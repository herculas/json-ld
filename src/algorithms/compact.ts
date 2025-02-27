/**
 * This algorithm compacts a JSON-LD document, such that the given context is applied. This must result in shortening
 * any applicable IRIs to terms or compact IRIs, any applicable keywords to keyword aliases, and any applicable JSON-LD
 * values expressed in expanded form to simple values such as strings or numbers.
 *
 * Starting with its root `element`, we can process the JSON-LD document recursively, until we have a fully compacted
 * `result`. When compacting an `element`, we can treat each one differently according to its type, in order to break
 * down the problem:
 *
 * 1. If the `element` is a scalar, it is already in compacted form, so we simply return it.
 * 2. If the `element` is an array, we compact each of its items recursively and return them in a new array.
 * 3. Otherwise, `element` is a map. The value of each entry in `element` is compacted recursively. Some of the entry
 *    keys will be compacted, using the IRI Compaction algorithm, to terms or compact IRIs and others will be compacted
 *    from keywords to keyword aliases or simply left unchanged because they do not have definitions in the context.
 *    Values will be converted to compacted form via the Value Compaction algorithm. Some data will be reshaped based on
 *    container mapping specified in the context such as `@index` or `@language` maps.
 *
 * @param activeContext The active context to use.
 * @param activeProperty The active property to use.
 * @param element The element to be compacted.
 * @param {boolean} [compactArrays] A flag to enable compaction of arrays to a single item when appropriate.
 * @param {boolean} [ordered] A flag to enable compaction of arrays to be ordered lexicographically by their keys.
 */
function compact(
  activeContext: string,
  activeProperty: string,
  element: any,
  compactArrays: boolean = false,
  ordered: boolean = false,
) {
  // Procedure:
  //
  // 1. Initialize `typeScopedContext` to `activeContext`. This is used for compacting values that may be relevant to
  //    any previous type-scoped context.
  // 2. If `element` is a scalar, it is already in its most compact form, so simply return `element`.
  // 3. If `element` is an array:
  //
  //    3.1. Initialize `result` to an empty array.
  //    3.2. For each `item` in `element`:
  //
  //         3.2.1. Initialize `compactedItem` to the result of using this algorithm recursively, passing
  //                `activeContext`, `activeProperty`, `item` for `element`, and the `compactArrays` and `ordered`
  //                flags.
  //         3.2.2. If `compactedItem` is not `null`, then append it to `result`.
  //
  //    3.3. If `result` is empty or contains more than one value, or `compactArrays` is `false`, or `activeProperty`
  //         is either `@graph` or `@set`, or container mapping for `activeProperty` in `activeContext` includes either
  //         `@list` or `@set`, return `result`.
  //    3.4. Otherwise, return the value in `result`.
  //
  // 4. Otherwise `element` is a map.
  // 5. If `activeContext` has a previous context, the `activeContext` is not propagated. If `element` does not contain
  //    an `@value` entry, and `element` does not consist of a single `@id` entry, set `activeContext` to
  //    `previousContext` from `activeContext`, as the scope of a term-scoped context does not apply when processing new
  //    node objects.
  // 6. If the term definition for `activeProperty` in `activeContext` has a local context:
  //
  //    6.1. Set `activeContext` to the result of the Context Processing algorithm, passing `activeContext`, the value
  //         of the `activeProperty`'s local context as `localContext`, `baseURL` from the term definition for
  //         `activeProperty` in `activeContext`, and `true` for `overrideProtected`.
  //
  // 7. If `element` has an `@value` or `@id` entry and the result of using the Value Compaction algorithm, passing
  //    `activeContext`, `activeProperty`, and `element` as `value` is a scalar, or the term definition for
  //    `activeProperty` has a type mapping of `@json`, return that result.
  // 8. If `element` is a list object, and the container mapping for `activeProperty` in `activeContext` includes
  //    `@list`, return the result of using this algorithm recursively, passing `activeContext`, `activeProperty`, value
  //    of `@list` in `element` for `element`, and the `compactArrays` and `ordered` flags.
  // 9. Initialize `insideReverse` to `true` if `activeProperty` equals `@reverse`, otherwise to `false`.
  // 10. Initialize `result` to an empty map.
  // 11. If `element` has an `@type` entry, create a new array `compactedTypes` initialized by transforming each
  //     `expandedType` of that entry into its compacted form by IRI compacting `expandedType`. Then, for each `term` in
  //     `compactedTypes` ordered lexicographically:
  //
  //     11.1. If the term definition for `term` in `typeScopedContext` has a local context set `activeContext` to the
  //           result of the Context Processing algorithm, passing `activeContext` and the value of `term`'s local
  //           context in `typeScopedContext` as `localContext` `baseURL` from the term definition for `term` in
  //           `typeScopedContext`, and `false` for `propagate`.
  //
  // 12. For each `key` `expandedProperty` and `value` `expandedValue` in `element`, ordered lexicographically by
  //     `expandedProperty` if `ordered` is `true`:
  //
  //     12.1. If `expandedProperty` is `@id`:
  //
  //           12.1.1. If `expandedValue` is a string, then initialize `compactedValue` by IRI compacting
  //                   `expandedValue` with `vocab` set to `false`.
  //           12.1.2. Initialize `alias` by IRI compacting `expandedProperty`.
  //           12.1.3. Add an entry `alias` to `result` whose value is set to `compactedValue` and continue to the next
  //                   `expandedProperty`.
  //
  //     12.2. If `expandedProperty` is `@type`:
  //
  //           12.2.1. If `expandedValue` is a string, then initialize `compactedValue` by IRI compacting
  //                   `expandedValue` using `typeScopedContext` for `activeContext`.
  //           12.2.2. Otherwise, `expandedValue` must be a `@type` array:
  //
  //                   12.2.2.1. Initialize `compactedValue` to an empty array.
  //                   12.2.2.2. For each `item` `expandedType` in `expandedValue`:
  //
  //                             12.2.2.2.1. Set `term` by IRI compacting `expandedType` using `typeScopedContext` for
  //                                         `activeContext`.
  //                             12.2.2.2.2. Append `term`, to `compactedValue`.
  //
  //           12.2.3. Initialize `alias` by IRI compacting `expandedProperty`.
  //           12.2.4. Initialize `asArray` to `true` if processing mode is `json-ld-1.1` and the container mapping for
  //                   `alias` in the active context includes `@set`, otherwise to the negation of `compactArrays`.
  //           12.2.5. Use `addValue` to add `compactedValue` to the `alias` entry in `result` using `asArray`.
  //           12.2.6. Continue to the next `expandedProperty`.
  //
  //     12.3. If `expandedProperty` is `@reverse`:
  //
  //           12.3.1. Initialize `compactedValue` to the result of using this algorithm recursively, passing
  //                   `activeContext`, `@reverse` for `activeProperty`, `expandedValue` for `element`, and the
  //                   `compactArrays` and `ordered` flags.
  //           12.3.2. For each `property` and `value` in `compactedValue`:
  //
  //                   12.3.2.1. If the term definition for `property` in the active context indicates that `property`
  //                             is a reverse property:
  //
  //                             12.3.2.1.1. Initialize `asArray` to `true` if the container mapping for `property` in
  //                                         the active context includes `@set`, otherwise the negation of
  //                                         `compactArrays`.
  //                             12.3.2.1.2. Use `addValue` to add `value` to the `property` entry in `result` using
  //                                         `asArray`.
  //                             12.3.2.1.3. Remove the `property` entry from `compactedValue`.
  //
  //           12.3.3. If `compactedValue` has some remaining map entries, i.e., it is not an empty map:
  //
  //                   12.3.3.1. Initialize `alias` by IRI compacting `@reverse`.
  //                   12.3.3.2. Set the value of the `alias` entry of `result` to `compactedValue`.
  //
  //     12.4. If `expandedProperty` is `@preserve` then:
  //
  //           12.4.1. Initialize `compactedValue` to the result of using this algorithm recursively, passing
  //                   `activeContext`, `activeProperty`, `expandedValue` for `element`, and the `compactArrays` and
  //                   `ordered` flags.
  //           12.4.2. Add `compactedValue` as the value of `@preserve` in `result` unless `expandedValue` is an empty
  //                   array.
  //
  //     12.5. If `expandedProperty` is `@index` and `activeProperty` has a container mapping in `activeContext` that
  //           includes `@index`, then the compacted result will be inside of an `@index` container, drop the `@index`
  //           entry by continuing to the next `expandedProperty`.
  //     12.6. Otherwise, if `expandedProperty` is `@direction`, `@index`, `@language`, or `@value`:
  //
  //           12.6.1. Initialize `alias` by IRI compacting `expandedProperty`.
  //           12.6.2. Add an entry `alias` to `result` whose value is set to `expandedValue` and continue with the next
  //                   `expandedProperty`.
  //
  //     12.7. If `expandedValue` is an empty array:
  //
  //           12.7.1. Initialize `itemActiveProperty` by IRI compacting `expandedProperty` using `expandedValue` for
  //                   `value` and `insideReverse` for `reverse`.
  //           12.7.2. If the term definition for `itemActiveProperty` in the active context has a nest value entry
  //                   (nest term):
  //
  //                   12.7.2.1. If `nestTerm` is not `@nest`, or a term in the active context that expands to `@nest`,
  //                             an invalid `@nest` value error has been detected, and processing is aborted.
  //                   12.7.2.2. If `result` does not have a `nestTerm` entry, initialize it to an empty map.
  //                   12.7.2.3. Initialize `nestResult` to the value of `nestTerm` in `result`.
  //
  //           12.7.3. Otherwise, initialize `nestResult` to `result`.
  //           12.7.4. Use `addValue` to add an empty array to the `itemActiveProperty` entry in `nestResult` using
  //                   `true` for `asArray`.
  //
  //     12.8. At this point, `expandedValue` must be an array due to the Expansion algorithm. For each `item`
  //           `expandedItem` in `expandedValue`:
  //
  //           12.8.1. Initialize `itemActiveProperty` by IRI compacting `expandedProperty` using `expandedItem` for
  //                   `value` and `insideReverse` for `reverse`.
  //           12.8.2. If the term definition for `itemActiveProperty` in the active context has a nest value entry
  //                   (nest term):
  //
  //                   12.8.2.1. If `nestTerm` is not `@nest`, or a term in the active context that expands to `@nest`,
  //                             an invalid `@nest` value error has been detected, and processing is aborted.
  //                   12.8.2.2. If `result` does not have a `nestTerm` entry, initialize it to an empty map.
  //                   12.8.2.3. Initialize `nestResult` to the value of `nestTerm` in `result`.
  //
  //           12.8.3. Otherwise, initialize `nestResult` to `result`.
  //           12.8.4. Initialize `container` to container mapping for `itemActiveProperty` in active context, or to a
  //                   new empty array, if there is no such container mapping.
  //           12.8.5. Initialize `asArray` to `true` if `container` includes `@set`, or if `itemActiveProperty` is
  //                   `@graph` or `@list`, otherwise the negation of `compactArrays`.
  //           12.8.6. Initialize `compactedItem` to the result of using this algorithm recursively, passing
  //                   `activeContext`, `itemActiveProperty` for `activeProperty`, `expandedItem` for `element`, along
  //                   with the `compactArrays` and `ordered` flags. If `expandedItem` is a list object or a graph
  //                   object, use the value of the `@list` or `@graph` entries, respectively, for `element` instead of
  //                   `expandedItem`.
  //           12.8.7. If `expandedItem` is a list object:
  //
  //                   12.8.7.1. If `compactedItem` is not an array, then set `compactedItem` to an array containing
  //                             only `compactedItem`.
  //                   12.8.7.2. If `container` does not include `@list`:
  //
  //                             12.8.7.2.1. Convert `compactedItem` to a list object by setting it to a map containing
  //                                         an entry where the key is the result of IRI compacting `@list` and the
  //                                         value is the original `compactedItem`.
  //                             12.8.7.2.2. If `expandedItem` contains the entry `@index-value`, then add an entry to
  //                                         `compactedItem` where the key is the result of IRI compacting `@index` and
  //                                         value is `value`.
  //                             12.8.7.2.3. Use `addValue` to add `compactedItem` to the `itemActiveProperty` entry in
  //                                         `nestResult` using `asArray`.
  //
  //                   12.8.7.3. Otherwise, set the value of the `itemActiveProperty` entry in `nestResult` to
  //                             `compactedItem`.
  //
  //           12.8.8. If `expandedItem` is a graph object:
  //
  //                   12.8.8.1. If `container` includes `@graph` and `@id`:
  //
  //                             12.8.8.1.1. Initialize `mapObject` to the value of `itemActiveProperty` in
  //                                         `nestResult`, initializing it to a new empty map, if necessary.
  //                             12.8.8.1.2. Initialize `mapKey` by IRI compacting the value of `@id` in `expandedItem`
  //                                         or `@none` if no such value exists with `vocab` set to `false` if there is
  //                                         an `@id` entry in `expandedItem`.
  //                             12.8.8.1.3. Use `addValue` to add `compactedItem` to the `mapKey` entry in `mapObject`
  //                                         using `asArray`.
  //
  //                   12.8.8.2. Otherwise, if `container` includes `@graph` and `@index` and `expandedItem` is a simple
  //                             graph object:
  //
  //                             12.8.8.2.1. Initialize `mapObject` to the value of `itemActiveProperty` in
  //                                         `nestResult`, initializing it to a new empty map, if necessary.
  //                             12.8.8.2.2. Initialize `mapKey` the value of `@index` in `expandedItem` or `@none`, if
  //                                         no such value exists.
  //                             12.8.8.2.3. Use `addValue` to add `compactedItem` to the `mapKey` entry in `mapObject`
  //                                         using `asArray`.
  //
  //                   12.8.8.3. Otherwise, if `container` includes `@graph` and `expandedItem` is a simple graph object
  //                             the value cannot be represented as a map object.
  //
  //                             12.8.8.3.1. If `compactedItem` is an array with more than one value, it cannot be
  //                                         directly represented, as multiple objects would be interpreted as different
  //                                         named graphs. Set `compactedItem` to a new map, containing the key from IRI
  //                                         compacting `@included` and the original `compactedItem` as the value.
  //                             12.8.8.3.2. Use `addValue` to add `compactedItem` to the `itemActiveProperty` entry in
  //                                         `nestResult` using `asArray`.
  //
  //                   12.8.8.4. Otherwise, `container` does not include `@graph` or otherwise does not match one of the
  //                             previous cases.
  //
  //                             12.8.8.4.1. Set `compactedItem` to a new map containing the key from IRI compacting
  //                                         `@graph` using the original `compactedItem` as a value.
  //                             12.8.8.4.2. If `expandedItem` contains an `@id` entry, add an entry in `compactedItem`
  //                                         using the key from IRI compacting `@id` using the value of IRI compacting
  //                                         the value of `@id` in `expandedItem` using `false` for `vocab`.
  //                             12.8.8.4.3. If `expandedItem` contains an `@index` entry, add an entry in
  //                                         `compactedItem` using the key from IRI compacting `@index` and the value of
  //                                         `@index` in `expandedItem`.
  //                             12.8.8.4.4. Use `addValue` to add `compactedItem` to the `itemActiveProperty` entry in
  //                                         `nestResult` using `asArray`.
  //
  //           12.8.9. Otherwise, if `container` includes `@language`, `@index`, `@id`, or `@type` and `container` does
  //                   not include `@graph`:
  //
  //                   12.8.9.1. Initialize `mapObject` to the value of `itemActiveProperty` in `nestResult`,
  //                             initializing it to a new empty map, if necessary.
  //                   12.8.9.2. Initialize `containerKey` by IRI compacting either `@language`, `@index`, `@id`, or
  //                             `@type` based on the contents of `container`.
  //                   12.8.9.3. Initialize `indexKey` to the value of index mapping in the term definition associated
  //                             with `itemActiveProperty` in `activeContext`, or `@index`, if no such value exists.
  //                   12.8.9.4. If `container` includes `@language` and `expandedItem` contains a `@value` entry, then
  //                             set `compactedItem` to the value associated with its `@value` entry. Set `mapKey` to
  //                             the value of `@language` in `expandedItem`, if any.
  //                   12.8.9.5. Otherwise, if `container` includes `@index` and `indexKey` is `@index`, set `mapKey`
  //                             to the value of `@index` in `expandedItem`, if any.
  //                   12.8.9.6. Otherwise, if `container` includes `@index` and `indexKey` is not `@index`:
  //
  //                             12.8.9.6.1. Reinitialize `containerKey` by IRI compacting `indexKey`.
  //                             12.8.9.6.2. Set `mapKey` to the first value of `containerKey` in `compactedItem`, if
  //                                         any.
  //                             12.8.9.6.3. If there are remaining values in `compactedItem` for `containerKey`, use
  //                                         `addValue` to add those remaining values to the `containerKey` in
  //                                         `compactedItem`. Otherwise, remove that entry from `compactedItem`.
  //
  //                   12.8.9.7. Otherwise, if `container` includes `@id`, set `mapKey` to the value of `containerKey`
  //                             in `compactedItem` and remove `containerKey` from `compactedItem`.
  //                   12.8.9.8. Otherwise, if `container` includes `@type`:
  //
  //                             12.8.9.8.1. Set `mapKey` to the first value of `containerKey` in `compactedItem`, if
  //                                         any.
  //                             12.8.9.8.2. If there are remaining values in `compactedItem` for `containerKey`, use
  //                                         `addValue` to add those remaining values to the `containerKey` in
  //                                         `compactedItem`.
  //                             12.8.9.8.3. Otherwise, remove that entry from `compactedItem`.
  //                             12.8.9.8.4. If `compactedItem` contains a single entry with a key expanding to `@id`,
  //                                         set `compactedItem` to the result of using this algorithm recursively,
  //                                         passing `activeContext`, `itemActiveProperty` for `activeProperty`, and a
  //                                         map composed of the single entry for `@id` from `expandedItem` for
  //                                         `element`.
  //
  //                   12.8.9.9. If `mapKey` is `null`, set it to the result of IRI compacting `@none`.
  //                   12.8.9.10. Use `addValue` to add `compactedItem` to the `mapKey` entry in `mapObject` using
  //                              `asArray`.
  //
  //           12.8.10. Otherwise, use `addValue` to add `compactedItem` to the `itemActiveProperty` entry in
  //                    `nestResult` using `asArray`.
  //
  // 13. Return `result`.
}

/**
 * This algorithm compacts an IRI to a term or compact IRI, or a keyword to a keyword alias. A value that is associated
 * with the IRI may be passed in order to assist in selecting the most context-appropriate term.
 *
 * If the passed IRI is `null`, we simply return `null`. Otherwise, we first try to find a term that the IRI or keyword
 * can be compacted to if it is relative to active context's vocabulary mapping. In order to select the most appropriate
 * term, we may have to collect information about the passed `value`. This information includes determining the
 * preferred container mapping, type mapping or language mapping for expressing the `value`. For JSON-LD lists, the type
 * mapping or language mapping will be chosen based on the most specific values that work for all items in the list.
 * Once this information is gathered, it is passed to the Term Selection algorithm, which will return the most
 * appropriate term.
 *
 * If no term was found that could be used to compact the IRI, an attempt is made to compact the IRI using the active
 * context's vocabulary mapping, if there is one. If the IRI could not be compacted, an attempt is made to find a
 * compact IRI. A term will be used to create a compact IRI only if the term definition contains the prefix flag with
 * the value `true`. If there is no appropriate compact IRI, and the `compactToRelative` option is `true`, the IRI is
 * transformed to a relative IRI reference using the document's base IRI. Finally, if the IRI or keyword still could not
 * be compacted, it is returned as is.
 *
 * When considering language mapping, the direction mapping is also considered, either with, or without, a language
 * mapping, and the language mapping is normalized to lower case.
 *
 * In the case were this algorithm would return the input IRI as is, and that IRI can be mistaken for a compact IRI in
 * the active context, this algorithm will raise an error, because it has no way to return an unambiguous representation
 * of the original IRI.
 *
 * @param activeContext The active context to use.
 * @param variable The variable to be compacted.
 * @param [value] The value associated with the variable.
 * @param {boolean} [vocab] Whether the passed variable should be compacted using the active context's vocabulary
 * mapping.
 * @param {boolean} [reverse] Whether a reverse property is being compacted.
 */
function compactIri(
  activeContext: string,
  variable: string,
  value: any = null,
  vocab: boolean = false,
  reverse: boolean = false,
) {
  // Procedure:
  //
  // 1. If `variable` is `null`, return `null`.
  // 2. If the `activeContext` has a `null` inverse context, set `inverseContext` in `activeContext` to the result of
  //    calling the Inverse Context Creation algorithm using `activeContext`.
  // 3. Initialize `inverseContext` to the value of `inverseContext` in `activeContext`.
  // 4. If `vocab` is `true` and `variable` is an entry of `inverseContext`:
  //
  //    4.1. Initialize `defaultLanguage` based on the `activeContext`'s default language, normalized to lower case and
  //         default base direction:
  //
  //         4.1.1. If the `activeContext`'s default base direction is not `null`, to the concatenation of the
  //                `activeContext`'s default language and default base direction, separated by an underscore ("_"),
  //                normalized to lower case.
  //         4.1.2. Otherwise, to the `activeContext`'s default language, if it has one, normalized to lower case,
  //                otherwise to `@none`.
  //
  //    4.2. If `value` is a map containing an `@preserve` entry, use the first element from the value of `@preserve` as
  //         `value`.
  //    4.3. Initialize `containers` to an empty array. This array will be used to keep track of an ordered list of
  //         preferred container mapping for a term, based on what is compatible with `value`.
  //    4.4. Initialize `typeLanguage` to `@language`, and `typeLanguageValue` to `@null`. These two variables will keep
  //         track of the preferred type mapping or language mapping for a term, based on what is compatible with
  //         `value`.
  //    4.5. If `value` is a map containing an `@index` entry, and `value` is not a graph object then append the values
  //         `@index` and `@index@set` to `containers`.
  //    4.6. If `reverse` is `true`, set `typeLanguage` to `@type`, `typeLanguageValue` to `@reverse`, and append `@set`
  //         to `containers`.
  //    4.7. Otherwise, if `value` is a list object, then set `typeLanguage` and `typeLanguageValue` to the most
  //         specific values that work for all items in the list as follows:
  //
  //         4.7.1. If `@index` is not an entry in `value`, then append `@list` to `containers`.
  //         4.7.2. Initialize `list` to the array associated with the `@list` entry in `value`.
  //         4.7.3. Initialize `commonType` and `commonLanguage` to `null`. If `list` is empty, set `commonLanguage` to
  //                `defaultLanguage`.
  //         4.7.4. For each `item` in `list`:
  //
  //                4.7.4.1. Initialize `itemLanguage` to `@none` and `itemType` to `@none`.
  //                4.7.4.2. If `item` contains an `@value` entry:
  //
  //                         4.7.4.2.1. If `item` contains an `@direction` entry, then set `itemLanguage` to the
  //                                    concatenation of the item's `@language` entry (if any) the `item`'s
  //                                    `@direction`, separated by an underscore ("_"), normalized to lower case.
  //                         4.7.4.2.2. Otherwise, if `item` contains an `@language` entry, then set `itemLanguage` to
  //                                    its associated value, normalized to lower case.
  //                         4.7.4.2.3. Otherwise, if `item` contains a `@type` entry, set `itemType` to its associated
  //                                    value.
  //                         4.7.4.2.4. Otherwise, set `itemLanguage` to `@null`.
  //
  //                4.7.4.3. Otherwise, set `itemType` to `@id`.
  //                4.7.4.4. If `commonLanguage` is `null`, set `commonLanguage` to `itemLanguage`.
  //                4.7.4.5. Otherwise, if `itemLanguage` does not equal `commonLanguage` and `item` contains a `@value`
  //                         entry, then set `commonLanguage` to `@none` because list items have conflicting languages.
  //                4.7.4.6. If `commonType` is `null`, set `commonType` to `itemType`.
  //                4.7.4.7. Otherwise, if `itemType` does not equal `commonType`, then set `commonType` to `@none`
  //                         because list items have conflicting types.
  //                4.7.4.8. If `commonLanguage` is `@none` and `commonType` is `@none`, then stop processing items in
  //                         the list because it has been detected that there is no common language or type amongst the
  //                         items.
  //
  //         4.7.5. If `commonLanguage` is `null`, set `commonLanguage` to `@none`.
  //         4.7.6. If `commonType` is `null`, set `commonType` to `@none`.
  //         4.7.7. If `commonType` is not `@none` then set `typeLanguage` to `@type` and `typeLanguageValue` to
  //                `commonType`.
  //         4.7.8. Otherwise, set `typeLanguageValue` to `commonLanguage`.
  //
  //    4.8. Otherwise, if `value` is a graph object, prefer a mapping most appropriate for the particular value.
  //
  //         4.8.1. If `value` contains an `@index` entry, append the values `@graph@index` and `@graph@index@set` to
  //                `containers`.
  //         4.8.2. If `value` contains an `@id` entry, append the values `@graph@id` and `@graph@id@set` to
  //                `containers`.
  //         4.8.3. Append the values `@graph`, `@graph@set`, and `@set` to `containers`.
  //         4.8.4. If `value` does not contain an `@index` entry, append the values `@graph@index` and
  //                `@graph@index@set` to `containers`.
  //         4.8.5. If the value does not contain an `@id` entry, append the values `@graph@id` and `@graph@id@set` to
  //                `containers`.
  //         4.8.6. Append the values `@index` and `@index@set` to `containers`.
  //         4.8.7. Set `typeLanguage` to `@type` and set `typeLanguageValue` to `@id`.
  //
  //    4.9. Otherwise:
  //
  //         4.9.1. If `value` is a value object:
  //
  //                4.9.1.1. If `value` contains an `@direction` entry and does not contain an `@index` entry, then set
  //                         `typeLanguageValue` to the concatenation of the value's `@language` entry (if any) and the
  //                         value's `@direction` entry, separated by an underscore ("_"), normalized to lower case.
  //                         Append `@language` and `@language@set` to `containers`.
  //                4.9.1.2. Otherwise, if `value` contains an `@language` entry and does not contain an `@index` entry,
  //                         then set `typeLanguageValue` to the value of `@language` normalized to lower case, and
  //                         append `@language`, and `@language@set` to `containers`.
  //                4.9.1.3. Otherwise, if `value` contains an `@type` entry, then set `typeLanguageValue` to its
  //                         associated value and set `typeLanguage` to `@type`.
  //
  //         4.9.2. Otherwise, set `typeLanguage` to `@type` and set `typeLanguageValue` to `@id`, and append `@id`,
  //                `@id@set`, `@type`, and `@set@type`, to `containers`.
  //         4.9.3. Append `@set` to `containers`.
  //
  //    4.10. Append `@none` to `containers`. This represents the non-existence of a container mapping, and it will be
  //          the last container mapping value to be checked as it is the most generic.
  //    4.11. If processing mode is not `json-ld-1.0` and `value` is not a map or does not contain an `@index` entry,
  //          append `@index` and `@index@set` to `containers`.
  //    4.12. If processing mode is not `json-ld-1.0` and `value` is a map containing only an `@value` entry, append
  //          `@language` and `@language@set` to `containers`.
  //    4.13. If `typeLanguageValue` is `null`, set `typeLanguageValue` to `@null`. This is the key under which null
  //          values are stored in the inverse context entry.
  //    4.14. Initialize `preferredValues` to an empty array. This array will indicate, in order, the preferred values
  //          for a term's type mapping or language mapping.
  //    4.15. If `typeLanguageValue` is `@reverse`, append `@reverse` to `preferredValues`.
  //    4.16. If `typeLanguageValue` is `@id` or `@reverse` and `value` is a map containing an `@id` entry:
  //
  //          4.16.1. If the result of IRI compacting the value of the `@id` entry in `value` has a term definition in
  //                  the `activeContext` with an IRI mapping that equals the value of the `@id` entry in `value`, then
  //                  append `@vocab`, `@id`, and `@none`, in that order, to `preferredValues`.
  //          4.16.2. Otherwise, append `@id`, `@vocab`, and `@none`, in that order, to `preferredValues`.
  //
  //    4.17. Otherwise, append `typeLanguageValue` and `@none`, in that order, to `preferredValues`. If `value` is a
  //          list object with an empty array as the value of `@list`, set `typeLanguage` to `@any`.
  //    4.18. Append `@any` to `preferredValues`.
  //    4.19. If `preferredValues` contains any entry having an underscore ("_"), append the substring of that entry
  //          from the underscore to the end of the string to `preferredValues`.
  //    4.20. Initialize `term` to the result of the Term Selection algorithm, passing `variable`, `containers`,
  //          `typeLanguage`, and `preferredValues`.
  //    4.21. If `term` is not `null`, return `term`.
  //
  // 5. At this point, there is no simple term that `variable` can be compacted to. If `vocab` is `true` and
  //    `activeContext` has a vocabulary mapping:
  //
  //    5.1. If `variable` begins with the vocabulary mapping's value but is longer, then initialize `suffix` to the
  //         substring of `variable` that does not match. If `suffix` does not have a term definition in
  //         `activeContext`, then return `suffix`.
  //
  // 6. The `variable` could not be compacted using the `activeContext`'s vocabulary mapping. Try to create a compact
  //    IRI, starting by initializing `compactIri` to `null`. This variable will be used to store the created compact
  //    IRI, if any.
  // 7. For each term definition `definition` in `activeContext`:
  //
  //    7.1. If the IRI mapping of `definition` is `null`, its IRI mapping equals `variable`, its IRI mapping is not a
  //         substring at the beginning of `variable`, or `definition` does not have a true prefix flag, `definition`'s
  //         key cannot be used as a prefix. Continue with the next `definition`.
  //    7.2. Initialize `candidate` by concatenating `definition` key, a colon (`:`), and the substring of `variable`
  //         that follows after the value of the `definition`'s IRI mapping.
  //    7.3. If either `compactIri` is `null`, `candidate` is shorter or the same length but lexicographically less
  //         than `compactIri` and `candidate` does not have a term definition in `activeContext`, or if that term
  //         definition has an IRI mapping that equals `variable` and `value` is `null`, set `compactIri` to
  //         `candidate`.
  //
  // 8. If `compactIri` is not `null`, return `compactIri`.
  // 9. To ensure that the IRI `variable` is not confused with a compact IRI, if the IRI scheme of `variable` matches
  //    any term in `activeContext` with prefix flag set to `true`, and `variable` has no IRI authority (preceded by
  //    double-forward-slash (`//`), an IRI confused with prefix error has been detected, and processing is aborted.
  // 10. If `vocab` is `false`, transform `variable` to a relative IRI reference using the base IRI from
  //     `activeContext`, if it exists.
  // 11. Finally, return `variable` as is.
}

/**
 * Expansion transforms all values into expanded form in JSON-LD. This algorithm performs the opposite operation,
 * transforming a value into compacted form. This algorithm compacts a value according to the term definition in the
 * given active context that is associated with the value's associated active property.
 *
 * The value to compact has either an `@id` or an `@value` entry.
 *
 * For the former case, if the type mapping of active property is set to `@id` or `@vocab` and `value` consists of only
 * an `@id` entry and, if the container mapping of active property includes `@index`, an `@index` entry, `value` can be
 * compacted to a string by returning the result of using the IRI Compaction algorithm to compact the value associated
 * with the `@id` entry. Otherwise, `value` cannot be compacted and is returned as is.
 *
 * For the latter case, it might be possible to compact `value` just into the value associated with the `@value` entry.
 * This can be done if the active property has a matching type mapping or language mapping and there is either no
 * `@index` entry or the container mapping of active property includes `@index`. It can also be done if `@value` is the
 * only entry in value (apart an `@index` entry in case the container mapping of active property includes `@index`) and
 * either its associated value is not a string, there is no default language, or there is an explicit `null` language
 * mapping for the active property.
 *
 * @param activeContext The active context to use.
 * @param activeProperty The active property to use.
 * @param value The value to be compacted.
 */
function compactValue(
  activeContext: string,
  activeProperty: string,
  value: any,
) {
  // Procedure:
  //
  // 1. Initialize `result` to a copy of `value`.
  // 2. If the `activeContext` has a `null` inverse context, set `inverseContext` in `activeContext` to the result of
  //    calling the Inverse Context Creation algorithm using `activeContext`.
  // 3. Initialize `inverseContext` to the value of `inverseContext` in `activeContext`.
  // 4. Initialize `language` to the language mapping for `activeProperty` in `activeContext`, if any, otherwise to the
  //    default language of `activeContext`.
  // 5. Initialize `direction` to the direction mapping for `activeProperty` in `activeContext`, if any, otherwise to
  //    the default base direction of `activeContext`.
  // 6. If `value` has an `@id` entry and has no other entries other than `@index`:
  //
  //    6.1. If the type mapping of `activeProperty` is set to `@id`, set `result` to the result of IRI compacting the
  //         value associated with the `@id` entry using `false` for `vocab`.
  //    6.2. Otherwise, if the type mapping of `activeProperty` is set to `@vocab`, set `result` to the result of IRI
  //         compacting the value associated with the `@id` entry.
  //
  // 7. Otherwise, if `value` has an `@type` entry whose value matches the type mapping of `activeProperty`, set
  //    `result` to the value associated with the `@value` entry of `value`.
  // 8. Otherwise, if the type mapping of `activeProperty` is `@none`, or `value` has an `@type` entry, and the value of
  //    `@type` in `value` does not match the type mapping of `activeProperty`, leave `value` as is, as value compaction
  //    is disabled.
  //
  //    8.1. Replace any value of `@type` in `result` with the result of IRI compacting the value of the `@type` entry.
  //
  // 9. Otherwise, if the value of the `@value` entry is not a string:
  //
  //    9.1. If `value` has an `@index` entry, and the container mapping associated to `activeProperty` includes
  //         `@index`, or if `value` has no `@index` entry, set `result` to the value associated with the `@value`
  //         entry.
  //
  // 10. Otherwise, if `value` has an `@language` entry whose value exactly matches `language`, using a case-insensitive
  //     comparison if it is not `null`, or is not present, if `language` is `null, and the value has an `@direction`
  //     entry whose value exactly matches `direction`, if it is not `null`, or is not present, if `direction` is
  //     `null`:
  //
  //     10.1. If `value` has an `@index` entry, and the container mapping associated to `activeProperty` includes
  //           `@index`, or `value` has no `@index` entry, set `result` to the value associated with the `@value` entry.
  //
  // 11. If `result` is a map, replace each key in `result` with the result of IRI compacting that key.
  // 12. Return `result`.
}

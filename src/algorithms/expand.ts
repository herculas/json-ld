import { Term } from "../types/basic.ts"
import { ActiveContext, ContextDefinition } from "../types/context.ts"

/**
 * This algorithm expands a JSON-LD document, such that all context definitions are removed, all terms and compact IRIs
 * are expanded to IRIs, blank node identifiers, or keywords and all JSON-LD values are expressed in arrays in expanded
 * form.
 *
 * Starting with its root `element`, we can process the JSON-LD document recursively, until we have a fully expanded
 * `result`. When expanding an `element`, we can treat each one differently according to its type, in order to break
 * down the problem:
 *
 * 1. If the `element` is `null`, there is nothing to expand.
 * 2. Otherwise, if `element` is a scalar, we expand it according to the Value Expansion algorithm.
 * 3. Otherwise, if the `element` is an array, then we expand each of its items recursively and return them in a new
 *    array.
 * 4. Otherwise, `element` is a map. We expand each of its entries, adding them to our `result`, and then we expand each
 *    value for each entry recursively. Some of the entry keys will be terms or compact IRIs and others will be keywords
 *    or simply ignored because they do not have definitions in the context. Any IRIs will be expanded using the IRI
 *    Expansion algorithm.
 * 5. Finally, after ensuring `result` is in an array, we return `result`.
 *
 * The algorithm also performs processing steps specific to expanding a JSON-LD Frame. For a frame, the `@id` and
 * `@type` entries can accept an array of IRIs or an empty map. The entries of a value object can also accept an array
 * of strings, or an empty map. Framing also uses additional keyword entries: (`@explicit`, `@default`, `@embed`,
 * `@explicit`, `@omitDefault`, or `@requireAll`) which are preserved through expansion. Special processing for a
 * JSON-LD Frame is invoked when the `frameExpansion` flag is set to true.
 *
 * @param activeContext The active context to use.
 * @param activeProperty The active property to use.
 * @param element An element to be expanded.
 * @param baseURL A base URL associated with the `documentUrl` of the original document to expand.
 * @param {boolean} [frameExpansion] Whether to allow special forms of input used for frame expansion.
 * @param {boolean} [ordered] Whether to order map entry keys lexicographically.
 * @param {boolean} [fromMap] Whether to control reverting previous term definitions in the active context associated
 * with non-propagated contexts.
 */
function expand(
  activeContext: string,
  activeProperty: string,
  element: any,
  baseURL: string,
  frameExpansion: boolean = false,
  ordered: boolean = false,
  fromMap: boolean = false,
) {
  // Procedure:
  //
  // 1. If `element` is `null`, return `null`.
  // 2. If `activeProperty` is `@default`, initialize the `frameExpansion` flag to `false`.
  // 3. If `activeProperty` has a term definition in `activeContext` with a local context, initialize
  //    `propertyScopedContext` to that local context.
  // 4. If `element` is a scalar:
  //
  //    4.1. If `activeProperty` is `null` or `@graph`, drop the free-floating scalar by returning `null`.
  //    4.2. If `propertyScopedContext` is defined, set `activeContext` to the result of the Context Processing
  //         algorithm, passing `activeContext`, `propertyScopedContext` as `localContext`, and `baseURL` from the term
  //         definition for `activeProperty` in `activeContext`.
  //    4.3. Return the result of the Value Expansion algorithm, passing the `activeContext`, `activeProperty`, and
  //         `element` as `value`.
  //
  // 5. If `element` is an array:
  //
  //    5.1. Initialize an empty array, `result`.
  //    5.2. For each `item` in `element`:
  //
  //         5.2.1. Initialize `expandedItem` to the result of using this algorithm recursively, passing
  //                `activeContext`, `activeProperty`, `item` as `element`, `baseURL`, the `frameExpansion`, `ordered`,
  //                and `fromMap` flags.
  //         5.2.2. If the container mapping of `activeProperty` includes `@list`, and `expandedItem` is an array, set
  //                `expandedItem` to a new map containing the entry `@list` where the value is the original
  //                `expandedItem`.
  //         5.2.3. If `expandedItem` is an array, append each of its items to `result`. Otherwise, if `expandedItem`
  //                is not `null`, append it to `result`.
  //
  //    5.3. Return `result`.
  //
  // 6. Otherwise `element` is a map.
  // 7. If `activeContext` has a previous context, the active context is not propagated. If `fromMap` is `undefined` or
  //    `false`, and `element` does not contain an entry expanding to `@value`, and `element` does not consist of a
  //    single entry expanding to `@id` (where entries are IRI expanded, set `activeContext` to previous context from
  //    `activeContext`, as the scope of a term-scoped context does not apply when processing new node objects.
  // 8. If `propertyScopedContext` is defined, set `activeContext` to the result of the Context Processing algorithm,
  //    passing `activeContext`, `propertyScopedContext` as `localContext`, `baseURL` from the term definition for
  //    `activeProperty`, in `activeContext` and `true` for `overrideProtected`.
  // 9. If `element` contains the entry `@context`, set `activeContext` to the result of the Context Processing
  //    algorithm, passing `activeContext`, the value of the `@context` entry as `localContext`, and `baseURL`.
  // 10. Initialize `typeScopedContext` to `activeContext`. This is used for expanding values that may be relevant to
  //     any previous type-scoped context.
  // 11. For each `key` and `value` in `element` ordered lexicographically by `key` where `key` IRI expands to `@type`:
  //
  //     11.1. Convert `value` into an array, if necessary.
  //     11.2. For each `term` which is a value of `value` ordered lexicographically, if `term` is a string, and
  //           `term`'s term definition in `typeScopedContext` has a local context, set `activeContext` to the result of
  //           the Context Processing algorithm, passing `activeContext`, the value of the `term`'s local context as
  //           `localContext`, `baseURL` from the term definition for `value` in `activeContext`, and `false` for
  //           `propagate`.
  //
  // 12. Initialize two empty maps, `result` and `nests`. Initialize `inputType` to expansion of the last value of the
  //     first entry in `element` expanding to `@type` (if any), ordering entries lexicographically by key. Both the key
  //     and value of the matched entry are IRI expanded.
  // 13. For each `key` and `value` in `element`, ordered lexicographically by `key` if `ordered` is `true`:
  //
  //     13.1. If `key` is `@context`, continue to the next `key`.
  //     13.2. Initialize `expandedProperty` to the result of IRI expanding `key`.
  //     13.3. If `expandedProperty` is `null` or it neither contains a colon (":") nor it is a keyword, drop `key` by
  //           continuing to the next `key`.
  //     13.4. If `expandedProperty` is a keyword:
  //
  //           13.4.1. If `activeProperty` equals `@reverse`, an invalid reverse property map error has been detected
  //                   and processing is aborted.
  //           13.4.2. If `result` already has an `expandedProperty` entry, other than `@included` or `@type` (unless
  //                   processing mode is `json-ld-1.0`), a colliding keywords error has been detected and processing is
  //                   aborted.
  //           13.4.3. If `expandedProperty` is `@id`:
  //
  //                   13.4.3.1. If `value` is not a string, an invalid `@id` value error has been detected and
  //                             processing is aborted. When the `frameExpansion` flag is set, `value` MAY be an empty
  //                             map, or an array of one or more strings.
  //                   13.4.3.2. Otherwise, set `expandedValue` to the result of IRI expanding `value` using `true` for
  //                             `documentRelative` and `false` for `vocab`. When the `frameExpansion` flag is set,
  //                             `expandedValue` will be an array of one or more of the values, with string values
  //                             expanded using the IRI Expansion algorithm as above.
  //           13.4.4. If `expandedProperty` is `@type`:
  //
  //                   13.4.4.1. If `value` is neither a string nor an array of strings, an invalid type value error
  //                             has been detected and processing is aborted. When the `frameExpansion` flag is set,
  //                             `value` MAY be an empty map, or a default object where the value of `@default` is
  //                             restricted to be an IRI. All other values mean that invalid type value error has been
  //                             detected and processing is aborted.
  //                   13.4.4.2. If `value` is an empty map, set `expandedValue` to `value`.
  //                   13.4.4.3. Otherwise, if `value` is a default object, set `expandedValue` to a new default object
  //                             with the value of `@default` set to the result of IRI expanding `value` using
  //                             `typeScopedContext` for `activeContext`, and `true` for `documentRelative`.
  //                   13.4.4.4. Otherwise, set `expandedValue` to the result of IRI expanding each of its values using
  //                             `typeScopedContext` for `activeContext`, and `true` for `documentRelative`.
  //                   13.4.4.5. If `result` already has an entry for `@type`, prepend the value of `@type` in `result`
  //                             to `expandedValue`, transforming it into an array, if necessary.
  //
  //           13.4.5. If `expandedProperty` is `@graph`, set `expandedValue` to the result of using this algorithm
  //                   recursively passing `activeContext`, `@graph` for `activeProperty`, `value` for `element`,
  //                   `baseURL`, and the `frameExpansion` and `ordered` flags, ensuring that `expandedValue` is an
  //                   array of one or more maps.
  //           13.4.6. If `expandedProperty` is `@included`:
  //
  //                   13.4.6.1. If processing mode is `json-ld-1.0`, continue with the next `key` from `element`.
  //                   13.4.6.2. Set `expandedValue` to the result of using this algorithm recursively passing
  //                             `activeContext`, `null` for `activeProperty`, `value` for `element`, `baseURL`, and the
  //                             `frameExpansion` and `ordered` flags, ensuring that the result is an array.
  //                   13.4.6.3. If any element of `expandedValue` is not a node object, an invalid `@included` value
  //                             error has been detected and processing is aborted.
  //                   13.4.6.4. If `result` already has an entry for `@included`, prepend the value of `@included` in
  //                             `result` to `expandedValue`.
  //
  //           13.4.7. If `expandedProperty` is `@value`:
  //
  //                   13.4.7.1. If `inputType` is `@json`, set `expandedValue` to `value`. If processing mode is
  //                             `json-ld-1.0`, an invalid value object value error has been detected and processing is
  //                             aborted.
  //                   13.4.7.2. Otherwise, if `value` is not a scalar or `null`, an invalid value object value error
  //                             has been detected and processing is aborted. When the `frameExpansion` flag is set,
  //                             `value` MAY be an empty map or an array of scalar values.
  //                   13.4.7.3. Otherwise, set `expandedValue` to `value`. When the `frameExpansion` flag is set,
  //                             `expandedValue` will be an array of one or more string values or an array containing an
  //                             empty map.
  //                   13.4.7.4. If `expandedValue` is `null`, set the `@value` entry of `result` to `null` and continue
  //                             with the next `key` from `element`. Null values need to be preserved in this case as
  //                             the meaning of an `@type` entry depends on the existence of an `@value` entry.
  //
  //           13.4.8. If `expandedProperty` is `@language`:
  //
  //                   13.4.8.1. If `value` is not a string, an invalid language-tagged string error has been detected
  //                             and processing is aborted. When the `frameExpansion` flag is set, `value` MAY be an
  //                             empty map or an array of zero or more strings.
  //                   13.4.8.2. Otherwise, set `expandedValue` to `value`. If `value` is not well-formed according to
  //                             section 2.2.9 of [BCP47], processors SHOULD issue a warning. When the `frameExpansion`
  //                             flag is set, `expandedValue` will be an array of one or more string values or an array
  //                             containing an empty map.
  //
  //           13.4.9. If `expandedProperty` is `@direction`:
  //
  //                   13.4.9.1. If processing mode is `json-ld-1.0`, continue with the next `key` from `element`.
  //                   13.4.9.2. If `value` is neither "ltr" nor "rtl", an invalid base direction error has been
  //                             detected and processing is aborted. When the `frameExpansion` flag is set, `value` MAY
  //                             be an empty map or an array of zero or more strings.
  //                   13.4.9.3. Otherwise, set `expandedValue` to `value`. When the `frameExpansion` flag is set,
  //                             `expandedValue` will be an array of one or more string values or an array containing an
  //                             empty map.
  //
  //           13.4.10. If `expandedProperty` is `@index`:
  //
  //                    13.4.10.1. If `value` is not a string, an invalid `@index` value error has been detected and
  //                               processing is aborted.
  //                    13.4.10.2. Otherwise, set `expandedValue` to `value`.
  //
  //           13.4.11. If `expandedProperty` is `@list`:
  //
  //                    13.4.11.1. If `activeProperty` is `null` or `@graph`, continue with the next `key` from
  //                               `element` to remove the free-floating list.
  //                    13.4.11.2. Otherwise, initialize `expandedValue` to the result of using this algorithm
  //                               recursively passing `activeContext`, `activeProperty`, `value` for `element`,
  //                               `baseURL`, and the `frameExpansion` and `ordered` flags, ensuring that the result is
  //                               an array.
  //
  //           13.4.12. If `expandedProperty` is `@set`, set `expandedValue` to the result of using this algorithm
  //                    recursively, passing `activeContext`, `activeProperty`, `value` for `element`, `baseURL`, and
  //                    the `frameExpansion` and `ordered` flags.
  //           13.4.13. If `expandedProperty` is `@reverse`:
  //
  //                    13.4.13.1. If `value` is not a map, an invalid `@reverse` value error has been detected and
  //                               processing is aborted.
  //                    13.4.13.2. Otherwise initialize `expandedValue` to the result of using this algorithm
  //                               recursively, passing `activeContext`, `@reverse` as `activeProperty`, `value` as
  //                               `element`, `baseURL`, and the `frameExpansion` and `ordered` flags.
  //                    13.4.13.3. If `expandedValue` contains an `@reverse` entry, i.e., properties that are reversed
  //                               twice, execute for each of its property and item the following steps:
  //
  //                               13.4.13.3.1. Use `addValue` to add `item` to the property entry in `result` using
  //                                            `true` for `asArray`.
  //
  //                    13.4.13.4. If `expandedValue` contains an entry other than `@reverse`:
  //
  //                               13.4.13.4.1. Set `reverseMap` to the value of the `@reverse` entry in `result`,
  //                                            initializing it to an empty map, if necessary.
  //                               13.4.13.4.2. For each `property` and `items` in `expandedValue` other than
  //                                            `@reverse`:
  //
  //                                            13.4.13.4.2.1. For each `item` in `items`:
  //
  //                                                           13.4.13.4.2.1.1. If `item` is a value object or list
  //                                                                            object, an invalid reverse property
  //                                                                            value has been detected and processing
  //                                                                            is aborted.
  //                                                           13.4.13.4.2.1.2. Use `addValue` to add `item` to the
  //                                                                            property entry in `reverseMap` using
  //                                                                            `true` for `asArray`.
  //
  //                    13.4.13.5. Continue with the next `key` from `element`.
  //
  //           13.4.14. If `expandedProperty` is `@nest`, add `key` to `nests`, initializing it to an empty array, if
  //                    necessary. Continue with the next `key` from `element`.
  //           13.4.15. When the `frameExpansion` flag is set, if `expandedProperty` is any other framing keyword
  //                    (`@default`, `@embed`, `@explicit`, `@omitDefault`, or `@requireAll`), set `expandedValue` to
  //                    the result of performing the Expansion Algorithm recursively, passing `activeContext`,
  //                    `activeProperty`, `value` for `element`, `baseURL`, and the `frameExpansion` and `ordered`
  //                    flags.
  //           13.4.16. Unless `expandedValue` is `null`, `expandedProperty` is `@value`, and `inputType` is not
  //                    `@json`, set the `expandedProperty` entry of `result` to `expandedValue`.
  //           13.4.17. Continue with the next `key` from `element`.
  //
  //     13.5. Initialize `containerMapping` to `key`'s container mapping in `activeContext`.
  //     13.6. If `key`'s term definition in `activeContext` has a type mapping of `@json`, set `expandedValue` to a new
  //           map, set the entry `@value` to `value`, and set the entry `@type` to `@json`.
  //     13.7. Otherwise, if `containerMapping` includes `@language` and `value` is a map then `value` is expanded from
  //           a language map as follows:
  //
  //           13.7.1. Initialize `expandedValue` to an empty array.
  //           13.7.2. Initialize `direction` to the default base direction from `activeContext`.
  //           13.7.3. If `key`'s term definition in `activeContext` has a direction mapping, update `direction` with
  //                   that value.
  //           13.7.4. For each `key`-`value` pair `language`-`languageValue` in `value`, ordered lexicographically by
  //                   `language` if `ordered` is `true`:
  //
  //                   13.7.4.1. If `languageValue` is not an array, set `languageValue` to an array containing only
  //                             `languageValue`.
  //                   13.7.4.2. For each `item` in `languageValue`:
  //
  //                             13.7.4.2.1. If `item` is `null`, continue to the next entry in `languageValue`.
  //                             13.7.4.2.2. `item` must be a string, otherwise an invalid language map value error has
  //                                         been detected and processing is aborted.
  //                             13.7.4.2.3. Initialize a new map `v` consisting of two key-value pairs: `(@value-item)`
  //                                         and `(@language-language)`. If `item` is neither `@none` nor well-formed
  //                                         according to section 2.2.9 of [BCP47], processors SHOULD issue a warning.
  //                             13.7.4.2.4. If `language` is `@none`, or expands to `@none`, remove `@language` from
  //                                         `v`.
  //                             13.7.4.2.5. If `direction` is not `null`, add an entry for `@direction` to `v` with
  //                                         `direction`.
  //                             13.7.4.2.6. Append `v` to `expandedValue`.
  //
  //     13.8. Otherwise, if `containerMapping` includes `@index`, `@type`, or `@id` and `value` is a map then `value`
  //           is expanded from a map as follows:
  //
  //           13.8.1. Initialize `expandedValue` to an empty array.
  //           13.8.2. Initialize `indexKey` to the key's index mapping in `activeContext`, or `@index`, if it does not
  //                   exist.
  //           13.8.3. For each `index`-`indexValue` pair in `value`, ordered lexicographically by `index` if `ordered`
  //                   is `true`:
  //
  //                   13.8.3.1. If `containerMapping` includes `@id` or `@type`, initialize `mapContext` to the
  //                             previous context from `activeContext` if it exists, otherwise, set `mapContext` to
  //                             `activeContext`.
  //                   13.8.3.2. If `containerMapping` includes `@type` and `index`'s term definition in `mapContext`
  //                             has a local context, update `mapContext` to the result of the Context Processing
  //                             algorithm, passing `mapContext` as `activeContext`, the value of the `index`'s local
  //                             context as `localContext`, and `baseURL` from the term definition for `index` in
  //                             `mapContext`.
  //                   13.8.3.3. Otherwise, set `mapContext` to `activeContext`.
  //                   13.8.3.4. Initialize `expandedIndex` to the result of IRI expanding `index`.
  //                   13.8.3.5. If `indexValue` is not an array, set `indexValue` to an array containing only
  //                             `indexValue`.
  //                   13.8.3.6. Initialize `indexValue` to the result of using this algorithm recursively, passing
  //                             `mapContext` as `activeContext`, `key` as `activeProperty`, `indexValue` as `element`,
  //                             `baseURL`, `true` for `fromMap`, and the `frameExpansion` and `ordered` flags.
  //                   13.8.3.7. For each `item` in `indexValue`:
  //
  //                             13.8.3.7.1. If `containerMapping` includes `@graph`, and `item` is not a graph object,
  //                                         set `item` to a new map containing the key-value pair `@graph`-`item`,
  //                                         ensuring that the value is represented using an array.
  //                             13.8.3.7.2. If `containerMapping` includes `@index`, `indexKey` is not `@index`, and
  //                                         `expandedIndex` is not `@none`:
  //
  //                                         13.8.3.7.2.1. Initialize `reExpandedIndex` to the result of calling the
  //                                                       Value Expansion algorithm, passing the `activeContext`,
  //                                                       `indexKey` as `activeProperty`, and `index` as `value`.
  //                                         13.8.3.7.2.2. Initialize `expandedIndexKey` to the result of IRI expanding
  //                                                       `indexKey`.
  //                                         13.8.3.7.2.3. Initialize `indexPropertyValues` to an array consisting of
  //                                                       `reExpandedIndex` followed by the existing values of the
  //                                                       concatenation of `expandedIndexKey` in `item`, if any.
  //                                         13.8.3.7.2.4. Add the `expandedIndexKey`-`indexPropertyValues` pair to
  //                                                       `item`.
  //                                         13.8.3.7.2.5. If `item` is a value object, it MUST NOT contain any extra
  //                                                       properties; an invalid value object error has been detected
  //                                                       and processing is aborted.
  //
  //                             13.8.3.7.3. Otherwise, if `containerMapping` includes `@index`, `item` does not have an
  //                                         entry `@index`, and `expandedIndex` is not `@none`, add the `@index`-
  //                                         `index` pair to `item`.
  //                             13.8.3.7.4. Otherwise, if `containerMapping` includes `@id`, `item` does not have the
  //                                         entry `@id`, and `expandedIndex` is not `@none`, add the `@id`-
  //                                         `expandedIndex` pair to `item`, where `expandedIndex` is set to the result
  //                                         of IRI expanding `index` using `true` for `documentRelative` and `false`
  //                                         for `vocab`.
  //                             13.8.3.7.5. Otherwise, if `containerMapping` includes `@type`, and `expandedIndex` is
  //                                         not `@none`, initialize `types` to a new array consisting of
  //                                         `expandedIndex` followed by any existing values of `@type` in `item`. Add
  //                                         the `@type`-`types` pair to `item`.
  //                             13.8.3.7.6. Append `item` to `expandedValue`.
  //
  //     13.9. Otherwise, initialize `expandedValue` to the result of using this algorithm recursively, passing
  //           `activeContext`, `key` for `activeProperty`, `value` for `element`, `baseURL`, and the `frameExpansion`
  //           and `ordered` flags.
  //     13.10. If `expandedValue` is `null`, ignore `key` by continuing to the next `key` from `element`.
  //     13.11. If `containerMapping` includes `@list` and `expandedValue` is not already a list object, convert
  //            `expandedValue` to a list object by first setting it to an array containing only `expandedValue` if it
  //            is not already an array, and then by setting it to a map containing the `@list`-`expandedValue` pair.
  //     13.12. If `containerMapping` includes `@graph`, and includes neither `@id` nor `@index`, convert
  //            `expandedValue` into an array, if necessary, then convert each value `ev` in `expandedValue` into a
  //            graph object:
  //
  //            13.12.1. Convert `ev` into a graph object by creating a map containing the key-value pair `@graph`-`ev`
  //                     where `ev` is represented as an array.
  //
  //     13.13. If the term definition associated to `key` indicates that it is a reverse property:
  //
  //            13.13.1. If `result` has no `@reverse` entry, create one and initialize its value to an empty map.
  //            13.13.2. Reference the value of the `@reverse` entry in `result` using the variable `reverseMap`.
  //            13.13.3. If `expandedValue` is not an array, set it to an array containing `expandedValue`.
  //            13.13.4. For each `item` in `expandedValue`:
  //
  //                     13.13.4.1. If `item` is a value object or list object, an invalid reverse property value has
  //                                been detected and processing is aborted.
  //                     13.13.4.2. If `reverseMap` has no `expandedProperty` entry, create one and initialize its
  //                                value to an empty array.
  //                     13.13.4.3. Use `addValue` to add `item` to the `expandedProperty` entry in `reverseMap` using
  //                                `true` for `asArray`.
  //
  //     13.14. Otherwise, `key` is not a reverse property use `addValue` to add `expandedValue` to the
  //            `expandedProperty` entry in `result` using `true` for `asArray`.
  // 14. For each `key` `nestingKey` in `nests`, ordered lexicographically if `ordered` is `true`:
  //
  //     14.1. Initialize `nestedValues` to the value of `nestingKey` in `element`, ensuring that it is an array.
  //     14.2. For each `nestedValue` in `nestedValues`:
  //
  //           14.2.1. If `nestedValue` is not a map, or any key within `nestedValue` expands to `@value`, an invalid
  //                   `@nest` value error has been detected and processing is aborted.
  //           14.2.2. Recursively repeat steps 13 and 14 using `nestedValue` for `element`.
  //
  // 15. If `result` contains the entry `@value`:
  //
  //     15.1. The `result` must not contain any entries other than `@direction`, `@index`, `@language`, `@type`, and
  //           `@value`. It must not contain an `@type` entry if it contains either `@language` or `@direction` entries.
  //           Otherwise, an invalid value object error has been detected and processing is aborted.
  //     15.2. If the `result`'s `@type` entry is `@json`, then the `@value` entry may contain any value, and is treated
  //           as a JSON literal.
  //     15.3. Otherwise, if the value of the `result`'s `@value` entry is `null`, or an empty array, return `null`.
  //     15.4. Otherwise, if the value of the `result`'s `@value` entry is not a string and `result` contains the entry
  //           `@language`, an invalid language-tagged value error has been detected (only strings can be language-
  //           tagged) and processing is aborted.
  //     15.5. Otherwise, if the `result` has an `@type` entry and its value is not an IRI, an invalid typed value error
  //           has been detected and processing is aborted.
  //
  // 16. Otherwise, if `result` contains the entry `@type` and its associated value is not an array, set it to an array
  //     containing only the associated value.
  // 17. Otherwise, if `result` contains the entry `@set` or `@list`:
  //
  //     17.1. The `result` must contain at most one other entry which must be `@index`. Otherwise, an invalid set or
  //           list object error has been detected and processing is aborted.
  //     17.2. If `result` contains the entry `@set`, then set `result` to the entry's associated value.
  //
  // 18. If `result` is a map that contains only the entry `@language`, return `null`.
  // 19. If `activeProperty` is `null` or `@graph`, drop free-floating values as follows:
  //
  //     19.1. If `result` is a map which is empty, or contains only the entries `@value` or `@list`, set `result` to
  //           `null`.
  //     19.2. Otherwise, if `result` is a map whose only entry is `@id`, set `result` to `null`. When the
  //           `frameExpansion` flag is set, a map containing only the `@id` entry is retained.
  //
  // 20. Return `result`.
}

/**
 * In JSON-LD documents, some keys and values may represent IRIs. This section defines an algorithm for transforming a
 * string that represents an IRI into an absolute IRI or blank node identifier. It also covers transforming keyword
 * aliases into keywords.
 *
 * IRI expansion may occur during context processing or during any of the other JSON-LD algorithms. If IRI expansion
 * occurs during context processing, then the local context and its related defined map from the Context Processing
 * algorithm are passed to this algorithm. This allows for term definition dependencies to be processed via the Create
 * Term Definition algorithm.
 *
 * In order to expand value to an IRI, we must first determine if it is `null`, a term, a keyword alias, or some form of
 * IRI. Based on what we find, we handle the specific kind of expansion; for example, we expand a keyword alias to a
 * keyword and a term to an IRI according to its IRI mapping in the active context. While inspecting value we may also
 * find that we need to create term definition dependencies because we're running this algorithm during context
 * processing. We can tell whether or not we're running during context processing by checking local context against
 * `null`. We know we need to create a term definition in the active context when value is an entry in the local context
 * and the defined map does not have an entry for value with an associated value of `true`. The defined map is used
 * during Context Processing to keep track of which terms have already been defined or are in the process of being
 * defined. We create a term definition by using the Create Term Definition algorithm.
 *
 * @param activeContext the active context to use.
 * @param value the value to be expanded.
 * @param {boolean} [documentRelative] Whether the `value` can be interpreted as a relative IRI reference against the
 * document's base IRI.
 * @param {boolean} [vocab] Whether the `value` can be interpreted as a relative IRI reference against the active
 * context's vocabulary mapping.
 * @param [localContext] the local context to use.
 * @param [defined] the map defined to use.
 */
export function expandIri(
  activeContext: ActiveContext,
  value: Term,
  documentRelative: boolean = false,
  vocab: boolean = false,
  localContext: ContextDefinition | null = null,
  defined: Map<Term, boolean> | null = null,
): Term {
  // Procedure:
  //
  // 1. If `value` is a keyword or `null`, return `value` as is.
  // 2. If `value` has the form of a keyword (i.e., it matches the ABNF rule `"@"1*ALPHA` from [RFC5234]), a processor
  //    SHOULD generate a warning and return `null`.
  // 3. If `localContext` is not `null`, it contains an entry with a key that equals `value`, and the value of the entry
  //    for `value` in `defined` is not `true`, invoke the Create Term Definition algorithm, passing `activeContext`,
  //    `localContext`, `value` as `term`, and `defined`. This will ensure that a term definition is created for `value`
  //    in `activeContext` during Context Processing.
  // 4. If `activeContext` has a term definition for `value`, and the associated IRI mapping is a keyword, return that
  //    keyword.
  // 5. If `vocab` is `true` and the `activeContext` has a term definition for `value`, return the associated IRI
  //    mapping.
  // 6. If `value` contains a colon (`:`) anywhere after the first character, it is either an IRI, a compact IRI, or a
  //    blank node identifier:
  //
  //    6.1. Split `value` into a `prefix` and `suffix` at the first occurrence of a colon (`:`).
  //    6.2. If `prefix` is underscore (`_`) or `suffix` begins with double-forward-slash (`//`), return `value` as it
  //         is already an IRI or a blank node identifier.
  //    6.3. If `localContext` is not `null`, it contains a `prefix` entry, and the value of the `prefix` entry in
  //         `defined` is not `true`, invoke the Create Term Definition algorithm, passing `activeContext`,
  //         `localContext`, `prefix` as `term`, and `defined`. This will ensure that a term definition is created for
  //         `prefix` in `activeContext` during Context Processing.
  //    6.4. If `activeContext` contains a term definition for `prefix` having a non-null IRI mapping and the `prefix`
  //         flag of the term definition is `true`, return the result of concatenating the IRI mapping associated with
  //         `prefix` and `suffix`.
  //    6.5. If `value` has the form of an IRI, return `value`.
  //
  // 7. If `vocab` is `true`, and `activeContext` has a vocabulary mapping, return the result of concatenating the
  //    vocabulary mapping with `value`.
  // 8. Otherwise, if `documentRelative` is `true` set `value` to the result of resolving `value` against the base IRI
  //    from `activeContext`. Only the basic algorithm in section 5.2 of [RFC3986] is used; neither Syntax-Based
  //    Normalization nor Scheme-Based Normalization are performed. Characters additionally allowed in IRI references
  //    are treated in the same way that unreserved characters are treated in URI references, per section 6.5 of
  //    [RFC3987].
  // 9. Return `value` as is.
}

/**
 * Some values in JSON-LD can be expressed in a compact form. These values are required to be expanded at times when
 * processing JSON-LD documents. A value is said to be in expanded form after the application of this algorithm.
 *
 * If active property has a type mapping in the active context set to `@id` or `@vocab`, and the value is a string, a
 * map with a single entry `@id` whose value is the result of using the IRI Expansion algorithm on `value` is returned.
 * Otherwise, the result will be a map containing an `@value` entry whose value is the passed `value`. Additionally, an
 * `@type` entry will be included if there is a type mapping associated with the active property or an `@language` entry
 * if `value` is a string and there is language mapping associated with the active property.
 *
 * Note that values interpreted as IRIs fall into two categories: those that are `document relative`, and those that are
 * `vocabulary relative`. Properties and values of `@type`, along with terms marked as `"@type": "@vocab"` are
 * `vocabulary relative`, meaning that they need to be either a defined term, a compact IRI where the prefix is a term,
 * or a string which is turned into an IRI using the vocabulary mapping.
 *
 * @param activeContext the active context to use.
 * @param activeProperty the active property to use.
 * @param value the value to be expanded.
 */
function expandValue(
  activeContext: string,
  activeProperty: string,
  value: string,
) {
  // Procedure:
  //
  // 1. If the `activeProperty` has a type mapping in the `activeContext` that is `@id`, and the `value` is a string,
  //    return a new map containing a single entry where the key is `@id` and the value is the result of IRI expanding
  //    `value` using `true` for `documentRelative` and `false` for `vocab`.
  // 2. If the `activeProperty` has a type mapping in the `activeContext` that is `@vocab`, and the `value` is a string,
  //    return a new map containing a single entry where the key is `@id` and the value is the result of IRI expanding
  //    `value` using `true` for `documentRelative`.
  // 3. Otherwise, initialize `result` to a map with an `@value` entry whose value is set to `value`.
  // 4. If the `activeProperty` has a type mapping in the `activeContext`, other than `@id`, `@vocab`, or `@none`, add
  //    `@type` to `result` and set its value to the value associated with the type mapping.
  // 5. Otherwise, if `value` is a string:
  //
  //    5.1. Initialize `language` to the language mapping for `activeProperty` in `activeContext`, if any, otherwise to
  //         the default language of `activeContext`.
  //    5.2. Initialize `direction` to the direction mapping for `activeProperty` in `activeContext`, if any, otherwise
  //         to the default base direction of `activeContext`.
  //    5.3. If `language` is not `null`, add `@language` to `result` with the value `language`.
  //    5.4. If `direction` is not `null`, add `@direction` to `result` with the value `direction`.
  //
  // 6. Return `result`.
}

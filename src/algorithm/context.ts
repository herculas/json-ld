/**
 * When processing a JSON-LD data structure, each processing rule is applied using information provided by the active
 * context. An active context is a context that is used to resolve terms while the processing algorithm is running. This
 * function describes how to produce an active context.
 *
 * The active context consists of:
 *
 * - the active term definitions which specify how keys and values have to be interpreted (array of term definitions),
 * - the current base IRI (IRI),
 * - the original base URL (IRI),
 * - an inverse context (inverse context),
 * - an optional vocabulary mapping (IRI),
 * - an optional default language (string),
 * - an optional default direction ("ltr" or "rtl"), and
 * - an optional previous context (context), used when a non-propagated context is defined.
 *
 * Each term definition consists of:
 *
 * - an IRI mapping (IRI),
 * - a prefix flag (boolean),
 * - a protected flag (boolean),
 * - a reverse property flag (boolean),
 * - an optional base URL (IRI),
 * - an optional context (context),
 * - an optional container mapping (array of strings),
 * - an optional direction mapping ("ltr" or "rtl"),
 * - an optional index mapping (string),
 * - an optional language mapping (string),
 * - an optional nest value (string), and
 * - an optional type mapping (IRI).
 *
 * A term definition cannot only be used to map a term to an IRI, but also to map a term to a keyword, in which case it
 * is referred to as a keyword alias.
 *
 * When processing, active context is initialized with a `null` inverse context, without any term definitions,
 * vocabulary mapping, default base direction, or default language. If a local context is encountered during processing,
 * a new active context is created by cloning the existing active context. Then the information from the local context
 * is merged into the new active context. Given that local contexts may contain references to remote contexts, this
 * includes their retrieval.
 *
 * First we prepare a new active context result by cloning the current active context. Then we normalize the form of the
 * original local context to an array. Local contexts may be in the form of a map, a string, or an array containing a
 * combination of the two. Finally we process each context contained in the local context array as follows.
 *
 * If context is a string, it represents a reference to a remote context. We dereference the remote context and replace
 * context with the value of the `@context` entry of the top-level object in the retrieved JSON-LD document. If there's
 * no such entry, an `invalid remote context` has been detected. Otherwise, we process context by recursively using this
 * algorithm ensuring that there is no cyclical reference.
 *
 * If context is a map, it is a context definition. We first update the base IRI, the default base direction, the
 * default language, context propagation, the processing mode, and the vocabulary mapping by processing six specific
 * keywords: `@base`, `@direction`, `@language`, `@propagate`, `@version`, and `@vocab`. These are handled before any
 * other entries in the local context because they affect how the other entries are processed. If context contains
 * `@import`, it is retrieved and is reverse-merged into the containing context, allowing JSON-LD 1.0 contexts to be
 * upgraded to JSON-LD 1.1. Please note that `@base` is ignored when processing remote contexts.
 *
 * If context is not to be propagated, a reference to the previous context is retained so that it may be rolled back
 * when a new node object is entered. By default, all contexts are propagated, other than type-scoped contexts.
 *
 * When an active context is initialized, the value of the original base URL is initialized from the original
 * `documentUrl` of the document containing the initial context, if available, otherwise from the `base` API option.
 * This is necessary when resetting the active context by setting it to `null` to retain the original default base IRI.
 *
 * When initialized, or when any entry of an active context is changed, or any associated term definition is added,
 * changed, or removed, the inverse context field in active context is set to `null`.
 *
 * Then, for every other entry in local context, we update the term definition in result. Since term definitions in a
 * local context may themselves contain terms or compact IRIs, we may need to recurse. When doing so, we must ensure
 * that there is no cyclical dependency, which is an error. After we have processed any term definition dependencies, we
 * update the current term definition, which may be a keyword alias.
 *
 * Finally, we return result as the new active context.
 *
 * @param activeContext The active context.
 * @param localContext The local context to merge into the active context.
 * @param baseURL The base URL used when resolving relative context URLs.
 * @param {string[]} [remoteContexts] An array used to detect cyclic context inclusions.
 * @param {boolean} [overrideProtected] Whether or not protected terms can be overridden.
 * @param {boolean} [propagate] Mark term definitions associated with non-propagated contexts.
 * @param {boolean} [validateScopedContext] Used to limit recursion when validating possibly recursive scoped contexts.
 *
 * @returns The new active context.
 */
function processContext(
  activeContext: string,
  localContext: string,
  baseURL: string,
  remoteContexts: string[] = [],
  overrideProtected: boolean = false,
  propagate: boolean = true,
  validateScopedContext: boolean = true,
) {
  // Procedure:
  //
  // 1. Initialize `result` to the result of cloning `activeContext`, with inverse context set to `null`.
  // 2. If `localContext` is an object containing the member `@propagate`, its value MUST be boolean `true` or `false`,
  //    set `propagate` to that value.
  // 3. If `propagate` is `false`, and `result` does not have a previous context, set `previousContext` in `result` to
  //    `activeContext`.
  // 4. If `localContext` is not an array, set `localContext` to an array containing only `localContext`.
  // 5. For each item `context` in `localContext`:
  //
  //    5.1. If `context` is `null`:
  //
  //         5.1.1. If `overrideProtected` is `false` and `activeContext` contains any protected term definitions, an
  //                invalid context nullification has been detected and processing is aborted.
  //         5.1.2. Initialize `result` as a newly-initialized active context, setting both base IRI and original base
  //                URL to the value of original base URL in `activeContext`, and, if `propagate` is `false`,
  //                `previousContext` in `result` to the previous value of `result`.
  //         5.1.3. Continue with the next `context`.
  //
  //    5.2. If `context` is a string:
  //
  //         5.2.1. Initialize `context` to the result of resolving `context` against base URL. If base URL is not a
  //                valid IRI, then `context` MUST be a valid IRI, otherwise a loading document failed error has been
  //                detected and processing is aborted.
  //         5.2.2. If `validateScopedContext` is `false`, and `remoteContexts` already includes `context` do not
  //                process `context` further and continue to any next `context` in `localContext`.
  //         5.2.3. If the number of entries in the `remoteContexts` array exceeds a processor defined limit, a context
  //                overflow error has been detected and processing is aborted; otherwise, add `context` to
  //                `remoteContexts`.
  //         5.2.4. If `context` was previously dereferenced, then the processor MUST NOT do a further dereference, and
  //                `context` is set to the previously established internal representation: set `contextDocument` to the
  //                previously dereferenced document, and set `loadedContext` to the value of the `@context` entry from
  //                the document in `contextDocument`.
  //         5.2.5. Otherwise, set `contextDocument` to the `RemoteDocument` obtained by dereferencing `context` using
  //                the `LoadDocumentCallback`, passing `context` for `url`, and `http://www.w3.org/ns/json-ld#context`
  //                for `profile` and for `requestProfile`.
  //
  //                5.2.5.1. If `context` cannot be dereferenced, or the document from `contextDocument` cannot be
  //                         transformed into the internal representation, a loading remote context failed error has
  //                         been detected and processing is aborted.
  //                5.2.5.2. If the document has no top-level map with an `@context` entry, an invalid remote context
  //                         has been detected and processing is aborted.
  //                5.2.5.3. Set `loadedContext` to the value of that entry.
  //
  //         5.2.6. Set `result` to the result of recursively calling this algorithm, passing `result` for
  //                `activeContext`, `loadedContext` for `localContext`, the `documentUrl` of `contextDocument` for
  //                `baseURL`, a copy of `remoteContexts`, and `validateScopedContext`.
  //         5.2.7. Continue with the next `context`.
  //
  //    5.3. If `context` is not a map, an invalid local context error has been detected and processing is aborted.
  //    5.4. Otherwise, `context` is a context definition.
  //    5.5. If `context` has an `@version` entry:
  //
  //         5.5.1. If the associated value is not `1.1`, an invalid `@version` value has been detected, and processing
  //                is aborted.
  //         5.5.2. If processing mode is set to `json-ld-1.0`, a processing mode conflict error has been detected and
  //                processing is aborted.
  //
  //    5.6. If `context` has an `@import` entry:
  //
  //         5.6.1. If processing mode is `json-ld-1.0`, an invalid context entry error has been detected and processing
  //                is aborted.
  //         5.6.2. Otherwise, if the value of `@import` is not a string, an invalid `@import` value error has been
  //                detected and processing is aborted.
  //         5.6.3. Initialize `import` to the result of resolving the value of `@import` against `baseURL`.
  //         5.6.4. Dereference `import` using the `LoadDocumentCallback`, passing `import` for `url`, and
  //                `http://www.w3.org/ns/json-ld#context` for `profile` and for `requestProfile`.
  //         5.6.5. If `import` cannot be dereferenced, or cannot be transformed into the internal representation, a
  //                loading remote context failed error has been detected and processing is aborted.
  //         5.6.6. If the dereferenced document has no top-level map with an `@context` entry, or if the value of
  //                `@context` is not a context definition (i.e., it is not an map), an invalid remote context has been
  //                detected and processing is aborted; otherwise, set `importContext` to the value of that entry.
  //         5.6.7. If `importContext` has a `@import` entry, an invalid context entry error has been detected and
  //                processing is aborted.
  //         5.6.8. Set `context` to the result of merging `context` into `importContext`, replacing common entries with
  //                those from `context`.
  //
  //    5.7. If `context` has an `@base` entry and `remoteContexts` is empty, i.e., the currently being processed
  //         context is not a remote context:
  //
  //         5.7.1. Initialize `value` to the value associated with the `@base` entry.
  //         5.7.2. If `value` is `null`, remove the base IRI of `result`.
  //         5.7.3. Otherwise, if `value` is an IRI, the base IRI of `result` is set to `value`.
  //         5.7.4. Otherwise, if `value` is a relative IRI reference and the base IRI of `result` is not `null`, set
  //                the base IRI of `result` to the result of resolving `value` against the current base IRI of
  //                `result`.
  //         5.7.5. Otherwise, an invalid base IRI error has been detected and processing is aborted.
  //
  //    5.8. If `context` has an `@vocab` entry:
  //
  //         5.8.1. Initialize `value` to the value associated with the `@vocab` entry.
  //         5.8.2. If `value` is `null`, remove any vocabulary mapping from `result`.
  //         5.8.3. Otherwise, if `value` is an IRI or blank node identifier, the vocabulary mapping of `result` is set
  //                to the result of IRI expanding `value` using `true` for `documentRelative`. If it is not an IRI, or
  //                a blank node identifier, an invalid vocab mapping error has been detected and processing is aborted.
  //
  //    5.9. If `context` has an `@language` entry:
  //
  //         5.9.1. Initialize `value` to the value associated with the `@language` entry.
  //         5.9.2. If `value` is `null`, remove any default language from `result`.
  //         5.9.3. Otherwise, if `value` is a string, the default language of `result` is set to `value`. If it is not
  //                a string, an invalid default language error has been detected and processing is aborted. If `value`
  //                is not well-formed according to section 2.2.9 of [BCP47], processors SHOULD issue a warning.
  //
  //    5.10. If `context` has an `@direction` entry:
  //
  //         5.10.1. If processing mode is `json-ld-1.0`, an invalid context entry error has been detected and
  //                 processing is aborted.
  //         5.10.2. Initialize `value` to the value associated with the `@direction` entry.
  //         5.10.3. If `value` is `null`, remove any base direction from `result`.
  //         5.10.4. Otherwise, if `value` is a string, the base direction of `result` is set to `value`. If it is not
  //                 `null`, `"ltr"`, or `"rtl"`, an invalid base direction error has been detected and processing is
  //                 aborted.
  //
  //    5.11. If `context` has an `@propagate` entry:
  //
  //         5.11.1. If processing mode is `json-ld-1.0`, an invalid context entry error has been detected and
  //                 processing is aborted.
  //         5.11.2. Otherwise, if the value of `@propagate` is not boolean `true` or `false`, an invalid
  //                 `@propagate` value error has been detected and processing is aborted.
  //
  //    5.12. Create a map `defined` to keep track of whether or not a term has already been defined or is currently
  //         being defined during recursion.
  //    5.13. For each key-value pair in `context` where key is not `@base`, `@direction`, `@import`, `@language`,
  //         `@propagate`, `@protected`, `@version`, or `@vocab`, invoke the Create Term Definition algorithm, passing
  //         `result` for `activeContext`, `context` for `localContext`, `key`, `defined`, `baseURL`, the value of the
  //         `@protected` entry from `context`, if any, for `protected`, `overrideProtected`, and a copy of
  //         `remoteContexts`.
  //    5.14. Return `result`.
}

/**
 * This function creates a term definition in the active context for a term being processed in a local context.
 *
 * Term definitions are created by parsing the information in the given local context for the given term. If the given
 * term is a compact IRI, it may omit an IRI mapping by depending on its prefix having its own term definition. If the
 * prefix is an entry in the local context, then its term definition must first be created, through recursion, before
 * continuing. Because a term definition can depend on other term definitions, a mechanism must be used to detect
 * cyclical dependencies. The solution employed here uses a map, defined, that keeps track of whether or not a term has
 * been defined or is currently in the process of being defined. This map is checked before any recursion is attempted.
 *
 * After all dependencies for a term have been defined, the rest of the information in the local context for the given
 * term is taken into account, creating the appropriate IRI mapping, container mapping, and type mapping, language
 * mapping, or direction mapping for the term.
 *
 * @param activeContext The active context.
 * @param localContext The local context being processed.
 * @param term The term to define.
 * @param defined A map of defined term mappings.
 * @param baseURL The base URL used when resolving relative context URLs.
 * @param {boolean} [termProtected] Whether or not the term is protected.
 * @param {boolean} [overrideProtected] Whether or not protected terms can be overridden.
 * @param {string[]} [remoteContexts] An array used to detect cyclic context inclusions.
 * @param {boolean} [validateScopedContext] Used to limit recursion when validating possibly recursive scoped contexts.
 */
function createTermDefinition(
  activeContext: string,
  localContext: string,
  term: string,
  defined: object,
  baseURL: string | null = null,
  termProtected: boolean = false,
  overrideProtected: boolean = false,
  remoteContexts: string[] = [],
  validateScopedContext: boolean = true,
) {
  // Procedure:
  //
  // 1. If `defined` contains the entry `term` and the associated value is `true` (indicating that the term definition
  //    has already been created), return. Otherwise, if the value is `false`, a cyclic IRI mapping error has been
  //    detected and processing is aborted.
  // 2. If `term` is the empty string (""), an invalid term definition error has been detected and processing is
  //    aborted. Otherwise, set the value associated with `defined`'s `term` entry to `false`. This indicates that the
  //    term definition is now being created but is not yet complete.
  // 3. Initialize `value` to a copy of the value associated with the entry `term` in `localContext`.
  // 4. If `term` is `@type`, and processing mode is `json-ld-1.0`, a keyword redefinition error has been detected and
  //    processing is aborted. At this point, `value` MUST be a map with only either or both of the following entries:
  //
  //    - An entry for `@container` with value `@set`.
  //    - An entry for `@protected`.
  //
  //    Any other value means that a keyword redefinition error has been detected and processing is aborted.
  // 5. Otherwise, since keywords cannot be overridden, `term` MUST NOT be a keyword and a keyword redefinition error
  //    has been detected and processing is aborted. If `term` has the form of a keyword (i.e., it matches the ABNF rule
  //    `"@"1*ALPHA` from [RFC5234]), return; processors SHOULD generate a warning.
  // 6. Initialize `previousDefinition` to any existing term definition for `term` in `activeContext`, removing that
  //    term definition from `activeContext`.
  // 7. If `value` is `null`, convert it to a map consisting of a single entry whose key is `@id` and whose value is
  //    `null`.
  // 8. Otherwise, if `value` is a string, convert it to a map consisting of a single entry whose key is `@id` and whose
  //    value is `value`. Set `simpleTerm` to `true`.
  // 9. Otherwise, `value` MUST be a map, if not, an invalid term definition error has been detected and processing is
  //    aborted. Set `simpleTerm` to `false`.
  // 10. Create a new term definition, `definition`, initializing `prefixFlag` to `false`, `protected` to `protected`,
  //     and `reverseProperty` to `false`.
  // 11. If `value` has an `@protected` entry, set the `protected` flag in `definition` to the value of this entry. If
  //     the value of `@protected` is not a boolean, an invalid `@protected` value error has been detected and
  //     processing is aborted. If processing mode is `json-ld-1.0`, an invalid term definition has been detected and
  //     processing is aborted.
  // 12. If `value` contains the entry `@type`:
  //
  //     12.1. Initialize `type` to the value associated with the `@type` entry, which MUST be a string. Otherwise, an
  //           invalid type mapping error has been detected and processing is aborted.
  //     12.2. Set `type` to the result of IRI expanding `type`, using `localContext`, and `defined`.
  //     12.3. If the expanded `type` is `@json` or `@none`, and processing mode is `json-ld-1.0`, an invalid type
  //           mapping error has been detected and processing is aborted.
  //     12.4. Otherwise, if the expanded `type` is neither `@id`, nor `@json`, nor `@none`, nor `@vocab`, nor an IRI,
  //           an invalid type mapping error has been detected and processing is aborted.
  //     12.5. Set the type mapping for `definition` to `type`.
  //
  // 13. If `value` contains the entry `@reverse`:
  //
  //     13.1. If `value` contains `@id` or `@nest`, entries, an invalid reverse property error has been detected and
  //           processing is aborted.
  //     13.2. If the value associated with the `@reverse` entry is not a string, an invalid IRI mapping error has been
  //           detected and processing is aborted.
  //     13.3. If the value associated with the `@reverse` entry is a string having the form of a keyword (i.e., it
  //           matches the ABNF rule `"@"1*ALPHA` from [RFC5234]), return; processors SHOULD generate a warning.
  //     13.4. Otherwise, set the IRI mapping of `definition` to the result of IRI expanding the value associated with
  //           the `@reverse` entry, using `localContext`, and `defined`. If the result does not have the form of an IRI
  //           or a blank node identifier, an invalid IRI mapping error has been detected and processing is aborted.
  //     13.5. If `value` contains an `@container` entry, set the container mapping of `definition` to an array
  //           containing its value; if its value is neither `@set`, nor `@index`, nor `null`, an invalid reverse
  //           property error has been detected (reverse properties only support set- and index-containers) and
  //           processing is aborted.
  //     13.6. Set the reverse property flag of `definition` to `true`.
  //     13.7. Set the term definition of `term` in `activeContext` to `definition` and the value associated with
  //           `defined`'s entry `term` to `true` and return.
  //
  // 14. If `value` contains the entry `@id` and its value does not equal `term`:
  //
  //     14.1. If the `@id` entry of `value` is `null`, the term is not used for IRI expansion, but is retained to be
  //           able to detect future redefinitions of this term.
  //     14.2. Otherwise:
  //
  //           14.2.1. If the value associated with the `@id` entry is not a string, an invalid IRI mapping error has
  //                   been detected and processing is aborted.
  //           14.2.2. If the value associated with the `@id` entry is not a keyword, but has the form of a keyword
  //                   (i.e., it matches the ABNF rule `"@"1*ALPHA` from [RFC5234]), return; processors SHOULD generate
  //                   a warning.
  //           14.2.3. Otherwise, set the IRI mapping of `definition` to the result of IRI expanding the value
  //                   associated with the `@id` entry, using `localContext`, and `defined`. If the resulting IRI
  //                   mapping is neither a keyword, nor an IRI, nor a blank node identifier, an invalid IRI mapping
  //                   error has been detected and processing is aborted; if it equals `@context`, an invalid keyword
  //                   alias error has been detected and processing is aborted.
  //           14.2.4. If the term contains a colon (`:`) anywhere but as the first or last character of `term`, or if
  //                   it contains a slash (`/`) anywhere:
  //
  //                   14.2.4.1. Set the value associated with `defined`'s `term` entry to `true`.
  //                   14.2.4.2. If the result of IRI expanding `term` using `localContext`, and `defined`, is not the
  //                             same as the IRI mapping of `definition`, an invalid IRI mapping error has been detected
  //                             and processing is aborted.
  //
  //           14.2.5. If the term contains neither a colon (`:`) nor a slash (`/`), `simpleTerm` is `true`, and if the
  //                   IRI mapping of `definition` is either an IRI ending with a gen-delim character, or a blank node
  //                   identifier, set the `prefixFlag` in `definition` to `true`.
  //
  // 15. Otherwise if the term contains a colon (`:`) anywhere after the first character:
  //
  //     15.1. If `term` is a compact IRI with a prefix that is an entry in `localContext` a dependency has been found.
  //           Use this algorithm recursively passing `activeContext`, `localContext`, the prefix as `term`, and
  //           `defined`.
  //     15.2. If term's prefix has a term definition in `activeContext`, set the IRI mapping of `definition` to the
  //           result of concatenating the value associated with the prefix's IRI mapping and the term's suffix.
  //     15.3. Otherwise, term is an IRI or blank node identifier. Set the IRI mapping of `definition` to term.
  //
  // 16. Otherwise if the term contains a slash (`/`):
  //
  //     16.1. Term is a relative IRI reference.
  //     16.2. Set the IRI mapping of `definition` to the result of IRI expanding `term`. If the resulting IRI mapping
  //           is not an IRI, an invalid IRI mapping error has been detected and processing is aborted.
  //
  // 17. Otherwise, if `term` is `@type`, set the IRI mapping of `definition` to `@type`.
  // 18. Otherwise, if `activeContext` has a vocabulary mapping, the IRI mapping of `definition` is set to the result of
  //     concatenating the value associated with the vocabulary mapping and `term`. If it does not have a vocabulary
  //     mapping, an invalid IRI mapping error been detected and processing is aborted.
  // 19. If `value` contains the entry `@container`:
  //
  //     19.1. Initialize `container` to the value associated with the `@container` entry, which MUST be either
  //           `@graph`, `@id`, `@index`, `@language`, `@list`, `@set`, `@type`, or an array containing exactly any one
  //           of those keywords, an array containing `@graph` and either `@id` or `@index` optionally including `@set`,
  //           or an array containing a combination of `@set` and any of `@index`, `@graph`, `@id`, `@type`, `@language`
  //           in any order. Otherwise, an invalid container mapping has been detected and processing is aborted.
  //     19.2. If the container value is `@graph`, `@id`, or `@type`, or is otherwise not a string, generate an invalid
  //           container mapping error and abort processing if processing mode is `json-ld-1.0`.
  //     19.3. Set the container mapping of `definition` to `container` coercing to an array, if necessary.
  //     19.4. If the container mapping of `definition` includes `@type`:
  //
  //           19.4.1. If type mapping in `definition` is undefined, set it to `@id`.
  //           19.4.2. If type mapping in `definition` is neither `@id` nor `@vocab`, an invalid type mapping error has
  //                   been detected and processing is aborted.
  //
  // 20. If `value` contains the entry `@index`:
  //
  //     20.1. If processing mode is `json-ld-1.0` or container mapping does not include `@index`, an invalid term
  //           definition has been detected and processing is aborted.
  //     20.2. Initialize `index` to the value associated with the `@index` entry. If the result of IRI expanding that
  //           value is not an IRI, an invalid term definition has been detected and processing is aborted.
  //     20.3. Set the index mapping of `definition` to `index`.
  //
  // 21. If `value` contains the entry `@context`:
  //
  //     21.1. If processing mode is `json-ld-1.0`, an invalid term definition has been detected and processing is
  //           aborted.
  //     21.2. Initialize `context` to the value associated with the `@context` entry, which is treated as a local
  //           context.
  //     21.3. Invoke the Context Processing algorithm using the `activeContext`, `context` as `localContext`,
  //           `baseURL`, `true` for `overrideProtected`, a copy of `remoteContexts`, and `false` for
  //           `validateScopedContext`. If any error is detected, an invalid scoped context error has been detected and
  //           processing is aborted.
  //     21.4. Set the local context of `definition` to `context`, and `baseURL` to `baseURL`.
  //
  // 22. If `value` contains the entry `@language` and does not contain the entry `@type`:
  //
  //     22.1. Initialize `language` to the value associated with the `@language` entry, which MUST be either `null` or
  //           a string. If `language` is not well-formed according to section 2.2.9 of [BCP47], processors SHOULD issue
  //           a warning. Otherwise, an invalid language mapping error has been detected and processing is aborted.
  //     22.2. Set the language mapping of `definition` to `language`.
  //
  // 23. If `value` contains the entry `@direction` and does not contain the entry `@type`:
  //
  //     23.1. Initialize `direction` to the value associated with the `@direction` entry, which MUST be either `null`,
  //           `"ltr"`, or `"rtl"`. Otherwise, an invalid base direction error has been detected and processing is
  //           aborted.
  //     23.2. Set the direction mapping of `definition` to `direction`.
  //
  // 24. If `value` contains the entry `@nest`:
  //
  //     24.1. If processing mode is `json-ld-1.0`, an invalid term definition has been detected and processing is
  //           aborted.
  //     24.2. Initialize `nest` value in `definition` to the value associated with the `@nest` entry, which MUST be a
  //           string and MUST NOT be a keyword other than `@nest`. Otherwise, an invalid `@nest` value error has been
  //           detected and processing is aborted.
  //
  // 25. If `value` contains the entry `@prefix`:
  //
  //     25.1. If processing mode is `json-ld-1.0`, or if `term` contains a colon (`:`) or slash (`/`), an invalid term
  //           definition has been detected and processing is aborted.
  //     25.2. Set the `prefixFlag` to the value associated with the `@prefix` entry, which MUST be a boolean.
  //           Otherwise, an invalid @prefix value error has been detected and processing is aborted.
  //     25.3. If the `prefixFlag` of `definition` is set to `true`, and its IRI mapping is a keyword, an invalid term
  //           definition has been detected and processing is aborted.
  //
  // 26. If `value` contains any entry other than `@id`, `@reverse`, `@container`, `@context`, `@direction`, `@index`,
  //     `@language`, `@nest`, `@prefix`, `@protected`, or `@type`, an invalid term definition error has been detected
  //     and processing is aborted.
  // 27. If `overrideProtected` is `false` and `previousDefinition` exists and is protected:
  //
  //     27.1. If `definition` is not the same as `previousDefinition` (other than the value of `protected`), a
  //           protected term redefinition error has been detected, and processing is aborted.
  //     27.2. Set `definition` to `previousDefinition` to retain the value of `protected`.
  //
  // 28. Set the term definition of `term` in `activeContext` to `definition` and set the value associated with
  //     `defined`'s entry `term` to `true`.
}

/**
 * When there is more than one term that could be chosen to compact an IRI, it has to be ensured that the term selection
 * is both deterministic and represents the most context-appropriate choice whilst taking into consideration algorithmic
 * complexity.
 *
 * In order to make term selections, the concept of an inverse context is introduced. An inverse context is essentially
 * a reverse lookup table that maps container mapping, type mappings, and language mappings to a simple term for a given
 * active context. A inverse context only needs to be generated for an active context if it is being used for
 * compaction.
 *
 * To make use of an inverse context, a list of preferred container mapping and the type mapping or language mapping are
 * gathered for a particular value associated with an IRI. These parameters are then fed to the term selection
 * algorithm, which will find the term that most appropriately matches the value's mappings.
 *
 * To create an inverse context for a given active context, each term in the active context is visited, ordered by
 * length, shortest first (ties are broken by choosing the lexicographically least term). For each term, an entry is
 * added to the inverse context for each possible combination of container mapping and type mapping or language mapping
 * that would legally match the term. Illegal matches include differences between a value's type mapping or language
 * mapping and that of the term. If a term has no container mapping, type mapping, or language mapping (or some
 * combination of these), then it will have an entry in the inverse context using the special key @none. This allows the
 * Term Selection algorithm to fall back to choosing more generic terms when a more specifically-matching term is not
 * available for a particular IRI and value combination.
 *
 * Although normalizing language tags is optional, the inverse context creates entries based on normalized language
 * tags, so that the proper term can be selected regardless of representation.
 *
 * @param activeContext The active context.
 */
function createInverseContext(
  activeContext: string,
) {
  // Procedure:
  //
  // 1. Initialize `result` to an empty map.
  // 2. Initialize `defaultLanguage` to `@none`. If the `activeContext` has a default language, set `defaultLanguage` to
  //    the default language from the `activeContext` normalized to lower case.
  // 3. For each key `term` and value `termDefinition` in the `activeContext`, ordered by shortest `term` first
  //    (breaking ties by choosing the lexicographically least `term`):
  //
  //    3.1. If the `termDefinition` is `null`, the term cannot be selected during compaction, so continue to the next
  //         `term`.
  //    3.2. Initialize `container` to `@none`. If the container mapping is not empty, set `container` to the
  //         concatenation of all values of the container mapping in lexicographical order.
  //    3.3. Initialize `var` to the value of the IRI mapping for the `termDefinition`.
  //    3.4. If `var` is not an entry of `result`, add an entry where the key is `var` and the value is an empty map to
  //         `result`.
  //    3.5. Reference the value associated with the `var` entry in `result` using the variable `containerMap`.
  //    3.6. If `containerMap` has no `container` entry, create one and set its value to a new map with three entries.
  //         The first entry is `@language` and its value is a new empty map, the second entry is `@type` and its value
  //         is a new empty map, and the third entry is `@any` and its value is a new map with the entry `@none` set to
  //         the `term` being processed.
  //    3.7. Reference the value associated with the `container` entry in `containerMap` using the variable
  //         `type/LanguageMap`.
  //    3.8. Reference the value associated with the `@type` entry in `type/LanguageMap` using the variable `typeMap`.
  //    3.9. Reference the value associated with the `@language` entry in `type/LanguageMap` using the variable
  //         `languageMap`.
  //    3.10. If the `termDefinition` indicates that the term represents a reverse property:
  //
  //          3.10.1. If `typeMap` does not have an `@reverse` entry, create one and set its value to the `term` being
  //                  processed.
  //
  //    3.11. Otherwise, if `termDefinition` has a type mapping which is `@none`:
  //
  //          3.11.1. If `languageMap` does not have an `@any` entry, create one and set its value to the `term` being
  //                  processed.
  //          3.11.2. If `typeMap` does not have an `@any` entry, create one and set its value to the `term` being
  //                  processed.
  //
  //    3.12. Otherwise, if `termDefinition` has a type mapping:
  //
  //          3.12.1. If `typeMap` does not have an entry corresponding to the type mapping in `termDefinition`, create
  //                  one and set its value to the `term` being processed.
  //
  //    3.13. Otherwise, if `termDefinition` has both a language mapping and a direction mapping:
  //
  //          3.13.1. Create a new variable `langDir`.
  //          3.13.2. If neither the language mapping nor the direction mapping are `null`, set `langDir` to the
  //                  concatenation of `languageMapping` and `directionMapping` separated by an underscore ("_")
  //                  normalized to lower case.
  //          3.13.3. Otherwise, if `languageMapping` is not `null`, set `langDir` to the `languageMapping`, normalized
  //                  to lower case.
  //          3.13.4. Otherwise, if `directionMapping` is not `null`, set `langDir` to `directionMapping` preceded by an
  //                  underscore ("_").
  //          3.13.5. Otherwise, set `langDir` to `@null`.
  //          3.13.6. If `languageMap` does not have a `langDir` entry, create one and set its value to the `term` being
  //                  processed.
  //
  //    3.14. Otherwise, if `termDefinition` has a language mapping (might be `null`):
  //
  //          3.14.1. If the language mapping equals `null`, set `language` to `@null`; otherwise to the language
  //                  mapping, normalized to lower case.
  //          3.14.2. If `languageMap` does not have a `language` entry, create one and set its value to the `term`
  //                  being processed.
  //
  //    3.15. Otherwise, if `termDefinition` has a direction mapping (might be `null`):
  //
  //          3.15.1. If the direction mapping equals `null`, set `direction` to `@none`; otherwise to
  //                  `directionMapping` preceded by an underscore ("_").
  //          3.15.2. If `languageMap` does not have a `direction` entry, create one and set its value to the `term`
  //                  being processed.
  //
  //    3.16. Otherwise, if `activeContext` has a default base direction:
  //
  //          3.16.1. Initialize a variable `langDir` with the concatenation of default language and default base
  //                  direction, separate by an underscore ("_"), normalized to lower case.
  //          3.16.2. If `languageMap` does not have a `langDir` entry, create one and set its value to the `term`
  //                  being processed.
  //          3.16.3. If `languageMap` does not have an `@none` entry, create one and set its value to the `term` being
  //                  processed.
  //          3.16.4. If `typeMap` does not have an `@none` entry, create one and set its value to the `term` being
  //                  processed.
  //
  //    3.17. Otherwise:
  //
  //          3.17.1. If `languageMap` does not have a default language entry (after being normalized to lower case),
  //                  create one and set its value to the `term` being processed.
  //          3.17.2. If `languageMap` does not have an `@none` entry, create one and set its value to the `term` being
  //                  processed.
  //          3.17.3. If `typeMap` does not have an `@none` entry, create one and set its value to the `term` being
  //                  processed.
  //
  // 4. Return `result`.
}

/**
 * This algorithm, invoked via the IRI Compaction algorithm, makes use of an active context's inverse context to find
 * the term that is best used to compact an IRI. Other information about a value associated with the IRI is given,
 * including which container mapping and which type mapping or language mapping would be best used to express the value.
 *
 * The inverse context's entry for the IRI will be first searched according to the preferred container mapping, in the
 * order that they are given. Amongst terms with a matching container mapping, preference will be given to those with a
 * matching type mapping or language mapping, over those without a type mapping or language mapping. If there is no term
 * with a matching container mapping then the term without a container mapping that matches the given type mapping or
 * language mapping is selected. If there is still no selected term, then a term with no type mapping or language
 * mapping will be selected if available. No term will be selected that has a conflicting type mapping or language
 * mapping. Ties between terms that have the same mappings are resolved by first choosing the shortest terms, and then
 * by choosing the lexicographically least term. Note that these ties are resolved automatically because they were
 * previously resolved when the Inverse Context Creation algorithm was used to create the inverse context.
 *
 * @param activeContext The active context.
 * @param varKeywordIri The keyword or IRI var to find a term for.
 * @param containers An array of preferred container mappings.
 * @param typeLanguage The type or language to find a term for.
 * @param preferredValues An array of preferred values for the type or language.
 */
function selectTerm(
  activeContext: string,
  varKeywordIri: string,
  containers: string[],
  typeLanguage: string,
  preferredValues: string[],
) {
  // Procedure:
  //
  // 1. If the `activeContext` has a `null` inverse context, set `inverseContext` in `activeContext` to the result of
  //    calling the Inverse Context Creation algorithm using `activeContext`.
  // 2. Initialize `inverseContext` to the value of `inverseContext` in `activeContext`.
  // 3. Initialize `containerMap` to the value associated with `varKeywordIri` in `inverseContext`.
  // 4. For each item `container` in `containers`:
  //
  //    4.1. If `container` is not an entry of `containerMap`, then there is no term with a matching container mapping
  //         for it, so continue to the next `container`.
  //    4.2. Initialize `typeLanguageMap` to the value associated with the `container` entry in `containerMap`.
  //    4.3. Initialize `valueMap` to the value associated with `typeLanguage` entry in `typeLanguageMap`.
  //    4.4. For each item in `preferredValues`:
  //
  //         4.4.1. If `item` is not an entry of `valueMap`, then there is no term with a matching type mapping or
  //                language mapping, so continue to the next `item`.
  //         4.4.2. Otherwise, a matching term has been found, return the value associated with the `item` entry in
  //                `valueMap`.
  //
  // 5. No matching term has been found. Return `null`.
}

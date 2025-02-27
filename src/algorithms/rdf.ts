/**
 * This algorithm deserializes a JSON-LD document to an RDF dataset. Please note that RDF does not allow a blank node to
 * be used as a property, while JSON-LD does. Therefore, by default triples that would have contained blank nodes as
 * properties are discarded when interpreting JSON-LD as RDF.
 *
 * If the `rdfDirection` option is not `null`, then special processing is used to convert from an `i18n-datatype` or
 * `compound-literal` form.
 *
 * Implementations MUST generate only well-formed triples and graph names:
 *
 * - An IRI is well-formed if it matches the ABNF for IRI as described in [RFC-3987].
 * - A blank node identifier is well-formed if it matches the EBNF for BLANK_NODE_LABEL as described in [Turtle].
 * - A literal is well-formed if it has the lexical form of a string, any datatype IRI is well-formed, and any language
 *   tag is well-formed according to section 2.2.9 of [BCP47].
 *
 * The JSON-LD document is expanded and converted to a `nodeMap` using the Node Map Generation algorithm. This allows
 * each graph represented within the document to be extracted and flattened, making it easier to process each node
 * object. Each graph from the `nodeMap` is processed to extract triple, to which any (non-default) graph name is
 * applied to create an RDF dataset. Each node object in the node map has an `@id` entry which corresponds to the
 * subject, the other entries represent predicates. Each entry value is either an IRI or blank node identifier or can be
 * transformed to an RDF literal to generate an triple. Lists are transformed into an RDF collection using the List to
 * RDF Conversion algorithm.
 *
 * The algorithm takes a map node map, which is the result of the Node Map Generation algorithm and an RDF dataset
 * dataset into which new graphs and triples are added. It also takes two optional input variables produceGeneralizedRdf
 * and rdfDirection. Unless the produceGeneralizedRdf option is set to true, triple containing a blank node predicate
 * are excluded from output.
 *
 * @param nodeMap A map which is the result of the Node Map Generation algorithm.
 * @param dataset An RDF dataset into which new graphs and triples are added.
 * @param {boolean} [produceGeneralizedRdf] Whether to exclude triples with blank node predicates from the output.
 * @param {string} [rdfDirection] the RDF direction, either 'i18n-datatype', 'compound-literal', or null.
 */
function jsonldToRdf(
  nodeMap: any,
  dataset: any,
  produceGeneralizedRdf: boolean = false,
  rdfDirection: string | null = null,
) {
  // Procedure:
  //
  // 1. For each `graphName` and `graph` in `nodeMap` ordered by `graphName`:
  //
  //    1.1. If `graphName` is not well-formed, continue with the next `graphName`-`graph` pair.
  //    1.2. If `graphName` is `@default`, initialize `triples` to the value of the `defaultGraph` attribute of
  //         `dataset`. Otherwise, initialize `triples` as an empty `RdfGraph` and add to `dataset` using its `add`
  //         method along with `graphName` for `graphName`.
  //    1.3. For each `subject` and `node` in `graph` ordered by `subject`:
  //
  //         1.3.1. If `subject` is not well-formed, continue with the next `subject`-`node` pair.
  //         1.3.2. For each `property` and `values` in `node` ordered by `property`:
  //
  //                1.3.2.1. If `property` is `@type`, then for each `type` in `values`, create a new `RdfTriple`
  //                         composed of `subject`, `rdf:type` for `predicate`, and `type` for `object` and add to
  //                         `triples` using its `add` method, unless `type` is not well-formed.
  //                1.3.2.2. Otherwise, if `property` is a keyword continue with the next `property`-`values` pair.
  //                1.3.2.3. Otherwise, if `property` is a blank node identifier and the `produceGeneralizedRdf`
  //                         option is not `true`, continue with the next `property`-`values` pair.
  //                1.3.2.4. Otherwise, if `property` is not well-formed, continue with the next `property`-`values`
  //                         pair.
  //                1.3.2.5. Otherwise, `property` is an IRI or blank node identifier. For each `item` in `values`:
  //
  //                         1.3.2.5.1. Initialize `listTriples` as an empty array.
  //                         1.3.2.5.2. Add a triple composed of `subject`, `property`, and the result of using the
  //                                    Object to RDF Conversion algorithm passing `item` and `listTriples` to `triples`
  //                                    using its `add` method, unless the result is `null`, indicating a non-well-
  //                                    formed resource that has to be ignored.
  //                         1.3.2.5.3. Add all `RdfTriple` instances from `listTriples` to `triples` using its `add`
  //                                    method.
}

/**
 * This algorithm takes a node object, list object, or value object and transforms it into an resource to be used as the
 * object of an triple. If a node object containing a relative IRI reference is passed to the algorithm, `null` is
 * returned which then causes the resulting triple to be ignored. If the input is a list object, it will also return the
 * triples created from that input.
 *
 * Value objects are transformed to RDF literals whereas node objects are transformed to IRIs, blank node identifiers,
 * or `null`.
 *
 * @param item A value object, list object, or node object.
 * @param listTriples An empty array.
 */
function objectToRdf(
  item: any,
  listTriples: any[],
) {
  // Procedure:
  //
  // 1. If `item` is a node object and the value of its `@id` entry is not well-formed, return `null`.
  // 2. If `item` is a node object, return the IRI or blank node identifier associated with its `@id` entry.
  // 3. If `item` is a list object return the result of the List Conversion algorithm, passing the value associated with
  //    the `@list` entry from `item` and `listTriples`.
  // 4. Otherwise, `item` is a value object. Initialize `value` to the value associated with the `@value` entry in
  //    `item`.
  // 5. Initialize `datatype` to the value associated with the `@type` entry of `item` or `null` if `item` does not have
  //    such an entry.
  // 6. If `datatype` is not `null` and neither a well-formed IRI nor `@json`, return `null`.
  // 7. If `item` has an `@language` entry which is not well-formed, return `null`.
  // 8. If `datatype` is `@json`, convert `value` to the canonical lexical form using the result of transforming the
  //    internal representation of `value` to JSON and set `datatype` to `rdf:JSON`.
  // 9. If `value` is `true` or `false`, set `value` to the string `true` or `false` which is the canonical lexical form
  //    as described in Section 8.6 Data Round Tripping If `datatype` is `null`, set `datatype` to `xsd:boolean`.
  // 10. Otherwise, if `value` is a number with a non-zero fractional part (the result of a modulo‑1 operation) or an
  //     absolute value greater or equal to 10^21, or `value` is a number and `datatype` equals `xsd:double`, convert
  //     `value` to a string in canonical lexical form of an `xsd:double` as defined in [XMLSCHEMA11-2] and described in
  //     Section 8.6 Data Round Tripping. If `datatype` is `null`, set `datatype` to `xsd:double`.
  // 11. Otherwise, if `value` is a number, convert it to a string in canonical lexical form of an `xsd:integer` as
  //     defined in [XMLSCHEMA11-2] and described in Section 8.6 Data Round Tripping. If `datatype` is `null`, set
  //     `datatype` to `xsd:integer`.
  // 12. Otherwise, if `datatype` is `null`, set `datatype` to `xsd:string` or `rdf:langString`, depending on if `item`
  //     has an `@language` entry.
  // 13. If `item` contains an `@direction` entry and `rdfDirection` is not `null`, `item` is a value object which is
  //     serialized using special rules.
  //
  //     13.1. Initialize `language` to the value of `@language` in `item` normalized to lower case, or the empty string
  //           ("") if there is no such entry.
  //     13.2. If `rdfDirection` is `i18n-datatype`, set `datatype` to the result of appending `language` and the value
  //           of `@direction` in `item` separated by an underscore ("_") to `https://www.w3.org/ns/i18n#`. Initialize
  //           `literal` as an RDF literal using `value` and `datatype`.
  //     13.3. Otherwise, if `rdfDirection` is `compound-literal`:
  //
  //           13.3.1. Initialize `literal` as a new blank node.
  //           13.3.2. Create a new triple using `literal` as the subject, `rdf:value` as the predicate, and the value
  //                   of `@value` in `item` as the object, and add it to `listTriples`.
  //           13.3.3. If the `item` has an entry for `@language`, create a new triple using `literal` as the subject,
  //                   `rdf:language` as the predicate, and `language` as the object, and add it to `listTriples`.
  //           13.3.4. Create a new triple using `literal` as the subject, `rdf:direction` as the predicate, and the
  //                   value of `@direction` in `item` as the object, and add it to `listTriples`.
  //
  // 14. Otherwise, initialize `literal` as an RDF literal using `value` and `datatype`. If `item` has an `@language`
  //     entry, add the value associated with the `@language` entry as the language tag of `literal`.
  // 15. Return `literal`.
}

/**
 * List Conversion is the process of taking a list object and transforming it into an RDF collection as defined in RDF
 * Semantics [RDF11-MT].
 *
 * For each element of the list a new blank node identifier is allocated which is used to generate `rdf:first` and
 * `rdf:rest`. The algorithm returns the list head, which is either the first allocated blank node identifier or
 * `rdf:nil` if the list is empty. If a list element represents an IRI, the corresponding `rdf:first` triple is omitted.
 *
 * @param list An array list.
 * @param listTriples An empty array.
 */
function listToRdf(
  list: any[],
  listTriples: any[],
) {
  // Procedure:
  //
  // 1. If `list` is empty, return `rdf:nil`.
  // 2. Otherwise, create an array `bnodes` composed of a newly generated blank node identifier for each entry in
  //    `list`.
  // 3. For each pair of `subject` from `bnodes` and `item` from `list`:
  //
  //    3.1. Initialize `embeddedTriples` to a new empty array.
  //    3.2. Initialize `object` to the result of using the Object to RDF Conversion algorithm passing `item` and
  //         `embeddedTriples` for `listTriples`.
  //    3.3. Unless `object` is `null`, append a triple composed of `subject`, `rdf:first`, and `object` to
  //         `listTriples`.
  //    3.4. Initialize `rest` as the next entry in `bnodes`, or if that does not exist, `rdf:nil`. Append a triple
  //         composed of `subject`, `rdf:rest`, and `rest` to `listTriples`.
  //    3.5. Append all values from `embeddedTriples` to `listTriples`.
  //
  // 4. Return the first blank node from `bnodes` or `rdf:nil` if `bnodes` is empty.
}

/**
 * This algorithm serializes an RDF dataset consisting of a default graph and zero or more named graphs into a JSON-LD
 * document.
 *
 * In the RDF abstract syntax, RDF literals have a lexical form, as defined in [RDF11-CONCEPTS]. The form of these
 * literals is used when creating JSON-LD values based on these literals.
 *
 * Iterate through each graph in the dataset, converting each RDF collection into a list and generating a JSON-LD
 * document in expanded form for all RDF literals, IRIs and blank node identifiers. If the `useNativeTypes` flag is set
 * to `true`, RDF literals with a datatype IRI that equals `xsd:integer` or `xsd:double` are converted to a JSON numbers
 * and RDF literals with a datatype IRI that equals `xsd:boolean` are converted to `true` or `false` based on their
 * lexical form as described in Section 8.6 Data Round Tripping. Unless the `useRdfType` flag is set to `true`,
 * `rdf:type` predicates will be serialized as `@type` as long as the associated object is either an IRI or blank node
 * identifier.
 *
 * If the `rdfDirection` option is not `null`, then special processing is used to convert from an `i18n-datatype` or
 * `compound-literal` form.
 *
 * @param dataset An RDF dataset to convert to a JSON-LD document.
 * @param {boolean} [ordered] If `true`, orders keys in maps lexicographically.
 * @param {string} [rdfDirection] the RDF direction, either 'i18n-datatype', 'compound-literal', or null.
 * @param {boolean} [useNativeTypes] If `true`, converts XSD datatypes to native types.
 * @param {boolean} [useRdfType] If `true`, `rdf:type` is serialized as `@type`.
 */
function rdfToJsonld(
  dataset: any,
  ordered: boolean = false,
  rdfDirection: string | null = null,
  useNativeTypes: boolean = false,
  useRdfType: boolean = false,
) {
  // Procedure:
  //
  // 1. Initialize `defaultGraph` to an empty map.
  // 2. Initialize `graphMap` to a map consisting of a single entry `@default` whose value references `defaultGraph`.
  // 3. Initialize `referencedOnce` to an empty map.
  // 4. Initialize `compoundLiteralSubjects` to an empty map.
  // 5. For each `graph` in `dataset`:
  //
  //    5.1. If `graph` is the default graph, initialize `name` to `@default`, otherwise to the graph name associated
  //         with `graph`.
  //    5.2. If `graphMap` has no `name` entry, create one and set its value to an empty map.
  //    5.3. If `compoundLiteralSubjects` has no `name` entry, create one and set its value to an empty map.
  //    5.4. If `graph` is not the default graph and `defaultGraph` does not have a `name` entry, create such an entry
  //         and initialize its value to a new map with a single entry `@id` whose value is `name`.
  //    5.5. Reference the value of the `name` entry in `graphMap` using the variable `nodeMap`.
  //    5.6. Reference the value of the `name` entry in `compoundLiteralSubjects` using the variable `compoundMap`.
  //    5.7. For each triple in `graph` consisting of `subject`, `predicate`, and `object`:
  //
  //         5.7.1. If `nodeMap` does not have a `subject` entry, create one and initialize its value to a new map
  //                consisting of a single entry `@id` whose value is set to `subject`.
  //         5.7.2. Reference the value of the `subject` entry in `nodeMap` using the variable `node`.
  //         5.7.3. If the `rdfDirection` option is `compound-literal` and `predicate` is `rdf:direction`, add an entry
  //                in `compoundMap` for `subject` with the value `true`.
  //         5.7.4. If `object` is an IRI or blank node identifier, and `nodeMap` does not have an `object` entry,
  //                create one and initialize its value to a new map consisting of a single entry `@id` whose value is
  //                set to `object`.
  //         5.7.5. If `predicate` equals `rdf:type`, the `useRdfType` flag is not `true`, and `object` is an IRI or
  //                blank node identifier, append `object` to the value of the `@type` entry of `node`; unless such an
  //                item already exists. If no such entry exists, create one and initialize it to an array whose only
  //                item is `object`. Finally, continue to the next triple.
  //         5.7.6. Initialize `value` to the result of using the RDF to Object Conversion algorithm, passing `object`,
  //                `rdfDirection`, and `useNativeTypes`.
  //         5.7.7. If `node` does not have a `predicate` entry, create one and initialize its value to an empty array.
  //         5.7.8. If there is no item equivalent to `value` in the array associated with the `predicate` entry of
  //                `node`, append a reference to `value` to the array. Two maps are considered equal if they have
  //                equivalent map entries.
  //         5.7.9. If `object` is `rdf:nil`, it represents the termination of an RDF collection:
  //
  //                5.7.9.1. Reference the `usages` entry of the `object` entry of `nodeMap` using the variable
  //                         `usages`.
  //                5.7.9.2. Append a new map consisting of three entries, `node`, `property`, and `value` to the
  //                         `usages` array. The `node` entry is set to a reference to `node`, `property` to
  //                         `predicate`, and `value` to a reference to `value`.
  //
  //         5.7.10. Otherwise, if `referencedOnce` has an entry for `object`, set the `object` entry of
  //                 `referencedOnce` to `false`.
  //         5.7.11. Otherwise, if `object` is a blank node identifier, it might represent a list node:
  //
  //                 5.7.11.1. Set the `object` entry of `referencedOnce` to a new map consisting of three entries,
  //                           `node`, `property`, and `value` to the `usages` array. The `node` entry is set to a
  //                           reference to `node`, `property` to `predicate`, and `value` to a reference to `value`.
  //
  // 6. For each `name` and `graphObject` in `graphMap`:
  //
  //    6.1. If `compoundLiteralSubjects` has an entry for `name`, then for each `cl` which is a key in that entry:
  //
  //         6.1.1. Initialize `clEntry` to the value of `cl` in `referencedOnce`, continuing to the next `cl` if
  //                `clEntry` is not a map.
  //         6.1.2. Initialize `node` to the value of `node` in `clEntry`.
  //         6.1.3. Initialize `property` to value of `property` in `clEntry`.
  //         6.1.4. Initialize `value` to value of `value` in `clEntry`.
  //         6.1.5. Initialize `clNode` to the value of `cl` in `graphObject`, and remove that entry from `graph`
  //                object, continuing to the next `cl` if `clNode` is not a map.
  //         6.1.6. For each `clReference` in the value of `property` in `node` where the value of `@id` in
  //                `clReference` is `cl`:
  //
  //                6.1.6.1. Delete the `@id` entry in `clReference`.
  //                6.1.6.2. Add an entry to `clReference` for `@value` with the value taken from the `rdf:value` entry
  //                         in `clNode`.
  //                6.1.6.3. Add an entry to `clReference` for `@language` with the value taken from the `rdf:language`
  //                         entry in `clNode`, if any. If that value is not well-formed according to section 2.2.9 of
  //                         [BCP47], an invalid language-tagged string error has been detected and processing is
  //                         aborted.
  //                6.1.6.4. Add an entry to `clReference` for `@direction` with the value taken from the
  //                         `rdf:direction` entry in `clNode`, if any. If that value is not "ltr" or "rtl", an invalid
  //                         base direction error has been detected and processing is aborted.
  //
  //    6.2. If `graphObject` has no `rdf:nil` entry, continue with the next `name`-`graphObject` pair as the graph does
  //         not contain any lists that need to be converted.
  //    6.3. Initialize `nil` to the value of the `rdf:nil` entry of `graphObject`.
  //    6.4. For each `itemUsage` in the `usages` entry of `nil`, perform the following steps:
  //
  //         6.4.1. Initialize `node` to the value of the value of the `node` entry of `usage`, `property` to the value
  //                of the `property` entry of `usage`, and `head` to the value of the `value` entry of `usage`.
  //         6.4.2. Initialize two empty arrays `list` and `listNodes`.
  //         6.4.3. While `property` equals `rdf:rest`, the value of the `@id` entry of `node` is a blank node
  //                identifier, the value of the entry of `referencedOnce` associated with the `@id` entry of `node` is
  //                a map, `node` has `rdf:first` and `rdf:rest` entries, both of which have as value an array
  //                consisting of a single element, and `node` has no other entries apart from an optional `@type` entry
  //                whose value is an array with a single item equal to `rdf:List`, `node` represents a well-formed list
  //                node. Perform the following steps to traverse the list backwards towards its head:
  //
  //                6.4.3.1. Append the only item of `rdf:first` entry of `node` to the `list` array.
  //                6.4.3.2. Append the value of the `@id` entry of `node` to the `listNodes` array.
  //                6.4.3.3. Initialize `nodeUsage` to the value of the entry of `referencedOnce` associated with the
  //                         `@id` entry of `node`.
  //                6.4.3.4. Set `node` to the value of the `node` entry of `nodeUsage`, `property` to the value of the
  //                         `property` entry of `nodeUsage`, and `head` to the value of the `value` entry of
  //                         `nodeUsage`.
  //                6.4.3.5. If the `@id` entry of `node` is an IRI instead of a blank node identifier, exit the while
  //                         loop.
  //
  //         6.4.4. Remove the `@id` entry from `head`.
  //         6.4.5. Reverse the order of the `list` array.
  //         6.4.6. Add an `@list` entry to `head` and initialize its value to the `list` array.
  //         6.4.7. For each `itemNodeId` in `listNodes`, remove the `itemNodeId` entry from `graphObject`.
  //
  // 7. Initialize an empty array `result`.
  // 8. For each `subject` and `node` in `defaultGraph` ordered lexicographically by `subject` if `ordered` is `true`:
  //
  //    8.1. If `graphMap` has a `subject` entry:
  //
  //         8.1.1. Add an `@graph` entry to `node` and initialize its value to an empty array.
  //         8.1.2. For each key-value pair `s-n` in the `subject` entry of `graphMap` ordered lexicographically by `s`
  //                if `ordered` is `true`, append `n` to the `@graph` entry of `node` after removing its `usages`
  //                entry, unless the only remaining entry of `n` is `@id`.
  //
  //    8.2. Append `node` to `result` after removing its `usages` entry, unless the only remaining entry of `node` is
  //         `@id`.
  //
  // 9. Return `result`.
}

/**
 * This algorithm transforms an RDF literal to a JSON-LD value object and a RDF blank node or IRI to an JSON-LD node
 * object. RDF literals are transformed to value objects whereas IRIs and blank node identifiers are transformed to node
 * objects.
 *
 * Literals with datatype `rdf:JSON` are transformed into a value object using the internal representation based on the
 * lexical-to-value mapping defined in JSON datatype in [JSON-LD11], and `@type` of `@json`.
 *
 * - With the `rdfDirection` option set to `i18n-datatype`, literals with datatype starting with
 *   `https://www.w3.org/ns/i18n#` are transformed into a value object by decoding the language tag and base direction
 *   from the datatype.
 * - With the `rdfDirection` option set to `compound-literal`, blank node objects using `rdf:direction` are transformed
 *   into a value object by decoding the `rdf:value`, `rdf:language`, and `rdf:direction` properties.
 *
 * If the `useNativeTypes` flag is set to `true`, RDF literals with a datatype IRI that equals `xsd:integer` or
 * `xsd:double` are converted to a JSON numbers and RDF literals with a datatype IRI that equals `xsd:boolean` are
 * converted to `true` or `false` based on their lexical form as described in Section 8.6 Data Round Tripping.
 *
 * @param value A value to be converted to a map.
 * @param {string} rdfDirection the RDF direction, either 'i18n-datatype', 'compound-literal', or null.
 * @param {boolean} useNativeTypes If `true`, converts XSD datatypes to native types.
 */
function rdfToObject(
  value: any,
  rdfDirection: string,
  useNativeTypes: boolean,
) {
  // Procedure:
  //
  // 1. If `value` is an IRI or a blank node identifier, return a new map consisting of a single entry `@id` whose value
  //    is set to `value`.
  // 2. Otherwise, `value` is an RDF literal:
  //
  //    2.1. Initialize a new empty map `result`.
  //    2.2. Initialize `convertedValue` to `value`.
  //    2.3. Initialize `type` to `null`.
  //    2.4. If `useNativeTypes` is `true`:
  //
  //         2.4.1. If the datatype IRI of `value` equals `xsd:string`, set `convertedValue` to the lexical form of
  //                `value`.
  //         2.4.2. Otherwise, if the datatype IRI of `value` equals `xsd:boolean`, set `convertedValue` to `true` if
  //                the lexical form of `value` matches `true`, or `false` if it matches `false`. If it matches neither,
  //                set `type` to `xsd:boolean`.
  //         2.4.3. Otherwise, if the datatype IRI of `value` equals `xsd:integer` or `xsd:double` and its lexical form
  //                is a valid `xsd:integer` or `xsd:double` according [XMLSCHEMA11-2], set `convertedValue` to the
  //                result of converting the lexical form to a JSON number.
  //
  //    2.5. Otherwise, if processing mode is not `json-ld-1.0`, and `value` is a JSON literal, set `convertedValue` to
  //         the result of turning the lexical value of `value` into the JSON-LD internal representation, and set `type`
  //         to `@json`. If the lexical value of `value` is not valid JSON according to the JSON Grammar [RFC8259], an
  //         invalid JSON literal error has been detected and processing is aborted.
  //    2.6. Otherwise, if the datatype IRI of `value` starts with `https://www.w3.org/ns/i18n#`, and `rdfDirection` is
  //         `i18n-datatype`:
  //
  //         2.6.1. Set `convertedValue` to the lexical form of `value`.
  //         2.6.2. If the string prefix of the fragment identifier of the datatype IRI up until the underscore ("_") is
  //                not empty, add an entry `@language` to `result` and set its value to that prefix.
  //         2.6.3. Add an entry `@direction` to `result` and set its value to the substring of the fragment identifier
  //                following the underscore ("_").
  //
  //    2.7. Otherwise, if `value` is a language-tagged string add an entry `@language` to `result` and set its value to
  //         the language tag of `value`.
  //    2.8. Otherwise, set `type` to the datatype IRI of `value`, unless it equals `xsd:string` which is ignored.
  //    2.9. Add an entry `@value` to `result` whose value is set to `convertedValue`.
  //    2.10. If `type` is not `null`, add an entry `@type` to `result` whose value is set to `type`.
  //    2.11. Return `result`.
}

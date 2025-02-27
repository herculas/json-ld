/**
 * This algorithm flattens an expanded JSON-LD document by collecting all properties of a node in a single map and
 * labeling all blank nodes with blank node identifiers. This resulting uniform shape of the document, may drastically
 * simplify the code required to process JSON-LD data in certain applications.
 *
 * First, a `nodeMap` is generated using the Node Map Generation algorithm which collects all properties of a node in a
 * single map. In the next step, the `nodeMap` is converted to a JSON-LD document in flattened document form.
 *
 * This algorithm uses the Generate Blank Node Identifier algorithm to generate new blank node identifiers and relabel
 * existing blank node identifiers. The Generate Blank Node Identifier algorithm maintains an `identifierMap` to ensure
 * that blank node identifiers in the source document are consistently remapped to new blank node identifiers avoiding
 * collisions. Thus, before this algorithm is run, the `identifierMap` is reset.
 *
 * @param element The element to flatten.
 * @param {boolean} [ordered] Whether to order map entry keys lexicographically.
 */
function flatten(
  element: any,
  ordered: boolean = false,
) {
  // Procedure:
  //
  // 1. Initialize `nodeMap` to a map consisting of a single entry whose key is `@default` and whose value is an empty
  //    map.
  // 2. Perform the Node Map Generation algorithm, passing `element` and `nodeMap`.
  // 3. Initialize `defaultGraph` to the value of the `@default` entry of `nodeMap`, which is a map representing the
  //    default graph.
  // 4. For each `graphName`-`graph` pair in `nodeMap` where `graphName` is not `@default`, ordered lexicographically
  //    by `graphName` if `ordered` is `true`, perform the following steps:
  //
  //    4.1. If `defaultGraph` does not have a `graphName` entry, create one and initialize its value to a map
  //         consisting of an `@id` entry whose value is set to `graphName`.
  //    4.2. Reference the value associated with the `graphName` entry in `defaultGraph` using the variable `entry`.
  //    4.3. Add an `@graph` entry to `entry` and set it to an empty array.
  //    4.4. For each `id`-`node` pair in `graph` ordered lexicographically by `id` if `ordered` is `true`, add `node`
  //         to the `@graph` entry of `entry`, unless the only entry of `node` is `@id`.
  //
  // 5. Initialize an empty array `flattened`.
  // 6. For each `id`-`node` pair in `defaultGraph` ordered lexicographically by `id` if `ordered` is `true`, add `node`
  //    to `flattened`, unless the only entry of `node` is `@id`.
  // 7. Return `flattened`.
}

/**
 * This algorithm creates a map `nodeMap` holding an indexed representation of the graphs and nodes represented in the
 * passed expanded document. All nodes that are not uniquely identified by an IRI get assigned a (new) blank node
 * identifier. The resulting `nodeMap` will have an map entry for every graph in the document whose value is another
 * object with an entry for every node represented in the document. The default graph is stored under the `@default`
 * entry, all other graphs are stored under their graph name.
 *
 * The algorithm recursively runs over an expanded JSON-LD document to collect all entries of a node in a single map.
 * The algorithm updates a map `nodeMap` whose keys represent the graph names used in the document (the default graph is
 * stored under the `@default` entry) and whose associated values are maps which index the nodes in the graph. If a
 * entry's value is a node object, it is replaced by a node object consisting of only an `@id` entry. If a node object
 * has no `@id` entry or it is identified by a blank node identifier, a new blank node identifier is generated. This
 * relabeling of blank node identifiers is also done for properties and values of `@type`.
 *
 * @param element An expanded JSON-LD document.
 * @param nodeMap A reference to a map.
 * @param {string} [activeGraph] The name of the currently active graph.
 * @param {string} [activeSubject] The name of the currently active subject.
 * @param {string} [activeProperty] The name of the currently active property.
 * @param {object} [list] The list to append to.
 */
function generateNodeMap(
  element: object,
  nodeMap: object,
  activeGraph: string = "@default",
  activeSubject: string | null = null,
  activeProperty: string | null = null,
  list: object | null = null,
) {
  // Procedure:
  //
  // 1. If `element` is an array, process each item in `element` as follows and then return:
  //
  //    1.1. Run this algorithm recursively by passing `item` for `element`, `nodeMap`, `activeGraph`, `activeSubject`,
  //         `activeProperty`, and `list`.
  //
  // 2. Otherwise, `element` is a map. Reference the map which is the value of the `activeGraph` entry of `nodeMap`
  //    using the variable `graph`. If the `activeSubject` is `null`, set `node` to `null` otherwise reference the
  //    `activeSubject` entry of `graph` using the variable `subjectNode`.
  // 3. For each `item` in the `@type` entry of `element`, if any, or for the value of `@type`, if the value of `@type`
  //    exists and is not an array:
  //
  //    3.1. If `item` is a blank node identifier, replace it with a newly generated blank node identifier passing
  //         `item` for `identifier`.
  //
  // 4. If `element` has an `@value` entry, perform the following steps:
  //
  //    4.1. If `list` is `null`:
  //
  //         4.1.1. If `subjectNode` does not have an `activeProperty` entry, create one and initialize its value to an
  //                array containing `element`.
  //         4.1.2. Otherwise, compare `element` against every `item` in the array associated with the `activeProperty`
  //                entry of `subjectNode`. If there is no `item` equivalent to `element`, append `element` to the
  //                array. Two maps are considered equal if they have equivalent map entries.
  //
  //    4.2. Otherwise, append `element` to the `@list` entry of `list`.
  //
  // 5. Otherwise, if `element` has an `@list` entry, perform the following steps:
  //
  //    5.1. Initialize a new map `result` consisting of a single entry `@list` whose value is initialized to an empty
  //         array.
  //    5.2. Recursively call this algorithm passing the value of `element`'s `@list` entry for `element`, `nodeMap`,
  //         `activeGraph`, `activeSubject`, `activeProperty`, and `result` for `list`.
  //    5.3. If `list` is `null`, append `result` to the value of the `activeProperty` entry of `subjectNode`.
  //    5.4. Otherwise, append `result` to the `@list` entry of `list`.
  //
  // 6. Otherwise, `element` is a node object, perform the following steps:
  //
  //    6.1. If `element` has an `@id` entry, set `id` to its value and remove the entry from `element`. If `id` is a
  //         blank node identifier, replace it with a newly generated blank node identifier passing `id` for
  //         `identifier`.
  //    6.2. Otherwise, set `id` to the result of the Generate Blank Node Identifier algorithm passing `null` for
  //         `identifier`.
  //    6.3. If `graph` does not contain an entry `id`, create one and initialize its value to a map consisting of a
  //         single entry `@id` whose value is `id`.
  //    6.4. Reference the value of the `id` entry of `graph` using the variable `node`.
  //    6.5. If `activeSubject` is a map, a reverse property relationship is being processed. Perform the following
  //         steps:
  //
  //         6.5.1. If `node` does not have an `activeProperty` entry, create one and initialize its value to an array
  //                containing `activeSubject`.
  //         6.5.2. Otherwise, compare `activeSubject` against every `item` in the array associated with the
  //                `activeProperty` entry of `node`. If there is no `item` equivalent to `activeSubject`, append
  //                `activeSubject` to the array. Two maps are considered equal if they have equivalent map entries.
  //
  //    6.6. Otherwise, if `activeProperty` is not `null`, perform the following steps:
  //
  //         6.6.1. Create a new map `reference` consisting of a single entry `@id` whose value is `id`.
  //         6.6.2. If `list` is `null`:
  //
  //                6.6.2.1. If `subjectNode` does not have an `activeProperty` entry, create one and initialize its
  //                         value to an array containing `reference`.
  //                6.6.2.2. Otherwise, compare `reference` against every `item` in the array associated with the
  //                         `activeProperty` entry of `subjectNode`. If there is no `item` equivalent to `reference`,
  //                         append `reference` to the array. Two maps are considered equal if they have equivalent map
  //                         entries.
  //
  //         6.6.3. Otherwise, append `reference` to the `@list` entry of `list`.
  //
  //    6.7. If `element` has an `@type` entry, append each `item` of its associated array to the array associated with
  //         the `@type` entry of `node` unless it is already in that array. Finally remove the `@type` entry from
  //         `element`.
  //    6.8. If `element` has an `@index` entry, set the `@index` entry of `node` to its value. If `node` already has
  //         an `@index` entry with a different value, a conflicting indexes error has been detected and processing is
  //         aborted. Otherwise, continue by removing the `@index` entry from `element`.
  //    6.9. If `element` has an `@reverse` entry:
  //
  //         6.9.1. Create a map `referencedNode` with a single entry `@id` whose value is `id`.
  //         6.9.2. Initialize `reverseMap` to the value of the `@reverse` entry of `element`.
  //         6.9.3. For each key-value pair `property-values` in `reverseMap`:
  //
  //                6.9.3.1. For each `value` of `values`:
  //
  //                         6.9.3.1.1. Recursively invoke this algorithm passing `value` for `element`, `nodeMap`,
  //                                    `activeGraph`, `referencedNode` for `activeSubject`, and `property` for
  //                                    `activeProperty`. Passing a map for `activeSubject` indicates to the algorithm
  //                                    that a reverse property relationship is being processed.
  //
  //         6.9.4. Remove the `@reverse` entry from `element`.
  //
  //    6.10. If `element` has an `@graph` entry, recursively invoke this algorithm passing the value of the `@graph`
  //          entry for `element`, `nodeMap`, and `id` for `activeGraph` before removing the `@graph` entry from
  //          `element`.
  //    6.11. If `element` has an `@included` entry, recursively invoke this algorithm passing the value of the
  //          `@included` entry for `element`, `nodeMap`, and `activeGraph` before removing the `@included` entry from
  //          `element`.
  //    6.12. Finally, for each key-value pair `property-value` in `element` ordered by `property` perform the following
  //          steps:
  //
  //          6.12.1. If `property` is a blank node identifier, replace it with a newly generated blank node identifier
  //                  passing `property` for `identifier`.
  //          6.12.2. If `node` does not have a `property` entry, create one and initialize its value to an empty array.
  //          6.12.3. Recursively invoke this algorithm passing `value` for `element`, `nodeMap`, `activeGraph`, `id`
  //                  for `activeSubject`, and `property` for `activeProperty`.
}

/**
 * This algorithm creates a new map of subjects to nodes using all graphs contained in the `graphMap` created using the
 * Node Map Generation algorithm to create merged node objects containing information defined for a given subject in
 * each graph contained in the `nodeMap`.
 */
function mergeNodeMaps() {
  // Procedure:
  //
  // 1. Initialize `result` to an empty map.
  // 2. For each `graphName`-`graph` pair in `graphMap` and for each `id`-`node` pair in `graph`:
  //
  //    2.1. Initialize `mergedNode` to the value of `id` in `result`, initializing it with a new map consisting of a
  //         single entry `@id` whose value is `id`, if it does not exist.
  //    2.2. For each `property`-`values` pair in `node`:
  //
  //         2.2.1. If `property` is a keyword other than `@type`, add `property` and `values` to `mergedNode`.
  //         2.2.2. Otherwise, merge each element from `values` into the values for `property` in `mergedNode`,
  //                initializing it to an empty array if necessary.
  //
  // 3. Return `result`.
}

/**
 * This algorithm is used to generate new blank node identifiers or to relabel an existing blank node identifier to
 * avoid collision by the introduction of new ones.
 *
 * The simplest case is if there exists already a blank node identifier in the `identifierMap` for the passed
 * identifier, in which case it is simply returned. Otherwise, a new blank node identifier is generated. If the passed
 * `identifier` is not `null`, an entry is created in the `identifierMap` associating the `identifier` with the blank
 * node identifier.
 *
 * The algorithm takes a single input variable identifier which may be null. The algorithm maintains an identifier map
 * to relabel existing blank node identifiers to new blank node identifiers, which is reset when the invoking algorithm
 * is initialized.
 *
 * @param identifier The blank node identifier to generate or relabel.
 */
function generateBlankNodeIdentifier(
  identifier: string | null,
) {
  // Procedure:
  //
  // 1. If `identifier` is not `null` and there is an entry in the `identifierMap` for `identifier`, return the value of
  //    that entry.
  // 2. Otherwise, generate a new unique blank node identifier.
  // 3. If `identifier` is not `null`, create an entry in the `identifierMap` for `identifier` and set its value to the
  //    new blank node identifier.
  // 4. Return the new blank node identifier.
}

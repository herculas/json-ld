/**
 * Within node objects, value objects, graph objects, list objects, set objects, and nested properties keyword aliases
 * MAY be used instead of the corresponding keyword, except for `@context`. The `@context` keyword MUST NOT be aliased.
 * Within local contexts and expanded term definitions, keyword aliases MAY NOT used.
 */

import { ContextDefinition } from "./context.ts"
import { IRI, IRICompacted, IRIReference, Term } from "./basic.ts"
import { JsonObject, JsonPrimitive, Null, OneOrMany, OneOrWrapped } from "./document.ts"
import { NodeObject, ValueObject } from "./object.ts"

/**
 * The unaliased `@base` keyword MAY be used as a key in a context definition.
 *
 * Its value MUST be:
 *
 * - `null`, or
 * - an IRI reference.
 *
 * @see https://www.w3.org/TR/json-ld11/#keywords
 */
export type Base = Null | IRIReference

/**
 * The unaliased `@container` keyword MAY be used as a key in an expanded term definition.
 *
 * Its value MUST be either:
 *
 * - `null`,
 * - `@list`, `@set`, `@language`, `@index`, `@id`, `@graph`, `@type`,
 * - an array containing exactly any one of those keywords,
 * - a combination of `@set` and any of `@index`, `@id`, `@graph`, `@type`, `@language` in any order, or
 * - an array containing `@graph` along with either `@id` or `@index` and also optionally including `@set`.
 *
 * @see https://www.w3.org/TR/json-ld11/#keywords
 */
export type Container = Null | OneOrWrapped<"@list" | "@set" | ContainerValue> | ContainerValueCombined
type ContainerValue = "@language" | "@index" | "@id" | "@graph" | "@type"
type ContainerValueCombined =
  | ["@set", ContainerValue]
  | [ContainerValue, "@set"]
  | ["@set", "@graph", "@id" | "@index"]
  | ["@set", "@id" | "@index", "@graph"]
  | ["@graph", "@set", "@id" | "@index"]
  | ["@id" | "@index", "@set", "@graph"]
  | ["@graph", "@id" | "@index", "@set"]
  | ["@id" | "@index", "@graph", "@set"]
  | ["@graph", "@id" | "@index"]
  | ["@id" | "@index", "@graph"]

/**
 * The `@context` keyword MUST NOT be aliased, and MAY be used as a key in the following objects:
 *
 * - node objects,
 * - value objects,
 * - graph objects,
 * - list objects,
 * - set objects,
 * - nested properties, and
 * - expanded term definitions.
 *
 * The value of `@context` MUST be:
 *
 * - `null`,
 * - an IRI reference,
 * - a context definition, or
 * - an array composed of any of these.
 *
 * @see https://www.w3.org/TR/json-ld11/#keywords
 */
export type Context = OneOrMany<Null | IRIReference | ContextDefinition>

/**
 * It is possible to annotate a string, or language-tagged string, with its base direction. As with language, it is
 * possible to define a default base direction for a JSON-LD document by setting the `@direction` key in the context.
 *
 * The `@direction` keyword MAY be aliased and MAY be used as a key in a value object. The unaliased `@direction` MAY be
 * used as a key in a context definition.
 *
 * Its value MUST be one of:
 *
 * - "ltr",
 * - "rtl", or
 * - `null`.
 *
 * @see https://www.w3.org/TR/json-ld11/#keywords
 * @see https://www.w3.org/TR/json-ld11/#base-direction
 */
export type Direction = Null | "ltr" | "rtl"

/**
 * At times, it is necessary to make statements about a graph itself, rather than just a single node. This can be done
 * by grouping a set of nodes using the `@graph` keyword. A developer may also name data expressed using the `@graph`
 * keyword by pairing it with an `@id` keyword.
 *
 * The `@graph` keyword MAY be aliased and MAY be used as a key in a node object or a graph object. The unaliased
 * `@graph` MAY be used as the value of the `@container` key within an expanded term definition.
 *
 * Its value MUST be:
 *
 * - a value object,
 * - a node object, or
 * - an array of either value objects or node objects.
 *
 * @see https://www.w3.org/TR/json-ld11/#keywords
 * @see https://www.w3.org/TR/json-ld11/#named-graphs
 */
export type Graph = OneOrMany<ValueObject | NodeObject>

/**
 * The `@id` keyword MAY be aliased and MAY be used as a key in a node object or a graph object. The unaliased `@id` MAY
 * be used as a key in an expanded term definition, or as the value of the `@container` key within an expanded term
 * definition.
 *
 * The value of the `@id` key MUST be:
 *
 * - an IRI reference, or
 * - a compact IRI (including blank node identifiers).
 *
 * @see https://www.w3.org/TR/json-ld11/#keywords
 * @see https://www.w3.org/TR/json-ld11/#node-identifiers
 * @see https://www.w3.org/TR/json-ld11/#compact-iris
 * @see https://www.w3.org/TR/json-ld11/#identifying-blank-nodes
 */
export type Id = OneOrMany<IRIReference | IRICompacted>

/**
 * The unaliased `@import` keyword MAY be used in a context definition.
 *
 * Its value MUST be an IRI reference.
 *
 * @see https://www.w3.org/TR/json-ld11/#keywords
 */
export type Import = IRIReference

/**
 * Sometimes it is also useful to list node objects as part of another node object. For instance, to represent a set of
 * resources which are used by some other resource. Included blocks may be also be used to collect such secondary node
 * objects which can be referenced from a primary node object.
 *
 * The `@included` keyword MAY be aliased and its value MUST be an included block.
 *
 * @see https://www.w3.org/TR/json-ld11/#keywords
 * @see https://www.w3.org/TR/json-ld11/#included-nodes
 */
export type Included = IncludedBlock

/**
 * An included block is used to provide a set of node objects. An included block MAY appear as the value of a member of
 * a node object with either the key of `@included` or an alias of `@included`. While expanding, multiple included
 * blocks will be coalesced into a single included block.
 *
 * An included block is either a node object or an array of node objects.
 *
 * @see https://www.w3.org/TR/json-ld11/#included-blocks
 */
type IncludedBlock = OneOrMany<NodeObject>

/**
 * The `@index` keyword MAY be aliased and MAY be used as a key in a node object, value object, graph object, set
 * object, or list object. Its value MUST be a string. The unaliased `@index` MAY be used as the value of the
 * `@container` key within an expanded term definition and as an entry in a expanded term definition.
 *
 * Its value MUST be either:
 *
 * - an IRI,
 * - a compact IRI, or
 * - a term.
 *
 * @see https://www.w3.org/TR/json-ld11/#keywords
 */
export type Index = IRI | IRICompacted | Term

/**
 * At times, it is useful to include JSON within JSON-LD that is not interpreted as JSON-LD. Generally, a JSON-LD
 * processor will ignore properties which don't map to IRIs, but this causes them to be excluded when performing various
 * algorithmic transformations. But, when the data that is being described is, itself, JSON, it's important that it
 * survives algorithmic transformations.
 *
 * When a term is defined with `@type` set to `@json`, a JSON-LD processor will treat the value as a JSON literal,
 * rather than interpreting it further as JSON-LD. In the expanded document form, such JSON will become the value of
 * `@value` within a value object having `"@type": "@json"`.
 *
 * When transformed into RDF, the JSON literal will have a lexical form based on a specific serialization of the JSON,
 * as described in Compaction algorithm of [JSON-LD11-API] and the JSON datatype.
 *
 * The `@json` keyword MAY be aliased and MAY be used as the value of the `@type` key within a value object or an
 * expanded term definition.
 *
 * @see https://www.w3.org/TR/json-ld11/#keywords
 * @see https://www.w3.org/TR/json-ld11/#json-literals
 */
export type Json = "@json"

/**
 * At times, it is important to annotate a string with its language. In JSON-LD, this is possible in a variety of ways.
 *
 * The `@language` keyword MAY be aliased and MAY be used as a key in a value object. The unaliased `@language` MAY be
 * used as a key in a context definition, or as the value of the `@container` key within an expanded term definition.
 *
 * Its value MUST be a string with the lexical form described in [BCP47] or be `null`.
 *
 * @see https://www.w3.org/TR/json-ld11/#keywords
 * @see https://www.w3.org/TR/json-ld11/#string-internationalization
 */
export type Language = string | Null

/**
 * The `@list` keyword MAY be aliased and MUST be used as a key in a list object.
 *
 * The unaliased `@list` MAY be used as the value of the `@container` key within an expanded term definition. Its value
 * MUST be one of the following:
 *
 * - string,
 * - number,
 * - boolean,
 * - `null`,
 * - node object,
 * - value object, or
 * - an array of zero or more of the above possibilities.
 *
 * @see https://www.w3.org/TR/json-ld11/#keywords
 * @see https://www.w3.org/TR/json-ld11/#sets-and-lists
 */
export type List = OneOrMany<JsonPrimitive | NodeObject | ValueObject>

/**
 * A nested property is used to gather properties of a node object in a separate map, or array of maps which are not
 * value objects. It is semantically transparent and is removed during the expansion process. Property nesting is
 * recursive, and collections of nested properties may contain further nesting.
 *
 * Semantically, nesting is treated as if the properties and values were declared directly within the containing node
 * object.
 *
 * The `@nest` keyword MAY be aliased and MAY be used as a key in a node object, where its value must be a map. The
 * unaliased `@nest` MAY be used as the value of a simple term definition, or as a key in an expanded term definition,
 * where its value MUST be a string expanding to `@nest`.
 *
 * @see https://www.w3.org/TR/json-ld11/#keywords
 * @see https://www.w3.org/TR/json-ld11/#property-nesting
 */
export type Nest = JsonObject

/**
 * The `@none` keyword MAY be aliased and MAY be used as a key in an index map, id map, language map, type map.
 *
 * @see https://www.w3.org/TR/json-ld11/#keywords
 * @see https://www.w3.org/TR/json-ld11/#data-indexing
 * @see https://www.w3.org/TR/json-ld11/#language-indexing
 * @see https://www.w3.org/TR/json-ld11/#node-identifier-indexing
 * @see https://www.w3.org/TR/json-ld11/#node-type-indexing
 * @see https://www.w3.org/TR/json-ld11/#named-graph-indexing
 * @see https://www.w3.org/TR/json-ld11/#named-graph-data-indexing
 */
export type None = "@none"

/**
 * The unaliased `@prefix` keyword MAY be used as a key in an expanded term definition. Its value MUST be `true` or
 * `false`.
 *
 * @see https://www.w3.org/TR/json-ld11/#keywords
 */
export type Prefix = boolean

/**
 * The unaliased `@propagate` keyword MAY be used in a context definition. Its value MUST be `true` or `false`.
 *
 * @see https://www.w3.org/TR/json-ld11/#keywords
 */
export type Propagate = boolean

/**
 * The unaliased `@protected` keyword MAY be used in a context definition, or an expanded term definition. Its value
 * MUST be `true` or `false`.
 *
 * @see https://www.w3.org/TR/json-ld11/#keywords
 */
export type Protected = boolean

/**
 * JSON-LD serializes directed graphs. That means that every property points from a node to another node or value.
 * However, in some cases, it is desirable to serialize in the reverse direction. Consider for example the case where a
 * person and its children should be described in a document. If the used vocabulary does not provide a children
 * property but just a parent property, every node representing a child would have to be expressed with a property
 * pointing to the parent as in the following example.
 *
 * ```json
 * [
 *   {
 *     "@id": "#homer",
 *     "http://example.com/vocab#name": "Homer"
 *   }, {
 *     "@id": "#bart",
 *     "http://example.com/vocab#name": "Bart",
 *     "http://example.com/vocab#parent": { "@id": "#homer" }
 *   }, {
 *     "@id": "#lisa",
 *     "http://example.com/vocab#name": "Lisa",
 *     "http://example.com/vocab#parent": { "@id": "#homer" }
 *   }
 * ]
 * ```
 *
 * Expressing such data is much simpler by using JSON-LD's `@reverse` keyword:
 *
 * ```json
 * {
 *   "@id": "#homer",
 *   "http://example.com/vocab#name": "Homer",
 *   "@reverse": {
 *     "http://example.com/vocab#parent": [
 *       {
 *         "@id": "#bart",
 *         "http://example.com/vocab#name": "Bart"
 *       }, {
 *         "@id": "#lisa",
 *         "http://example.com/vocab#name": "Lisa"
 *       }
 *     ]
 *   }
 * }
 * ```
 *
 * The `@reverse` keyword MAY be aliased and MAY be used as a key in a node object. The unaliased `@reverse` MAY be used
 * as a key in an expanded term definition.
 *
 * The value of the `@reverse` key MUST be an IRI reference, or a compact IRI (including blank node identifiers).
 *
 * @see https://www.w3.org/TR/json-ld11/#keywords
 * @see https://www.w3.org/TR/json-ld11/#reverse-properties
 */
export type Reverse = IRIReference | IRICompacted

/**
 * The `@set` keyword MAY be aliased and MUST be used as a key in a set object. Its value MUST be one of the following:
 *
 * - string,
 * - number,
 * - boolean,
 * - `null`,
 * - node object,
 * - value object, or
 * - an array of zero or more of the above possibilities.
 *
 * The unaliased `@set` MAY be used as the value of the `@container` key within an expanded term definition.
 *
 * @see https://www.w3.org/TR/json-ld11/#keywords
 * @see https://www.w3.org/TR/json-ld11/#sets-and-lists
 */
export type UnorderedSet = OneOrMany<JsonPrimitive | NodeObject | ValueObject>

/**
 * The `@type` keyword MAY be aliased and MAY be used as a key in a node object or a value object, where its value MUST
 * be:
 *
 * - a term,
 * - IRI reference, or
 * - a compact IRI (including blank node identifiers).
 *
 * The unaliased `@type` MAY be used as a key in an expanded term definition, where its value may also be either `@id`
 * or `@vocab`, or as the value of the `@container` key within an expanded term definition.
 *
 * Within a context, `@type` may be used as the key for an expanded term definition, whose entries are limited to
 * `@container` and `@protected`.
 *
 * @see https://www.w3.org/TR/json-ld11/#keywords
 */
export type Type = Term | IRIReference | IRICompacted

/**
 * The `@value` keyword MAY be aliased and MUST be used as a key in a value object. Its value key MUST be either a
 * string, a number, `true`, `false` or `null`.
 *
 * @see https://www.w3.org/TR/json-ld11/#keywords
 */
export type Value = JsonPrimitive

/**
 * The unaliased `@version` keyword MAY be used as a key in a context definition. Its value MUST be a number with the
 * value `1.1`.
 *
 * @see https://www.w3.org/TR/json-ld11/#keywords
 */
export type Version = 1.1 | "1.1"

/**
 * The unaliased `@vocab` keyword MAY be used as a key in a context definition or as the value of `@type` in an expanded
 * term definition. Its value MUST be:
 *
 * - an IRI reference,
 * - a compact IRI (a blank node identifier),
 * - a term, or
 * - `null`.
 *
 * @see https://www.w3.org/TR/json-ld11/#keywords
 */
export type Vocab = IRIReference | IRICompacted | Term | Null

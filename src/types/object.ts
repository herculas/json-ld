import {
  Context,
  Direction,
  Graph,
  Id,
  Included,
  Index,
  Json,
  Language,
  List,
  Nest,
  Reverse,
  Type,
  UnorderedSet,
  Value,
} from "./keyword.ts"
import { IdMap, IndexMap, LanguageMap, TypeMap } from "./map.ts"
import { JsonArray, JsonObject, JsonPrimitive, OneOrMany } from "./document.ts"

/**
 * A node object represents zero or more properties of a node in the graph serialized by the JSON-LD document. A map is
 * a node object if it exists outside of the JSON-LD context and:
 *
 * - it is not the top-most map in the JSON-LD document consisting of no other entries than `@context` and `@graph`,
 * - it does not contain the `@value`, `@list`, or `@set` keywords, and
 * - it is not a graph object.
 *
 * The properties of a node in a graph may be spread among different node objects within a document. When that happens,
 * the keys of the different node objects need to be merged to create the properties of the resulting node.
 *
 * A node object MUST be a map. All keys which are not IRIs, compact IRIs, terms valid in the active context, or one of
 * the following keywords (or alias of such a keyword) MUST be ignored when processed:
 *
 * - `@context`
 * - `@id`
 * - `@included`
 * - `@graph`
 * - `@nest`
 * - `@type`
 * - `@reverse`, or
 * - `@index`.
 *
 * Then we consider these cases:
 *
 * - If the node object contains the `@context` key, its value MUST be `null`, an IRI reference, a context definition,
 *   or an array composed of any of these.
 * - If the node object contains the `@id` key, its value MUST be an IRI reference, or a compact IRI (including blank
 *   node identifiers).
 * - If the node object contains the `@graph` key, its value MUST be a node object or an array of zero or more node
 *   objects. If the node object also contains an `@id` keyword, its value is used as the graph name of a named graph.
 *   As a special case, if a map contains no keys other than `@graph` and `@context`, and the map is the root of the
 *   JSON-LD document, the map is not treated as a node object; this is used as a way of defining node objects that may
 *   not form a connected graph. This allows a context to be defined which is shared by all of the constituent node
 *   objects.
 * - If the node object contains the `@type` key, its value MUST be either an IRI reference, a compact IRI (including
 *   blank node identifiers), a term defined in the active context expanding into an IRI, or an array of any of these.
 * - If the node object contains the `@reverse` key, its value MUST be a map containing entries representing reverse
 *   properties. Each value of such a reverse property MUST be an IRI reference, a compact IRI, a blank node identifier,
 *   a node object or an array containing a combination of these.
 * - If the node object contains the `@included` key, its value MUST be an included block.
 * - If the node object contains the `@index` key, its value MUST be a string.
 * - If the node object contains the `@nest` key, its value MUST be a map or an array of map which MUST NOT include a
 *   value object.
 *
 * Keys in a node object that are not keywords MAY expand to an IRI using the active context. The values associated with
 * keys that expand to an IRI MUST be one of the following:
 *
 * - string,
 * - number,
 * - boolean,
 * - `null`,
 * - node object,
 * - graph object,
 * - value object,
 * - list object,
 * - set object,
 * - an array of zero or more of any of the possibilities above,
 * - a language map,
 * - an index map,
 * - an included block
 * - an id map, or
 * - a type map.
 *
 * @see https://www.w3.org/TR/json-ld11/#node-objects
 */
export interface NodeObject {
  "@context"?: Context
  "@id"?: Id
  "@included"?: Included
  "@graph"?: Graph
  "@nest"?: OneOrMany<Nest>
  "@type"?: OneOrMany<Type>
  "@reverse"?: { [key: string]: OneOrMany<Reverse | NodeObject> }
  "@index"?: Index
  [key: string]:
    | OneOrMany<
      | JsonPrimitive
      | NodeObject
      | GraphObject
      | ValueObject
      | ListObject
      | SetObject
    >
    | Included
    | LanguageMap
    | IndexMap
    | IdMap
    | TypeMap
    | NodeObject[keyof NodeObject]
}

/**
 * When framing, a frame object extends a node object to allow entries used specifically for framing.
 *
 * - A frame object MAY include a default object as the value of any key which is not a keyword. Values of `@default`
 *   MAY include the value `@null`, or an array containing only `@null`, in addition to other values allowed in the
 *   grammar for values of entry keys expanding to IRIs.
 * - The values of `@id` and `@type` MAY additionally be an empty map (wildcard), an array containing only an empty map,
 *   an empty array (match none) an array of IRIs.
 * - A frame object MAY include an entry with the key `@embed` with any value from `@always`, `@once`, and `@never`.
 * - A frame object MAY include entries with the boolean valued keys `@explicit`, `@omitDefault`, or `@requireAll`.
 * - In addition to other property values, a property of a frame object MAY include a value pattern.
 *
 * @see https://www.w3.org/TR/json-ld11/#frame-objects
 */
export type FrameObject = {
  "@id"?: OneOrMany<Id> | Wildcard
  "@type"?: OneOrMany<Type> | Wildcard
  "@default"?: "@null" | ["@null"] | NodeObject[keyof NodeObject]
  "@embed"?: "@always" | "@once" | "@never"
  "@explicit"?: boolean
  "@omitDefault"?: boolean
  "@requireAll"?: boolean
} & Omit<NodeObject, "@id" | "@type">

/**
 * An array containing an empty object (after excluding any properties which are framing keywords) matches any value
 * that is present, and does not match if there are no values.
 *
 * @see https://www.w3.org/TR/json-ld11-framing/#dfn-wildcard
 */
type Wildcard =
  | Record<string | number | symbol, never>
  | Array<Record<string | number | symbol, never>>
  | []

/**
 * A graph object represents a named graph, which MAY include an explicit graph name. A map is a graph object if it
 * exists outside of a JSON-LD context, it contains an `@graph` entry (or an alias of that keyword), it is not the top-
 * most map in the JSON-LD document, and it consists of no entries other than `@graph`, `@index`, `@id` and `@context`,
 * or an alias of one of these keywords.
 *
 * - If the graph object contains the `@context` key, its value MUST be `null`, an IRI reference, a context definition,
 *   or an array composed of any of these.
 * - If the graph object contains the `@id` key, its value is used as the identifier (graph name) of a named graph, and
 *   MUST be an IRI reference, or a compact IRI (including blank node identifiers).
 * - A graph object without an `@id` entry is also a simple graph object and represents a named graph without an
 *   explicit identifier, although in the data model it still has a graph name, which is an implicitly allocated blank
 *   node identifier.
 *
 * The value of the `@graph` key MUST be a node object or an array of zero or more node objects.
 *
 * @see https://www.w3.org/TR/json-ld11/#graph-objects
 */
export interface GraphObject {
  "@graph": OneOrMany<NodeObject>
  "@index"?: Index
  "@id"?: Id
  "@context"?: Context
}

/**
 * A value object is used to explicitly associate a type or a language with a value to create a typed value or a
 * language-tagged string and possibly associate a base direction.
 *
 * A value object MUST be a map containing the `@value` key. It MAY also contain an `@type`, an `@language`, an
 * `@direction`, an `@index`, or an `@context` key but MUST NOT contain both an `@type` and either `@language` or
 * `@direction` keys at the same time. A value object MUST NOT contain any other keys that expand to an IRI or keyword.
 *
 * - The value associated with the `@value` key MUST be either a string, a number, a boolean, or `null`. If the value
 *   associated with the `@type` key is `@json`, the value MAY be either an array or an object.
 * - The value associated with the `@type` key MUST be a term, an IRI, a compact IRI, a string which can be turned into
 *   an IRI using the vocabulary mapping, `@json`, or `null`.
 * - The value associated with the `@language` key MUST have the lexical form described in [BCP47], or be `null`.
 * - The value associated with the `@direction` key MUST be one of "ltr" or "rtl", or be `null`.
 * - The value associated with the `@index` key MUST be a string.
 *
 * @see https://www.w3.org/TR/json-ld11/#value-objects
 */
export type ValueObject =
  & {
    "@index"?: Index
    "@context"?: Context
  }
  & ({
    "@value": Value
    "@language"?: Language
    "@direction"?: Direction
  } | {
    "@value": Value
    "@type": Type
  } | {
    "@value": Value | JsonObject | JsonArray
    "@type": Json
  })

/**
 * A list represents an ordered set of values. Unless otherwise specified, arrays are unordered in JSON-LD. Values of
 * terms associated with an `@list` container will always be represented in the form of an array when a document is
 * processed—even if there is just a single value that would otherwise be optimized to a non-array form in compacted
 * document form. This simplifies post-processing of the data as the data is always in a deterministic form.
 *
 * A list object MUST be a map that contains no keys that expand to an IRI or keyword other than `@list` and @index.
 *
 * The value associated with the keys `@list` MUST be one of the following types:
 *
 * - string,
 * - number,
 * - boolean,
 * - `null`,
 * - node object,
 * - value object, or
 * - an array of zero or more of the above possibilities.
 *
 * @see https://www.w3.org/TR/json-ld11/#lists-and-sets
 */
export interface ListObject {
  "@list": List
  "@index"?: Index
}

/**
 * A set represents an unordered set of values. Unless otherwise specified, arrays are unordered in JSON-LD. As such,
 * the `@set` keyword, when used in the body of a JSON-LD document, represents just syntactic sugar which is optimized
 * away when processing the document. However, it is very helpful when used within the context of a document. Values of
 * terms associated with an `@set` container will always be represented in the form of an array when a document is
 * processed—even if there is just a single value that would otherwise be optimized to a non-array form in compacted
 * document form. This simplifies post-processing of the data as the data is always in a deterministic form.
 *
 * A set object MUST be a map that contains no keys that expand to an IRI or keyword other than `@set` and @index.
 * Please note that the `@index` key will be ignored when being processed.
 *
 * The value associated with the keys `@set` MUST be one of the following types:
 *
 * - string,
 * - number,
 * - boolean,
 * - `null`,
 * - node object,
 * - value object, or
 * - an array of zero or more of the above possibilities.
 *
 * @see https://www.w3.org/TR/json-ld11/#lists-and-sets
 */
export interface SetObject {
  "@set": UnorderedSet
  "@index"?: Index
}

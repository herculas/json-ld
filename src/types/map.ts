import { IRI, IRICompacted, IRIReference, Term } from "./basic.ts"
import { JsonPrimitive, OneOrMany } from "./document.ts"
import { ListObject, NodeObject, SetObject, ValueObject } from "./object.ts"

/**
 * A language map is used to associate a language with a value in a way that allows easy programmatic access. A language
 * map may be used as a term value within a node object if the term is defined with `@container` set to `@language`, or
 * an array containing both `@language` and `@set`.
 *
 * The keys of a language map MUST be strings representing [BCP47] language tags, the keyword `@none`, or a term which
 * expands to `@none`, and the values MUST be any of the following types:
 *
 * - `null`,
 * - string, or
 * - an array of zero or more of the strings.
 *
 * @see https://www.w3.org/TR/json-ld11/#language-maps
 * @see https://www.w3.org/TR/json-ld11/#string-internationalization
 */
export interface LanguageMap {
  [key: string]: OneOrMany<string> | null
}

/**
 * An index map allows keys that have no semantic meaning, but should be preserved regardless, to be used in JSON-LD
 * documents. An index map may be used as a term value within a node object if the term is defined with `@container` set
 * to `@index`, or an array containing both `@index` and `@set`.
 *
 * Index Maps may also be used to map indexes to associated named graphs, if the term is defined with `@container` set
 * to an array containing both `@graph` and `@index`, and optionally including `@set`. The value consists of the node
 * objects contained within the named graph which is indexed using the referencing key, which can be represented as a
 * simple graph object if the value does not include `@id`, or a named graph if it includes `@id`.
 *
 * The values of the entries of an index map MUST be one of the following types:
 *
 * - string,
 * - number,
 * - boolean,
 * - `null`,
 * - node object,
 * - value object,
 * - list object,
 * - set object,
 * - an array of zero or more of the above possibilities.
 *
 * @see https://www.w3.org/TR/json-ld11/#index-maps
 */
export interface IndexMap {
  [key: string]: OneOrMany<JsonPrimitive | NodeObject | ValueObject | ListObject | SetObject>
}

/**
 * An id map is used to associate an IRI with a value that allows easy programmatic access. An id map may be used as a
 * term value within a node object if the term is defined with `@container` set to `@id`, or an array containing both
 * `@id` and `@set`.
 *
 * Id Maps may also be used to map graph names to their named graphs, if the term is defined with `@container` set to an
 * array containing both `@graph` and `@id`, and optionally including `@set`. The value consists of the node objects
 * contained within the named graph which is named using the referencing key.
 *
 * The keys of an id map MUST be IRIs (IRI references or compact IRIs (including blank node identifiers)), the keyword
 * `@none`, or a term which expands to `@none`, and the values MUST be node objects.
 *
 * - If the value contains a property expanding to `@id`, its value MUST be equivalent to the referencing key.
 *   Otherwise, the property from the value is used as the `@id` of the node object value when expanding.
 *
 * @see https://www.w3.org/TR/json-ld11/#id-maps
 */
export interface IdMap {
  [key: IRI | IRIReference | IRICompacted | Term | "@none"]: NodeObject
}

/**
 * A type map is used to associate an IRI with a value that allows easy programmatic access. A type map may be used as a
 * term value within a node object if the term is defined with `@container` set to `@type`, or an array containing both
 * `@type` and `@set`.
 *
 * The keys of a type map MUST be:
 * - IRIs
 * - IRI references
 * - compact IRI (including blank node identifiers),
 * - terms, or
 * - `@none`.
 *
 * Its values MUST be node objects or strings which expand to node objects. If the value contains a property expanding
 * to `@type`, and its value is contains the referencing key after suitable expansion of both the referencing key and
 * the value, then the node object already contains the type. Otherwise, the property from the value is added as a
 * `@type` of the node object value when expanding.
 *
 * @see https://www.w3.org/TR/json-ld11/#type-maps
 */
export interface TypeMap {
  [key: IRI | IRIReference | IRICompacted | Term | "@none"]: string | NodeObject
}

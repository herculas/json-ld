import { IRI, IRICompacted, IRIReference, Term } from "./basic.ts"
import { Null } from "./document.ts"
import {
  Base,
  Container,
  Direction,
  Id,
  Import,
  Index,
  Language,
  Prefix,
  Propagate,
  Protected,
  Reverse,
  Version,
  Vocab,
} from "./keyword.ts"

/**
 * A context definition defines a local context in a node object.
 *
 * A context definition MUST be a map whose keys MUST be either terms, compact IRIs, IRIs, or one of the keywords
 * `@base`, `@import`, `@language`, `@propagate`, `@protected`, `@version`, or `@vocab`.
 *
 * - If the context definition has an `@base` key, its value MUST be an IRI reference, or `null`.
 * - If the context definition has an `@direction` key, its value MUST be one of `"ltr"` or `"rtl"`, or `null`.
 * - If the context definition has an `@import` keyword, its value MUST be an IRI reference. When used as a reference
 *   from an `@import`, the referenced context definition MUST NOT include an `@import` key, itself.
 * - If the context definition has an `@language` key, its value MUST have the lexical form described in [BCP47], or
 *   `null`.
 * - If the context definition has an `@propagate` key, its value MUST be `true` or `false`.
 * - If the context definition has an `@protected` key, its value MUST be `true` or `false`.
 * - If the context definition has an `@type` key, its value MUST be a map with only the entry `@container` set to
 *   `@set`, and optionally an entry `@protected`.
 * - If the context definition has an `@version` key, its value MUST be a number with the value `1.1`.
 * - If the context definition has an `@vocab` key, its value MUST be an IRI reference, a compact IRI, a blank node
 *   identifier, a term, or `null`.
 *
 * The value of keys that are not keywords MUST be either an IRI, a compact IRI, a term, a blank node identifier, a
 * keyword, `null`, or an expanded term definition.
 *
 * @see https://www.w3.org/TR/json-ld11/#context-definitions
 */
export interface ContextDefinition {
  "@base"?: Base
  "@direction"?: Direction
  "@import"?: Import
  "@language"?: Language
  "@propagate"?: Propagate
  "@protected"?: Protected
  "@version"?: Version
  "@vocab"?: Vocab
  "@type"?: {
    "@container": "@set"
    "@protected"?: Protected
  }
  [key: IRI | IRICompacted]:
    | Null
    | IRI
    | IRICompacted
    | Term
    | IRIReference
    | ExpandedTermDefinition
    | ContextDefinition[keyof ContextDefinition]
}

/**
 * An expanded term definition is used to describe the mapping between a term and its expanded identifier, as well as
 * other properties of the value associated with the term when it is used as key in a node object.
 *
 * An expanded term definition MUST be a map composed of zero or more keys from `@id`, `@reverse`, `@type`, `@language`,
 * `@container`, `@context`, `@prefix`, `@propagate`, and `@protected`. An expanded term definition SHOULD NOT contain
 * any other keys.
 *
 * When the associated term is `@type`, the expanded term definition MUST NOT contain keys other than `@container` and
 * `@protected`. The value of `@container` is limited to the single value `@set`.
 *
 * - If the term being defined is not an IRI or a compact IRI, and the active context does not have an `@vocab` mapping,
 *   the expanded term definition MUST include the `@id` key.
 *
 * Term definitions with keys which are of the form of an IRI or a compact IRI MUST NOT expand to an IRI other than the
 * expansion of the key itself.
 *
 * - If the expanded term definition contains the `@id` keyword, its value MUST be `null`, an IRI, a blank node
 *   identifier, a compact IRI, a term, or a keyword.
 * - If the expanded term definition has the `@reverse` keyword, it MUST NOT have `@id` or `@nest` entries at the same
 *   time, its value MUST an IRI, a blank node identifier, a compact IRI, or a term. If an `@container` entry exists,
 *   its value MUST be `null`, `@set` or `@index`.
 * - If the expanded term definition contains the `@type` keyword, its value MUST be an IRI, a compact IRI, a term,
 *   `null`, or one of the keywords `@id`, `@json`, `@vocab`, or `@none`.
 * - If the expanded term definition contains the `@language` keyword, its value MUST have the lexical form described in
 *   [BCP47], or `null`.
 * - If the expanded term definition contains the `@index` keyword, its value MUST be an IRI, a compact IRI, or a term.
 * - If the expanded term definition contains the `@container` keyword, its value MUST be either `@list`, `@set`,
 *   `@language`, `@index`, `@id`, `@graph`, `@type`, or be `null` or an array containing exactly any one of those
 *   keywords, or a combination of `@set` and any of `@index`, `@id`, `@graph`, `@type`, `@language` in any order.
 *   `@container` may also be an array containing `@graph` along with either `@id` or `@index` and also optionally
 *   including `@set`. If the value is `@language`, when the term is used outside of the `@context`, the associated
 *   value MUST be a language map. If the value is `@index`, when the term is used outside of the `@context`, the
 *   associated value MUST be an index map.
 * - If the expanded term definition contains the `@context` keyword, its value MUST be a valid context definition.
 * - If the expanded term definition contains the `@nest` keyword, its value MUST be either `@nest`, or a term which
 *   expands to `@nest`.
 * - If the expanded term definition contains the `@prefix` keyword, its value MUST be `true` or `false`.
 * - If the expanded term definition contains the `@propagate` keyword, its value MUST be `true` or `false`.
 * - If the expanded term definition contains the `@protected` keyword, its value MUST be `true` or `false`.
 *
 * Terms MUST NOT be used in a circular manner. That is, the definition of a term cannot depend on the definition of
 * another term if that term also depends on the first term.
 *
 * @see https://www.w3.org/TR/json-ld11/#expanded-term-definition
 */
type ExpandedTermDefinition =
  & {
    "@type"?: "@id" | "@json" | "@vocab" | "@none" | IRI | IRICompacted | Term | Null
    "@language"?: Language
    "@index"?: Index
    "@context"?: ContextDefinition
    "@prefix"?: Prefix
    "@propagate"?: Propagate
    "@protected"?: Protected
  }
  & ({
    "@id"?: Id | Null
    "@nest"?: "@nest" | Term
    "@container"?: Container
  } | {
    "@reverse": Reverse
    "@container"?: "@set" | "@index" | Null
  })

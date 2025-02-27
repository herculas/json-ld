import { Context, Graph } from "./keyword.ts"
import { NodeObject } from "./object.ts"

/**
 * The value `null` is used to indicate the lack of a value. It can be used interchangeably with the JavaScript `null`
 * value.
 *
 * @see https://infra.spec.whatwg.org/#nulls
 */
export type Null = null

/**
 * One or multiple values of type `T`.
 */
export type OneOrMany<T> = T | Array<T>

/**
 * A value wrapped in a single-element array.
 */
export type SingleWrapped<T> = Array<T> & { length: 1 }

/**
 * A value that is either of type `T` or a single-element array of type `T`.
 */
export type OneOrWrapped<T> = T | SingleWrapped<T>

/**
 * A JSON primitive also known as a scalar value, is a value that is not an object or array. It is a value that can be
 * represented as a single string, number, boolean, or null value.
 */
export type JsonPrimitive = string | number | boolean | Null

export interface JsonArray extends Array<JsonValue> {}

export interface JsonObject {
  [key: string]: JsonValue | Null
}

type JsonValue = JsonPrimitive | JsonObject | JsonArray

/**
 * A JSON-LD document MUST be valid JSON text as described in [RFC-8259], or some format that can be represented in the
 * JSON-LD internal representation that is equivalent to valid JSON text.
 *
 * A JSON-LD document MUST be a single node object, a map consisting of only the entries `@context` and/or `@graph`, or
 * an array of zero or more node objects.
 *
 * In contrast to JSON, in JSON-LD the keys in objects MUST be unique.
 *
 * @see https://www.w3.org/TR/json-ld11/#json-ld-grammar
 */
export type JsonLdDocument = OneOrMany<NodeObject> | {
  "@context"?: Context
  "@graph"?: Graph
}

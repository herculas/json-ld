/**
 * The value `null` is used to indicate the lack of a value. It can be used interchangeably with the JavaScript `null`
 * value.
 *
 * @see https://infra.spec.whatwg.org/#nulls
 */
export type Null = null | undefined

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

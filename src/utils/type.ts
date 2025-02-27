/**
 * Check whether the given value is a subject with properties.
 *
 * @param {unknown} value The value to check.
 *
 * @returns {boolean} Return `true` if the value is a subject; otherwise `false`.
 */
export function isSubject(value: unknown): value is Record<string, unknown> {
  // A value is a subject of all of the following conditions are met:
  //
  // 1. It is an object.
  // 2. It does not have a `@value`, `@list`, or `@set` key.
  // 3. It has more than one key, or any existing key is not `@id`.

  if (typeof value === "object" && value !== null) {
    const keys = Object.keys(value)
    return (
      !keys.includes("@value") &&
      !keys.includes("@list") &&
      !keys.includes("@set") &&
      (keys.length > 1 || !keys.includes("@id"))
    )
  }
  return false
}

/**
 * Check whether the given value is a subject reference.
 *
 * @param {unknown} value The value to check.
 *
 * @returns {boolean} Return `true` if the value is a subject reference; otherwise `false`.
 */
export function isSubjectRef(value: unknown): value is Record<string, unknown> {
  // A value is a subject reference if all of the following conditions are met:
  //
  // 1. It is an object.
  // 2. It has an single `@id` key.

  if (typeof value === "object" && value !== null) {
    const keys = Object.keys(value)
    return keys.length === 1 && keys.includes("@id")
  }
  return false
}

/**
 * Check whether the given value is a value object.
 *
 * @param {unknown} value The value to check.
 *
 * @returns {boolean} Return `true` if the value is a value object; otherwise `false`.
 */
export function isValueObject(value: unknown): value is Record<string, unknown> {
  // A value is a value object if all of the following conditions are met:
  //
  // 1. It is an object.
  // 2. It has an `@value` key.

  if (typeof value === "object" && value !== null) {
    return "@value" in value
  }
  return false
}

/**
 * Check whether the given value is a list object.
 *
 * @param {unknown} value The value to check.
 *
 * @returns {boolean} Return `true` if the value is a list object; otherwise `false`.
 */
export function isListObject(value: unknown): value is Record<string, unknown> {
  // A value is a list object if all of the following conditions are met:
  //
  // 1. It is an object.
  // 2. It has an `@list` key.

  if (typeof value === "object" && value !== null) {
    return "@list" in value
  }
  return false
}

/**
 * Check whether the given value is a graph object.
 *
 * @param {unknown} value The value to check.
 *
 * @returns {boolean} Return `true` if the value is a graph object; otherwise `false`.
 */
export function isGraphObject(value: unknown): value is Record<string, unknown> {
  // A value is a graph object if all of the following conditions are met:
  //
  // 1. It is an object.
  // 2. It has an `@graph` key.
  // 3. It may have `@id` or `@index` keys.

  if (typeof value === "object" && value !== null) {
    const keys = Object.keys(value)
    return keys.includes("@graph") &&
      keys.filter((key) => key !== "@id" && key !== "@index").length === 1
  }
  return false
}

/**
 * Check whether the given value is a simple graph.
 *
 * @param {unknown} value The value to check.
 *
 * @returns {boolean} Return `true` if the value is a simple graph; otherwise `false`.
 */
export function isSimpleGraph(value: unknown): value is Record<string, unknown> {
  // A value is a simple graph if all of the following conditions are met:
  //
  // 1. It is an object.
  // 2. It has an `@graph` key.
  // 3. It has only one key, or two keys where the other key is `@index`.

  return isGraphObject(value) && !("@id" in value)
}

/**
 * Check whether the given value is a blank node.
 *
 * @param {unknown} value The value to check.
 *
 * @returns {boolean} Return `true` if the value is a blank node; otherwise `false`.
 */
export function isBlankNode(value: unknown): value is Record<string, unknown> {
  // A value is a blank node if all of the following conditions are met:
  //
  // 1. It is an object.
  // 2. It has an `@id` key whose value is not a string, or is a string starting with "_:".
  // 3. It has no keys, or it has keys other than `@value`, `@set` or `@list`.

  if (typeof value === "object" && value !== null) {
    const keys = Object.keys(value)
    if (keys.includes("@id")) {
      const id = (value as Record<string, unknown>)["@id"]
      return (
        typeof id !== "string" || id.startsWith("_:")
      )
    }
    return keys.length === 0 || keys.some((key) => !["@value", "@set", "@list"].includes(key))
  }
  return false
}

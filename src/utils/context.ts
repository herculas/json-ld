import { ContextDefinition } from "../types/context.ts"
import { Context } from "../types/keyword.ts"

/**
 * Retrieve the value for the given active context and type, `null` if `none` is set, or `undefined` if `none` is set
 * and `type` is `@context`.
 *
 * @param {Context} context The active context to retrieve the value from.
 * @param {string} key The key to retrieve the value for.
 * @param {string} [type] The type to retrieve the value for.
 *
 * @returns {string | null | undefined} The value for the given key, `null` if `none` is set, or `undefined` if `none`
 * is set and `type` is `@context`.
 */
export function getContextValue(
  context: ContextDefinition,
  key: string,
  type?: string,
) {
  // invalid key
  if (key === null) {
    if (type === "@context") {
      return undefined
    }
    return null
  }

  // context has the key
  if (context[key] !== undefined) {
    const entry = context[key]
    if (type === undefined) {
      return entry
    }
    if (entry && Object.prototype.hasOwnProperty.call(entry, type)) {
      return entry[type]
    }
  }
}

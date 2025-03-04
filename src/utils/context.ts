/**
 * Check the processing mode (version) of a context.
 *
 * @param {string | number} version The version string or number in the context.
 * @param {number} expect The expected version number.
 *
 * @returns {boolean} `true` if the version is equal to the expected version, `false` otherwise.
 */
export function checkVersion(version: string | number, expect: number): boolean {
  // the input version could be a string in the form of "1.1" or "json-ld-1.1"
  return parseFloat(version.toString().replace(/json-ld-/, "")) === expect
}

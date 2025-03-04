import { assert, assertEquals } from "@std/assert"
import { add } from "../src/mod.ts"
import { checkVersion } from "../src/utils/context.ts"

Deno.test(function addTest() {
  assertEquals(add(2, 3), 5)
})

Deno.test("version checking", () => {
  assert(checkVersion("1.1", 1.1))
  assert(checkVersion("json-ld-1.1", 1.1))
  assert(checkVersion(1.1, 1.1))
  assert(checkVersion("1.0", 1.0))
  assert(checkVersion("json-ld-1.0", 1.0))
  assert(checkVersion(1.0, 1.0))
})

Deno.test("URL parsing", () => {
  assert(URL.canParse("http://example.com"))
  assert(URL.canParse("https://example.com"))
  assert(URL.canParse("ftp://example.com"))
  assert(URL.canParse("file:///example.com"))

  assert(!URL.canParse("example.com"))
})

Deno.test("type assertion", () => {
  type ContainerValueSingle = "@language" | "@index" | "@id" | "@graph" | "@type" | "@set" | "@list"

  const value = "@language" as ContainerValueSingle
  const value2 = "@aa" as ContainerValueSingle

  console.log(value)
  console.log(value2)
})

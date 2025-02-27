/**
 * A Uniform Resource Identifier (URI) is defined as a sequence of characters chosen from a limited subset of the
 * repertoire of US-ASCII characters. The characters in URIs are frequently used for representing words of natural
 * languages.
 *
 * A URI can be further classified as a locator, a name, or both. The term "Uniform Resource Locator" (URL) refers to
 * the subset of URIs that, in addition to identifying a resource, provide a means of locating the resource by
 * describing its primary access mechanism (e.g., its network "location"). The term "Uniform Resource Name" (URN) has
 * been used historically to refer to both URIs under the "urn" scheme [RFC-2141], which are required to remain globally
 * unique and persistent even when the resource ceases to exist or becomes unavailable, and to any other URI with the
 * properties of a name.
 *
 * An individual scheme does not have to be classified as being just one of "locator" or "name". Instances of URIs from
 * any given scheme may have the characteristics of locators or names or both, often depending on the persistence and
 * care in the assignment of identifiers by the naming authority, rather than on any quality of the scheme.
 *
 * The generic URI syntax consists of a hierarchical sequence of components referred to as the scheme, authority, path,
 * query, and fragment.
 *
 * ```
 * URI                = scheme ":" hier-part [ "?" query ] [ "#" fragment ]
 * scheme             = ALPHA *( ALPHA / DIGIT / "+" / "-" / "." )
 * hier-part          = "//" authority path-abempty
 *                      / path-absolute
 *                      / path-rootless
 *                      / path-empty
 * authority          = [ userinfo "@" ] host [ ":" port ]
 * userinfo           = *( unreserved / pct-encoded / sub-delims / ":" )
 * host               = IP-literal / IPv4address / reg-name
 *
 * IP-literal         = "[" ( IPv6address / IPvFuture  ) "]"
 * IPvFuture          = "v" 1*HEXDIG "." 1*( unreserved / sub-delims / ":" )
 * IPv6address        =                              6( h16 ":" ) ls32
 *                      /                       "::" 5( h16 ":" ) ls32
 *                      / [               h16 ] "::" 4( h16 ":" ) ls32
 *                      / [ *1( h16 ":" ) h16 ] "::" 3( h16 ":" ) ls32
 *                      / [ *2( h16 ":" ) h16 ] "::" 2( h16 ":" ) ls32
 *                      / [ *3( h16 ":" ) h16 ] "::"    h16 ":"   ls32
 *                      / [ *4( h16 ":" ) h16 ] "::"              ls32
 *                      / [ *5( h16 ":" ) h16 ] "::"              h16
 *                      / [ *6( h16 ":" ) h16 ] "::"
 * ls32               = ( h16 ":" h16 ) / IPv4address ; least-significant 32 bits of address
 * h16                = 1*4HEXDIG ; 16 bits of address represented in hexadecimal
 *
 * IPv4address        = dec-octet "." dec-octet "." dec-octet "." dec-octet
 * dec-octet          = DIGIT                   ; 0-9
 *                      / %x31-39 DIGIT         ; 10-99
 *                      / "1" 2DIGIT            ; 100-199
 *                      / "2" %x30-34 DIGIT     ; 200-249
 *                      / "25" %x30-35          ; 250-255
 * reg-name           = *( unreserved / pct-encoded / sub-delims )
 *
 * port               = *DIGIT
 *
 * path               = path-abempty      ; begins with "/" or is empty
 *                      / path-absolute   ; begins with "/" but not "//"
 *                      / path-noscheme   ; begins with a non-colon segment
 *                      / path-rootless   ; begins with a segment
 *                      / path-empty      ; zero characters
 * path-abempty       = *( "/" segment )
 * path-absolute      = "/" [ segment-nz *( "/" segment ) ]
 * path-noscheme      = segment-nz-nc *( "/" segment )
 * path-rootless      = segment-nz *( "/" segment )
 * path-empty         = 0<pchar>
 * segment            = *pchar
 * segment-nz         = 1*pchar
 * segment-nz-nc      = 1*( unreserved / pct-encoded / sub-delims / "@" ) ; non-zero-length segment without any ":"
 * pchar              = unreserved / pct-encoded / sub-delims / ":" / "@"
 *
 * query              = *( pchar / "/" / "?" )
 * fragment           = *( pchar / "/" / "?" )
 *
 * pct-encoded        = "%" HEXDIG HEXDIG
 * unreserved         = ALPHA / DIGIT / "-" / "." / "_" / "~"
 * reserved           = gen-delims / sub-delims
 * gen-delims         = ":" / "/" / "?" / "#" / "[" / "]" / "@"
 * sub-delims         = "!" / "$" / "&" / "'" / "(" / ")" / "*" / "+" / "," / ";" / "="
 * ```
 *
 * @see https://datatracker.ietf.org/doc/html/rfc3986
 * @see https://datatracker.ietf.org/doc/html/rfc2141
 *
 * @example "ftp://ftp.is.co.za/rfc/rfc1808.txt"
 * @example "http://www.ietf.org/rfc/rfc2396.txt"
 * @example "ldap://[2001:db8::7]/c=GB?objectClass?one"
 * @example "mailto:John.Doe@example.com"
 * @example "news:comp.infosystems.www.servers.unix"
 * @example "tel:+1-816-555-1212"
 * @example "telnet://192.0.2.16:80/"
 * @example "urn:oasis:names:specification:docbook:dtd:xml:4.1.2"
 */
export type URI = string

/**
 * URI-reference is used to denote the most common usage of a resource identifier.
 *
 * ```
 * URI-reference      = URI / relative-ref
 *
 * relative-ref       = relative-part [ "?" query ] [ "#" fragment ]
 * relative-part      = "//" authority path-abempty
 *                      / path-absolute
 *                      / path-noscheme
 *                      / path-empty
 * ```
 *
 * A URI-reference is either a URI or a relative reference. If the URI-reference's prefix does not match the syntax of a
 * scheme followed by its colon separator, then the URI-reference is a relative reference.
 *
 * A URI-reference is typically parsed first into the five URI components, in order to determine what components are
 * present and whether the reference is relative. Then, each component is parsed for its subparts and their validation.
 * The ABNF of URI-reference, along with the "first-match-wins" disambiguation rule, is sufficient to define a
 * validating parser for the generic syntax.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc3986#section-4.1
 */
export type URIReference = string

/**
 * A Uniform Resource Identifier (URI) is defined in [RFC-3986] as a sequence of characters chosen from a limited subset
 * of the repertoire of US-ASCII characters.
 *
 * The characters in URIs are frequently used for representing words of natural languages. This usage has many
 * advantages: Such URIs are easier to memorize, easier to interpret, easier to transcribe, easier to create, and easier
 * to guess. For most languages other than English, however, the natural script uses characters other than [A-Z]. For
 * many people, handling Latin characters is as difficult as handling the characters of other scripts is for those who
 * use only the Latin alphabet. Many languages with non-Latin scripts are transcribed with Latin letters. These
 * transcriptions are now often used in URIs, but they introduce additional ambiguities.
 *
 * The infrastructure for the appropriate handling of characters from local scripts is now widely deployed in local
 * versions of operating system and application software. Software that can handle a wide variety of scripts and
 * languages at the same time is increasingly common. Also, increasing numbers of protocols and formats can carry a wide
 * range of characters.
 *
 * IRIs are designed to be compatible with recommendations for new URI schemes [RFC2718]. The compatibility is provided
 * by specifying a well-defined and deterministic mapping from the IRI character sequence to the functionally equivalent
 * URI character sequence. Practical use of IRIs (or IRI references) in place of URIs (or URI references) depends on the
 * following conditions being met:
 *
 * 1. A protocol or format element should be explicitly designated to be able to carry IRIs. The intent is not to
 *    introduce IRIs into contexts that are not defined to accept them. For example, XML schema [XMLSchema] has an
 *    explicit type "anyURI" that includes IRIs and IRI references. Therefore, IRIs and IRI references can be in
 *    attributes and elements of type "anyURI". On the other hand, in the HTTP protocol [RFC2616], the Request URI is
 *    defined as a URI, which means that direct use of IRIs is not allowed in HTTP requests.
 * 2. The protocol or format carrying the IRIs should have a mechanism to represent the wide range of characters used in
 *    IRIs, either natively or by some protocol- or format-specific escaping mechanism (for example, numeric character
 *    references in [XML1]).
 * 3. The URI corresponding to the IRI in question has to encode original characters into octets using UTF-8. For new
 *    URI schemes, this is recommended in [RFC2718]. It can apply to a whole scheme (e.g., IMAP URLs [RFC2192] and POP
 *    URLs [RFC2384], or the URN syntax [RFC2141]). It can apply to a specific part of a URI, such as the fragment
 *    identifier (e.g., [XPointer]). It can apply to a specific URI or part(s) thereof.
 *
 * Although it might be possible to define IRI references and IRIs merely by their transformation to URI references and
 * URIs, they can also be accepted and processed directly. Therefore, an ABNF definition for IRI references (which are
 * the most general concept and the start of the grammar) and IRIs is given here. Character numbers are taken from the
 * UCS, without implying any actual binary encoding. Terminals in the ABNF are characters, not bytes.
 *
 * The following grammar closely follows the URI grammar in [RFC3986], except that the range of unreserved characters is
 * expanded to include UCS characters, with the restriction that private UCS characters can occur only in query parts.
 * The grammar is split into two parts: Rules that differ from [RFC3986] because of the above-mentioned expansion, and
 * rules that are the same as those in [RFC3986]. For rules that are different than those in [RFC3986], the names of the
 * non-terminals have been changed as follows. If the non-terminal contains 'URI', this has been changed to 'IRI'.
 * Otherwise, an 'i' has been prefixed.
 *
 * The following rules are different from those in [RFC3986]:
 *
 * ```
 * IRI                = scheme ":" ihier-part [ "?" iquery ] [ "#" ifragment ]
 *
 * ihier-part         = "//" iauthority ipath-abempty
 *                      / ipath-absolute
 *                      / ipath-rootless
 *                      / ipath-empty
 *
 * absolute-IRI       = scheme ":" ihier-part [ "?" iquery ]
 *
 * iauthority         = [ iuserinfo "@" ] ihost [ ":" port ]
 * iuserinfo          = *( iunreserved / pct-encoded / sub-delims / ":" )
 * ihost              = IP-literal / IPv4address / ireg-name
 *
 * ireg-name          = *( iunreserved / pct-encoded / sub-delims )
 *
 * ipath              = ipath-abempty     ; begins with "/" or is empty
 *                      / ipath-absolute  ; begins with "/" but not "//"
 *                      / ipath-noscheme  ; begins with a non-colon segment
 *                      / ipath-rootless  ; begins with a segment
 *                      / ipath-empty     ; zero characters
 *
 * ipath-abempty      = *( "/" isegment )
 * ipath-absolute     = "/" [ isegment-nz *( "/" isegment ) ]
 * ipath-noscheme     = isegment-nz-nc *( "/" isegment )
 * ipath-rootless     = isegment-nz *( "/" isegment )
 * ipath-empty        = 0<ipchar>
 *
 * isegment           = *ipchar
 * isegment-nz        = 1*ipchar
 * isegment-nz-nc     = 1*( iunreserved / pct-encoded / sub-delims / "@" )
 *
 * ipchar             = iunreserved / pct-encoded / sub-delims / ":" / "@"
 * iquery             = *( ipchar / iprivate / "/" / "?" )
 * ifragment          = *( ipchar / "/" / "?" )
 * iunreserved        = ALPHA / DIGIT / "-" / "." / "_" / "~" / ucschar
 *
 * ucschar            = %xA0-D7FF / %xF900-FDCF / %xFDF0-FFEF
 *                      / %x10000-1FFFD / %x20000-2FFFD / %x30000-3FFFD
 *                      / %x40000-4FFFD / %x50000-5FFFD / %x60000-6FFFD
 *                      / %x70000-7FFFD / %x80000-8FFFD / %x90000-9FFFD
 *                      / %xA0000-AFFFD / %xB0000-BFFFD / %xC0000-CFFFD
 *                      / %xD0000-DFFFD / %xE1000-EFFFD
 *
 * iprivate           = %xE000-F8FF / %xF0000-FFFFD / %x100000-10FFFD
 * ```
 *
 * The following rules are the same as those in [RFC3986]:
 *
 * ```
 * scheme             = ALPHA *( ALPHA / DIGIT / "+" / "-" / "." )
 * port               = *DIGIT
 *
 * IP-literal         = "[" ( IPv6address / IPvFuture  ) "]"
 * IPvFuture          = "v" 1*HEXDIG "." 1*( unreserved / sub-delims / ":" )
 * IPv6address        =                              6( h16 ":" ) ls32
 *                      /                       "::" 5( h16 ":" ) ls32
 *                      / [               h16 ] "::" 4( h16 ":" ) ls32
 *                      / [ *1( h16 ":" ) h16 ] "::" 3( h16 ":" ) ls32
 *                      / [ *2( h16 ":" ) h16 ] "::" 2( h16 ":" ) ls32
 *                      / [ *3( h16 ":" ) h16 ] "::"    h16 ":"   ls32
 *                      / [ *4( h16 ":" ) h16 ] "::"              ls32
 *                      / [ *5( h16 ":" ) h16 ] "::"              h16
 *                      / [ *6( h16 ":" ) h16 ] "::"
 *
 * h16                = 1*4HEXDIG
 * ls32               = ( h16 ":" h16 ) / IPv4address
 *
 * IPv4address        = dec-octet "." dec-octet "." dec-octet "." dec-octet
 * dec-octet          = DIGIT                   ; 0-9
 *                      / %x31-39 DIGIT         ; 10-99
 *                      / "1" 2DIGIT            ; 100-199
 *                      / "2" %x30-34 DIGIT     ; 200-249
 *                      / "25" %x30-35          ; 250-255
 *
 * pct-encoded        = "%" HEXDIG HEXDIG
 *
 * unreserved         = ALPHA / DIGIT / "-" / "." / "_" / "~"
 * reserved           = gen-delims / sub-delims
 * gen-delims         = ":" / "/" / "?" / "#" / "[" / "]" / "@"
 * sub-delims         = "!" / "$" / "&" / "'" / "(" / ")" / "*" / "+" / "," / ";" / "="
 * ```
 *
 * @see https://datatracker.ietf.org/doc/html/rfc3987
 */
export type IRI = string

/**
 * IRI reference denotes the common usage of an Internationalized Resource Identifier (IRI). An IRI reference may be
 * absolute or relative. However, the "IRI" that results from such a reference only includes absolute IRIs; any relative
 * IRI references are resolved to their absolute form.
 *
 * Note that in [RFC-2396] URIs did not include fragment identifiers, but in [RFC-3986] fragment identifiers are part of
 * URIs.
 *
 * The following is the ABNF definition of an IRI reference:
 *
 * ```
 * IRI-reference      = IRI / irelative-ref
 *
 * irelative-ref      = irelative-part [ "?" iquery ] [ "#" ifragment ]
 * irelative-part     = "//" iauthority ipath-abempty
 *                      / ipath-absolute
 *                      / ipath-noscheme
 *                      / ipath-empty
 * ```
 *
 * @see https://datatracker.ietf.org/doc/html/rfc3987
 */
export type IRIReference = string

/**
 * A compact IRI is a way to expressing an IRI using a `prefix` and `suffix` separated by a colon `:`. The `prefix` is
 * a term taken from the active context and is a short string identifying a particular IRI in a JSON-LD document.
 *
 * For example, the prefix `foaf` may be used as a shorthand for the Friend-of-a-Friend vocabulary, which is identified
 * using the IRI `http://xmlns.com/foaf/0.1/`. A developer may append any of the FOAF vocabulary terms to the end of the
 * prefix to specify a short-hand version of the IRI for the vocabulary term. For example, `foaf:name` would be expanded
 * to the IRI `http://xmlns.com/foaf/0.1/name`.
 *
 * ```json
 * {
 *   "@context": {
 *     "foaf": "http://xmlns.com/foaf/0.1/"
 *   },
 *   "@type": "foaf:Person",
 *   "foaf:name": "Dave Longley",
 * }
 * ```
 *
 * In the example above, `"foaf:name"` expands to the IRI "http://xmlns.com/foaf/0.1/name" and `"foaf:Person"` expands
 * to http://xmlns.com/foaf/0.1/Person.
 *
 * Prefixes are expanded when the form of the value is a compact IRI represented as a `prefix:suffix` combination, the
 * `prefix` matches a term defined within the active context, and the `suffix` does not begin with two slashes (`//`).
 * The compact IRI is expanded by concatenating the IRI mapped to the `prefix` to the (possibly empty) `suffix`. If the
 * `prefix` is not defined in the active context, or the `suffix` begins with two slashes (such as in
 * "http://example.com"), the value is interpreted as IRI instead. If the `prefix` is an underscore (`_`), the value is
 * interpreted as blank node identifier instead.
 *
 * @see https://www.w3.org/TR/json-ld11/#compact-iris
 */
export type IRICompacted = string

/**
 * A decentralized identifier (DID) is a globally unique persistent identifier that does not require a centralized
 * registration authority, and is often generated and/or registered cryptographically. Many--but not all--DID methods
 * makes use of distributed ledger technology (DLT) or some other form of decentralized network.
 *
 * A DID scheme defines the formal syntax of a DID. The generic DID scheme begins with the prefix `did:`. A specific DID
 * scheme is defined in a DID method specification.
 *
 * A DID method is a definition of how a specific DID scheme is implemented. A DID method is defined by a DID method
 * specification, which specifies the precise operations by which DIDs and DID documents are created, resolved, updated,
 * and deactivated. In a specific DID method scheme, the DID method name follows the first colon and terminates with the
 * second colon, e.g., `did:method-name:`.
 *
 * The generic DID scheme is a URI scheme conformant with [RFC-3986]. The ABNF definition can be found below, which uses
 * the syntax in [RFC-5234] and the corresponding definitions for `ALPHA` and `DIGIT`. All other rule names not defined
 * in the ABNF below are defined in [RFC-3986].
 *
 * All DIDs MUST conform to the DID Syntax ABNF Rules defined below:
 *
 * ```
 * did                = "did:" method-name ":" method-specific-id
 * method-name        = 1*method-char
 * method-char        = %x61-7A / DIGIT
 * method-specific-id = *( *idchar ":" ) 1*idchar
 * idchar             = ALPHA / DIGIT / "." / "-" / "_" / pct-encoded
 * pct-encoded        = "%" HEXDIG HEXDIG
 * ```
 *
 * @see https://www.w3.org/TR/did-core
 * @see https://www.w3.org/TR/did-core/#did-syntax
 * @see https://www.w3.org/TR/did-core/#dfn-decentralized-identifiers
 * @see https://www.w3.org/TR/did-core/#dfn-did-schemes
 * @see https://www.w3.org/TR/did-core/#dfn-did-methods
 * @see https://datatracker.ietf.org/doc/html/rfc3986
 * @see https://datatracker.ietf.org/doc/html/rfc5234
 *
 * @example "did:example:123456789abcdefghi"
 */
export type DID = URI

/**
 * A DID URL is a network location identifier for a specific resource. It can be used to retrieve things like
 * representations of DID subjects, verification methods, services, specific parts of a DID document, or other
 * resources.
 *
 * The following is the ABNF definition of a DID URL, which uses the syntax in [RFC-5234]. It builds on the `did`
 * syntax. The `path-abempty`, `query`, and `fragment` components are defined in [RFC-3986].
 *
 * All DID URLs MUST conform to the DID URL Syntax ABNF Rules defined below:
 *
 * ```
 * did-url = did path-abempty [ "?" query ] [ "#" fragment ]
 * ```
 *
 * @see https://www.w3.org/TR/did-core
 * @see https://www.w3.org/TR/did-core/#did-url-syntax
 * @see https://datatracker.ietf.org/doc/html/rfc3986
 * @see https://datatracker.ietf.org/doc/html/rfc5234
 *
 * @example "did:example:123?service=agent&relativeRef=/credentials#degree"
 * @example "did:example:123?versionTime=2021-05-10T17:00:00Z"
 * @example "did:example:123?service=files&relativeRef=/resume.pdf"
 */
export type DIDURL = URI

/**
 * A dateTimeStamp is a string that represents a date and time in the `dateTimeStamp` format. The lexical space of
 * `dateTimeStamp` is reduced from that of `dateTime` by requiring a `timezoneFrag` fragment in the lexical
 * representations.
 *
 * @see https://www.w3.org/TR/xmlschema11-2/#dateTimeStamp
 *
 * @example "2020-01-01T19:23:24Z"
 * @example "2021-05-10T17:00:00.123Z"
 */
export type DateTime = string

/**
 * A term is a short word defined in a context that may be expanded to an IRI, blank node identifier, or keyword. A term
 * MUST NOT equal any of the JSON-LD keywords, other than `@type`.
 *
 * When used as the prefix in a Compact IRI, to avoid the potential ambiguity of a prefix being confused with an IRI
 * scheme, terms SHOULD NOT come from the list of URI schemes as defined in [IANA-URI-SCHEMES]. Similarly, to avoid
 * confusion between a Compact IRI and a term, terms SHOULD NOT include a colon (`:`) and SHOULD be restricted to the
 * form of `isegment-nz-nc` as defined in [RFC-3987].
 *
 * To avoid forward-compatibility issues, a term SHOULD NOT start with an `@` character followed exclusively by one or
 * more `ALPHA` characters (see [RFC-5234]) as future versions of JSON-LD may introduce additional keywords.
 * Furthermore, the term MUST NOT be an empty string ("") as not all programming languages are able to handle empty JSON
 * keys.
 *
 * @see https://www.w3.org/TR/json-ld11/#terms
 * @see https://datatracker.ietf.org/doc/html/rfc3987
 * @see https://datatracker.ietf.org/doc/html/rfc5234
 */
export type Term = string

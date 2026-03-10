/**
 * All IANA-registered HTTP status codes as string literals, matching how
 * they appear as keys in API specifications (e.g. `"200"`, `"404"`).
 */
export type HttpStatusCode =
  // 1xx Informational
  | '100'
  | '101'
  | '102'
  | '103'
  // 2xx Success
  | '200'
  | '201'
  | '202'
  | '203'
  | '204'
  | '205'
  | '206'
  | '207'
  | '208'
  | '226'
  // 3xx Redirection
  | '300'
  | '301'
  | '302'
  | '303'
  | '304'
  | '305'
  | '307'
  | '308'
  // 4xx Client Error
  | '400'
  | '401'
  | '402'
  | '403'
  | '404'
  | '405'
  | '406'
  | '407'
  | '408'
  | '409'
  | '410'
  | '411'
  | '412'
  | '413'
  | '414'
  | '415'
  | '416'
  | '417'
  | '418'
  | '421'
  | '422'
  | '423'
  | '424'
  | '425'
  | '426'
  | '428'
  | '429'
  | '431'
  | '451'
  // 5xx Server Error
  | '500'
  | '501'
  | '502'
  | '503'
  | '504'
  | '505'
  | '506'
  | '507'
  | '508'
  | '510'
  | '511'

/**
 * A status code as used in an operation response: a specific HTTP status
 * code string or `"default"` as a catch-all fallback.
 */
export type StatusCode = HttpStatusCode | 'default'

/**
 * Common IANA media types used in API request/response bodies.
 */
export type MediaType =
  // Application
  | 'application/json'
  | 'application/xml'
  | 'application/x-www-form-urlencoded'
  | 'application/octet-stream'
  | 'application/pdf'
  | 'application/zip'
  | 'application/graphql'
  // Multipart
  | 'multipart/form-data'
  // Text
  | 'text/plain'
  | 'text/html'
  | 'text/csv'
  | 'text/xml'
  // Image
  | 'image/png'
  | 'image/jpeg'
  | 'image/gif'
  | 'image/webp'
  | 'image/svg+xml'
  // Audio / Video
  | 'audio/mpeg'
  | 'video/mp4'

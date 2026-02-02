/**
 * Output keys for the Zod plugin
 * These define all the artifacts that plugin-zod can produce for an operation
 */
export type ZodOutputKeys =
  | 'pathParams'
  | 'queryParams'
  | 'headerParams'
  | 'request'
  | 'response'

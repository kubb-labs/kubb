import type { BaseNode } from './base.ts'
import { type ContentNode, createContent } from './content.ts'
import type { SchemaNode } from './schema.ts'

type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

/** Three-digit HTTP status code string, or `'default'` for the catch-all response. */
export type StatusCode = `${1 | 2 | 3 | 4 | 5}${Digit}${Digit}` | 'default'

/** One operation response variant. Body schemas live only inside `content`, one entry per content type. */
export type ResponseNode = BaseNode & {
  kind: 'Response'
  statusCode: StatusCode
  description?: string
  /**
   * One entry per content type declared in the spec, or exactly one entry when the adapter
   * `contentType` option is set, so plugins can generate a union of response types. Body-less
   * responses keep a single entry whose `schema` is the empty/`void` placeholder.
   */
  content?: Array<ContentNode>
}

type ResponseInput = Pick<ResponseNode, 'statusCode'> &
  Partial<Omit<ResponseNode, 'kind' | 'statusCode' | 'content'>> & {
    content?: Array<ContentNode>
    schema?: SchemaNode
    mediaType?: string | null
    keysToOmit?: Array<string> | null
  }

/** Creates a `ResponseNode`. A single legacy `schema` (with optional `mediaType`/`keysToOmit`) is normalized into one `content` entry. */
export function createResponse(props: ResponseInput): ResponseNode {
  const { schema, mediaType, keysToOmit, content, ...rest } = props
  const entries = content ?? (schema ? [createContent({ contentType: mediaType ?? 'application/json', schema, keysToOmit: keysToOmit ?? null })] : undefined)

  return { ...rest, content: entries, kind: 'Response' }
}

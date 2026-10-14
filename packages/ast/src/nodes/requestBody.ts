import { type BaseNode, nodeFactory } from './base.ts'
import type { ContentNode } from './content.ts'

/** An operation request body. Body schemas live only inside `content`, one entry per content type, mirroring {@link ResponseNode}. */
export type RequestBodyNode = BaseNode & {
  kind: 'RequestBody'
  description?: string
  /** `requestBody.required: true` in the spec. When `false` or absent, the generated `data` parameter should be optional. */
  required?: boolean
  /**
   * One entry per content type declared in the spec, or exactly one entry when the adapter
   * `contentType` option is set.
   */
  content?: Array<ContentNode>
}

export const createRequestBody = nodeFactory<RequestBodyNode>('RequestBody')

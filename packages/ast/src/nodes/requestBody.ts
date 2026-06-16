import { defineNode } from '../defineNode.ts'
import type { BaseNode } from './base.ts'
import type { ContentNode } from './content.ts'

/**
 * AST node representing an operation request body.
 *
 * Body schemas live exclusively inside the `content` array (one entry per content type),
 * mirroring {@link ResponseNode}.
 *
 * @example
 * ```ts
 * const requestBody: RequestBodyNode = {
 *   kind: 'RequestBody',
 *   required: true,
 *   content: [{ kind: 'Content', contentType: 'application/json', schema: createSchema({ type: 'string' }) }],
 * }
 * ```
 */
export type RequestBodyNode = BaseNode & {
  kind: 'RequestBody'
  /**
   * Request body description carried over from the spec.
   */
  description?: string
  /**
   * Whether the request body is required (`requestBody.required: true` in the spec).
   * When `false` or absent, the generated `data` parameter should be optional.
   */
  required?: boolean
  /**
   * Content type entries for this request body.
   *
   * When the adapter `contentType` option is set, this array contains exactly one entry for
   * that content type. Otherwise it contains one entry per content type declared in the spec,
   * so plugins can generate code for every variant (for example, separate hooks for
   * `application/json` and `multipart/form-data`).
   */
  content?: Array<ContentNode>
}

/**
 * Definition for the {@link RequestBodyNode}. Content entries are built upfront with
 * {@link createContent}, mirroring how `parameters` and `responses` take prebuilt nodes.
 */
export const requestBodyDef = defineNode<RequestBodyNode>({
  kind: 'RequestBody',
  children: ['content'],
})

/**
 * Creates a `RequestBodyNode`.
 */
export const createRequestBody = requestBodyDef.create

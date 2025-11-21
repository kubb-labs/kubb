import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import fetch from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import type { AddFiles405, AddFilesMutationRequest, AddFilesMutationResponse } from '../../models/ts/petController/AddFiles.ts'

/**
 * @description Place a new file in the store
 * @summary Place an file for a pet
 * {@link /pet/files}
 */
export async function addFilesHandler({ data }: { data: AddFilesMutationRequest }): Promise<Promise<CallToolResult>> {
  const requestData = data
  const formData = new FormData()
  if (requestData) {
    Object.entries(requestData).forEach(([key, value]) => {
      if (value === undefined || value === null) return

      if (Array.isArray(value)) {
        if (value.length && value[0] instanceof Blob) {
          value.forEach((v) => {
            formData.append(key, v as Blob)
          })
        } else {
          formData.append(key, JSON.stringify(value))
        }
      } else if (value instanceof Blob) {
        formData.append(key, value)
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        formData.append(key, String(value))
      } else if (typeof value === 'string') {
        formData.append(key, value)
      } else if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value))
      }
    })
  }
  const res = await fetch<AddFilesMutationResponse, ResponseErrorConfig<AddFiles405>, AddFilesMutationRequest>({
    method: 'POST',
    url: '/pet/files',
    baseURL: 'https://petstore.swagger.io/v2',
    data: formData as FormData,
  })
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res.data),
      },
    ],
  }
}

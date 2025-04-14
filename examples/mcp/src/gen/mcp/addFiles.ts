import client from '../../client.js'
import type { ResponseErrorConfig } from '../../client.js'
import type { AddFilesMutationRequest, AddFilesMutationResponse, AddFiles405 } from '../models/ts/AddFiles.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * @description Place a new file in the store
 * @summary Place an file for a pet
 * {@link /pet/files}
 */
export async function addFilesHandler({ data }: { data: AddFilesMutationRequest }): Promise<Promise<CallToolResult>> {
  const formData = new FormData()
  if (data) {
    Object.keys(data).forEach((key) => {
      const value = data[key as keyof typeof data]
      if (typeof key === 'string' && (typeof value === 'string' || (value as Blob) instanceof Blob)) {
        formData.append(key, value as unknown as string)
      }
    })
  }
  const res = await client<AddFilesMutationResponse, ResponseErrorConfig<AddFiles405>, AddFilesMutationRequest>({
    method: 'POST',
    url: '/pet/files',
    baseURL: 'https://petstore.swagger.io/v2',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
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

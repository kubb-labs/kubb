import fetch from '@kubb/plugin-client/clients/axios'
import type { AddFilesMutationRequest, AddFilesMutationResponse, AddFiles405 } from '../../models/ts/petController/AddFiles.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * @description Place a new file in the store
 * @summary Place an file for a pet
 * {@link /pet/files}
 */
export async function addFilesHandler({ data }: { data: AddFilesMutationRequest }): Promise<Promise<CallToolResult>> {
  const requestData = data
  const formData = new FormData()
  if (requestData) {
    Object.keys(requestData).forEach((key) => {
      const value = requestData[key as keyof typeof requestData]
      if (typeof value === 'string' || (value as unknown) instanceof Blob) {
        formData.append(key, value as unknown as string | Blob)
      }
    })
  }
  const res = await fetch<AddFilesMutationResponse, ResponseErrorConfig<AddFiles405>, AddFilesMutationRequest>({
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

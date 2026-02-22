import type { ResponseErrorConfig } from '../../client.js'
import fetch from '../../client.js'
import { buildFormData } from '../.kubb/config.js'
import type { AddFiles405, AddFilesMutationRequest, AddFilesMutationResponse } from '../models/ts/AddFiles.js'

/**
 * @description Place a new file in the store
 * @summary Place an file for a pet
 * {@link /pet/files}
 */
export async function addFilesHandler({ data }: { data: AddFilesMutationRequest }) {
  const requestData = data
  const formData = buildFormData(requestData)
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

import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import fetch from '../../../../axios-client.ts'
import type { AddFiles405, AddFilesMutationRequest, AddFilesMutationResponse } from '../../../models/ts/petController/AddFiles.ts'

export function getAddFilesUrl() {
  const res = { method: 'POST', url: 'https://petstore3.swagger.io/api/v3/pet/files' as const }
  return res
}

/**
 * @description Place a new file in the store
 * @summary Place an file for a pet
 * {@link /pet/files}
 */
export async function addFiles(
  { data }: { data: AddFilesMutationRequest },
  config: Partial<RequestConfig<AddFilesMutationRequest>> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

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
  const res = await request<AddFilesMutationResponse, ResponseErrorConfig<AddFiles405>, AddFilesMutationRequest>({
    method: 'POST',
    url: getAddFilesUrl().url.toString(),
    data: formData as FormData,
    ...requestConfig,
  })
  return res
}

import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { AddFilesRequestData, AddFilesResponseData, AddFilesStatus405 } from '../../../models/ts/petController/AddFiles.ts'
import { buildFormData } from '../../../.kubb/config.ts'

export function getAddFilesUrl() {
  const res = { method: 'POST', url: 'https://petstore3.swagger.io/api/v3/pet/files' as const }
  return res
}

/**
 * @description Place a new file in the store
 * @summary Place an file for a pet
 * {@link /pet/files}
 */
export async function addFiles({ data }: { data: AddFilesRequestData }, config: Partial<RequestConfig<AddFilesRequestData>> & { client?: typeof fetch } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = data
  const formData = buildFormData(requestData)
  const res = await request<AddFilesResponseData, ResponseErrorConfig<AddFilesStatus405>, AddFilesRequestData>({
    method: 'POST',
    url: getAddFilesUrl().url.toString(),
    data: formData as FormData,
    ...requestConfig,
  })
  return res
}

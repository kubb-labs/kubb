import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { AddFilesMutationRequest, AddFilesMutationResponse, AddFiles405 } from '../../../models/ts/petController/AddFiles.ts'
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
export async function addFiles(
  { data }: { data: AddFilesMutationRequest },
  config: Partial<RequestConfig<AddFilesMutationRequest>> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = data
  const formData = buildFormData(requestData)
  const res = await request<AddFilesMutationResponse, ResponseErrorConfig<AddFiles405>, AddFilesMutationRequest>({
    method: 'POST',
    url: getAddFilesUrl().url.toString(),
    data: formData,
    ...requestConfig,
  })
  return res
}

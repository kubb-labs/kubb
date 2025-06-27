import client from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { AddFilesMutationRequest, AddFilesMutationResponse, AddFiles405 } from '../../../models/ts/petController/AddFiles.ts'

function getAddFilesUrl() {
  return `https://petstore3.swagger.io/api/v3/pet/files` as const
}

/**
 * @description Place a new file in the store
 * @summary Place an file for a pet
 * {@link /pet/files}
 */
export async function addFiles(
  { data }: { data: AddFilesMutationRequest },
  config: Partial<RequestConfig<AddFilesMutationRequest>> & { client?: typeof client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const formData = new FormData()
  if (data) {
    Object.keys(data).forEach((key) => {
      const value = data[key as keyof typeof data]
      if (typeof value === 'string' || (value as unknown) instanceof Blob) {
        formData.append(key, value as unknown as string | Blob)
      }
    })
  }
  const res = await request<AddFilesMutationResponse, ResponseErrorConfig<AddFiles405>, AddFilesMutationRequest>({
    method: 'POST',
    url: getAddFilesUrl().toString(),
    data: formData,
    ...requestConfig,
    headers: { 'Content-Type': 'multipart/form-data', ...requestConfig.headers },
  })
  return res
}

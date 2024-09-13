import client from '@kubb/plugin-client/client'
import useSWRMutation from 'swr/mutation'
import type { UploadFileMutationRequest, UploadFileMutationResponse, UploadFilePathParams, UploadFileQueryParams } from '../models/UploadFile.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { Key } from 'swr'
import type { SWRMutationConfiguration } from 'swr/mutation'

/**
 * @summary uploads an image
 * @link /pet/:petId/uploadImage
 */
async function uploadFile(
  petId: UploadFilePathParams['petId'],
  data?: UploadFileMutationRequest,
  params?: UploadFileQueryParams,
  config: Partial<RequestConfig<UploadFileMutationRequest>> = {},
) {
  const res = await client<UploadFileMutationResponse, unknown, UploadFileMutationRequest>({
    method: 'POST',
    url: `/pet/${petId}/uploadImage`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    params,
    data,
    headers: { 'Content-Type': 'application/octet-stream', ...config.headers },
    ...config,
  })
  return res.data
}

/**
 * @summary uploads an image
 * @link /pet/:petId/uploadImage
 */
export function useUploadFile(
  petId: UploadFilePathParams['petId'],
  params?: UploadFileQueryParams,
  options: {
    mutation?: SWRMutationConfiguration<UploadFileMutationResponse, unknown>
    client?: Partial<RequestConfig<UploadFileMutationRequest>>
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const swrKey = [`/pet/${petId}/uploadImage`, params] as const
  return useSWRMutation<UploadFileMutationResponse, unknown, Key>(
    shouldFetch ? swrKey : null,
    async (_url, { arg: data }) => {
      return uploadFile(petId, data, params, config)
    },
    mutationOptions,
  )
}

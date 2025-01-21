import client from '@kubb/plugin-client/clients/axios'
import useSWRMutation from 'swr/mutation'
import type { UploadFileMutationRequest, UploadFileMutationResponse, UploadFilePathParams, UploadFileQueryParams } from '../models/UploadFile.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'

export const uploadFileMutationKey = () => [{ url: '/pet/{petId}/uploadImage' }] as const

export type UploadFileMutationKey = ReturnType<typeof uploadFileMutationKey>

/**
 * @summary uploads an image
 * {@link /pet/:petId/uploadImage}
 */
export async function uploadFile(
  petId: UploadFilePathParams['petId'],
  data?: UploadFileMutationRequest,
  params?: UploadFileQueryParams,
  config: Partial<RequestConfig<UploadFileMutationRequest>> = {},
) {
  const res = await client<UploadFileMutationResponse, ResponseErrorConfig<Error>, UploadFileMutationRequest>({
    method: 'POST',
    url: `/pet/${petId}/uploadImage`,
    params,
    data,
    headers: { 'Content-Type': 'application/octet-stream', ...config.headers },
    ...config,
  })
  return res.data
}

/**
 * @summary uploads an image
 * {@link /pet/:petId/uploadImage}
 */
export function useUploadFile(
  petId: UploadFilePathParams['petId'],
  params?: UploadFileQueryParams,
  options: {
    mutation?: Parameters<typeof useSWRMutation<UploadFileMutationResponse, ResponseErrorConfig<Error>, UploadFileMutationKey, UploadFileMutationRequest>>[2]
    client?: Partial<RequestConfig<UploadFileMutationRequest>>
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = uploadFileMutationKey()

  return useSWRMutation<UploadFileMutationResponse, ResponseErrorConfig<Error>, UploadFileMutationKey | null, UploadFileMutationRequest>(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return uploadFile(petId, data, params, config)
    },
    mutationOptions,
  )
}

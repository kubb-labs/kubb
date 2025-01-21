import client from '@kubb/plugin-client/clients/axios'
import type { UploadFileMutationRequest, UploadFileMutationResponse, UploadFilePathParams, UploadFileQueryParams } from '../../models/UploadFile.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { UseMutationOptions } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'

export const uploadFileMutationKey = () => [{ url: '/pet/{petId}/uploadImage' }] as const

export type UploadFileMutationKey = ReturnType<typeof uploadFileMutationKey>

/**
 * @summary uploads an image
 * {@link /pet/:petId/uploadImage}
 */
export async function uploadFileHook(
  { petId }: { petId: UploadFilePathParams['petId'] },
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
export function useUploadFileHook(
  options: {
    mutation?: UseMutationOptions<
      UploadFileMutationResponse,
      ResponseErrorConfig<Error>,
      { petId: UploadFilePathParams['petId']; data?: UploadFileMutationRequest; params?: UploadFileQueryParams }
    >
    client?: Partial<RequestConfig<UploadFileMutationRequest>>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? uploadFileMutationKey()

  return useMutation<
    UploadFileMutationResponse,
    ResponseErrorConfig<Error>,
    { petId: UploadFilePathParams['petId']; data?: UploadFileMutationRequest; params?: UploadFileQueryParams }
  >({
    mutationFn: async ({ petId, data, params }) => {
      return uploadFileHook({ petId }, data, params, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}

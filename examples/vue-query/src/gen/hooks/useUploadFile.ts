import client from '@kubb/plugin-client/clients/axios'
import type { UploadFileMutationRequest, UploadFileMutationResponse, UploadFilePathParams, UploadFileQueryParams } from '../models/UploadFile.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { MutationObserverOptions, QueryClient } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import { useMutation } from '@tanstack/vue-query'

export const uploadFileMutationKey = () => [{ url: '/pet/{petId}/uploadImage' }] as const

export type UploadFileMutationKey = ReturnType<typeof uploadFileMutationKey>

/**
 * @summary uploads an image
 * {@link /pet/:petId/uploadImage}
 */
export async function uploadFile(
  { petId }: { petId: UploadFilePathParams['petId'] },
  data?: UploadFileMutationRequest,
  params?: UploadFileQueryParams,
  config: Partial<RequestConfig<UploadFileMutationRequest>> & { client?: typeof client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<UploadFileMutationResponse, ResponseErrorConfig<Error>, UploadFileMutationRequest>({
    method: 'POST',
    url: `/pet/${petId}/uploadImage`,
    params,
    data,
    ...requestConfig,
    headers: { 'Content-Type': 'application/octet-stream', ...requestConfig.headers },
  })
  return res.data
}

/**
 * @summary uploads an image
 * {@link /pet/:petId/uploadImage}
 */
export function useUploadFile<TContext>(
  options: {
    mutation?: MutationObserverOptions<
      UploadFileMutationResponse,
      ResponseErrorConfig<Error>,
      { petId: MaybeRef<UploadFilePathParams['petId']>; data?: MaybeRef<UploadFileMutationRequest>; params?: MaybeRef<UploadFileQueryParams> },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<UploadFileMutationRequest>> & { client?: typeof client }
  } = {},
) {
  const {
    mutation: { client: queryClient, ...mutationOptions } = {},
    client: config = {},
  } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? uploadFileMutationKey()

  return useMutation<
    UploadFileMutationResponse,
    ResponseErrorConfig<Error>,
    { petId: UploadFilePathParams['petId']; data?: UploadFileMutationRequest; params?: UploadFileQueryParams },
    TContext
  >(
    {
      mutationFn: async ({ petId, data, params }) => {
        return uploadFile({ petId }, data, params, config)
      },
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  )
}

import type { QueryClient, UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import { mutationOptions, useMutation } from '@tanstack/react-query'
import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { UploadFilePathParams, UploadFileQueryParams, UploadFileRequestData, UploadFileResponseData } from '../../../models/ts/petController/UploadFile.ts'
import { uploadFile } from '../../axios/petService/uploadFile.ts'

export const uploadFileMutationKey = () => [{ url: '/pet/:petId/uploadImage' }] as const

export type UploadFileMutationKey = ReturnType<typeof uploadFileMutationKey>

export function uploadFileMutationOptions(config: Partial<RequestConfig<UploadFileRequestData>> & { client?: typeof fetch } = {}) {
  const mutationKey = uploadFileMutationKey()
  return mutationOptions<
    ResponseConfig<UploadFileResponseData>,
    ResponseErrorConfig<Error>,
    { petId: UploadFilePathParams['petId']; data?: UploadFileRequestData; params?: UploadFileQueryParams },
    typeof mutationKey
  >({
    mutationKey,
    mutationFn: async ({ petId, data, params }) => {
      return uploadFile({ petId, data, params }, config)
    },
  })
}

/**
 * @summary uploads an image
 * {@link /pet/:petId/uploadImage}
 */
export function useUploadFile<TContext>(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<UploadFileResponseData>,
      ResponseErrorConfig<Error>,
      { petId: UploadFilePathParams['petId']; data?: UploadFileRequestData; params?: UploadFileQueryParams },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<UploadFileRequestData>> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? uploadFileMutationKey()

  const baseOptions = uploadFileMutationOptions(config) as UseMutationOptions<
    ResponseConfig<UploadFileResponseData>,
    ResponseErrorConfig<Error>,
    { petId: UploadFilePathParams['petId']; data?: UploadFileRequestData; params?: UploadFileQueryParams },
    TContext
  >

  return useMutation<
    ResponseConfig<UploadFileResponseData>,
    ResponseErrorConfig<Error>,
    { petId: UploadFilePathParams['petId']; data?: UploadFileRequestData; params?: UploadFileQueryParams },
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    ResponseConfig<UploadFileResponseData>,
    ResponseErrorConfig<Error>,
    { petId: UploadFilePathParams['petId']; data?: UploadFileRequestData; params?: UploadFileQueryParams },
    TContext
  >
}

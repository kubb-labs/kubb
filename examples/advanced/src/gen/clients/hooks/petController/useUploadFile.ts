import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type {
  UploadFileRequestData9,
  UploadFileResponseData9,
  UploadFilePathParams9,
  UploadFileQueryParams9,
} from '../../../models/ts/petController/UploadFile.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { uploadFile } from '../../axios/petService/uploadFile.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const uploadFileMutationKey = () => [{ url: '/pet/:petId/uploadImage' }] as const

export type UploadFileMutationKey = ReturnType<typeof uploadFileMutationKey>

export function uploadFileMutationOptions(config: Partial<RequestConfig<UploadFileRequestData9>> & { client?: typeof fetch } = {}) {
  const mutationKey = uploadFileMutationKey()
  return mutationOptions<
    ResponseConfig<UploadFileResponseData9>,
    ResponseErrorConfig<Error>,
    { petId: UploadFilePathParams9['petId']; data?: UploadFileRequestData9; params?: UploadFileQueryParams9 },
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
      ResponseConfig<UploadFileResponseData9>,
      ResponseErrorConfig<Error>,
      { petId: UploadFilePathParams9['petId']; data?: UploadFileRequestData9; params?: UploadFileQueryParams9 },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<UploadFileRequestData9>> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? uploadFileMutationKey()

  const baseOptions = uploadFileMutationOptions(config) as UseMutationOptions<
    ResponseConfig<UploadFileResponseData9>,
    ResponseErrorConfig<Error>,
    { petId: UploadFilePathParams9['petId']; data?: UploadFileRequestData9; params?: UploadFileQueryParams9 },
    TContext
  >

  return useMutation<
    ResponseConfig<UploadFileResponseData9>,
    ResponseErrorConfig<Error>,
    { petId: UploadFilePathParams9['petId']; data?: UploadFileRequestData9; params?: UploadFileQueryParams9 },
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    ResponseConfig<UploadFileResponseData9>,
    ResponseErrorConfig<Error>,
    { petId: UploadFilePathParams9['petId']; data?: UploadFileRequestData9; params?: UploadFileQueryParams9 },
    TContext
  >
}

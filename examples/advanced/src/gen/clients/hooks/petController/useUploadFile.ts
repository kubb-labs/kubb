import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  UploadFileMutationRequest,
  UploadFileMutationResponse,
  UploadFilePathParams,
  UploadFileQueryParams,
} from '../../../models/ts/petController/UploadFile.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { uploadFile } from '../../axios/petService/uploadFile.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const uploadFileMutationKey = () => [{ url: '/pet/:petId/uploadImage' }] as const

export type UploadFileMutationKey = ReturnType<typeof uploadFileMutationKey>

export function uploadFileMutationOptions(config: Partial<RequestConfig<UploadFileMutationRequest>> & { client?: typeof fetch } = {}) {
  const mutationKey = uploadFileMutationKey()
  return mutationOptions<
    ResponseConfig<UploadFileMutationResponse>,
    ResponseErrorConfig<Error>,
    { petId: UploadFilePathParams['petId']; data?: UploadFileMutationRequest; params?: UploadFileQueryParams },
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
      ResponseConfig<UploadFileMutationResponse>,
      ResponseErrorConfig<Error>,
      { petId: UploadFilePathParams['petId']; data?: UploadFileMutationRequest; params?: UploadFileQueryParams },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<UploadFileMutationRequest>> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? uploadFileMutationKey()

  const baseOptions = uploadFileMutationOptions(config) as UseMutationOptions<
    ResponseConfig<UploadFileMutationResponse>,
    ResponseErrorConfig<Error>,
    { petId: UploadFilePathParams['petId']; data?: UploadFileMutationRequest; params?: UploadFileQueryParams },
    TContext
  >

  return useMutation<
    ResponseConfig<UploadFileMutationResponse>,
    ResponseErrorConfig<Error>,
    { petId: UploadFilePathParams['petId']; data?: UploadFileMutationRequest; params?: UploadFileQueryParams },
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    ResponseConfig<UploadFileMutationResponse>,
    ResponseErrorConfig<Error>,
    { petId: UploadFilePathParams['petId']; data?: UploadFileMutationRequest; params?: UploadFileQueryParams },
    TContext
  >
}

import useSWRMutation from 'swr/mutation'
import client from '@kubb/swagger-client/client'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { UploadFileMutationRequest, UploadFileMutationResponse, UploadFilePathParams, UploadFileQueryParams } from '../models/UploadFile'

/**
 * @summary uploads an image
 * @link /pet/:petId/uploadImage */
export function useUploadFile<TData = UploadFileMutationResponse, TError = unknown, TVariables = UploadFileMutationRequest>(
  petId: UploadFilePathParams['petId'],
  params?: UploadFileQueryParams,
  options?: {
    mutation?: SWRMutationConfiguration<ResponseConfig<TData>, TError>
    client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
    shouldFetch?: boolean
  },
): SWRMutationResponse<ResponseConfig<TData>, TError> {
  const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = `/pet/${petId}/uploadImage` as const
  return useSWRMutation<ResponseConfig<TData>, TError, [typeof url, typeof params] | null>(
    shouldFetch ? [url, params] : null,
    (_url, { arg: data }) => {
      return client<TData, TError, TVariables>({
        method: 'post',
        url,
        params,
        data,
        ...clientOptions,
      })
    },
    mutationOptions,
  )
}

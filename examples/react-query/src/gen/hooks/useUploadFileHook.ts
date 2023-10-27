import { useMutation } from '@tanstack/react-query'
import client from '@kubb/swagger-client/client'
import type { KubbQueryFactory } from './types'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { UploadFileMutationResponse, UploadFilePathParams, UploadFileQueryParams } from '../models/UploadFile'

type UploadFile = KubbQueryFactory<UploadFileMutationResponse, never, never, UploadFilePathParams, UploadFileQueryParams, UploadFileMutationResponse, {
  dataReturnType: 'data'
  type: 'mutation'
}> /**
 * @summary uploads an image
 * @link /pet/:petId/uploadImage
 */

export function useUploadFileHook<TData = UploadFile['response'], TError = UploadFile['error'], TVariables = UploadFile['request']>(
  petId: UploadFilePathParams['petId'],
  params?: UploadFile['queryParams'],
  options: {
    mutation?: UseMutationOptions<ResponseConfig<TData>, TError, TVariables>
    client?: UploadFile['client']['paramaters']
  } = {},
): UseMutationResult<ResponseConfig<TData>, TError, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<ResponseConfig<TData>, TError, TVariables>({
    mutationFn: (data) => {
      return client<TData, TError, TVariables>({
        method: 'post',
        url: `/pet/${petId}/uploadImage`,
        data,
        params,
        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}

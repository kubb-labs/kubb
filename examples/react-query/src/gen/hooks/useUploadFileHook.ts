import { useMutation } from '@tanstack/react-query'
import client from '@kubb/swagger-client/client'
import type { KubbQueryFactory } from './types'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import type { UploadFileMutationRequest, UploadFileMutationResponse, UploadFilePathParams, UploadFileQueryParams } from '../models/UploadFile'

type UploadFile = KubbQueryFactory<
  UploadFileMutationResponse,
  never,
  UploadFileMutationRequest,
  UploadFilePathParams,
  UploadFileQueryParams,
  never,
  UploadFileMutationResponse,
  {
    dataReturnType: 'full'
    type: 'mutation'
  }
> /**
 * @summary uploads an image
 * @link /pet/:petId/uploadImage
 */

export function useUploadFileHook<TData = UploadFile['response'], TError = UploadFile['error']>(
  petId: UploadFilePathParams['petId'],
  params?: UploadFile['queryParams'],
  options: {
    mutation?: UseMutationOptions<TData, TError, UploadFile['request']>
    client?: UploadFile['client']['paramaters']
  } = {},
): UseMutationResult<TData, TError, UploadFile['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useMutation<TData, TError, UploadFile['request']>({
    mutationFn: (data) => {
      return client<UploadFile['data'], TError, UploadFile['request']>({
        method: 'post',
        url: `/pet/${petId}/uploadImage`,
        data,
        params,
        ...clientOptions,
      }).then(res => res as TData)
    },
    ...mutationOptions,
  })
}

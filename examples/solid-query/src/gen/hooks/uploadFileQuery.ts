import { createMutation } from '@tanstack/solid-query'
import client from '@kubb/swagger-client/client'
import type { KubbQueryFactory } from './types'
import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/solid-query'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { UploadFileMutationResponse, UploadFilePathParams, UploadFileQueryParams } from '../models/UploadFile'

type UploadFile = KubbQueryFactory<
  UploadFileMutationResponse,
  never,
  never,
  UploadFilePathParams,
  UploadFileQueryParams,
  UploadFileMutationResponse,
  {
    dataReturnType: 'data'
    type: 'mutation'
  }
> /**
 * @summary uploads an image
 * @link /pet/:petId/uploadImage
 */
export function uploadFileQuery<TData = UploadFile['response'], TError = UploadFile['error'], TVariables = UploadFile['request']>(
  petId: UploadFilePathParams['petId'],
  params?: UploadFile['queryParams'],
  options: {
    mutation?: CreateMutationOptions<ResponseConfig<TData>, TError, TVariables>
    client?: UploadFile['client']['paramaters']
  } = {},
): CreateMutationResult<ResponseConfig<TData>, TError, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return createMutation<ResponseConfig<TData>, TError, TVariables>({
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

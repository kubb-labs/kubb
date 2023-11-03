import { createMutation } from '@tanstack/svelte-query'
import client from '@kubb/swagger-client/client'
import type { KubbQueryFactory } from './types'
import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/svelte-query'
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

export function uploadFileQuery<TData = UploadFile['response'], TError = UploadFile['error']>(
  petId: UploadFilePathParams['petId'],
  params?: UploadFile['queryParams'],
  options: {
    mutation?: CreateMutationOptions<TData, TError, UploadFile['request']>
    client?: UploadFile['client']['paramaters']
  } = {},
): CreateMutationResult<TData, TError, UploadFile['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return createMutation<TData, TError, UploadFile['request']>({
    mutationFn: (data) => {
      return client<UploadFile['data'], TError, UploadFile['request']>({
        method: 'post',
        url: `/pet/${petId}/uploadImage`,
        data,
        params,
        ...clientOptions,
      }).then((res) => res as TData)
    },
    ...mutationOptions,
  })
}

import client from '@kubb/swagger-client/client'
import { createMutation } from '@tanstack/solid-query'
import type { UploadFileMutationRequest, UploadFileMutationResponse, UploadFilePathParams, UploadFileQueryParams } from '../models/UploadFile'
import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/solid-query'

type UploadFileClient = typeof client<UploadFileMutationResponse, never, UploadFileMutationRequest>
type UploadFile = {
  data: UploadFileMutationResponse
  error: never
  request: UploadFileMutationRequest
  pathParams: UploadFilePathParams
  queryParams: UploadFileQueryParams
  headerParams: never
  response: Awaited<ReturnType<UploadFileClient>>['data']
  unionResponse: Awaited<ReturnType<UploadFileClient>> | Awaited<ReturnType<UploadFileClient>>['data']
  client: {
    paramaters: Partial<Parameters<UploadFileClient>[0]>
    return: Awaited<ReturnType<UploadFileClient>>
  }
}
/**
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
        params,
        data,
        ...clientOptions,
      }).then((res) => res as TData)
    },
    ...mutationOptions,
  })
}

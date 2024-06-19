import client from '@kubb/swagger-client/client'
import { useMutation } from '@tanstack/react-query'
import type { UploadFileMutationRequest, UploadFileMutationResponse, UploadFilePathParams, UploadFileQueryParams } from '../models/UploadFile'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'

type UploadFileClient = typeof client<UploadFileMutationResponse, never, UploadFileMutationRequest>
type UploadFile = {
  data: UploadFileMutationResponse
  error: never
  request: UploadFileMutationRequest
  pathParams: UploadFilePathParams
  queryParams: UploadFileQueryParams
  headerParams: never
  response: UploadFileMutationResponse
  client: {
    parameters: Partial<Parameters<UploadFileClient>[0]>
    return: Awaited<ReturnType<UploadFileClient>>
  }
}
/**
 * @summary uploads an image
 * @link /pet/:petId/uploadImage
 */
export function useUploadFileHook(
  petId: UploadFilePathParams['petId'],
  params?: UploadFile['queryParams'],
  options: {
    mutation?: UseMutationOptions<UploadFile['response'], UploadFile['error'], UploadFile['request']>
    client?: UploadFile['client']['parameters']
  } = {},
): UseMutationResult<UploadFile['response'], UploadFile['error'], UploadFile['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<UploadFile['response'], UploadFile['error'], UploadFile['request']>({
    mutationFn: async (data) => {
      const res = await client<UploadFile['data'], UploadFile['error'], UploadFile['request']>({
        method: 'post',
        url: `/pet/${petId}/uploadImage`,
        params,
        data,
        headers: { 'Content-Type': 'application/octet-stream', ...clientOptions.headers },
        ...clientOptions,
      })
      return res.data
    },
    ...mutationOptions,
  })
}

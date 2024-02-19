import client from '@kubb/swagger-client/client'
import { createMutation } from '@tanstack/svelte-query'
import type { UploadFileMutationRequest, UploadFileMutationResponse, UploadFilePathParams, UploadFileQueryParams } from '../models/UploadFile'
import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/svelte-query'

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
 * @link /pet/:petId/uploadImage */

export function uploadFileQuery(
  petId: UploadFilePathParams['petId'],
  params?: UploadFile['queryParams'],
  options: {
    mutation?: CreateMutationOptions<UploadFile['response'], UploadFile['error'], UploadFile['request']>
    client?: UploadFile['client']['parameters']
  } = {},
): CreateMutationResult<UploadFile['response'], UploadFile['error'], UploadFile['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return createMutation<UploadFile['response'], UploadFile['error'], UploadFile['request']>({
    mutationFn: async (data) => {
      const res = await client<UploadFile['data'], UploadFile['error'], UploadFile['request']>({
        method: 'post',
        url: `/pet/${petId}/uploadImage`,
        params,
        data,
        ...clientOptions,
      })

      return res.data
    },
    ...mutationOptions,
  })
}

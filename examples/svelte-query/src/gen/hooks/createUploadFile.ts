import client from '@kubb/plugin-client/client'
import type { UploadFileMutationRequest, UploadFileMutationResponse, UploadFilePathParams, UploadFileQueryParams } from '../models/UploadFile.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { CreateMutationOptions } from '@tanstack/svelte-query'
import { createMutation } from '@tanstack/svelte-query'

/**
 * @summary uploads an image
 * @link /pet/:petId/uploadImage
 */
async function uploadFile(
  petId: UploadFilePathParams['petId'],
  data?: UploadFileMutationRequest,
  params?: UploadFileQueryParams,
  config: Partial<RequestConfig<UploadFileMutationRequest>> = {},
) {
  const res = await client<UploadFileMutationResponse, Error, UploadFileMutationRequest>({
    method: 'POST',
    url: `/pet/${petId}/uploadImage`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    params,
    data,
    headers: { 'Content-Type': 'application/octet-stream', ...config.headers },
    ...config,
  })
  return res.data
}

/**
 * @summary uploads an image
 * @link /pet/:petId/uploadImage
 */
export function createUploadFile(
  options: {
    mutation?: CreateMutationOptions<
      UploadFileMutationResponse,
      Error,
      {
        petId: UploadFilePathParams['petId']
        data?: UploadFileMutationRequest
        params?: UploadFileQueryParams
      }
    >
    client?: Partial<RequestConfig<UploadFileMutationRequest>>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  return createMutation({
    mutationFn: async ({
      petId,
      data,
      params,
    }: {
      petId: UploadFilePathParams['petId']
      data?: UploadFileMutationRequest
      params?: UploadFileQueryParams
    }) => {
      return uploadFile(petId, data, params, config)
    },
    ...mutationOptions,
  })
}

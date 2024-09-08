import client from '@kubb/plugin-client/client'
import type { UploadFileMutationRequest, UploadFileMutationResponse, UploadFilePathParams, UploadFileQueryParams } from '../models/UploadFile.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { UseMutationOptions } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'

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
  const res = await client<UploadFileMutationResponse, unknown, UploadFileMutationRequest>({
    method: 'post',
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
export function useUploadFileHook(
  petId: UploadFilePathParams['petId'],
  params?: UploadFileQueryParams,
  options: {
    mutation?: UseMutationOptions<UploadFileMutationResponse, unknown, UploadFileMutationRequest>
    client?: Partial<RequestConfig<UploadFileMutationRequest>>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  return useMutation({
    mutationFn: async (data) => {
      return uploadFile(petId, data, params, config)
    },
    ...mutationOptions,
  })
}

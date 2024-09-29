import client from '../../../../tanstack-query-client.ts'
import type { RequestConfig, ResponseConfig } from '../../../../tanstack-query-client.ts'
import type {
  UploadFileMutationRequest,
  UploadFileMutationResponse,
  UploadFilePathParams,
  UploadFileQueryParams,
} from '../../../models/ts/petController/UploadFile.ts'
import type { UseMutationOptions } from '@tanstack/react-query'
import { uploadFileMutationResponseSchema } from '../../../zod/petController/uploadFileSchema.ts'
import { useMutation } from '@tanstack/react-query'

export const uploadFileMutationKey = () => [{ url: '/pet/{petId}/uploadImage' }] as const

export type UploadFileMutationKey = ReturnType<typeof uploadFileMutationKey>

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
  return { ...res, data: uploadFileMutationResponseSchema.parse(res.data) }
}

/**
 * @summary uploads an image
 * @link /pet/:petId/uploadImage
 */
export function useUploadFile(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<UploadFileMutationResponse>,
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
  const mutationKey = mutationOptions?.mutationKey ?? uploadFileMutationKey()
  return useMutation<
    ResponseConfig<UploadFileMutationResponse>,
    Error,
    {
      petId: UploadFilePathParams['petId']
      data?: UploadFileMutationRequest
      params?: UploadFileQueryParams
    }
  >({
    mutationFn: async ({ petId, data, params }) => {
      return uploadFile(petId, data, params, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}

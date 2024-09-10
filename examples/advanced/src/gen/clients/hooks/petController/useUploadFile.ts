import client from '../../../../tanstack-query-client.ts'
import type { RequestConfig } from '../../../../tanstack-query-client.ts'
import type {
  UploadFileMutationRequest,
  UploadFileMutationResponse,
  UploadFilePathParams,
  UploadFileQueryParams,
} from '../../../models/ts/petController/UploadFile.ts'
import type { UseMutationOptions } from '@tanstack/react-query'
import { uploadFileMutationResponseSchema } from '../../../zod/petController/uploadFileSchema.ts'
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
  return uploadFileMutationResponseSchema.parse(res.data)
}

/**
 * @summary uploads an image
 * @link /pet/:petId/uploadImage
 */
export function useUploadFile(
  options: {
    mutation?: UseMutationOptions<
      UploadFileMutationResponse,
      unknown,
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
  return useMutation({
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

import client from '../../../../swr-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig } from '../../../../swr-client.ts'
import type {
  UploadFileMutationRequest,
  UploadFileMutationResponse,
  UploadFilePathParams,
  UploadFileQueryParams,
} from '../../../models/ts/petController/UploadFile.ts'
import { uploadFileMutationResponseSchema } from '../../../zod/petController/uploadFileSchema.ts'

export const uploadFileMutationKeySWR = () => [{ url: '/pet/{petId}/uploadImage' }] as const

export type UploadFileMutationKeySWR = ReturnType<typeof uploadFileMutationKeySWR>

/**
 * @summary uploads an image
 * @link /pet/:petId/uploadImage
 */
async function uploadFile(
  {
    petId,
    data,
    params,
  }: {
    petId: UploadFilePathParams['petId']
    data?: UploadFileMutationRequest
    params?: UploadFileQueryParams
  },
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
  return uploadFileMutationResponseSchema.parse(res.data)
}

/**
 * @summary uploads an image
 * @link /pet/:petId/uploadImage
 */
export function useUploadFileSWR(
  {
    petId,
  }: {
    petId: UploadFilePathParams['petId']
  },
  params?: UploadFileQueryParams,
  options: {
    mutation?: Parameters<typeof useSWRMutation<UploadFileMutationResponse, Error, UploadFileMutationKeySWR, UploadFileMutationRequest>>[2]
    client?: Partial<RequestConfig<UploadFileMutationRequest>>
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = uploadFileMutationKeySWR()
  return useSWRMutation<UploadFileMutationResponse, Error, UploadFileMutationKeySWR | null, UploadFileMutationRequest>(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return uploadFile({ petId, data, params }, config)
    },
    mutationOptions,
  )
}

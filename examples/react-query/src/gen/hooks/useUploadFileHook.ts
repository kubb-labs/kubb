import client from '@kubb/plugin-client/client'
import type { UploadFileMutationRequest, UploadFileMutationResponse, UploadFilePathParams, UploadFileQueryParams } from '../models/UploadFile.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { UseMutationOptions, UseMutationResult, MutationKey } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'

export const uploadFileMutationKey = () => [{ url: '/pet/{petId}/uploadImage' }] as const

export type UploadFileMutationKey = ReturnType<typeof uploadFileMutationKey>

/**
 * @summary uploads an image
 * @link /pet/:petId/uploadImage
 */
async function uploadFile(
  {
    petId,
  }: {
    petId: UploadFilePathParams['petId']
  },
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
export function useUploadFileHook(
  options: {
    mutation?: UseMutationOptions<
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
  const mutationKey = mutationOptions?.mutationKey ?? uploadFileMutationKey()
  const mutation = useMutation({
    mutationFn: async ({
      petId,
      data,
      params,
    }: {
      petId: UploadFilePathParams['petId']
      data?: UploadFileMutationRequest
      params?: UploadFileQueryParams
    }) => {
      return uploadFile({ petId }, data, params, config)
    },
    ...mutationOptions,
  }) as UseMutationResult<UploadFileMutationResponse, Error> & {
    mutationKey: MutationKey
  }
  mutation.mutationKey = mutationKey as MutationKey
  return mutation
}

import type { SWRMutationConfiguration } from 'swr/mutation'
import useSWRMutation from 'swr/mutation'
import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { UploadFilePathParams, UploadFileQueryParams, UploadFileRequestData, UploadFileResponseData } from '../../../models/ts/petController/UploadFile.ts'
import { uploadFile } from '../../axios/petService/uploadFile.ts'

export const uploadFileMutationKeySWR = () => [{ url: '/pet/:petId/uploadImage' }] as const

export type UploadFileMutationKeySWR = ReturnType<typeof uploadFileMutationKeySWR>

/**
 * @summary uploads an image
 * {@link /pet/:petId/uploadImage}
 */
export function useUploadFileSWR(
  { petId }: { petId: UploadFilePathParams['petId'] },
  params?: UploadFileQueryParams,
  options: {
    mutation?: SWRMutationConfiguration<
      ResponseConfig<UploadFileResponseData>,
      ResponseErrorConfig<Error>,
      UploadFileMutationKeySWR | null,
      UploadFileRequestData
    > & { throwOnError?: boolean }
    client?: Partial<RequestConfig<UploadFileRequestData>> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = uploadFileMutationKeySWR()

  return useSWRMutation<ResponseConfig<UploadFileResponseData>, ResponseErrorConfig<Error>, UploadFileMutationKeySWR | null, UploadFileRequestData>(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return uploadFile({ petId, data, params }, config)
    },
    mutationOptions,
  )
}

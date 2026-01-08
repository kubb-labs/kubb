import type fetch from '../../../../axios-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type {
  UploadFileRequestData3,
  UploadFileResponseData3,
  UploadFilePathParams3,
  UploadFileQueryParams3,
} from '../../../models/ts/petController/UploadFile.ts'
import type { SWRMutationConfiguration } from 'swr/mutation'
import { uploadFile } from '../../axios/petService/uploadFile.ts'

export const uploadFileMutationKeySWR = () => [{ url: '/pet/:petId/uploadImage' }] as const

export type UploadFileMutationKeySWR = ReturnType<typeof uploadFileMutationKeySWR>

/**
 * @summary uploads an image
 * {@link /pet/:petId/uploadImage}
 */
export function useUploadFileSWR(
  { petId }: { petId: UploadFilePathParams3['petId'] },
  params?: UploadFileQueryParams3,
  options: {
    mutation?: SWRMutationConfiguration<
      ResponseConfig<UploadFileResponseData3>,
      ResponseErrorConfig<Error>,
      UploadFileMutationKeySWR | null,
      UploadFileRequestData3
    > & { throwOnError?: boolean }
    client?: Partial<RequestConfig<UploadFileRequestData3>> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = uploadFileMutationKeySWR()

  return useSWRMutation<ResponseConfig<UploadFileResponseData3>, ResponseErrorConfig<Error>, UploadFileMutationKeySWR | null, UploadFileRequestData3>(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return uploadFile({ petId, data, params }, config)
    },
    mutationOptions,
  )
}

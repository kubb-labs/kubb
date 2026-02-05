import type fetch from '../../../../axios-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type {
  UploadFileMutationRequest,
  UploadFileMutationResponse,
  UploadFilePathParams,
  UploadFileQueryParams,
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
  { petId }: { petId: UploadFilePathParams['petId'] },
  params?: UploadFileQueryParams,
  options: {
    mutation?: SWRMutationConfiguration<
      ResponseConfig<UploadFileMutationResponse>,
      ResponseErrorConfig<Error>,
      UploadFileMutationKeySWR | null,
      UploadFileMutationRequest
    > & { throwOnError?: boolean }
    client?: Partial<RequestConfig<UploadFileMutationRequest>> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = uploadFileMutationKeySWR()

  return useSWRMutation<ResponseConfig<UploadFileMutationResponse>, ResponseErrorConfig<Error>, UploadFileMutationKeySWR | null, UploadFileMutationRequest>(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return uploadFile({ petId, data, params }, config)
    },
    mutationOptions,
  )
}

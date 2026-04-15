import useSWRMutation from 'swr/mutation'
import type { Client, RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type {
  UploadFilePathParams,
  UploadFileQueryParams,
  UploadFileMutationRequest,
  UploadFileMutationResponse,
} from '../../../models/ts/petController/UploadFile.ts'
import type { SWRMutationConfiguration } from 'swr/mutation'
import { uploadFile } from '../../axios/petService/uploadFile.ts'

export const uploadFileSWRMutationKey = () => [{ url: '/pet/:petId/uploadImage' }] as const

export type UploadFileSWRMutationKey = ReturnType<typeof uploadFileSWRMutationKey>

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
      UploadFileSWRMutationKey | null,
      UploadFileMutationRequest
    > & { throwOnError?: boolean }
    client?: Partial<RequestConfig<UploadFileMutationRequest>> & { client?: Client }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = uploadFileSWRMutationKey()

  return useSWRMutation<ResponseConfig<UploadFileMutationResponse>, ResponseErrorConfig<Error>, UploadFileSWRMutationKey | null, UploadFileMutationRequest>(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return uploadFile({ petId, data, params }, config)
    },
    mutationOptions,
  )
}

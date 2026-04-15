import useSWRMutation from 'swr/mutation'
import type { Client, RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { AddFilesMutationRequest, AddFilesMutationResponse, AddFiles405 } from '../../../models/ts/petController/AddFiles.ts'
import type { SWRMutationConfiguration } from 'swr/mutation'
import { addFiles } from '../../axios/petService/addFiles.ts'

export const addFilesSWRMutationKey = () => [{ url: '/pet/files' }] as const

export type AddFilesSWRMutationKey = ReturnType<typeof addFilesSWRMutationKey>

/**
 * @description Place a new file in the store
 * @summary Place an file for a pet
 * {@link /pet/files}
 */
export function useAddFilesSWR(
  options: {
    mutation?: SWRMutationConfiguration<
      ResponseConfig<AddFilesMutationResponse>,
      ResponseErrorConfig<AddFiles405>,
      AddFilesSWRMutationKey | null,
      AddFilesMutationRequest
    > & { throwOnError?: boolean }
    client?: Partial<RequestConfig<AddFilesMutationRequest>> & { client?: Client }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = addFilesSWRMutationKey()

  return useSWRMutation<ResponseConfig<AddFilesMutationResponse>, ResponseErrorConfig<AddFiles405>, AddFilesSWRMutationKey | null, AddFilesMutationRequest>(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return addFiles({ data }, config)
    },
    mutationOptions,
  )
}

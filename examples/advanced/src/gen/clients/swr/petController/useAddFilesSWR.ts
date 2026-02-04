import type fetch from '../../../../axios-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { AddFilesMutationRequest, AddFilesMutationResponse, AddFiles405 } from '../../../models/ts/petController/AddFiles.ts'
import type { SWRMutationConfiguration } from 'swr/mutation'
import { addFiles } from '../../axios/petService/addFiles.ts'

export const addFilesMutationKeySWR = () => [{ url: '/pet/files' }] as const

export type AddFilesMutationKeySWR = ReturnType<typeof addFilesMutationKeySWR>

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
      AddFilesMutationKeySWR | null,
      AddFilesMutationRequest
    > & { throwOnError?: boolean }
    client?: Partial<RequestConfig<AddFilesMutationRequest>> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = addFilesMutationKeySWR()

  return useSWRMutation<ResponseConfig<AddFilesMutationResponse>, ResponseErrorConfig<AddFiles405>, AddFilesMutationKeySWR | null, AddFilesMutationRequest>(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return addFiles({ data }, config)
    },
    mutationOptions,
  )
}

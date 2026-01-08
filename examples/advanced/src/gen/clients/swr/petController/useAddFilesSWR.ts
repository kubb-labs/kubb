import type fetch from '../../../../axios-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { AddFilesRequestData3, AddFilesResponseData3, AddFilesStatus4053 } from '../../../models/ts/petController/AddFiles.ts'
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
      ResponseConfig<AddFilesResponseData3>,
      ResponseErrorConfig<AddFilesStatus4053>,
      AddFilesMutationKeySWR | null,
      AddFilesRequestData3
    > & { throwOnError?: boolean }
    client?: Partial<RequestConfig<AddFilesRequestData3>> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = addFilesMutationKeySWR()

  return useSWRMutation<ResponseConfig<AddFilesResponseData3>, ResponseErrorConfig<AddFilesStatus4053>, AddFilesMutationKeySWR | null, AddFilesRequestData3>(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return addFiles({ data }, config)
    },
    mutationOptions,
  )
}

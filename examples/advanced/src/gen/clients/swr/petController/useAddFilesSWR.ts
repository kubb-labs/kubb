import type { SWRMutationConfiguration } from 'swr/mutation'
import useSWRMutation from 'swr/mutation'
import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { AddFilesRequestData, AddFilesResponseData, AddFilesStatus405 } from '../../../models/ts/petController/AddFiles.ts'
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
      ResponseConfig<AddFilesResponseData>,
      ResponseErrorConfig<AddFilesStatus405>,
      AddFilesMutationKeySWR | null,
      AddFilesRequestData
    > & { throwOnError?: boolean }
    client?: Partial<RequestConfig<AddFilesRequestData>> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = addFilesMutationKeySWR()

  return useSWRMutation<ResponseConfig<AddFilesResponseData>, ResponseErrorConfig<AddFilesStatus405>, AddFilesMutationKeySWR | null, AddFilesRequestData>(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return addFiles({ data }, config)
    },
    mutationOptions,
  )
}

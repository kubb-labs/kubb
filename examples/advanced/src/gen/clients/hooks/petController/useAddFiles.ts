import type { QueryClient, UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import { mutationOptions, useMutation } from '@tanstack/react-query'
import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { AddFilesRequestData, AddFilesResponseData, AddFilesStatus405 } from '../../../models/ts/petController/AddFiles.ts'
import { addFiles } from '../../axios/petService/addFiles.ts'

export const addFilesMutationKey = () => [{ url: '/pet/files' }] as const

export type AddFilesMutationKey = ReturnType<typeof addFilesMutationKey>

export function addFilesMutationOptions(config: Partial<RequestConfig<AddFilesRequestData>> & { client?: typeof fetch } = {}) {
  const mutationKey = addFilesMutationKey()
  return mutationOptions<ResponseConfig<AddFilesResponseData>, ResponseErrorConfig<AddFilesStatus405>, { data: AddFilesRequestData }, typeof mutationKey>({
    mutationKey,
    mutationFn: async ({ data }) => {
      return addFiles({ data }, config)
    },
  })
}

/**
 * @description Place a new file in the store
 * @summary Place an file for a pet
 * {@link /pet/files}
 */
export function useAddFiles<TContext>(
  options: {
    mutation?: UseMutationOptions<ResponseConfig<AddFilesResponseData>, ResponseErrorConfig<AddFilesStatus405>, { data: AddFilesRequestData }, TContext> & {
      client?: QueryClient
    }
    client?: Partial<RequestConfig<AddFilesRequestData>> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? addFilesMutationKey()

  const baseOptions = addFilesMutationOptions(config) as UseMutationOptions<
    ResponseConfig<AddFilesResponseData>,
    ResponseErrorConfig<AddFilesStatus405>,
    { data: AddFilesRequestData },
    TContext
  >

  return useMutation<ResponseConfig<AddFilesResponseData>, ResponseErrorConfig<AddFilesStatus405>, { data: AddFilesRequestData }, TContext>(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<ResponseConfig<AddFilesResponseData>, ResponseErrorConfig<AddFilesStatus405>, { data: AddFilesRequestData }, TContext>
}

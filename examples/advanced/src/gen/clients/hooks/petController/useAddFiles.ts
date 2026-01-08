import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { AddFilesRequestData9, AddFilesResponseData9, AddFilesStatus4059 } from '../../../models/ts/petController/AddFiles.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { addFiles } from '../../axios/petService/addFiles.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const addFilesMutationKey = () => [{ url: '/pet/files' }] as const

export type AddFilesMutationKey = ReturnType<typeof addFilesMutationKey>

export function addFilesMutationOptions(config: Partial<RequestConfig<AddFilesRequestData9>> & { client?: typeof fetch } = {}) {
  const mutationKey = addFilesMutationKey()
  return mutationOptions<ResponseConfig<AddFilesResponseData9>, ResponseErrorConfig<AddFilesStatus4059>, { data: AddFilesRequestData9 }, typeof mutationKey>({
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
    mutation?: UseMutationOptions<ResponseConfig<AddFilesResponseData9>, ResponseErrorConfig<AddFilesStatus4059>, { data: AddFilesRequestData9 }, TContext> & {
      client?: QueryClient
    }
    client?: Partial<RequestConfig<AddFilesRequestData9>> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? addFilesMutationKey()

  const baseOptions = addFilesMutationOptions(config) as UseMutationOptions<
    ResponseConfig<AddFilesResponseData9>,
    ResponseErrorConfig<AddFilesStatus4059>,
    { data: AddFilesRequestData9 },
    TContext
  >

  return useMutation<ResponseConfig<AddFilesResponseData9>, ResponseErrorConfig<AddFilesStatus4059>, { data: AddFilesRequestData9 }, TContext>(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<ResponseConfig<AddFilesResponseData9>, ResponseErrorConfig<AddFilesStatus4059>, { data: AddFilesRequestData9 }, TContext>
}

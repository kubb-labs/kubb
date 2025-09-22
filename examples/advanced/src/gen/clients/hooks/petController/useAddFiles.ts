import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { AddFilesMutationRequest, AddFilesMutationResponse, AddFiles405 } from '../../../models/ts/petController/AddFiles.ts'
import type { UseMutationOptions, QueryClient } from '@tanstack/react-query'
import { addFiles } from '../../axios/petService/addFiles.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const addFilesMutationKey = () => [{ url: '/pet/files' }] as const

export type AddFilesMutationKey = ReturnType<typeof addFilesMutationKey>

export function addFilesMutationOptions(config: Partial<RequestConfig<AddFilesMutationRequest>> & { client?: typeof fetch } = {}) {
  const mutationKey = addFilesMutationKey()
  return mutationOptions<ResponseConfig<AddFilesMutationResponse>, ResponseErrorConfig<AddFiles405>, { data: AddFilesMutationRequest }, typeof mutationKey>({
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
    mutation?: UseMutationOptions<ResponseConfig<AddFilesMutationResponse>, ResponseErrorConfig<AddFiles405>, { data: AddFilesMutationRequest }, TContext> & {
      client?: QueryClient
    }
    client?: Partial<RequestConfig<AddFilesMutationRequest>> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? addFilesMutationKey()

  return useMutation(
    {
      ...addFilesMutationOptions(config),
      mutationKey,
      ...mutationOptions,
    } as unknown as UseMutationOptions,
    queryClient,
  ) as UseMutationOptions<ResponseConfig<AddFilesMutationResponse>, ResponseErrorConfig<AddFiles405>, { data: AddFilesMutationRequest }, TContext>
}

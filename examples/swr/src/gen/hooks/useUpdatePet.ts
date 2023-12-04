import useSWRMutation from 'swr/mutation'
import client from '@kubb/swagger-client/client'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { UpdatePetMutationRequest, UpdatePetMutationResponse, UpdatePet400, UpdatePet404, UpdatePet405 } from '../models/UpdatePet'

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * @link /pet */
export function useUpdatePet<
  TData = UpdatePetMutationResponse,
  TError = UpdatePet400 | UpdatePet404 | UpdatePet405,
  TVariables = UpdatePetMutationRequest,
>(options?: {
  mutation?: SWRMutationConfiguration<ResponseConfig<TData>, TError>
  client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
  shouldFetch?: boolean
}): SWRMutationResponse<ResponseConfig<TData>, TError> {
  const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = `/pet` as const
  return useSWRMutation<ResponseConfig<TData>, TError, typeof url | null>(
    shouldFetch ? url : null,
    (_url, { arg: data }) => {
      return client<TData, TError, TVariables>({
        method: 'put',
        url,
        data,
        ...clientOptions,
      })
    },
    mutationOptions,
  )
}

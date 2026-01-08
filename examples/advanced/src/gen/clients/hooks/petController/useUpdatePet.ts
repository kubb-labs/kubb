import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type {
  UpdatePetRequestData9,
  UpdatePetResponseData9,
  UpdatePetStatus4009,
  UpdatePetStatus4049,
  UpdatePetStatus4059,
} from '../../../models/ts/petController/UpdatePet.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { updatePet } from '../../axios/petService/updatePet.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const updatePetMutationKey = () => [{ url: '/pet' }] as const

export type UpdatePetMutationKey = ReturnType<typeof updatePetMutationKey>

export function updatePetMutationOptions(config: Partial<RequestConfig<UpdatePetRequestData9>> & { client?: typeof fetch } = {}) {
  const mutationKey = updatePetMutationKey()
  return mutationOptions<
    ResponseConfig<UpdatePetResponseData9>,
    ResponseErrorConfig<UpdatePetStatus4009 | UpdatePetStatus4049 | UpdatePetStatus4059>,
    { data: UpdatePetRequestData9 },
    typeof mutationKey
  >({
    mutationKey,
    mutationFn: async ({ data }) => {
      return updatePet({ data }, config)
    },
  })
}

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * {@link /pet}
 */
export function useUpdatePet<TContext>(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<UpdatePetResponseData9>,
      ResponseErrorConfig<UpdatePetStatus4009 | UpdatePetStatus4049 | UpdatePetStatus4059>,
      { data: UpdatePetRequestData9 },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<UpdatePetRequestData9>> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? updatePetMutationKey()

  const baseOptions = updatePetMutationOptions(config) as UseMutationOptions<
    ResponseConfig<UpdatePetResponseData9>,
    ResponseErrorConfig<UpdatePetStatus4009 | UpdatePetStatus4049 | UpdatePetStatus4059>,
    { data: UpdatePetRequestData9 },
    TContext
  >

  return useMutation<
    ResponseConfig<UpdatePetResponseData9>,
    ResponseErrorConfig<UpdatePetStatus4009 | UpdatePetStatus4049 | UpdatePetStatus4059>,
    { data: UpdatePetRequestData9 },
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    ResponseConfig<UpdatePetResponseData9>,
    ResponseErrorConfig<UpdatePetStatus4009 | UpdatePetStatus4049 | UpdatePetStatus4059>,
    { data: UpdatePetRequestData9 },
    TContext
  >
}

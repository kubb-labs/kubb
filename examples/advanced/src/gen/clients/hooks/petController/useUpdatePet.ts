import type { QueryClient, UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import { mutationOptions, useMutation } from '@tanstack/react-query'
import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  UpdatePet400,
  UpdatePet404,
  UpdatePet405,
  UpdatePetMutationRequest,
  UpdatePetMutationResponse,
} from '../../../models/ts/petController/UpdatePet.ts'
import { updatePet } from '../../axios/petService/updatePet.ts'

export const updatePetMutationKey = () => [{ url: '/pet' }] as const

export type UpdatePetMutationKey = ReturnType<typeof updatePetMutationKey>

export function updatePetMutationOptions(config: Partial<RequestConfig<UpdatePetMutationRequest>> & { client?: typeof fetch } = {}) {
  const mutationKey = updatePetMutationKey()
  return mutationOptions<
    ResponseConfig<UpdatePetMutationResponse>,
    ResponseErrorConfig<UpdatePet400 | UpdatePet404 | UpdatePet405>,
    { data: UpdatePetMutationRequest },
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
      ResponseConfig<UpdatePetMutationResponse>,
      ResponseErrorConfig<UpdatePet400 | UpdatePet404 | UpdatePet405>,
      { data: UpdatePetMutationRequest },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<UpdatePetMutationRequest>> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? updatePetMutationKey()

  const baseOptions = updatePetMutationOptions(config) as UseMutationOptions<
    ResponseConfig<UpdatePetMutationResponse>,
    ResponseErrorConfig<UpdatePet400 | UpdatePet404 | UpdatePet405>,
    { data: UpdatePetMutationRequest },
    TContext
  >

  return useMutation<
    ResponseConfig<UpdatePetMutationResponse>,
    ResponseErrorConfig<UpdatePet400 | UpdatePet404 | UpdatePet405>,
    { data: UpdatePetMutationRequest },
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    ResponseConfig<UpdatePetMutationResponse>,
    ResponseErrorConfig<UpdatePet400 | UpdatePet404 | UpdatePet405>,
    { data: UpdatePetMutationRequest },
    TContext
  >
}

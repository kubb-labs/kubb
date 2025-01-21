import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../tanstack-query-client'
import type { AddPetMutationRequest, AddPetMutationResponse, AddPet405 } from '../../../models/ts/petController/AddPet.ts'
import type { UseMutationOptions } from '@tanstack/react-query'
import { addPet } from '../../axios/petService/addPet.ts'
import { useMutation } from '@tanstack/react-query'

export const addPetMutationKey = () => [{ url: '/pet' }] as const

export type AddPetMutationKey = ReturnType<typeof addPetMutationKey>

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * {@link /pet}
 */
export function useAddPet(
  options: {
    mutation?: UseMutationOptions<ResponseConfig<AddPetMutationResponse>, ResponseErrorConfig<AddPet405>, { data: AddPetMutationRequest }>
    client?: Partial<RequestConfig<AddPetMutationRequest>>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? addPetMutationKey()

  return useMutation<ResponseConfig<AddPetMutationResponse>, ResponseErrorConfig<AddPet405>, { data: AddPetMutationRequest }>({
    mutationFn: async ({ data }) => {
      return addPet({ data }, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}

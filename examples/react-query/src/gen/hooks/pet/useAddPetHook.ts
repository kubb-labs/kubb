import client from '@kubb/plugin-client/clients/axios'
import type { AddPetMutationRequest, AddPetMutationResponse, AddPet405 } from '../../models/AddPet.ts'
import type { RequestConfig } from '@kubb/plugin-client/clients/axios'
import type { UseMutationOptions } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'

export const addPetMutationKey = () => [{ url: '/pet' }] as const

export type AddPetMutationKey = ReturnType<typeof addPetMutationKey>

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * {@link /pet}
 */
async function addPetHook(data: AddPetMutationRequest, config: Partial<RequestConfig<AddPetMutationRequest>> = {}) {
  const res = await client<AddPetMutationResponse, AddPet405, AddPetMutationRequest>({ method: 'POST', url: '/pet', data, ...config })
  return res.data
}

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * {@link /pet}
 */
export function useAddPetHook(
  options: {
    mutation?: UseMutationOptions<
      AddPetMutationResponse,
      AddPet405,
      {
        data: AddPetMutationRequest
      }
    >
    client?: Partial<RequestConfig<AddPetMutationRequest>>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? addPetMutationKey()
  return useMutation<
    AddPetMutationResponse,
    AddPet405,
    {
      data: AddPetMutationRequest
    }
  >({
    mutationFn: async ({ data }) => {
      return addPetHook(data, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}

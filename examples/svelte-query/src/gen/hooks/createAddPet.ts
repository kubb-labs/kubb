import client from '@kubb/plugin-client/clients/axios'
import type { AddPetMutationRequest, AddPetMutationResponse, AddPet405 } from '../models/AddPet.ts'
import type { RequestConfig } from '@kubb/plugin-client/clients/axios'
import type { CreateMutationOptions } from '@tanstack/svelte-query'
import { createMutation } from '@tanstack/svelte-query'

export const addPetMutationKey = () => [{ url: '/pet' }] as const

export type AddPetMutationKey = ReturnType<typeof addPetMutationKey>

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * {@link /pet}
 */
async function addPet(data: AddPetMutationRequest, config: Partial<RequestConfig<AddPetMutationRequest>> = {}) {
  const res = await client<AddPetMutationResponse, AddPet405, AddPetMutationRequest>({ method: 'POST', url: '/pet', data, ...config })
  return res.data
}

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * {@link /pet}
 */
export function createAddPet(
  options: {
    mutation?: CreateMutationOptions<
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
  return createMutation<
    AddPetMutationResponse,
    AddPet405,
    {
      data: AddPetMutationRequest
    }
  >({
    mutationFn: async ({ data }) => {
      return addPet(data, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}

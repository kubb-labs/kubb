import client from '../../../../tanstack-query-client.ts'
import type { RequestConfig, ResponseConfig } from '../../../../tanstack-query-client.ts'
import type { AddPetMutationRequest, AddPetMutationResponse, AddPet405 } from '../../../models/ts/petController/AddPet.ts'
import type { UseMutationOptions } from '@tanstack/react-query'
import { addPetMutationResponseSchema } from '../../../zod/petController/addPetSchema.ts'
import { useMutation } from '@tanstack/react-query'

export const addPetMutationKey = () => [{ url: '/pet' }] as const

export type AddPetMutationKey = ReturnType<typeof addPetMutationKey>

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * {@link /pet}
 */
async function addPet(
  {
    data,
  }: {
    data: AddPetMutationRequest
  },
  config: Partial<RequestConfig<AddPetMutationRequest>> = {},
) {
  const res = await client<AddPetMutationResponse, AddPet405, AddPetMutationRequest>({ method: 'POST', url: '/pet', data, ...config })
  return { ...res, data: addPetMutationResponseSchema.parse(res.data) }
}

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * {@link /pet}
 */
export function useAddPet(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<AddPetMutationResponse>,
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
    ResponseConfig<AddPetMutationResponse>,
    AddPet405,
    {
      data: AddPetMutationRequest
    }
  >({
    mutationFn: async ({ data }) => {
      return addPet({ data }, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}

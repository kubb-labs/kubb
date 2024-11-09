import client from '@kubb/plugin-client/client'
import type { UpdatePetMutationRequest, UpdatePetMutationResponse, UpdatePet400, UpdatePet404, UpdatePet405 } from '../models/UpdatePet.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { UseMutationOptions } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'

export const updatePetMutationKey = () => [{ url: '/pet' }] as const

export type UpdatePetMutationKey = ReturnType<typeof updatePetMutationKey>

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * @link /pet
 */
async function updatePetHook(data: UpdatePetMutationRequest, config: Partial<RequestConfig<UpdatePetMutationRequest>> = {}) {
  const res = await client<UpdatePetMutationResponse, UpdatePet400 | UpdatePet404 | UpdatePet405, UpdatePetMutationRequest>({
    method: 'PUT',
    url: '/pet',
    data,
    ...config,
  })
  return res.data
}

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * @link /pet
 */
export function useUpdatePetHook(
  options: {
    mutation?: UseMutationOptions<
      UpdatePetMutationResponse,
      UpdatePet400 | UpdatePet404 | UpdatePet405,
      {
        data: UpdatePetMutationRequest
      }
    >
    client?: Partial<RequestConfig<UpdatePetMutationRequest>>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? updatePetMutationKey()
  return useMutation<
    UpdatePetMutationResponse,
    UpdatePet400 | UpdatePet404 | UpdatePet405,
    {
      data: UpdatePetMutationRequest
    }
  >({
    mutationFn: async ({ data }) => {
      return updatePetHook(data, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}

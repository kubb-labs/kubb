import client from '../../../../tanstack-query-client'
import type { RequestConfig, ResponseConfig } from '../../../../tanstack-query-client'
import type {
  UpdatePetMutationRequest,
  UpdatePetMutationResponse,
  UpdatePet400,
  UpdatePet404,
  UpdatePet405,
} from '../../../models/ts/petController/UpdatePet.ts'
import type { UseMutationOptions } from '@tanstack/react-query'
import { updatePetMutationResponseSchema } from '../../../zod/petController/updatePetSchema.ts'
import { useMutation } from '@tanstack/react-query'

export const updatePetMutationKey = () => [{ url: '/pet' }] as const

export type UpdatePetMutationKey = ReturnType<typeof updatePetMutationKey>

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * {@link /pet}
 */
async function updatePet({ data }: { data: UpdatePetMutationRequest }, config: Partial<RequestConfig<UpdatePetMutationRequest>> = {}) {
  const res = await client<UpdatePetMutationResponse, UpdatePet400 | UpdatePet404 | UpdatePet405, UpdatePetMutationRequest>({
    method: 'PUT',
    url: '/pet',
    data,
    ...config,
  })
  return { ...res, data: updatePetMutationResponseSchema.parse(res.data) }
}

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * {@link /pet}
 */
export function useUpdatePet(
  options: {
    mutation?: UseMutationOptions<ResponseConfig<UpdatePetMutationResponse>, UpdatePet400 | UpdatePet404 | UpdatePet405, { data: UpdatePetMutationRequest }>
    client?: Partial<RequestConfig<UpdatePetMutationRequest>>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? updatePetMutationKey()

  return useMutation<ResponseConfig<UpdatePetMutationResponse>, UpdatePet400 | UpdatePet404 | UpdatePet405, { data: UpdatePetMutationRequest }>({
    mutationFn: async ({ data }) => {
      return updatePet({ data }, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}

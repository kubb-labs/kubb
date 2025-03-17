import type client from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  UpdatePetMutationRequest,
  UpdatePetMutationResponse,
  UpdatePet400,
  UpdatePet404,
  UpdatePet405,
} from '../../../models/ts/petController/UpdatePet.ts'
import type { UseMutationOptions } from '@tanstack/react-query'
import { updatePet } from '../../axios/petService/updatePet.ts'
import { useMutation } from '@tanstack/react-query'

export const updatePetMutationKey = () => [{ url: '/pet' }] as const

export type UpdatePetMutationKey = ReturnType<typeof updatePetMutationKey>

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
    >
    client?: Partial<RequestConfig<UpdatePetMutationRequest>> & { client?: typeof client }
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? updatePetMutationKey()

  return useMutation<
    ResponseConfig<UpdatePetMutationResponse>,
    ResponseErrorConfig<UpdatePet400 | UpdatePet404 | UpdatePet405>,
    { data: UpdatePetMutationRequest },
    TContext
  >({
    mutationFn: async ({ data }) => {
      return updatePet({ data }, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}

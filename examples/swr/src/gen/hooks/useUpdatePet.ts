import client from '@kubb/plugin-client/clients/axios'
import useSWRMutation from 'swr/mutation'
import type { UpdatePetMutationRequest, UpdatePetMutationResponse, UpdatePet400, UpdatePet404, UpdatePet405 } from '../models/UpdatePet.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'

export const updatePetMutationKey = () => [{ url: '/pet' }] as const

export type UpdatePetMutationKey = ReturnType<typeof updatePetMutationKey>

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * {@link /pet}
 */
export async function updatePet(data: UpdatePetMutationRequest, config: Partial<RequestConfig<UpdatePetMutationRequest>> & { client?: typeof client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<UpdatePetMutationResponse, ResponseErrorConfig<UpdatePet400 | UpdatePet404 | UpdatePet405>, UpdatePetMutationRequest>({
    method: 'PUT',
    url: '/pet',
    data,
    ...requestConfig,
  })
  return res.data
}

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * {@link /pet}
 */
export function useUpdatePet(
  options: {
    mutation?: Parameters<
      typeof useSWRMutation<
        UpdatePetMutationResponse,
        ResponseErrorConfig<UpdatePet400 | UpdatePet404 | UpdatePet405>,
        UpdatePetMutationKey,
        UpdatePetMutationRequest
      >
    >[2]
    client?: Partial<RequestConfig<UpdatePetMutationRequest>> & { client?: typeof client }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = updatePetMutationKey()

  return useSWRMutation<
    UpdatePetMutationResponse,
    ResponseErrorConfig<UpdatePet400 | UpdatePet404 | UpdatePet405>,
    UpdatePetMutationKey | null,
    UpdatePetMutationRequest
  >(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return updatePet(data, config)
    },
    mutationOptions,
  )
}

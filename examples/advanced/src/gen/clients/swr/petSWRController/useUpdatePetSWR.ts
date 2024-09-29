import client from '../../../../swr-client.js'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig } from '../../../../swr-client.js'
import type {
  UpdatePetMutationRequest,
  UpdatePetMutationResponse,
  UpdatePet400,
  UpdatePet404,
  UpdatePet405,
} from '../../../models/ts/petController/UpdatePet.js'
import { updatePetMutationResponseSchema } from '../../../zod/petController/updatePetSchema.js'

export const updatePetMutationKeySWR = () => [{ url: '/pet' }] as const

export type UpdatePetMutationKeySWR = ReturnType<typeof updatePetMutationKeySWR>

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * @link /pet
 */
async function updatePet(data: UpdatePetMutationRequest, config: Partial<RequestConfig<UpdatePetMutationRequest>> = {}) {
  const res = await client<UpdatePetMutationResponse, UpdatePet400 | UpdatePet404 | UpdatePet405, UpdatePetMutationRequest>({
    method: 'PUT',
    url: '/pet',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    data,
    ...config,
  })
  return updatePetMutationResponseSchema.parse(res.data)
}

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * @link /pet
 */
export function useUpdatePetSWR(
  options: {
    mutation?: Parameters<
      typeof useSWRMutation<UpdatePetMutationResponse, UpdatePet400 | UpdatePet404 | UpdatePet405, UpdatePetMutationKeySWR, UpdatePetMutationRequest>
    >[2]
    client?: Partial<RequestConfig<UpdatePetMutationRequest>>
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = updatePetMutationKeySWR()
  return useSWRMutation<UpdatePetMutationResponse, UpdatePet400 | UpdatePet404 | UpdatePet405, UpdatePetMutationKeySWR | null, UpdatePetMutationRequest>(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return updatePet(data, config)
    },
    mutationOptions,
  )
}

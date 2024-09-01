import client from '../../../../swr-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig } from '../../../../swr-client.ts'
import type { AddPetMutationRequest, AddPetMutationResponse, AddPet405 } from '../../../models/ts/petController/AddPet.ts'
import { addPetMutationResponseSchema } from '../../../zod/petController/addPetSchema.ts'

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * @link /pet
 */
async function addPet(data: AddPetMutationRequest, config: Partial<RequestConfig<AddPetMutationRequest>> = {}) {
  const res = await client<AddPetMutationResponse, AddPet405, AddPetMutationRequest>({
    method: 'POST',
    url: '/pet',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    data,
    ...config,
  })
  return addPetMutationResponseSchema.parse(res.data)
}

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * @link /pet
 */
export function useAddPet(
  options: {
    mutation?: Parameters<typeof useSWRMutation<AddPetMutationResponse, AddPet405, any>>[2]
    client?: Partial<RequestConfig<AddPetMutationRequest>>
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const swrKey = ['/pet'] as const
  return useSWRMutation<AddPetMutationResponse, AddPet405, typeof swrKey | null>(
    shouldFetch ? swrKey : null,
    async (_url, { arg: data }) => {
      return addPet(data, config)
    },
    mutationOptions,
  )
}

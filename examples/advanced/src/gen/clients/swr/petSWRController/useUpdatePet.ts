import client from '../../../../swr-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig } from '../../../../swr-client.ts'
import type {
  UpdatePetMutationRequest,
  UpdatePetMutationResponse,
  UpdatePet400,
  UpdatePet404,
  UpdatePet405,
} from '../../../models/ts/petController/UpdatePet.ts'
import type { Key } from 'swr'
import type { SWRMutationConfiguration } from 'swr/mutation'
import { updatePetMutationResponseSchema } from '../../../zod/petController/updatePetSchema.ts'

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
export function useUpdatePet(
  options: {
    mutation?: SWRMutationConfiguration<UpdatePetMutationResponse, UpdatePet400 | UpdatePet404 | UpdatePet405>
    client?: Partial<RequestConfig<UpdatePetMutationRequest>>
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const swrKey = ['/pet'] as const
  return useSWRMutation<UpdatePetMutationResponse, UpdatePet400 | UpdatePet404 | UpdatePet405, Key>(
    shouldFetch ? swrKey : null,
    async (_url, { arg: data }) => {
      return updatePet(data, config)
    },
    mutationOptions,
  )
}

import client from '../../../../swr-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig } from '../../../../swr-client.ts'
import type {
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithForm405,
} from '../../../models/ts/petController/UpdatePetWithForm.ts'
import { updatePetWithFormMutationResponseSchema } from '../../../zod/petController/updatePetWithFormSchema.ts'

export const updatePetWithFormMutationKeySWR = () => [{ url: '/pet/{petId}' }] as const

export type UpdatePetWithFormMutationKeySWR = ReturnType<typeof updatePetWithFormMutationKeySWR>

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:petId}
 */
async function updatePetWithFormSWR(
  { petId, params }: { petId: UpdatePetWithFormPathParams['petId']; params?: UpdatePetWithFormQueryParams },
  config: Partial<RequestConfig> = {},
) {
  const res = await client<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, unknown>({
    method: 'POST',
    url: `/pet/${petId}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    params,
    ...config,
  })
  return updatePetWithFormMutationResponseSchema.parse(res.data)
}

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:petId}
 */
export function useUpdatePetWithFormSWR(
  { petId }: { petId: UpdatePetWithFormPathParams['petId'] },
  params?: UpdatePetWithFormQueryParams,
  options: {
    mutation?: Parameters<typeof useSWRMutation<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, UpdatePetWithFormMutationKeySWR>>[2]
    client?: Partial<RequestConfig>
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = updatePetWithFormMutationKeySWR()

  return useSWRMutation<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, UpdatePetWithFormMutationKeySWR | null>(
    shouldFetch ? mutationKey : null,
    async (_url) => {
      return updatePetWithFormSWR({ petId, params }, config)
    },
    mutationOptions,
  )
}

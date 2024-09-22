import client from '../../../../tanstack-query-client.ts'
import type { RequestConfig } from '../../../../tanstack-query-client.ts'
import type {
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithForm405,
} from '../../../models/ts/petController/UpdatePetWithForm.ts'
import type { UseMutationOptions, UseMutationResult, MutationKey } from '@tanstack/react-query'
import { updatePetWithFormMutationResponseSchema } from '../../../zod/petController/updatePetWithFormSchema.ts'
import { useMutation } from '@tanstack/react-query'

export const updatePetWithFormMutationKey = () => [{ url: '/pet/{petId}' }] as const

export type UpdatePetWithFormMutationKey = ReturnType<typeof updatePetWithFormMutationKey>

/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
async function updatePetWithForm(petId: UpdatePetWithFormPathParams['petId'], params?: UpdatePetWithFormQueryParams, config: Partial<RequestConfig> = {}) {
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
 * @link /pet/:petId
 */
export function useUpdatePetWithForm(
  options: {
    mutation?: UseMutationOptions<
      UpdatePetWithFormMutationResponse,
      UpdatePetWithForm405,
      {
        petId: UpdatePetWithFormPathParams['petId']
        params?: UpdatePetWithFormQueryParams
      }
    >
    client?: Partial<RequestConfig>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? updatePetWithFormMutationKey()
  const mutation = useMutation({
    mutationFn: async ({
      petId,
      params,
    }: {
      petId: UpdatePetWithFormPathParams['petId']
      params?: UpdatePetWithFormQueryParams
    }) => {
      return updatePetWithForm(petId, params, config)
    },
    ...mutationOptions,
  }) as UseMutationResult<UpdatePetWithFormMutationResponse, UpdatePetWithForm405> & {
    mutationKey: MutationKey
  }
  mutation.mutationKey = mutationKey as MutationKey
  return mutation
}

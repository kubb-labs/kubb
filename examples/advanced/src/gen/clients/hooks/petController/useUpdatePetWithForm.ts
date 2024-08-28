import client from '../../../../tanstack-query-client.ts'
import type {
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithForm405,
} from '../../../models/ts/petController/UpdatePetWithForm.ts'
import type { UseMutationOptions } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'

type UpdatePetWithFormClient = typeof client<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, never>

type UpdatePetWithForm = {
  data: UpdatePetWithFormMutationResponse
  error: UpdatePetWithForm405
  request: never
  pathParams: UpdatePetWithFormPathParams
  queryParams: UpdatePetWithFormQueryParams
  headerParams: never
  response: Awaited<ReturnType<UpdatePetWithFormClient>>
  client: {
    parameters: Partial<Parameters<UpdatePetWithFormClient>[0]>
    return: Awaited<ReturnType<UpdatePetWithFormClient>>
  }
}

/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export function useUpdatePetWithForm(
  options: {
    mutation?: UseMutationOptions<
      UpdatePetWithForm['response'],
      UpdatePetWithForm['error'],
      {
        petId: UpdatePetWithFormPathParams['petId']
        params?: UpdatePetWithForm['queryParams']
      }
    >
    client?: UpdatePetWithForm['client']['parameters']
  } = {},
) {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation({
    mutationFn: async ({ petId, params }) => {
      const res = await client<UpdatePetWithForm['data'], UpdatePetWithForm['error'], UpdatePetWithForm['request']>({
        method: 'post',
        url: `/pet/${petId}`,
        params,
        ...clientOptions,
      })
      return res
    },
    ...mutationOptions,
  })
}

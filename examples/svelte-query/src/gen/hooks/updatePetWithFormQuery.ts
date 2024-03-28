import client from '@kubb/swagger-client/client'
import { createMutation } from '@tanstack/svelte-query'
import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/svelte-query'
import type {
  UpdatePetWithForm405,
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
} from '../models/UpdatePetWithForm'

type UpdatePetWithFormClient = typeof client<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, never>
type UpdatePetWithForm = {
  data: UpdatePetWithFormMutationResponse
  error: UpdatePetWithForm405
  request: never
  pathParams: UpdatePetWithFormPathParams
  queryParams: UpdatePetWithFormQueryParams
  headerParams: never
  response: UpdatePetWithFormMutationResponse
  client: {
    parameters: Partial<Parameters<UpdatePetWithFormClient>[0]>
    return: Awaited<ReturnType<UpdatePetWithFormClient>>
  }
}
/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export function updatePetWithFormQuery(
  petId: UpdatePetWithFormPathParams['petId'],
  params?: UpdatePetWithForm['queryParams'],
  options: {
    mutation?: CreateMutationOptions<UpdatePetWithForm['response'], UpdatePetWithForm['error'], UpdatePetWithForm['request']>
    client?: UpdatePetWithForm['client']['parameters']
  } = {},
): CreateMutationResult<UpdatePetWithForm['response'], UpdatePetWithForm['error'], UpdatePetWithForm['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return createMutation<UpdatePetWithForm['response'], UpdatePetWithForm['error'], never>({
    mutationFn: async () => {
      const res = await client<UpdatePetWithForm['data'], UpdatePetWithForm['error'], UpdatePetWithForm['request']>({
        method: 'post',
        url: `/pet/${petId}`,
        params,
        ...clientOptions,
      })
      return res.data
    },
    ...mutationOptions,
  })
}

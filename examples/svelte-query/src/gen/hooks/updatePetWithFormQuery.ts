import client from '@kubb/swagger-client/client'
import { createMutation } from '@tanstack/svelte-query'
import type {
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithForm405,
} from '../models/UpdatePetWithForm'
import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/svelte-query'

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
 * @link /pet/:petId */
export function updatePetWithFormQuery(
  petId: UpdatePetWithFormPathParams['petId'],
  params?: UpdatePetWithForm['queryParams'],
  options: {
    mutation?: CreateMutationOptions<UpdatePetWithForm['response'], UpdatePetWithForm['error'], void>
    client?: UpdatePetWithForm['client']['parameters']
  } = {},
): CreateMutationResult<UpdatePetWithForm['response'], UpdatePetWithForm['error'], void> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return createMutation<UpdatePetWithForm['response'], UpdatePetWithForm['error'], void>({
    mutationFn: async () => {
      const res = await client<UpdatePetWithForm['data'], UpdatePetWithForm['error'], void>({
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

import client from '@kubb/plugin-client/client'
import type {
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithForm405,
} from '../models/UpdatePetWithForm.ts'
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
export function useUpdatePetWithFormHook(
  petId: UpdatePetWithFormPathParams['petId'],
  params?: UpdatePetWithForm['queryParams'],
  options?: {
    mutation?: UseMutationOptions<UpdatePetWithForm['response'], UpdatePetWithForm['error'], UpdatePetWithForm['request']>
    client?: UpdatePetWithForm['client']['parameters']
  },
) {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation({
    mutationFn: async (data) => {
      const res = await client<UpdatePetWithForm['data'], UpdatePetWithForm['error']>({ method: 'post', url: `/pet/${petId}`, params, ...options })
      return res.data
    },
    ...mutationOptions,
  })
}

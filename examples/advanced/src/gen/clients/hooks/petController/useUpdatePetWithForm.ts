import client from '../../../../tanstack-query-client.ts'
import { useMutation } from '@tanstack/react-query'
import type {
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithForm405,
} from '../../../models/ts/petController/UpdatePetWithForm'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'

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
    paramaters: Partial<Parameters<UpdatePetWithFormClient>[0]>
    return: Awaited<ReturnType<UpdatePetWithFormClient>>
  }
}
/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId */
export function useUpdatePetWithForm(petId: UpdatePetWithFormPathParams['petId'], params?: UpdatePetWithForm['queryParams'], options: {
  mutation?: UseMutationOptions<UpdatePetWithForm['response'], UpdatePetWithForm['error'], void>
  client?: UpdatePetWithForm['client']['paramaters']
} = {}): UseMutationResult<UpdatePetWithForm['response'], UpdatePetWithForm['error'], void> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<UpdatePetWithForm['response'], UpdatePetWithForm['error'], void>({
    mutationFn: async () => {
      const res = await client<UpdatePetWithForm['data'], UpdatePetWithForm['error'], void>({
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

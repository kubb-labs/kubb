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
    parameters: Partial<Parameters<UpdatePetWithFormClient>[0]>
    return: Awaited<ReturnType<UpdatePetWithFormClient>>
  }
}
/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId */
export function useUpdatePetWithForm(options: {
  mutation?: UseMutationOptions<UpdatePetWithForm['response'], UpdatePetWithForm['error'], UpdatePetWithForm['pathParams']>
  client?: UpdatePetWithForm['client']['parameters']
} = {}): UseMutationResult<UpdatePetWithForm['response'], UpdatePetWithForm['error'], UpdatePetWithForm['pathParams']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<UpdatePetWithForm['response'], UpdatePetWithForm['error'], void>({
    mutationFn: async ({ petId }) => {
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

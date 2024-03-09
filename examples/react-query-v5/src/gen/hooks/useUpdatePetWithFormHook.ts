import client from '@kubb/swagger-client/client'
import { useMutation } from '@tanstack/react-query'
import { useInvalidationForMutation } from '../../useInvalidationForMutation'
import type {
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithForm405,
} from '../models/UpdatePetWithForm'
import type { UseMutationOptions } from '@tanstack/react-query'

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
export function useUpdatePetWithFormHook(petId: UpdatePetWithFormPathParams['petId'], params?: UpdatePetWithForm['queryParams'], options: {
  mutation?: UseMutationOptions<UpdatePetWithForm['response'], UpdatePetWithForm['error'], {
    data: UpdatePetWithForm['request']
  }>
  client?: UpdatePetWithForm['client']['parameters']
} = {}) {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  const invalidationOnSuccess = useInvalidationForMutation('useUpdatePetWithFormHook')
  return useMutation({
    mutationFn: async () => {
      const res = await client<UpdatePetWithForm['data'], UpdatePetWithForm['error'], UpdatePetWithForm['request']>({
        method: 'post',
        url: `/pet/${petId}`,
        params,
        ...clientOptions,
      })
      return res.data
    },
    onSuccess: (...args) => {
      if (invalidationOnSuccess) {
        invalidationOnSuccess(...args)
      }
      if (mutationOptions?.onSuccess) {
        mutationOptions.onSuccess(...args)
      }
    },
    ...mutationOptions,
  })
}

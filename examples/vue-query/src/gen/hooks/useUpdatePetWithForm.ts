import client from '@kubb/swagger-client/client'
import { useMutation } from '@tanstack/vue-query'
import type { UseMutationReturnType } from '@tanstack/vue-query'
import type { VueMutationObserverOptions } from '@tanstack/vue-query/build/lib/useMutation'
import { unref } from 'vue'
import type { MaybeRef } from 'vue'
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
export function useUpdatePetWithForm(
  refPetId: MaybeRef<UpdatePetWithFormPathParams['petId']>,
  refParams?: MaybeRef<UpdatePetWithFormQueryParams>,
  options: {
    mutation?: VueMutationObserverOptions<UpdatePetWithForm['response'], UpdatePetWithForm['error'], void, unknown>
    client?: UpdatePetWithForm['client']['parameters']
  } = {},
): UseMutationReturnType<UpdatePetWithForm['response'], UpdatePetWithForm['error'], void, unknown> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<UpdatePetWithForm['response'], UpdatePetWithForm['error'], void, unknown>({
    mutationFn: async (data) => {
      const petId = unref(refPetId)
      const params = unref(refParams)
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

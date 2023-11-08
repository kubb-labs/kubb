import client from '@kubb/swagger-client/client'
import { useMutation } from '@tanstack/vue-query'
import { unref } from 'vue'
import type { KubbQueryFactory } from './types'
import type {
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithForm405,
} from '../models/UpdatePetWithForm'
import type { UseMutationReturnType } from '@tanstack/vue-query'
import type { VueMutationObserverOptions } from '@tanstack/vue-query/build/lib/useMutation'
import type { MaybeRef } from 'vue'

type UpdatePetWithForm = KubbQueryFactory<
  UpdatePetWithFormMutationResponse,
  UpdatePetWithForm405,
  never,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  never,
  UpdatePetWithFormMutationResponse,
  {
    dataReturnType: 'full'
    type: 'mutation'
  }
>
/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export function useUpdatePetWithForm<TData = UpdatePetWithForm['response'], TError = UpdatePetWithForm['error']>(
  refPetId: MaybeRef<UpdatePetWithFormPathParams['petId']>,
  refParams?: MaybeRef<UpdatePetWithFormQueryParams>,
  options: {
    mutation?: VueMutationObserverOptions<TData, TError, void, unknown>
    client?: UpdatePetWithForm['client']['paramaters']
  } = {},
): UseMutationReturnType<TData, TError, void, unknown> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<TData, TError, void, unknown>({
    mutationFn: () => {
      const petId = unref(refPetId)
      const params = unref(refParams)
      return client<UpdatePetWithForm['data'], TError, void>({
        method: 'post',
        url: `/pet/${petId}`,
        params,
        ...clientOptions,
      }).then((res) => res as TData)
    },
    ...mutationOptions,
  })
}

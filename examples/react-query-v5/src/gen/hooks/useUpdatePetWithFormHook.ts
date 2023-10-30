import { useMutation } from '@tanstack/react-query'
import client from '@kubb/swagger-client/client'
import type { KubbQueryFactory } from './types'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import type {
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithForm405,
} from '../models/UpdatePetWithForm'

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
> /**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */

export function useUpdatePetWithFormHook<TData = UpdatePetWithForm['response'], TError = UpdatePetWithForm['error']>(
  petId: UpdatePetWithFormPathParams['petId'],
  params?: UpdatePetWithForm['queryParams'],
  options: {
    mutation?: UseMutationOptions<TData, TError, void>
    client?: UpdatePetWithForm['client']['paramaters']
  } = {},
): UseMutationResult<TData, TError, void> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<TData, TError, void>({
    mutationFn: () => {
      return client<UpdatePetWithForm['data'], TError, void>({
        method: 'post',
        url: `/pet/${petId}`,
        params,
        ...clientOptions,
      }).then(res => res as TData)
    },
    ...mutationOptions,
  })
}

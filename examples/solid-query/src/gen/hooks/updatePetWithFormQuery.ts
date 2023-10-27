import { createMutation } from '@tanstack/solid-query'
import client from '@kubb/swagger-client/client'
import type { KubbQueryFactory } from './types'
import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/solid-query'
import type { ResponseConfig } from '@kubb/swagger-client/client'
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
  UpdatePetWithFormMutationResponse,
  {
    dataReturnType: 'data'
    type: 'mutation'
  }
> /**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export function updatePetWithFormQuery<TData = UpdatePetWithForm['response'], TError = UpdatePetWithForm['error']>(
  petId: UpdatePetWithFormPathParams['petId'],
  params?: UpdatePetWithForm['queryParams'],
  options: {
    mutation?: CreateMutationOptions<ResponseConfig<TData>, TError, void>
    client?: UpdatePetWithForm['client']['paramaters']
  } = {},
): CreateMutationResult<ResponseConfig<TData>, TError, void> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return createMutation<ResponseConfig<TData>, TError, void>({
    mutationFn: () => {
      return client<TData, TError, void>({
        method: 'post',
        url: `/pet/${petId}`,
        params,
        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}

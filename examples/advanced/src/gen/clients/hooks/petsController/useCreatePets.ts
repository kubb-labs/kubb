import client from '../../../../tanstack-query-client.ts'
import { useMutation } from '@tanstack/react-query'
import type { KubbQueryFactory } from './types'
import type {
  CreatePetsMutationRequest,
  CreatePetsMutationResponse,
  CreatePetsPathParams,
  CreatePetsQueryParams,
  CreatePetsHeaderParams,
  CreatePets201,
  CreatePetsError,
} from '../../../models/ts/petsController/CreatePets'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'

type CreatePets = KubbQueryFactory<
  CreatePetsMutationResponse,
  CreatePets201 | CreatePetsError,
  CreatePetsMutationRequest,
  CreatePetsPathParams,
  CreatePetsQueryParams,
  CreatePetsHeaderParams,
  CreatePetsMutationResponse,
  {
    dataReturnType: 'full'
    type: 'mutation'
  }
>
/**
 * @summary Create a pet
 * @link /pets/:uuid
 */
export function useCreatePets<TData = CreatePets['response'], TError = CreatePets['error']>(
  uuid: CreatePetsPathParams['uuid'],
  headers: CreatePets['headerParams'],
  params?: CreatePets['queryParams'],
  options: {
    mutation?: UseMutationOptions<TData, TError, CreatePets['request']>
    client?: CreatePets['client']['paramaters']
  } = {},
): UseMutationResult<TData, TError, CreatePets['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<TData, TError, CreatePets['request']>({
    mutationFn: (data) => {
      return client<CreatePets['data'], TError, CreatePets['request']>({
        method: 'post',
        url: `/pets/${uuid}`,
        params,
        data,
        headers: { ...headers, ...clientOptions.headers },
        ...clientOptions,
      }).then(res => res as TData)
    },
    ...mutationOptions,
  })
}

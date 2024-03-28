import client from '@kubb/swagger-client/client'
import useSWRMutation from 'swr/mutation'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'
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
  petId: UpdatePetWithFormPathParams['petId'],
  params?: UpdatePetWithForm['queryParams'],
  options?: {
    mutation?: SWRMutationConfiguration<UpdatePetWithForm['response'], UpdatePetWithForm['error']>
    client?: UpdatePetWithForm['client']['parameters']
    shouldFetch?: boolean
  },
): SWRMutationResponse<UpdatePetWithForm['response'], UpdatePetWithForm['error']> {
  const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = `/pet/${petId}` as const
  return useSWRMutation<UpdatePetWithForm['response'], UpdatePetWithForm['error'], [typeof url, typeof params] | null>(
    shouldFetch ? [url, params] : null,
    async (_url) => {
      const res = await client<UpdatePetWithForm['data'], UpdatePetWithForm['error']>({
        method: 'post',
        url,
        params,
        ...clientOptions,
      })
      return res.data
    },
    mutationOptions,
  )
}

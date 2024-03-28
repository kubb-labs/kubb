import useSWRMutation from 'swr/mutation'
import client from '../../../../swr-client.ts'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'
import type { UpdatePetMutationRequest, UpdatePetMutationResponse, UpdatePet400, UpdatePet404, UpdatePet405 } from '../../../models/ts/petController/UpdatePet'

type UpdatePetClient = typeof client<UpdatePetMutationResponse, UpdatePet400 | UpdatePet404 | UpdatePet405, UpdatePetMutationRequest>
type UpdatePet = {
  data: UpdatePetMutationResponse
  error: UpdatePet400 | UpdatePet404 | UpdatePet405
  request: UpdatePetMutationRequest
  pathParams: never
  queryParams: never
  headerParams: never
  response: Awaited<ReturnType<UpdatePetClient>>
  client: {
    parameters: Partial<Parameters<UpdatePetClient>[0]>
    return: Awaited<ReturnType<UpdatePetClient>>
  }
}
/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * @link /pet
 */
export function useUpdatePet(options?: {
  mutation?: SWRMutationConfiguration<UpdatePet['response'], UpdatePet['error']>
  client?: UpdatePet['client']['parameters']
  shouldFetch?: boolean
}): SWRMutationResponse<UpdatePet['response'], UpdatePet['error']> {
  const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = `/pet`
  return useSWRMutation<UpdatePet['response'], UpdatePet['error'], typeof url | null>(
    shouldFetch ? url : null,
    async (_url, { arg: data }) => {
      const res = await client<UpdatePet['data'], UpdatePet['error'], UpdatePet['request']>({
        method: 'put',
        url,
        data,
        ...clientOptions,
      })
      return res
    },
    mutationOptions,
  )
}

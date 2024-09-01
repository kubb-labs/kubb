import client from '../../../../swr-client.ts'
import useSWRMutation from 'swr/mutation'
import type {
  UpdatePetMutationRequest,
  UpdatePetMutationResponse,
  UpdatePet400,
  UpdatePet404,
  UpdatePet405,
} from '../../../models/ts/petController/UpdatePet.ts'
import type { Key } from 'swr'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'

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
  const url = '/pet' as const
  return useSWRMutation<UpdatePet['response'], UpdatePet['error'], Key>(
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

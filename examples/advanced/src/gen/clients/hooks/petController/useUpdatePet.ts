import { useMutation } from '@tanstack/react-query'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import client from '../../../../tanstack-query-client.ts'
import type { UpdatePet400, UpdatePet404, UpdatePet405, UpdatePetMutationRequest, UpdatePetMutationResponse } from '../../../models/ts/petController/UpdatePet'

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
export function useUpdatePet(
  options: {
    mutation?: UseMutationOptions<
      UpdatePet['response'],
      UpdatePet['error'],
      {
        data: UpdatePet['request']
      }
    >
    client?: UpdatePet['client']['parameters']
  } = {},
): UseMutationResult<
  UpdatePet['response'],
  UpdatePet['error'],
  {
    data: UpdatePet['request']
  }
> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<
    UpdatePet['response'],
    UpdatePet['error'],
    {
      data: UpdatePet['request']
    }
  >({
    mutationFn: async ({ data }) => {
      const res = await client<UpdatePet['data'], UpdatePet['error'], UpdatePet['request']>({
        method: 'put',
        url: '/pet',
        data,
        ...clientOptions,
      })
      return res
    },
    ...mutationOptions,
  })
}

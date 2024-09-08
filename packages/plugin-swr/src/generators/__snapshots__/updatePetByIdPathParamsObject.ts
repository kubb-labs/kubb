import client from '@kubb/plugin-client/client'
import useSWRMutation from 'swr/mutation'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'

type UpdatePetByIdPathParamsObjectClient = typeof client<UpdatePetByIdPathParamsObject, UpdatePetByIdPathParamsObject, never>

type UpdatePetByIdPathParamsObject = {
  data: UpdatePetByIdPathParamsObject
  error: UpdatePetByIdPathParamsObject
  request: never
  pathParams: UpdatePetByIdPathParamsObject
  queryParams: UpdatePetByIdPathParamsObject
  headerParams: never
  response: UpdatePetByIdPathParamsObject
  client: {
    parameters: Partial<Parameters<UpdatePetByIdPathParamsObjectClient>[0]>
    return: Awaited<ReturnType<UpdatePetByIdPathParamsObjectClient>>
  }
}

/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export function updatePetByIdPathParamsObject(
  petId: UpdatePetByIdPathParamsObject['petId'],
  params?: UpdatePetByIdPathParamsObject['queryParams'],
  options?: {
    mutation?: SWRMutationConfiguration<UpdatePetByIdPathParamsObject['response'], UpdatePetByIdPathParamsObject['error']>
    client?: UpdatePetByIdPathParamsObject['client']['parameters']
    shouldFetch?: boolean
  },
): SWRMutationResponse<UpdatePetByIdPathParamsObject['response'], UpdatePetByIdPathParamsObject['error']> {
  const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = `/pet/${petId}` as const
  return useSWRMutation<UpdatePetByIdPathParamsObject['response'], UpdatePetByIdPathParamsObject['error'], [typeof url, typeof params] | null>(
    shouldFetch ? [url, params] : null,
    async (_url) => {
      const res = await client<UpdatePetByIdPathParamsObject['data'], UpdatePetByIdPathParamsObject['error']>({
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

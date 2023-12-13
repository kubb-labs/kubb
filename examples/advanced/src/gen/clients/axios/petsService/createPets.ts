import client from '../../../../axios-client.ts'
import type { ResponseConfig } from '../../../../axios-client.ts'
import type { CreatePetsMutation } from '../../../models/ts/petsController/CreatePets'

/**
 * @summary Create a pet
 * @link /pets/:uuid */
export async function createPets(
  { uuid }: CreatePetsMutation.PathParams,
  data: CreatePetsMutation.Request,
  headers: CreatePetsMutation.HeaderParams,
  params?: CreatePetsMutation.QueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<CreatePetsMutation.Response>> {
  const res = await client<CreatePetsMutation.Response, CreatePetsMutation.Request>({
    method: 'post',
    url: `/pets/${uuid}`,
    params,
    data,
    headers: { ...headers, ...options.headers },
    ...options,
  })
  return res
}

import client from '../../../../axios-client.ts'
import type { ResponseConfig } from '../../../../axios-client.ts'
import type { DeletePetMutation } from '../../../models/ts/petController/DeletePet'

/**
 * @description delete a pet
 * @summary Deletes a pet
 * @link /pet/:petId */
export async function deletePet(
  { petId }: DeletePetMutation.PathParams,
  headers?: DeletePetMutation.HeaderParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<DeletePetMutation.Response>> {
  const res = await client<DeletePetMutation.Response>({
    method: 'delete',
    url: `/pet/${petId}`,
    headers: { ...headers, ...options.headers },
    ...options,
  })
  return res
}

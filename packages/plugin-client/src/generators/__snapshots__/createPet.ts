/**
 * @summary Create a pet
 * @link /pets
 */
export async function createPet(data: CreatePet, options: Partial<Parameters<typeof client>[0]> = {}): Promise<ResponseConfig<CreatePet>['data']> {
  const res = await client<CreatePet, CreatePet>({ method: 'post', url: `/pets`, data, ...options })
  return res.data
}

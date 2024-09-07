/**
 * @summary List all pets
 * @link /pets
 */
export async function getPets(params?: GetPets, options: Partial<Parameters<typeof client>[0]> = {}): Promise<ResponseConfig<GetPets>['data']> {
  const res = await client<GetPets>({ method: 'get', url: `/pets`, params, ...options })
  return res.data
}

/**
 * @summary List all pets
 * @link /pets
 */
export async function getPetsFull(params?: GetPetsFull, options: Partial<Parameters<typeof client>[0]> = {}): Promise<ResponseConfig<GetPetsFull>> {
  const res = await client<GetPetsFull>({ method: 'get', url: `/pets`, params, ...options })
  return res
}

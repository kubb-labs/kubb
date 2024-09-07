/**
 * @summary Info for a specific pet
 * @link /pets/:petId
 */
export async function showPetById(
  petId: ShowPetById['petId'],
  testId: ShowPetById['testId'],
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<ShowPetById>['data']> {
  const res = await client<ShowPetById>({ method: 'get', url: `/pets/${petId}`, ...options })
  return res.data
}

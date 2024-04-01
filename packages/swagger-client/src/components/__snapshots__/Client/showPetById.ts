/**
 * @summary Info for a specific pet
 * @link /pets/:pet_id
 */
export async function showPetById(
  { petId, testId }: { petId: ShowPetByIdPathParams['petId']; testId: ShowPetByIdPathParams['testId'] },
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<ShowPetByIdQueryResponse>['data']> {
  const res = await client<ShowPetByIdQueryResponse>({
    method: 'get',
    url: `/pets/${petId}`,
    ...options,
  })
  return res.data
}

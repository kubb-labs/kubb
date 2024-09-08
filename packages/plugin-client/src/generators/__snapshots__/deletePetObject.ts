/**
 * @description delete a pet
 * @summary Deletes a pet
 * @link /pet/:petId
 */
export async function deletePetObject({ petId }: { petId: DeletePetObject['petId'] }, headers?: DeletePetObject, config: Partial<RequestConfig> = {}) {
  const res = await client<DeletePetObject>({ method: 'delete', url: `/pet/${petId}`, headers: { ...headers, ...config.headers }, ...config })
  return res.data
}

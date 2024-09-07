/**
 * @description delete a pet
 * @summary Deletes a pet
 * @link /pet/:petId
 */
export async function deletePet(petId: DeletePet['petId'], headers?: DeletePet, config: Partial<RequestConfig> = {}) {
  const res = await client<DeletePet>({ method: 'delete', url: `/pet/${petId}`, headers: { ...headers, ...config.headers }, ...config })

  return res.data
}

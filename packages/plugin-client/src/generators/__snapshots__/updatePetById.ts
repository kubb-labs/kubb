/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export async function updatePetById(petId: UpdatePetById['petId'], params?: UpdatePetById, config: Partial<RequestConfig> = {}) {
  const res = await client<UpdatePetById>({ method: 'post', url: `/pet/${petId}`, params, ...config })

  return res.data
}

/**
 * @description Null response
 */
export const CreatePets201 = z.any()
export const CreatePetsMutationRequest = z.object({ name: z.string(), tag: z.string() })
export const CreatePetsMutationResponse = z.any()

/**
 * @description unexpected error
 */
export const CreatePetsError = z.lazy(() => Error)

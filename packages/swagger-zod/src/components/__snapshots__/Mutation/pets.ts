export const CreatePets201 = z.any()
export const CreatePetsMutationRequest = z.object({ name: z.string().optional(), tag: z.string().optional() })
export const CreatePetsMutationResponse = z.any()
export const CreatePetsError = z.lazy(() => Error)

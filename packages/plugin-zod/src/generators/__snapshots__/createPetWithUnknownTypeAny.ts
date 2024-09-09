/**
 * @description Null response
 */
export const createPetWithUnknownTypeAny = z.any()

/**
 * @description unexpected error
 */
export const createPetWithUnknownTypeAny = z.lazy(() => createPetWithUnknownTypeAny)

export const createPetWithUnknownTypeAny = z.object({ name: z.string(), tag: z.string() })

export const createPetWithUnknownTypeAny = z.any()

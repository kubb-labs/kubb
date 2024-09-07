/**
 * @description Null response
 */
export const createPet = z.any()

/**
 * @description unexpected error
 */
export const createPet = z.lazy(() => createPet)

export const createPet = z.object({ name: z.string(), tag: z.string() })

export const createPet = z.any()

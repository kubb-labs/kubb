export const getPets = z.object({ limit: z.string().describe('How many items to return at one time (max 100)').optional() })

/**
 * @description A paged array of pets
 */
export const getPets = z.lazy(() => getPets)

/**
 * @description unexpected error
 */
export const getPets = z.lazy(() => getPets)

/**
 * @description A paged array of pets
 */
export const getPets = z.lazy(() => getPets)

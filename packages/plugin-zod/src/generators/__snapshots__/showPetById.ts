export const showPetById = z.object({
  petId: z.string().describe('The id of the pet to retrieve'),
  testId: z.string().describe('The id of the pet to retrieve'),
})

/**
 * @description Expected response to a valid request
 */
export const showPetById = z.lazy(() => showPetById)

/**
 * @description unexpected error
 */
export const showPetById = z.lazy(() => showPetById)

/**
 * @description Expected response to a valid request
 */
export const showPetById = z.lazy(() => showPetById)

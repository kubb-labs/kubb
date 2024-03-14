export const ShowPetByIdPathParams = z.object({
  petId: z.string().describe('The id of the pet to retrieve'),
  testId: z.string().describe('The id of the pet to retrieve'),
})

/**
 * @description Expected response to a valid request
 */
export const ShowPetById200 = z.lazy(() => Pet)

/**
 * @description unexpected error
 */
export const ShowPetByIdError = z.lazy(() => Error)

/**
 * @description Expected response to a valid request
 */
export const ShowPetByIdQueryResponse = z.lazy(() => Pet)

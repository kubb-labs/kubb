import { z } from 'zod'

export const showPetByIdPathParams = z.object({
  petId: z.string().describe('The id of the pet to retrieve'),
  testId: z.string().describe('The id of the pet to retrieve'),
})

/**
 * @description Expected response to a valid request
 */
export const showPetById200 = z.lazy(() => pet)

/**
 * @description unexpected error
 */
export const showPetByIdError = z.lazy(() => error)

/**
 * @description Expected response to a valid request
 */
export const showPetByIdQueryResponse = z.lazy(() => pet)

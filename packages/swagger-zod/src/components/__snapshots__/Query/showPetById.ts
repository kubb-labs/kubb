export const ShowPetByIdPathParams = z.object({
  petId: z.string().describe('The id of the pet to retrieve').optional(),
  testId: z.string().describe('The id of the pet to retrieve').optional(),
})
export const ShowPetById200 = z.lazy(() => Pet)
export const ShowPetByIdError = z.lazy(() => Error)
export const ShowPetByIdQueryResponse = z.lazy(() => Pet)

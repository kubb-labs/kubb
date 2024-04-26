export function createShowPetByIdPathParams(): NonNullable<ShowPetByIdPathParams> {
  return { petId: faker.string.alpha(), testId: faker.string.alpha() }
}

/**
 * @description Expected response to a valid request
 */
export function createShowPetById200(): NonNullable<ShowPetById200> {
  return createPet()
}

/**
 * @description unexpected error
 */
export function createShowPetByIdError(): NonNullable<ShowPetByIdError> {
  return createError()
}

/**
 * @description Expected response to a valid request
 */
export function createShowPetByIdQueryResponse(): NonNullable<ShowPetByIdQueryResponse> {
  return createPet()
}

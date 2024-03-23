export function createShowPetByIdPathParams(override: NonNullable<Partial<ShowPetByIdPathParams>> = {}): NonNullable<ShowPetByIdPathParams> {
  return {
    ...{ petId: faker.string.alpha(), testId: faker.string.alpha() },
    ...override,
  }
}

export function createShowPetById200(override?: NonNullable<Partial<ShowPetById200>>): NonNullable<ShowPetById200> {
  return createPet(override)
}

export function createShowPetByIdError(override?: NonNullable<Partial<ShowPetByIdError>>): NonNullable<ShowPetByIdError> {
  return createError(override)
}

export function createShowPetByIdQueryResponse(override?: NonNullable<Partial<ShowPetByIdQueryResponse>>): NonNullable<ShowPetByIdQueryResponse> {
  return createPet(override)
}

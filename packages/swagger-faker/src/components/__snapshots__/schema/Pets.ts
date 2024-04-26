/**
 * @description Null response
 */
export function createCreatePets201(): NonNullable<CreatePets201> {
  return undefined
}

/**
 * @description unexpected error
 */
export function createCreatePetsError(): NonNullable<CreatePetsError> {
  return createError()
}

export function createCreatePetsMutationRequest(): NonNullable<CreatePetsMutationRequest> {
  return { name: faker.string.alpha(), tag: faker.string.alpha() }
}

export function createCreatePetsMutationResponse(): NonNullable<CreatePetsMutationResponse> {
  return undefined
}

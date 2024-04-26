/**
 * @description Null response
 */
export function createCreatePets201(override?: NonNullable<Partial<CreatePets201>>): NonNullable<CreatePets201> {
  return undefined
}

export function createCreatePetsMutationRequest(override: NonNullable<Partial<CreatePetsMutationRequest>> = {}): NonNullable<CreatePetsMutationRequest> {
  return {
    ...{ name: faker.string.alpha(), tag: faker.string.alpha() },
    ...override,
  }
}

export function createCreatePetsMutationResponse(override?: NonNullable<Partial<CreatePetsMutationResponse>>): NonNullable<CreatePetsMutationResponse> {
  return undefined
}

/**
 * @description unexpected error
 */
export function createCreatePetsError(override?: NonNullable<Partial<CreatePetsError>>): NonNullable<CreatePetsError> {
  return createError(override)
}

/**
 * @description Null response
 */
export function createCreatePets201(): NonNullable<CreatePets201> {
  return undefined
}

/**
 * @description unexpected error
 */
export function createCreatePetsError(override?: NonNullable<Partial<CreatePetsError>>): NonNullable<CreatePetsError> {
  return createError(override)
}

export function createCreatePetsMutationRequest(override: NonNullable<Partial<CreatePetsMutationRequest>> = {}): NonNullable<CreatePetsMutationRequest> {
  return {
    ...{ name: faker.string.alpha(), tag: faker.string.alpha() },
    ...override,
  }
}

export function createCreatePetsMutationResponse(): NonNullable<CreatePetsMutationResponse> {
  return undefined
}

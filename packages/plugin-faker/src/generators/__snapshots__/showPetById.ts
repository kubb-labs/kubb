export function showPetById(data: NonNullable<Partial<ShowPetById>> = {}): NonNullable<ShowPetById> {
  return {
    ...{ petId: faker.string.alpha(), testId: faker.string.alpha() },
    ...data,
  }
}

/**
 * @description Expected response to a valid request
 */
export function showPetById(): NonNullable<ShowPetById> {
  return showPetById()
}

/**
 * @description unexpected error
 */
export function showPetById(): NonNullable<ShowPetById> {
  return showPetById()
}

/**
 * @description Expected response to a valid request
 */
export function showPetById(): NonNullable<ShowPetById> {
  return showPetById()
}

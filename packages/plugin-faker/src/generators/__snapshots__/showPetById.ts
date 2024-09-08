export function showPetById(data: NonNullable<Partial<ShowPetById>> = {}) {
  return {
    ...{ petId: faker.string.alpha(), testId: faker.string.alpha() },
    ...data,
  }
}

/**
 * @description Expected response to a valid request
 */
export function showPetById() {
  return showPetById()
}

/**
 * @description unexpected error
 */
export function showPetById() {
  return showPetById()
}

/**
 * @description Expected response to a valid request
 */
export function showPetById() {
  return showPetById()
}

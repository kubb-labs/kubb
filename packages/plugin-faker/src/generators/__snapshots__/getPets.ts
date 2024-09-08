export function getPets(data: NonNullable<Partial<GetPets>> = {}) {
  return {
    ...{ limit: faker.string.alpha() },
    ...data,
  }
}

/**
 * @description A paged array of pets
 */
export function getPets() {
  return getPets()
}

/**
 * @description unexpected error
 */
export function getPets() {
  return getPets()
}

/**
 * @description A paged array of pets
 */
export function getPets() {
  return getPets()
}

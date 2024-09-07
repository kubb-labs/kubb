export function getPets(data: NonNullable<Partial<GetPets>> = {}): NonNullable<GetPets> {
  return {
    ...{ limit: faker.string.alpha() },
    ...data,
  }
}

/**
 * @description A paged array of pets
 */
export function getPets(): NonNullable<GetPets> {
  return getPets()
}

/**
 * @description unexpected error
 */
export function getPets(): NonNullable<GetPets> {
  return getPets()
}

/**
 * @description A paged array of pets
 */
export function getPets(): NonNullable<GetPets> {
  return getPets()
}

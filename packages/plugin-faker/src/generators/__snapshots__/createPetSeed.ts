/**
 * @description Null response
 */
export function createPetSeed() {
  faker.seed([222])
  return unknown
}

/**
 * @description unexpected error
 */
export function createPetSeed() {
  faker.seed([222])
  return createPetSeed()
}

export function createPetSeed(data: NonNullable<Partial<CreatePetSeed>> = {}) {
  faker.seed([222])
  return {
    ...{ name: faker.string.alpha(), tag: faker.string.alpha() },
    ...data,
  }
}

export function createPetSeed() {
  faker.seed([222])
  return unknown
}

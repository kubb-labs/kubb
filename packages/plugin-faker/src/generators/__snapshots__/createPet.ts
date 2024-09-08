/**
 * @description Null response
 */
export function createPet() {
  return unknown
}

/**
 * @description unexpected error
 */
export function createPet() {
  return createPet()
}

export function createPet(data: NonNullable<Partial<CreatePet>> = {}) {
  return {
    ...{ name: faker.string.alpha(), tag: faker.string.alpha() },
    ...data,
  }
}

export function createPet() {
  return unknown
}

/**
 * @description Null response
 */
export function createPet(): NonNullable<CreatePet> {
  return unknown
}

/**
 * @description unexpected error
 */
export function createPet(): NonNullable<CreatePet> {
  return createPet()
}

export function createPet(data: NonNullable<Partial<CreatePet>> = {}): NonNullable<CreatePet> {
  return {
    ...{ name: faker.string.alpha(), tag: faker.string.alpha() },
    ...data,
  }
}

export function createPet(): NonNullable<CreatePet> {
  return unknown
}

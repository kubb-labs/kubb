/**
 * @description Null response
 */
export function createPetUnknownTypeAny() {
  return undefined
}

/**
 * @description unexpected error
 */
export function createPetUnknownTypeAny() {
  return createPetUnknownTypeAny()
}

export function createPetUnknownTypeAny(data: NonNullable<Partial<CreatePetUnknownTypeAny>> = {}) {
  return {
    ...{ name: faker.string.alpha(), tag: faker.string.alpha() },
    ...data,
  }
}

export function createPetUnknownTypeAny() {
  return undefined
}

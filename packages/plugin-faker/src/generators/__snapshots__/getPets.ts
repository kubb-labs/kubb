import { faker } from '@faker-js/faker'

export function listPetsQueryParams(data: NonNullable<Partial<ListPetsQueryParams>> = {}) {
  return {
    ...{ limit: faker.string.alpha() },
    ...data,
  }
}

/**
 * @description A paged array of pets
 */
export function listPets200() {
  return pets()
}

/**
 * @description unexpected error
 */
export function listPetsError() {
  return error()
}

/**
 * @description A paged array of pets
 */
export function listPetsQueryResponse() {
  return pets()
}

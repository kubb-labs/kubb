import { faker } from '@faker-js/faker'

/**
 * @description Invalid input
 */

export function createUpdatePetWithForm405() {
  return undefined
}

export function createUpdatePetWithFormMutationResponse() {
  return undefined
}

export function createUpdatePetWithFormPathParams() {
  return { petId: faker.number.float({}) }
}

export function createUpdatePetWithFormQueryParams() {
  return { name: faker.string.alpha({}), status: faker.string.alpha({}) }
}

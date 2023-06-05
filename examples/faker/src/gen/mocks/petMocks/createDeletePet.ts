import { faker } from '@faker-js/faker'

/**
 * @description Invalid pet value
 */

export function createDeletePet400() {
  return undefined
}

export function createDeletePetMutationResponse() {
  return undefined
}

export function createDeletePetPathParams() {
  return { petId: faker.number.float({}) }
}

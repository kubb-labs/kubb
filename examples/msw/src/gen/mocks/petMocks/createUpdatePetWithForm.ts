import type { UpdatePetWithFormPathParams, UpdatePetWithFormQueryParams } from '../../models/UpdatePetWithForm.ts'
import { faker } from '@faker-js/faker'

export function createUpdatePetWithFormPathParams(data: NonNullable<Partial<UpdatePetWithFormPathParams>> = {}) {
  faker.seed([220])
  return {
    ...{ petId: faker.number.int() },
    ...data,
  }
}

export function createUpdatePetWithFormQueryParams(data: NonNullable<Partial<UpdatePetWithFormQueryParams>> = {}) {
  faker.seed([220])
  return {
    ...{ name: faker.string.alpha(), status: faker.string.alpha() },
    ...data,
  }
}

/**
 * @description Invalid input
 */
export function createUpdatePetWithForm405() {
  faker.seed([220])
  return undefined
}

export function createUpdatePetWithFormMutationResponse() {
  faker.seed([220])
  return undefined
}

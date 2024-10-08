import type { UpdatePetWithFormPathParams, UpdatePetWithFormQueryParams } from '../models/UpdatePetWithForm.ts'
import { faker } from '@faker-js/faker'

export function createUpdatePetWithFormPathParams(data: NonNullable<Partial<UpdatePetWithFormPathParams>> = {}) {
  return {
    ...{ petId: faker.number.int() },
    ...data,
  }
}

export function createUpdatePetWithFormQueryParams(data: NonNullable<Partial<UpdatePetWithFormQueryParams>> = {}) {
  return {
    ...{ name: faker.string.alpha(), status: faker.string.alpha() },
    ...data,
  }
}

/**
 * @description Invalid input
 */
export function createUpdatePetWithForm405() {
  return undefined
}

export function createUpdatePetWithFormMutationResponse() {
  return undefined
}

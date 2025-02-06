import type { UpdatePetWithFormPathParams, UpdatePetWithFormQueryParams } from '../models/UpdatePetWithForm.ts'
import { faker } from '@faker-js/faker'

export function createUpdatePetWithFormPathParams(data?: Partial<UpdatePetWithFormPathParams>): Partial<UpdatePetWithFormPathParams> {
  return {
    ...{ petId: faker.number.int() },
    ...(data || {}),
  }
}

export function createUpdatePetWithFormQueryParams(data?: Partial<UpdatePetWithFormQueryParams>): Partial<UpdatePetWithFormQueryParams> {
  return {
    ...{ name: faker.string.alpha(), status: faker.string.alpha() },
    ...(data || {}),
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

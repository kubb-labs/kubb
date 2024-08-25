import type {
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithForm405,
  UpdatePetWithFormMutationResponse,
} from '../models/UpdatePetWithForm'
import { faker } from '@faker-js/faker'

export function createUpdatePetWithFormPathParams(): NonNullable<UpdatePetWithFormPathParams> {
  return { petId: faker.number.int() }
}

export function createUpdatePetWithFormQueryParams(): NonNullable<UpdatePetWithFormQueryParams> {
  return { name: faker.string.alpha(), status: faker.string.alpha() }
}

/**
 * @description Invalid input
 */
export function createUpdatePetWithForm405(): NonNullable<UpdatePetWithForm405> {
  return undefined
}

export function createUpdatePetWithFormMutationResponse(): NonNullable<UpdatePetWithFormMutationResponse> {
  return undefined
}

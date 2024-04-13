import { faker } from '@faker-js/faker'
import type {
  UpdatePetWithForm405,
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
} from '../models/UpdatePetWithForm'

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

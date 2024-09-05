import type {
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithForm405,
  UpdatePetWithFormMutationResponse,
} from '../models/UpdatePetWithForm'
import { faker } from '@faker-js/faker'

export function createUpdatePetWithFormPathParams(data: NonNullable<Partial<UpdatePetWithFormPathParams>> = {}): NonNullable<UpdatePetWithFormPathParams> {
  return {
    ...{ petId: faker.number.int() },
    ...data,
  }
}

export function createUpdatePetWithFormQueryParams(data: NonNullable<Partial<UpdatePetWithFormQueryParams>> = {}): NonNullable<UpdatePetWithFormQueryParams> {
  return {
    ...{ name: faker.string.alpha(), status: faker.string.alpha() },
    ...data,
  }
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

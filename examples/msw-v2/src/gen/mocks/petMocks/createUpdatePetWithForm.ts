import { faker } from '@faker-js/faker'
import type {
  UpdatePetWithForm405,
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
} from '../../models/UpdatePetWithForm'

export function createUpdatePetWithFormPathParams(): NonNullable<UpdatePetWithFormPathParams> {
  faker.seed([220])
  return { petId: faker.number.int() }
}

export function createUpdatePetWithFormQueryParams(): NonNullable<UpdatePetWithFormQueryParams> {
  faker.seed([220])
  return { name: faker.string.alpha(), status: faker.string.alpha() }
}

/**
 * @description Invalid input
 */
export function createUpdatePetWithForm405(): NonNullable<UpdatePetWithForm405> {
  faker.seed([220])
  return undefined
}

export function createUpdatePetWithFormMutationResponse(): NonNullable<UpdatePetWithFormMutationResponse> {
  faker.seed([220])
  return undefined
}

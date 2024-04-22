import { faker } from '@faker-js/faker'
import type {
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithForm405,
  UpdatePetWithFormMutationResponse,
} from '../../models/ts/petController/UpdatePetWithForm'

export function createUpdatePetWithFormPathParams(): NonNullable<UpdatePetWithFormPathParams> {
  return { petId: faker.number.int() }
}

export function createUpdatePetWithFormQueryParams(): NonNullable<UpdatePetWithFormQueryParams> {
  return { name: faker.string.alpha(), status: faker.helpers.arrayElement(['working', 'idle']) as any }
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

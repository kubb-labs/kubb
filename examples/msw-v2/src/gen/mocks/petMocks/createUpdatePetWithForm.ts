import { faker } from '@faker-js/faker'
import type {
  UpdatePetWithForm405,
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
} from '../../models/UpdatePetWithForm'

/**
 * @description Invalid input
 */

export function createUpdatePetWithForm405(override?: NonNullable<Partial<UpdatePetWithForm405>>): NonNullable<UpdatePetWithForm405> {
  faker.seed([220])
  return undefined
}

export function createUpdatePetWithFormMutationResponse(
  override?: NonNullable<Partial<UpdatePetWithFormMutationResponse>>,
): NonNullable<UpdatePetWithFormMutationResponse> {
  faker.seed([220])
  return undefined
}

export function createUpdatePetWithFormPathParams(override: NonNullable<Partial<UpdatePetWithFormPathParams>> = {}): NonNullable<UpdatePetWithFormPathParams> {
  faker.seed([220])
  return {
    ...{ 'petId': faker.number.int() },
    ...override,
  }
}

export function createUpdatePetWithFormQueryParams(
  override: NonNullable<Partial<UpdatePetWithFormQueryParams>> = {},
): NonNullable<UpdatePetWithFormQueryParams> {
  faker.seed([220])
  return {
    ...{ 'name': faker.string.alpha(), 'status': faker.string.alpha() },
    ...override,
  }
}

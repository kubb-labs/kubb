import { faker } from '@faker-js/faker'
import type {
  UpdatePetWithForm405,
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
} from '../../models/ts/petController/UpdatePetWithForm'

/**
 * @description Invalid input
 */
export function createUpdatePetWithForm405(override?: NonNullable<Partial<UpdatePetWithForm405>>): NonNullable<UpdatePetWithForm405> {
  return undefined
}

export function createUpdatePetWithFormMutationResponse(
  override?: NonNullable<Partial<UpdatePetWithFormMutationResponse>>,
): NonNullable<UpdatePetWithFormMutationResponse> {
  return undefined
}

export function createUpdatePetWithFormPathParams(override: NonNullable<Partial<UpdatePetWithFormPathParams>> = {}): NonNullable<UpdatePetWithFormPathParams> {
  return {
    ...{ 'petId': faker.number.int() },
    ...override,
  }
}

export function createUpdatePetWithFormQueryParams(
  override: NonNullable<Partial<UpdatePetWithFormQueryParams>> = {},
): NonNullable<UpdatePetWithFormQueryParams> {
  return {
    ...{ 'name': faker.string.alpha(), 'status': faker.string.alpha() },
    ...override,
  }
}

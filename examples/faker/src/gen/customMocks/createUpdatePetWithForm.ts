import { faker } from '@faker-js/faker'
import type {
  UpdatePetWithForm405,
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
} from '../models/UpdatePetWithForm'

/**
 * @description Invalid input
 */

export function createUpdatePetWithForm405(override?: Partial<UpdatePetWithForm405>): NonNullable<UpdatePetWithForm405> {
  return undefined
}

export function createUpdatePetWithFormMutationResponse(override?: Partial<UpdatePetWithFormMutationResponse>): NonNullable<UpdatePetWithFormMutationResponse> {
  return undefined
}

export function createUpdatePetWithFormPathParams(override: Partial<UpdatePetWithFormPathParams> = {}): NonNullable<UpdatePetWithFormPathParams> {
  return {
    ...{ 'petId': faker.number.float({}) },
    ...override,
  }
}

export function createUpdatePetWithFormQueryParams(override: Partial<UpdatePetWithFormQueryParams> = {}): NonNullable<UpdatePetWithFormQueryParams> {
  return {
    ...{ 'name': faker.commerce.productName(), 'status': faker.string.alpha() },
    ...override,
  }
}

import { faker } from '@faker-js/faker'
import { createPet } from '../createPet'
import type { GetPetById400, GetPetById404, GetPetByIdPathParams, GetPetByIdQueryResponse } from '../../models/ts/petController/GetPetById'

/**
 * @description Invalid ID supplied
 */

export function createGetPetById400(override?: NonNullable<Partial<GetPetById400>>): NonNullable<GetPetById400> {
  return undefined
}
/**
 * @description Pet not found
 */

export function createGetPetById404(override?: NonNullable<Partial<GetPetById404>>): NonNullable<GetPetById404> {
  return undefined
}

export function createGetPetByIdPathParams(override: NonNullable<Partial<GetPetByIdPathParams>> = {}): NonNullable<GetPetByIdPathParams> {
  return {
    ...{ 'petId': faker.number.float({}) },
    ...override,
  }
}
/**
 * @description successful operation
 */

export function createGetPetByIdQueryResponse(override?: NonNullable<Partial<GetPetByIdQueryResponse>>): NonNullable<GetPetByIdQueryResponse> {
  return createPet(override)
}

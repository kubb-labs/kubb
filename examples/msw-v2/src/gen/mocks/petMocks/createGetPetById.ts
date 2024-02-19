import { faker } from '@faker-js/faker'
import { createPet } from '../createPet'
import type { GetPetById400, GetPetById404, GetPetByIdPathParams, GetPetByIdQueryResponse } from '../../models/GetPetById'

/**
 * @description Invalid ID supplied
 */

export function createGetPetById400(override?: NonNullable<Partial<GetPetById400>>): NonNullable<GetPetById400> {
  faker.seed([220])
  return undefined
}

/**
 * @description Pet not found
 */

export function createGetPetById404(override?: NonNullable<Partial<GetPetById404>>): NonNullable<GetPetById404> {
  faker.seed([220])
  return undefined
}

export function createGetPetByIdPathParams(override: NonNullable<Partial<GetPetByIdPathParams>> = {}): NonNullable<GetPetByIdPathParams> {
  faker.seed([220])
  return {
    ...{ 'petId': faker.number.float({}) },
    ...override,
  }
}

/**
 * @description successful operation
 */

export function createGetPetByIdQueryResponse(override?: NonNullable<Partial<GetPetByIdQueryResponse>>): NonNullable<GetPetByIdQueryResponse> {
  faker.seed([220])
  return createPet(override)
}

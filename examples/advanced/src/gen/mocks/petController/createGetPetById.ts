import { faker } from '@faker-js/faker'

import { createPet } from '../createPet'
import { GetPetById400 } from '../../models/ts/petController/GetPetById'
import { GetPetById404 } from '../../models/ts/petController/GetPetById'
import { GetPetByIdPathParams } from '../../models/ts/petController/GetPetById'
import { GetPetByIdQueryResponse } from '../../models/ts/petController/GetPetById'

/**
 * @description Invalid ID supplied
 */

export function createGetPetById400(): NonNullable<GetPetById400> {
  return undefined
}

/**
 * @description Pet not found
 */

export function createGetPetById404(): NonNullable<GetPetById404> {
  return undefined
}

export function createGetPetByIdPathParams(): NonNullable<GetPetByIdPathParams> {
  return { petId: faker.number.float({}) }
}

/**
 * @description successful operation
 */

export function createGetPetByIdQueryResponse(): NonNullable<GetPetByIdQueryResponse> {
  return createPet()
}

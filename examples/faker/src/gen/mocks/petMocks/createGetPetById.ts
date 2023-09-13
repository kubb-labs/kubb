import { faker } from '@faker-js/faker'

import { createPet } from '../createPet'
import { GetPetById400 } from '../../models/GetPetById'
import { GetPetById404 } from '../../models/GetPetById'
import { GetPetByIdPathParams } from '../../models/GetPetById'
import { GetPetByIdQueryResponse } from '../../models/GetPetById'

/**
 * @description Invalid ID supplied
 */
export function createGetPetById400(): GetPetById400 {
  return undefined
}

/**
 * @description Pet not found
 */
export function createGetPetById404(): GetPetById404 {
  return undefined
}

export function createGetPetByIdPathParams(): GetPetByIdPathParams {
  return { petId: faker.number.float({}) }
}

/**
 * @description successful operation
 */
export function createGetPetByIdQueryResponse(): GetPetByIdQueryResponse {
  return createPet()
}

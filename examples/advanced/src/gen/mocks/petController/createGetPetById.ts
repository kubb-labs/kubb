import { faker } from '@faker-js/faker'

import { createPet } from '../createPet'
import { GetPetById400 } from '../../models/ts/petController/GetPetById'
import { GetPetById404 } from '../../models/ts/petController/GetPetById'
import { GetPetByIdPathParams } from '../../models/ts/petController/GetPetById'
import { GetPetByIdQueryResponse } from '../../models/ts/petController/GetPetById'

/**
 * @description Invalid ID supplied
 */

export function createGetpetbyid400(): GetPetById400 {
  return undefined
}

/**
 * @description Pet not found
 */

export function createGetpetbyid404(): GetPetById404 {
  return undefined
}

export function createGetpetbyidpathparams(): GetPetByIdPathParams {
  return { petId: faker.number.float({}) }
}

/**
 * @description successful operation
 */

export function createGetpetbyidqueryresponse(): GetPetByIdQueryResponse {
  return createPet()
}

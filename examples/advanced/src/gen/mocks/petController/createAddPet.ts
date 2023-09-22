import { faker } from '@faker-js/faker'

import { createAddpetrequest } from '../createAddpetrequest'
import { createPet } from '../createPet'
import { AddPet405 } from '../../models/ts/petController/AddPet'
import { AddPetMutationRequest } from '../../models/ts/petController/AddPet'
import { AddPetMutationResponse } from '../../models/ts/petController/AddPet'

export function createAddpet405(): AddPet405 {
  return { code: faker.number.float({}), message: faker.string.alpha() }
}

/**
 * @description Create a new pet in the store
 */

export function createAddpetmutationrequest(): AddPetMutationRequest {
  return createAddpetrequest()
}

/**
 * @description Successful operation
 */

export function createAddpetmutationresponse(): AddPetMutationResponse {
  return createPet()
}

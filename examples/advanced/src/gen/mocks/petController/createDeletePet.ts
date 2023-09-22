import { faker } from '@faker-js/faker'

import { DeletePet400 } from '../../models/ts/petController/DeletePet'
import { DeletePetMutationResponse } from '../../models/ts/petController/DeletePet'
import { DeletePetPathParams } from '../../models/ts/petController/DeletePet'
import { DeletepetHeaderparams } from '../../models/ts/petController/DeletePet'

/**
 * @description Invalid pet value
 */

export function createDeletepet400(): DeletePet400 {
  return undefined
}

export function createDeletepetmutationresponse(): DeletePetMutationResponse {
  return undefined
}

export function createDeletepetpathparams(): DeletePetPathParams {
  return { petId: faker.number.float({}) }
}

export function createDeletepetheaderparams(): DeletepetHeaderparams {
  return { api_key: faker.string.alpha() }
}

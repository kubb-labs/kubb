import { faker } from '@faker-js/faker'

import { UpdatePetWithForm405 } from '../../models/ts/petController/UpdatePetWithForm'
import { UpdatePetWithFormMutationResponse } from '../../models/ts/petController/UpdatePetWithForm'
import { UpdatePetWithFormPathParams } from '../../models/ts/petController/UpdatePetWithForm'
import { UpdatepetwithformQueryparams } from '../../models/ts/petController/UpdatePetWithForm'

/**
 * @description Invalid input
 */

export function createUpdatepetwithform405(): UpdatePetWithForm405 {
  return undefined
}

export function createUpdatepetwithformmutationresponse(): UpdatePetWithFormMutationResponse {
  return undefined
}

export function createUpdatepetwithformpathparams(): UpdatePetWithFormPathParams {
  return { petId: faker.number.float({}) }
}

export function createUpdatepetwithformqueryparams(): UpdatepetwithformQueryparams {
  return { name: faker.string.alpha(), status: faker.string.alpha() }
}

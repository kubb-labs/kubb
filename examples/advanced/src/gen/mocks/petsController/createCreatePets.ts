import { faker } from '@faker-js/faker'

import { createPetnotfound } from '../createPetnotfound'
import { CreatePets201 } from '../../models/ts/petsController/CreatePets'
import { CreatePetsMutationRequest } from '../../models/ts/petsController/CreatePets'
import { CreatePetsMutationResponse } from '../../models/ts/petsController/CreatePets'
import { CreatePetsPathParams } from '../../models/ts/petsController/CreatePets'
import { CreatepetsHeaderparams } from '../../models/ts/petsController/CreatePets'
import { CreatepetsQueryparams } from '../../models/ts/petsController/CreatePets'
import { CreatePetserror } from '../../models/ts/petsController/CreatePets'

/**
 * @description Null response
 */

export function createCreatepets201(): CreatePets201 {
  return undefined
}

export function createCreatepetsmutationrequest(): CreatePetsMutationRequest {
  return { name: faker.string.alpha(), tag: faker.string.alpha() }
}

export function createCreatepetsmutationresponse(): CreatePetsMutationResponse {
  return undefined
}

export function createCreatepetspathparams(): CreatePetsPathParams {
  return { uuid: faker.string.alpha() }
}

export function createCreatepetsheaderparams(): CreatepetsHeaderparams {
  return { 'X-EXAMPLE': faker.helpers.arrayElement<any>([`ONE`, `TWO`, `THREE`]) }
}

export function createCreatepetsqueryparams(): CreatepetsQueryparams {
  return { offset: faker.number.float({}) }
}

/**
 * @description unexpected error
 */

export function createCreatepetserror(): CreatePetserror {
  return createPetnotfound()
}

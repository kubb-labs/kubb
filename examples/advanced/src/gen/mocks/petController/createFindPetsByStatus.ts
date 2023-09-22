import { faker } from '@faker-js/faker'

import { createPet } from '../createPet'
import { FindPetsByStatus400 } from '../../models/ts/petController/FindPetsByStatus'
import { FindpetsbystatusQueryparams } from '../../models/ts/petController/FindPetsByStatus'
import { FindPetsByStatusQueryResponse } from '../../models/ts/petController/FindPetsByStatus'

/**
 * @description Invalid status value
 */

export function createFindpetsbystatus400(): FindPetsByStatus400 {
  return undefined
}

export function createFindpetsbystatusqueryparams(): FindpetsbystatusQueryparams {
  return { status: faker.helpers.arrayElement<any>([`available`, `pending`, `sold`]) }
}

/**
 * @description successful operation
 */

export function createFindpetsbystatusqueryresponse(): FindPetsByStatusQueryResponse {
  return faker.helpers.arrayElements([createPet()]) as any
}

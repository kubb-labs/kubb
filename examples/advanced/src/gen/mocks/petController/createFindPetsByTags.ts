import { faker } from '@faker-js/faker'

import { createPet } from '../createPet'
import { FindPetsByTags400 } from '../../models/ts/petController/FindPetsByTags'
import { FindpetsbytagsHeaderparams } from '../../models/ts/petController/FindPetsByTags'
import { FindpetsbytagsQueryparams } from '../../models/ts/petController/FindPetsByTags'
import { FindPetsByTagsQueryResponse } from '../../models/ts/petController/FindPetsByTags'

/**
 * @description Invalid tag value
 */

export function createFindpetsbytags400(): FindPetsByTags400 {
  return undefined
}

export function createFindpetsbytagsheaderparams(): FindpetsbytagsHeaderparams {
  return { 'X-EXAMPLE': faker.helpers.arrayElement<any>([`ONE`, `TWO`, `THREE`]) }
}

export function createFindpetsbytagsqueryparams(): FindpetsbytagsQueryparams {
  return { tags: faker.helpers.arrayElements([faker.string.alpha()]) as any, page: faker.string.alpha(), pageSize: faker.string.alpha() }
}

/**
 * @description successful operation
 */

export function createFindpetsbytagsqueryresponse(): FindPetsByTagsQueryResponse {
  return faker.helpers.arrayElements([createPet()]) as any
}

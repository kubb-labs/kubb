import { faker } from '@faker-js/faker'

import { createPet } from './createPet'

/**
 * @description Invalid tag value
 */

export function createFindPetsByTags400() {
  return undefined
}

export function createFindPetsByTagsQueryParams() {
  return { tags: faker.helpers.arrayElement([faker.string.alpha({})]) }
}

/**
 * @description successful operation
 */

export function createFindPetsByTagsQueryResponse() {
  return faker.helpers.arrayElement([createPet()])
}

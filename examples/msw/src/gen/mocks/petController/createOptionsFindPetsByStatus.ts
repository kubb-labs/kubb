import type { OptionsFindPetsByStatus200, OptionsFindPetsByStatusMutationResponse } from '../../models/OptionsFindPetsByStatus.ts'
import { createPet } from '../createPet.ts'
import { faker } from '@faker-js/faker'

/**
 * @description successful operation
 */
export function createOptionsFindPetsByStatus200() {
  faker.seed([220])
  return faker.helpers.multiple(() => createPet()) as any
}

/**
 * @description successful operation
 */
export function createOptionsFindPetsByStatusMutationResponse() {
  faker.seed([220])
  return faker.helpers.multiple(() => createPet()) as any
}

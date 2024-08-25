import type { OptionsFindPetsByStatus200, OptionsFindPetsByStatusMutationResponse } from '../../models/OptionsFindPetsByStatus'
import { faker } from '@faker-js/faker'
import { createPet } from '../createPet'

/**
 * @description successful operation
 */
export function createOptionsFindPetsByStatus200(): NonNullable<OptionsFindPetsByStatus200> {
  faker.seed([220])
  return faker.helpers.arrayElements([createPet()]) as any
}

/**
 * @description successful operation
 */
export function createOptionsFindPetsByStatusMutationResponse(): NonNullable<OptionsFindPetsByStatusMutationResponse> {
  faker.seed([220])
  return faker.helpers.arrayElements([createPet()]) as any
}

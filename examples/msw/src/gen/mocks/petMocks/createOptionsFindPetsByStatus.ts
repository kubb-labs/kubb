import type { OptionsFindPetsByStatus200, OptionsFindPetsByStatusMutationResponse } from '../../models/OptionsFindPetsByStatus.ts'
import { createPet } from '../createPet.ts'
import { faker } from '@faker-js/faker'

/**
 * @description successful operation
 */
export function createOptionsFindPetsByStatus200(data: NonNullable<Partial<OptionsFindPetsByStatus200>> = []) {
  faker.seed([220])
  return [...(faker.helpers.arrayElements([createPet()]) as any), ...data]
}

/**
 * @description successful operation
 */
export function createOptionsFindPetsByStatusMutationResponse(data: NonNullable<Partial<OptionsFindPetsByStatusMutationResponse>> = []) {
  faker.seed([220])
  return [...(faker.helpers.arrayElements([createPet()]) as any), ...data]
}

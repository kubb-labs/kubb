import type { AddFilesMutationResponse } from '../../models/ts/petController/AddFiles.ts'
import { createPetFaker } from '../createPetFaker.ts'
import { faker } from '@faker-js/faker'

/**
 * @description successful operation
 */
export function createAddFiles200Faker() {
  return createPetFaker()
}

/**
 * @description Invalid input
 */
export function createAddFiles405Faker() {
  return undefined
}

export function createAddFilesMutationRequestFaker() {
  return createPetFaker()
}

export function createAddFilesMutationResponseFaker(data?: Partial<AddFilesMutationResponse>): AddFilesMutationResponse {
  return data || faker.helpers.arrayElement<any>([createAddFiles200Faker()])
}

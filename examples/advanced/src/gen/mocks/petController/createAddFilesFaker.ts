import type { AddFiles200, AddFilesMutationRequest, AddFilesMutationResponse } from '../../models/ts/petController/AddFiles.ts'
import { createPetFaker } from '../createPetFaker.ts'
import { faker } from '@faker-js/faker'

/**
 * @description successful operation
 */
export function createAddFiles200Faker(data?: Partial<AddFiles200>): AddFiles200 {
  return createPetFaker(data)
}

/**
 * @description Invalid input
 */
export function createAddFiles405Faker() {
  return undefined
}

export function createAddFilesMutationRequestFaker(data?: Partial<AddFilesMutationRequest>): AddFilesMutationRequest {
  return createPetFaker(data)
}

export function createAddFilesMutationResponseFaker(data?: Partial<AddFilesMutationResponse>): AddFilesMutationResponse {
  return data || faker.helpers.arrayElement<any>([createAddFiles200Faker()])
}

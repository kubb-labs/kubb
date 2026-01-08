import type { AddFilesResponseData } from '../../models/ts/petController/AddFiles.ts'
import { createPetFaker } from '../createPetFaker.ts'
import { faker } from '@faker-js/faker'

/**
 * @description successful operation
 */
export function createAddFilesStatus200Faker() {
  return createPetFaker()
}

/**
 * @description Invalid input
 */
export function createAddFilesStatus405Faker() {
  return undefined
}

export function createAddFilesRequestDataFaker() {
  return createPetFaker()
}

export function createAddFilesResponseDataFaker(data?: Partial<AddFilesResponseData>): AddFilesResponseData {
  return data || faker.helpers.arrayElement<any>([createAddFilesStatus200Faker()])
}

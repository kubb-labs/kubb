import type { AppControllerGetStatusQueryResponse } from '../../models/ts/appController/AppControllerGetStatus.ts'
import { faker } from '@faker-js/faker'

/**
 * @description Returns the status of the application
 */
export function createAppControllerGetStatus200Faker() {
  return undefined
}

export function createAppControllerGetStatusQueryResponseFaker(data?: Partial<AppControllerGetStatusQueryResponse>): AppControllerGetStatusQueryResponse {
  return data || faker.helpers.arrayElement<any>([createAppControllerGetStatus200Faker()])
}

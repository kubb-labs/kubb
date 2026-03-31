import { faker } from '@faker-js/faker'
import type {
  CreateUsersWithListInput200,
  CreateUsersWithListInputMutationRequest,
  CreateUsersWithListInputMutationResponse,
} from '../../models/ts/userController/CreateUsersWithListInput.ts'
import { createUserFaker } from '../createUserFaker.ts'

/**
 * @description Successful operation
 */
export function createCreateUsersWithListInput200Faker(data?: Partial<CreateUsersWithListInput200>): CreateUsersWithListInput200 {
  return createUserFaker(data)
}

/**
 * @description successful operation
 */
export function createCreateUsersWithListInputErrorFaker() {
  return undefined
}

export function createCreateUsersWithListInputMutationRequestFaker(data?: CreateUsersWithListInputMutationRequest): CreateUsersWithListInputMutationRequest {
  return [...faker.helpers.multiple(() => createUserFaker()), ...(data || [])]
}

export function createCreateUsersWithListInputMutationResponseFaker(
  data?: Partial<CreateUsersWithListInputMutationResponse>,
): CreateUsersWithListInputMutationResponse {
  return data || faker.helpers.arrayElement<any>([createCreateUsersWithListInput200Faker()])
}

import { faker } from '@faker-js/faker'
import { createUser } from '../createUser'
import {
  CreateUsersWithListInput200,
  CreateUsersWithListInputError,
  CreateUsersWithListInputMutationRequest,
  CreateUsersWithListInputMutationResponse,
} from '../../models/ts/userController/CreateUsersWithListInput'

/**
 * @description Successful operation
 */
export function createCreateUsersWithListInput200(override?: NonNullable<Partial<CreateUsersWithListInput200>>): NonNullable<CreateUsersWithListInput200> {
  return createUser(override)
}

/**
 * @description successful operation
 */
export function createCreateUsersWithListInputError(
  override?: NonNullable<Partial<CreateUsersWithListInputError>>,
): NonNullable<CreateUsersWithListInputError> {
  return undefined
}

export function createCreateUsersWithListInputMutationRequest(
  override: NonNullable<Partial<CreateUsersWithListInputMutationRequest>> = [],
): NonNullable<CreateUsersWithListInputMutationRequest> {
  return [
    ...faker.helpers.arrayElements([createUser()]) as any,
    ...override,
  ]
}

/**
 * @description Successful operation
 */
export function createCreateUsersWithListInputMutationResponse(
  override?: NonNullable<Partial<CreateUsersWithListInputMutationResponse>>,
): NonNullable<CreateUsersWithListInputMutationResponse> {
  return createUser(override)
}

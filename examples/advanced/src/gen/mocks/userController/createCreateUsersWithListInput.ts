import { faker } from '@faker-js/faker'
import { createUser } from '../createUser'
import type {
  CreateUsersWithListInputError,
  CreateUsersWithListInputMutationRequest,
  CreateUsersWithListInputMutationResponse,
} from '../../models/ts/userController/CreateUsersWithListInput'

/**
 * @description successful operation
 */

export function createCreateUsersWithListInputError(override?: Partial<CreateUsersWithListInputError>): NonNullable<CreateUsersWithListInputError> {
  return undefined
}

export function createCreateUsersWithListInputMutationRequest(
  override: Partial<CreateUsersWithListInputMutationRequest> = [],
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
  override?: Partial<CreateUsersWithListInputMutationResponse>,
): NonNullable<CreateUsersWithListInputMutationResponse> {
  return createUser(override)
}

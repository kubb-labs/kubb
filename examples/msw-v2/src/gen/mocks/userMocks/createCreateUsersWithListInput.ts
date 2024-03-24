import { faker } from '@faker-js/faker'
import { createUser } from '../createUser'
import type {
  CreateUsersWithListInput200,
  CreateUsersWithListInputError,
  CreateUsersWithListInputMutationRequest,
  CreateUsersWithListInputMutationResponse,
} from '../../models/CreateUsersWithListInput'

/**
 * @description Successful operation
 */
export function createCreateUsersWithListInput200(override?: NonNullable<Partial<CreateUsersWithListInput200>>): NonNullable<CreateUsersWithListInput200> {
  faker.seed([220])
  return createUser(override)
}

/**
 * @description successful operation
 */
export function createCreateUsersWithListInputError(
  override?: NonNullable<Partial<CreateUsersWithListInputError>>,
): NonNullable<CreateUsersWithListInputError> {
  faker.seed([220])
  return undefined
}

export function createCreateUsersWithListInputMutationRequest(
  override: NonNullable<Partial<CreateUsersWithListInputMutationRequest>> = [],
): NonNullable<CreateUsersWithListInputMutationRequest> {
  faker.seed([220])
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
  faker.seed([220])
  return createUser(override)
}

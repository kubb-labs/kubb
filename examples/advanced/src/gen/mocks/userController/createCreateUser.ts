import { createUser } from "../createUser";
import { CreateUserMutationResponse } from "../../models/ts/userController/CreateUser";
import { CreateUserError } from "../../models/ts/userController/CreateUser";
import { CreateUserMutationRequest } from "../../models/ts/userController/CreateUser";


export function createCreateUserMutationResponse(): NonNullable<CreateUserMutationResponse> {
  return undefined;
}
  
/**
 * @description successful operation
 */

export function createCreateUserError(): NonNullable<CreateUserError> {
  return createUser();
}
  
/**
 * @description Created user object
 */

export function createCreateUserMutationRequest(): NonNullable<CreateUserMutationRequest> {
  return createUser();
}
  
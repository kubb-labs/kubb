import { faker } from "@faker-js/faker";

import { createUser } from "../createUser";
import { UpdateUserError } from "../../models/ts/userController/UpdateUser";
import { UpdateUserMutationResponse } from "../../models/ts/userController/UpdateUser";
import { UpdateUserPathParams } from "../../models/ts/userController/UpdateUser";
import { UpdateUserMutationRequest } from "../../models/ts/userController/UpdateUser";

/**
 * @description successful operation
 */

export function createUpdateUserError(): NonNullable<UpdateUserError> {
  return undefined;
}
  

export function createUpdateUserMutationResponse(): NonNullable<UpdateUserMutationResponse> {
  return undefined;
}
  

export function createUpdateUserPathParams(): NonNullable<UpdateUserPathParams> {
  return {"username": faker.string.alpha()};
}
  
/**
 * @description Update an existent user in the store
 */

export function createUpdateUserMutationRequest(): NonNullable<UpdateUserMutationRequest> {
  return createUser();
}
  
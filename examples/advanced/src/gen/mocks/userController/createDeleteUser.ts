import { faker } from "@faker-js/faker";

import { DeleteUser400 } from "../../models/ts/userController/DeleteUser";
import { DeleteUser404 } from "../../models/ts/userController/DeleteUser";
import { DeleteUserMutationResponse } from "../../models/ts/userController/DeleteUser";
import { DeleteUserPathParams } from "../../models/ts/userController/DeleteUser";

/**
 * @description Invalid username supplied
 */

export function createDeleteUser400(): NonNullable<DeleteUser400> {
  return undefined;
}
  
/**
 * @description User not found
 */

export function createDeleteUser404(): NonNullable<DeleteUser404> {
  return undefined;
}
  

export function createDeleteUserMutationResponse(): NonNullable<DeleteUserMutationResponse> {
  return undefined;
}
  

export function createDeleteUserPathParams(): NonNullable<DeleteUserPathParams> {
  return {"username": faker.string.alpha()};
}
  
import type { User } from "./User";

 /**
 * @description Successful operation
*/
export type CreateUsersWithListInput200 = User;
/**
 * @description successful operation
*/
export type CreateUsersWithListInputError = any;
export type CreateUsersWithListInputMutationRequest = User[];
/**
 * @description Successful operation
*/
export type CreateUsersWithListInputMutationResponse = User;
export type CreateUsersWithListInputMutation = {
    Response: CreateUsersWithListInputMutationResponse;
    Request: CreateUsersWithListInputMutationRequest;
};
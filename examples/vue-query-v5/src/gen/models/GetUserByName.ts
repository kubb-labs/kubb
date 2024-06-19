import type { User } from "./User";

 export type GetUserByNamePathParams = {
    /**
     * @description The name that needs to be fetched. Use user1 for testing.
     * @type string
    */
    username: string;
};
/**
 * @description successful operation
*/
export type GetUserByName200 = User;
/**
 * @description Invalid username supplied
*/
export type GetUserByName400 = any;
/**
 * @description User not found
*/
export type GetUserByName404 = any;
/**
 * @description successful operation
*/
export type GetUserByNameQueryResponse = User;
export type GetUserByNameQuery = {
    Response: GetUserByNameQueryResponse;
    PathParams: GetUserByNamePathParams;
    Errors: GetUserByName400 | GetUserByName404;
};
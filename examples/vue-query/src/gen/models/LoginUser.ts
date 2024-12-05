export type LoginUserQueryParams = {
    /**
     * @description The user name for login
     * @type string | undefined
    */
    username?: string;
    /**
     * @description The password for login in clear text
     * @type string | undefined
    */
    password?: string;
};

 /**
 * @description successful operation
*/
export type LoginUser200 = string;

 /**
 * @description Invalid username/password supplied
*/
export type LoginUser400 = any;

 export type LoginUserQueryResponse = LoginUser200;

 export type LoginUserQuery = {
    Response: LoginUser200;
    QueryParams: LoginUserQueryParams;
    Errors: LoginUser400;
};
import type { PageBankConnection } from "./PageBankConnection.ts";

export type ListLinkedAccountsQueryParams = {
    /**
     * @type string
    */
    cursor?: string | null;
    /**
     * @type integer, int32
    */
    limit?: number | null;
};

/**
 * @description Returns a list of bank connections
*/
export type ListLinkedAccounts200 = PageBankConnection;

/**
 * @description Bad request
*/
export type ListLinkedAccounts400 = any;

/**
 * @description Unauthorized
*/
export type ListLinkedAccounts401 = any;

/**
 * @description Forbidden
*/
export type ListLinkedAccounts403 = any;

export type ListLinkedAccountsQueryResponse = ListLinkedAccounts200;

export type ListLinkedAccountsQuery = {
    Response: ListLinkedAccounts200;
    QueryParams: ListLinkedAccountsQueryParams;
    Errors: ListLinkedAccounts400 | ListLinkedAccounts401 | ListLinkedAccounts403;
};
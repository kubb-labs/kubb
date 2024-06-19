export type DeleteOrderPathParams = {
    /**
     * @description ID of the order that needs to be deleted
     * @type integer, int64
    */
    orderId: number;
};
/**
 * @description Invalid ID supplied
*/
export type DeleteOrder400 = any;
/**
 * @description Order not found
*/
export type DeleteOrder404 = any;
export type DeleteOrderMutationResponse = any;
export type DeleteOrderMutation = {
    Response: DeleteOrderMutationResponse;
    PathParams: DeleteOrderPathParams;
    Errors: DeleteOrder400 | DeleteOrder404;
};
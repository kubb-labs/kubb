/**
 * @description Invalid ID supplied
*/
export type DeleteOrder400 = any | null;

 /**
 * @description Order not found
*/
export type DeleteOrder404 = any | null;

 export type DeleteOrderMutationResponse = any | null;

 export type DeleteOrderPathParams = {
    /**
     * @description ID of the order that needs to be deleted
     * @type integer int64
    */
    orderId: number;
};
export namespace DeleteOrderMutation {
    export type Response = DeleteOrderMutationResponse;
    export type PathParams = DeleteOrderPathParams;
    export type Errors = DeleteOrder400 | DeleteOrder404;
}
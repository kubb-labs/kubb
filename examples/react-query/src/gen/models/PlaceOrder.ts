import type { Order } from "./Order";

 /**
 * @description successful operation
*/
export type PlaceOrder200 = Order;

 /**
 * @description Invalid input
*/
export type PlaceOrder405 = any;

 export type PlaceOrderMutationRequest = Order;

 export type PlaceOrderMutationResponse = PlaceOrder200;

 export type PlaceOrderMutation = {
    Response: PlaceOrder200;
    Request: PlaceOrderMutationRequest;
    Errors: PlaceOrder405;
};
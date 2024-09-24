import client from "@kubb/plugin-client/client";
import type { PlaceOrderMutationRequest, PlaceOrderMutationResponse, PlaceOrder405 } from "../models/PlaceOrder.ts";
import type { RequestConfig } from "@kubb/plugin-client/client";
import type { MutationObserverOptions, MutationKey } from "@tanstack/vue-query";
import type { MaybeRef } from "vue";
import { useMutation } from "@tanstack/vue-query";

 export const placeOrderMutationKey = () => [{ "url": "/store/order" }] as const;

 export type PlaceOrderMutationKey = ReturnType<typeof placeOrderMutationKey>;

 /**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * @link /store/order
 */
async function placeOrder(data?: PlaceOrderMutationRequest, config: Partial<RequestConfig<PlaceOrderMutationRequest>> = {}) {
    const res = await client<PlaceOrderMutationResponse, PlaceOrder405, PlaceOrderMutationRequest>({ method: "POST", url: `/store/order`, baseURL: "https://petstore3.swagger.io/api/v3", data, ...config });
    return res.data;
}

 /**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * @link /store/order
 */
export function usePlaceOrder(options: {
    mutation?: MutationObserverOptions<PlaceOrderMutationResponse, PlaceOrder405, {
        data?: MaybeRef<PlaceOrderMutationRequest>;
    }>;
    client?: Partial<RequestConfig<PlaceOrderMutationRequest>>;
} = {}) {
    const { mutation: mutationOptions, client: config = {} } = options ?? {};
    const mutationKey = mutationOptions?.mutationKey ?? placeOrderMutationKey();
    return useMutation<PlaceOrderMutationResponse, PlaceOrder405, {
        data?: PlaceOrderMutationRequest;
    }>({
        mutationFn: async ({ data }) => {
            return placeOrder(data, config);
        },
        mutationKey,
        ...mutationOptions
    });
}
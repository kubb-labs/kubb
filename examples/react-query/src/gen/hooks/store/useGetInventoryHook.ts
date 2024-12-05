import client from "@kubb/plugin-client/client";
import type { GetInventoryQueryResponse } from "../../models/GetInventory";
import type { RequestConfig } from "@kubb/plugin-client/client";
import { queryOptions } from "@tanstack/react-query";

 export const getInventoryQueryKey = () => ["v5", { url: "/store/inventory" }] as const;

 export type GetInventoryQueryKey = ReturnType<typeof getInventoryQueryKey>;

 /**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * {@link /store/inventory}
 */
async function getInventoryHook(config: Partial<RequestConfig> = {}) {
    const res = await client<GetInventoryQueryResponse, Error, unknown>({ method: "GET", url: `/store/inventory`, ...config });
    return res.data;
}

 export function getInventoryQueryOptionsHook(config: Partial<RequestConfig> = {}) {
    const queryKey = getInventoryQueryKey();
    return queryOptions({
        queryKey,
        queryFn: async ({ signal }) => {
            config.signal = signal;
            return getInventoryHook(config);
        },
    });
}
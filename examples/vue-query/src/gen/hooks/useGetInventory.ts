import client from "@kubb/swagger-client/client";
import { useQuery } from "@tanstack/vue-query";
import type { GetInventoryQueryResponse } from "../models/GetInventory";
import type { UseQueryReturnType, QueryKey, WithRequired } from "@tanstack/vue-query";
import type { VueQueryObserverOptions } from "@tanstack/vue-query/build/lib/types";

 type GetInventoryClient = typeof client<GetInventoryQueryResponse, never, never>;
type GetInventory = {
    data: GetInventoryQueryResponse;
    error: never;
    request: never;
    pathParams: never;
    queryParams: never;
    headerParams: never;
    response: GetInventoryQueryResponse;
    client: {
        parameters: Partial<Parameters<GetInventoryClient>[0]>;
        return: Awaited<ReturnType<GetInventoryClient>>;
    };
};
export const getInventoryQueryKey = () => [{ url: "/store/inventory" }] as const;
export type GetInventoryQueryKey = ReturnType<typeof getInventoryQueryKey>;
export function getInventoryQueryOptions<TData = GetInventory["response"], TQueryData = GetInventory["response"]>(options: GetInventory["client"]["parameters"] = {}): WithRequired<VueQueryObserverOptions<GetInventory["response"], GetInventory["error"], TData, TQueryData>, "queryKey"> {
    const queryKey = getInventoryQueryKey();
    return {
        queryKey,
        queryFn: async () => {
            const res = await client<GetInventory["data"], GetInventory["error"]>({
                method: "get",
                url: `/store/inventory`,
                ...options
            });
            return res.data;
        },
    };
}
/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * @link /store/inventory
 */
export function useGetInventory<TData = GetInventory["response"], TQueryData = GetInventory["response"], TQueryKey extends QueryKey = GetInventoryQueryKey>(options: {
    query?: Partial<VueQueryObserverOptions<GetInventory["response"], GetInventory["error"], TData, TQueryKey>>;
    client?: GetInventory["client"]["parameters"];
} = {}): UseQueryReturnType<TData, GetInventory["error"]> & {
    queryKey: TQueryKey;
} {
    const { query: queryOptions, client: clientOptions = {} } = options ?? {};
    const queryKey = queryOptions?.queryKey ?? getInventoryQueryKey();
    const query = useQuery<GetInventory["data"], GetInventory["error"], TData, any>({
        ...getInventoryQueryOptions<TData, TQueryData>(clientOptions),
        queryKey,
        ...queryOptions
    }) as UseQueryReturnType<TData, GetInventory["error"]> & {
        queryKey: TQueryKey;
    };
    query.queryKey = queryKey as TQueryKey;
    return query;
}
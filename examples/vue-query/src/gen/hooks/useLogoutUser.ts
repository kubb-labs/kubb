import client from "@kubb/plugin-client/client";
import type { LogoutUserQueryResponse } from "../models/LogoutUser.ts";
import type { RequestConfig } from "@kubb/plugin-client/client";
import type { QueryKey, QueryObserverOptions } from "@tanstack/vue-query";
import { useQuery, queryOptions } from "@tanstack/vue-query";
import { unref } from "vue";

 export const logoutUserQueryKey = () => [{ url: "/user/logout" }] as const;

 export type LogoutUserQueryKey = ReturnType<typeof logoutUserQueryKey>;

 /**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
async function logoutUser(config: Partial<RequestConfig> = {}) {
    const res = await client<LogoutUserQueryResponse, Error, unknown>({ method: "GET", url: `/user/logout`, baseURL: "https://petstore3.swagger.io/api/v3", ...config });
    return res.data;
}

 export function logoutUserQueryOptions(config: Partial<RequestConfig> = {}) {
    const queryKey = logoutUserQueryKey();
    return queryOptions({
        queryKey,
        queryFn: async () => {
            return logoutUser(unref(config));
        },
    });
}

 /**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
export function useLogoutUser<TData = LogoutUserQueryResponse, TQueryData = LogoutUserQueryResponse, TQueryKey extends QueryKey = LogoutUserQueryKey>(options: {
    query?: Partial<QueryObserverOptions<LogoutUserQueryResponse, Error, TData, TQueryData, TQueryKey>>;
    client?: Partial<RequestConfig>;
} = {}) {
    const { query: queryOptions, client: config = {} } = options ?? {};
    const queryKey = queryOptions?.queryKey ?? logoutUserQueryKey();
    const query = useQuery({
        ...logoutUserQueryOptions(config) as unknown as QueryObserverOptions,
        queryKey,
        ...queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">
    }) as ReturnType<typeof query> & {
        queryKey: TQueryKey;
    };
    query.queryKey = queryKey as TQueryKey;
    return query;
}
import client from "../../../../tanstack-query-client.ts";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import type { LogoutUserQueryResponse, LogoutUserError } from "../../../models/ts/userController/LogoutUser";
import type { UseBaseQueryOptions, UseQueryResult, QueryKey, WithRequired, UseInfiniteQueryOptions, UseInfiniteQueryResult, InfiniteData } from "@tanstack/react-query";

type LogoutUserClient = typeof client<LogoutUserQueryResponse, LogoutUserError, never>;
type LogoutUser = {
    data: LogoutUserQueryResponse;
    error: LogoutUserError;
    request: never;
    pathParams: never;
    queryParams: never;
    headerParams: never;
    response: Awaited<ReturnType<LogoutUserClient>>;
    client: {
        parameters: Partial<Parameters<LogoutUserClient>[0]>;
        return: Awaited<ReturnType<LogoutUserClient>>;
    };
};
export const logoutUserQueryKey = () => [{ url: "/user/logout" }] as const;
export type LogoutUserQueryKey = ReturnType<typeof logoutUserQueryKey>;
export function logoutUserQueryOptions<TData = LogoutUser["response"], TQueryData = LogoutUser["response"]>(options: LogoutUser["client"]["parameters"] = {}): WithRequired<UseBaseQueryOptions<LogoutUser["response"], LogoutUser["error"], TData, TQueryData>, "queryKey"> {
    const queryKey = logoutUserQueryKey();
    return {
        queryKey,
        queryFn: async () => {
            const res = await client<LogoutUser["data"], LogoutUser["error"]>({
                method: "get",
                url: `/user/logout`,
                ...options
            });
            return res;
        },
    };
}
/**
     * @summary Logs out current logged in user session
     * @link /user/logout */
export function useLogoutUser<TData = LogoutUser["response"], TQueryData = LogoutUser["response"], TQueryKey extends QueryKey = LogoutUserQueryKey>(options: {
    query?: Partial<UseBaseQueryOptions<LogoutUser["response"], LogoutUser["error"], TData, TQueryData, TQueryKey>>;
    client?: LogoutUser["client"]["parameters"];
} = {}): UseQueryResult<TData, LogoutUser["error"]> & {
    queryKey: TQueryKey;
} {
    const { query: queryOptions, client: clientOptions = {} } = options ?? {};
    const queryKey = queryOptions?.queryKey ?? logoutUserQueryKey();
    const query = useQuery<LogoutUser["data"], LogoutUser["error"], TData, any>({
        ...logoutUserQueryOptions<TData, TQueryData>(clientOptions),
        queryKey,
        ...queryOptions
    }) as UseQueryResult<TData, LogoutUser["error"]> & {
        queryKey: TQueryKey;
    };
    query.queryKey = queryKey as TQueryKey;
    return query;
}
export const logoutUserInfiniteQueryKey = () => [{ url: "/user/logout" }] as const;
export type LogoutUserInfiniteQueryKey = ReturnType<typeof logoutUserInfiniteQueryKey>;
export function logoutUserInfiniteQueryOptions<TData = LogoutUser["response"], TQueryData = LogoutUser["response"]>(options: LogoutUser["client"]["parameters"] = {}): WithRequired<UseInfiniteQueryOptions<LogoutUser["response"], LogoutUser["error"], TData, TQueryData>, "queryKey"> {
    const queryKey = logoutUserInfiniteQueryKey();
    return {
        queryKey,
        queryFn: async ({ pageParam }) => {
            const res = await client<LogoutUser["data"], LogoutUser["error"]>({
                method: "get",
                url: `/user/logout`,
                ...options
            });
            return res;
        },
    };
}
/**
     * @summary Logs out current logged in user session
     * @link /user/logout */
export function useLogoutUserInfinite<TData = InfiniteData<LogoutUser["response"]>, TQueryData = LogoutUser["response"], TQueryKey extends QueryKey = LogoutUserInfiniteQueryKey>(options: {
    query?: Partial<UseInfiniteQueryOptions<LogoutUser["response"], LogoutUser["error"], TData, TQueryData, TQueryKey>>;
    client?: LogoutUser["client"]["parameters"];
} = {}): UseInfiniteQueryResult<TData, LogoutUser["error"]> & {
    queryKey: TQueryKey;
} {
    const { query: queryOptions, client: clientOptions = {} } = options ?? {};
    const queryKey = queryOptions?.queryKey ?? logoutUserInfiniteQueryKey();
    const query = useInfiniteQuery<LogoutUser["data"], LogoutUser["error"], TData, any>({
        ...logoutUserInfiniteQueryOptions<TData, TQueryData>(clientOptions),
        queryKey,
        ...queryOptions
    }) as UseInfiniteQueryResult<TData, LogoutUser["error"]> & {
        queryKey: TQueryKey;
    };
    query.queryKey = queryKey as TQueryKey;
    return query;
}
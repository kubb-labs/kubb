import client from "@kubb/swagger-client/client";
import { createQuery, createInfiniteQuery } from "@tanstack/svelte-query";
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from "../models/GetPetById";
import type { CreateBaseQueryOptions, CreateQueryResult, QueryKey, WithRequired, CreateInfiniteQueryOptions, CreateInfiniteQueryResult, InfiniteData } from "@tanstack/svelte-query";

 type GetPetByIdClient = typeof client<GetPetByIdQueryResponse, GetPetById400 | GetPetById404, never>;
type GetPetById = {
    data: GetPetByIdQueryResponse;
    error: GetPetById400 | GetPetById404;
    request: never;
    pathParams: GetPetByIdPathParams;
    queryParams: never;
    headerParams: never;
    response: GetPetByIdQueryResponse;
    client: {
        parameters: Partial<Parameters<GetPetByIdClient>[0]>;
        return: Awaited<ReturnType<GetPetByIdClient>>;
    };
};
export const getPetByIdQueryKey = (petId: GetPetByIdPathParams["petId"]) => [{ url: "/pet/:petId", params: { petId: petId } }] as const;
export type GetPetByIdQueryKey = ReturnType<typeof getPetByIdQueryKey>;
export function getPetByIdQueryOptions<TData = GetPetById["response"], TQueryData = GetPetById["response"]>(petId: GetPetByIdPathParams["petId"], options: GetPetById["client"]["parameters"] = {}): WithRequired<CreateBaseQueryOptions<GetPetById["response"], GetPetById["error"], TData, TQueryData>, "queryKey"> {
    const queryKey = getPetByIdQueryKey(petId);
    return {
        queryKey,
        queryFn: async () => {
            const res = await client<GetPetById["data"], GetPetById["error"]>({
                method: "get",
                url: `/pet/${petId}`,
                ...options
            });
            return res.data;
        },
    };
}
/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */
export function getPetByIdQuery<TData = GetPetById["response"], TQueryData = GetPetById["response"], TQueryKey extends QueryKey = GetPetByIdQueryKey>(petId: GetPetByIdPathParams["petId"], options: {
    query?: Partial<CreateBaseQueryOptions<GetPetById["response"], GetPetById["error"], TData, TQueryData, TQueryKey>>;
    client?: GetPetById["client"]["parameters"];
} = {}): CreateQueryResult<TData, GetPetById["error"]> & {
    queryKey: TQueryKey;
} {
    const { query: queryOptions, client: clientOptions = {} } = options ?? {};
    const queryKey = queryOptions?.queryKey ?? getPetByIdQueryKey(petId);
    const query = createQuery<GetPetById["data"], GetPetById["error"], TData, any>({
        ...getPetByIdQueryOptions<TData, TQueryData>(petId, clientOptions),
        queryKey,
        ...queryOptions
    }) as CreateQueryResult<TData, GetPetById["error"]> & {
        queryKey: TQueryKey;
    };
    query.queryKey = queryKey as TQueryKey;
    return query;
}
export const getPetByIdInfiniteQueryKey = (petId: GetPetByIdPathParams["petId"]) => [{ url: "/pet/:petId", params: { petId: petId } }] as const;
export type GetPetByIdInfiniteQueryKey = ReturnType<typeof getPetByIdInfiniteQueryKey>;
export function getPetByIdInfiniteQueryOptions<TData = GetPetById["response"], TQueryData = GetPetById["response"]>(petId: GetPetByIdPathParams["petId"], options: GetPetById["client"]["parameters"] = {}): WithRequired<CreateInfiniteQueryOptions<GetPetById["response"], GetPetById["error"], TData, TQueryData>, "queryKey"> {
    const queryKey = getPetByIdInfiniteQueryKey(petId);
    return {
        queryKey,
        queryFn: async ({ pageParam }) => {
            const res = await client<GetPetById["data"], GetPetById["error"]>({
                method: "get",
                url: `/pet/${petId}`,
                ...options
            });
            return res.data;
        },
    };
}
/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */
export function getPetByIdQueryInfinite<TData = InfiniteData<GetPetById["response"]>, TQueryData = GetPetById["response"], TQueryKey extends QueryKey = GetPetByIdInfiniteQueryKey>(petId: GetPetByIdPathParams["petId"], options: {
    query?: Partial<CreateInfiniteQueryOptions<GetPetById["response"], GetPetById["error"], TData, TQueryData, TQueryKey>>;
    client?: GetPetById["client"]["parameters"];
} = {}): CreateInfiniteQueryResult<TData, GetPetById["error"]> & {
    queryKey: TQueryKey;
} {
    const { query: queryOptions, client: clientOptions = {} } = options ?? {};
    const queryKey = queryOptions?.queryKey ?? getPetByIdInfiniteQueryKey(petId);
    const query = createInfiniteQuery<GetPetById["data"], GetPetById["error"], TData, any>({
        ...getPetByIdInfiniteQueryOptions<TData, TQueryData>(petId, clientOptions),
        queryKey,
        ...queryOptions
    }) as CreateInfiniteQueryResult<TData, GetPetById["error"]> & {
        queryKey: TQueryKey;
    };
    query.queryKey = queryKey as TQueryKey;
    return query;
}
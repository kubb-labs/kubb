import client from "@kubb/plugin-client/client";
import { useQuery, queryOptions } from "@tanstack/react-query";
import type { QueryObserverOptions, UseQueryResult, QueryKey } from "@tanstack/react-query";

 type UpdatePetWithFormClient = typeof client<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, UpdatePetWithFormMutationRequest>;
type UpdatePetWithForm = {
    data: UpdatePetWithFormMutationResponse;
    error: UpdatePetWithForm405;
    request: UpdatePetWithFormMutationRequest;
    pathParams: UpdatePetWithFormPathParams;
    queryParams: UpdatePetWithFormQueryParams;
    headerParams: never;
    response: UpdatePetWithFormMutationResponse;
    client: {
        parameters: Partial<Parameters<UpdatePetWithFormClient>[0]>;
        return: Awaited<ReturnType<UpdatePetWithFormClient>>;
    };
};
export const UpdatePetWithFormQueryKey = ({ petId }: {
    petId: UpdatePetWithFormPathParams["petId"];
}, params?: UpdatePetWithForm["queryParams"], data?: UpdatePetWithForm["request"]) => [{ url: "/pet/:petId", params: { petId: petId } }, ...(params ? [params] : []), ...(data ? [data] : [])] as const;
export type UpdatePetWithFormQueryKey = ReturnType<typeof UpdatePetWithFormQueryKey>;
export function UpdatePetWithFormQueryOptions({ petId }: {
    petId: UpdatePetWithFormPathParams["petId"];
}, params?: UpdatePetWithForm["queryParams"], data?: UpdatePetWithForm["request"], options: UpdatePetWithForm["client"]["parameters"] = {}) {
    const queryKey = UpdatePetWithFormQueryKey({ petId }, params, data);
    return queryOptions({
        queryKey,
        queryFn: async () => {
            const res = await client<UpdatePetWithForm["data"], UpdatePetWithForm["error"]>({
                method: "post",
                url: `/pet/${petId}`,
                params,
                data,
                ...options
            });
            return res.data;
        },
    });
}
/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export function updatePetWithForm<TData = UpdatePetWithForm["response"], TQueryData = UpdatePetWithForm["response"], TQueryKey extends QueryKey = UpdatePetWithFormQueryKey>({ petId }: {
    petId: UpdatePetWithFormPathParams["petId"];
}, params?: UpdatePetWithForm["queryParams"], data?: UpdatePetWithForm["request"], options: {
    query?: Partial<QueryObserverOptions<UpdatePetWithForm["response"], UpdatePetWithForm["error"], TData, TQueryData, TQueryKey>>;
    client?: UpdatePetWithForm["client"]["parameters"];
} = {}): UseQueryResult<TData, UpdatePetWithForm["error"]> & {
    queryKey: TQueryKey;
} {
    const { query: queryOptions, client: clientOptions = {} } = options ?? {};
    const queryKey = queryOptions?.queryKey ?? UpdatePetWithFormQueryKey({ petId }, params, data);
    const query = useQuery({
        ...UpdatePetWithFormQueryOptions({ petId }, params, data, clientOptions) as unknown as QueryObserverOptions,
        queryKey,
        ...queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">
    }) as UseQueryResult<TData, UpdatePetWithForm["error"]> & {
        queryKey: TQueryKey;
    };
    query.queryKey = queryKey as TQueryKey;
    return query;
}

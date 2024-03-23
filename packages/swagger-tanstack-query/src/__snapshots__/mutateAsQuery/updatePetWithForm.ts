import client from "@kubb/swagger-client/client";
import { useQuery } from "@tanstack/react-query";
import type { UpdatePetWithFormMutationResponse, UpdatePetWithFormPathParams, UpdatePetWithFormQueryParams, UpdatePetWithForm405 } from "./";
import type { UseBaseQueryOptions, UseQueryResult, QueryKey, WithRequired } from "@tanstack/react-query";

 type UpdatePetWithFormClient = typeof client<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, never>;
type UpdatePetWithForm = {
    data: UpdatePetWithFormMutationResponse;
    error: UpdatePetWithForm405;
    request: never;
    pathParams: UpdatePetWithFormPathParams;
    queryParams: UpdatePetWithFormQueryParams;
    headerParams: never;
    response: UpdatePetWithFormMutationResponse;
    client: {
        parameters: Partial<Parameters<UpdatePetWithFormClient>[0]>;
        return: Awaited<ReturnType<UpdatePetWithFormClient>>;
    };
};
export const UpdatePetWithFormQueryKey = ({ petId }: UpdatePetWithFormPathParams, params?: UpdatePetWithForm["queryParams"]) => [{ url: "/pet/:petId", params: { petId: petId } }, ...(params ? [params] : [])] as const;
export type UpdatePetWithFormQueryKey = ReturnType<typeof UpdatePetWithFormQueryKey>;
export function UpdatePetWithFormQueryOptions<TData = UpdatePetWithForm["response"], TQueryData = UpdatePetWithForm["response"]>({ petId }: UpdatePetWithFormPathParams, params?: UpdatePetWithForm["queryParams"], options: UpdatePetWithForm["client"]["parameters"] = {}): WithRequired<UseBaseQueryOptions<UpdatePetWithForm["response"], UpdatePetWithForm["error"], TData, TQueryData>, "queryKey"> {
    const queryKey = UpdatePetWithFormQueryKey(petId, params);
    return {
        queryKey,
        queryFn: async () => {
            const res = await client<UpdatePetWithForm["data"], UpdatePetWithForm["error"]>({
                method: "post",
                url: `/pet/${petId}`,
                params,
                ...options
            });
            return res.data;
        },
    };
}
/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export function updatePetWithForm<TData = UpdatePetWithForm["response"], TQueryData = UpdatePetWithForm["response"], TQueryKey extends QueryKey = UpdatePetWithFormQueryKey>({ petId }: UpdatePetWithFormPathParams, params?: UpdatePetWithForm["queryParams"], options: {
    query?: Partial<UseBaseQueryOptions<UpdatePetWithForm["response"], UpdatePetWithForm["error"], TData, TQueryData, TQueryKey>>;
    client?: UpdatePetWithForm["client"]["parameters"];
} = {}): UseQueryResult<TData, UpdatePetWithForm["error"]> & {
    queryKey: TQueryKey;
} {
    const { query: queryOptions, client: clientOptions = {} } = options ?? {};
    const queryKey = queryOptions?.queryKey ?? UpdatePetWithFormQueryKey(petId, params);
    const query = useQuery<UpdatePetWithForm["data"], UpdatePetWithForm["error"], TData, any>({
        ...UpdatePetWithFormQueryOptions<TData, TQueryData>({ petId }, UpdatePetWithFormPathParams, params, clientOptions),
        queryKey,
        ...queryOptions
    }) as UseQueryResult<TData, UpdatePetWithForm["error"]> & {
        queryKey: TQueryKey;
    };
    query.queryKey = queryKey as TQueryKey;
    return query;
}

import client from "@kubb/plugin-client/client";
import type { UseBaseQueryOptions, QueryKey, WithRequired } from "@tanstack/react-query";

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

 export const getPetByIdQueryKey = ({ petId }: {
    petId: GetPetByIdPathParams["petId"];
}) => [{ url: "/pet/:petId", params: { petId: petId } }] as const;

 export type GetPetByIdQueryKey = ReturnType<typeof getPetByIdQueryKey>;

 export function getPetByIdQueryOptions<TData = GetPetById["response"], TQueryData = GetPetById["response"]>({ petId }: {
    petId: GetPetByIdPathParams["petId"];
}, options: GetPetById["client"]["parameters"] = {}): WithRequired<UseBaseQueryOptions<GetPetById["response"], GetPetById["error"], TData, TQueryData>, "queryKey"> {
    const queryKey = getPetByIdQueryKey({ petId });
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

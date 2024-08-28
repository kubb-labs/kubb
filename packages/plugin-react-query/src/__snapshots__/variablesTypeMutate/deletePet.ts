import client from "@kubb/plugin-client/client";
import type { QueryKey } from "@tanstack/react-query";

 type DeletePetClient = typeof client<DeletePetMutationResponse, DeletePet400, never>;

 type DeletePet = {
    data: DeletePetMutationResponse;
    error: DeletePet400;
    request: never;
    pathParams: DeletePetPathParams;
    queryParams: never;
    headerParams: DeletePetHeaderParams;
    response: DeletePetMutationResponse;
    client: {
        parameters: Partial<Parameters<DeletePetClient>[0]>;
        return: Awaited<ReturnType<DeletePetClient>>;
    };
};

 export const deletePetQueryKey = ({ petId }: {
    petId: DeletePetPathParams["petId"];
}) => [{ url: "/pet/:petId", params: { petId: petId } }] as const;

 export type DeletePetQueryKey = ReturnType<typeof deletePetQueryKey>;

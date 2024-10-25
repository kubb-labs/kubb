import { http } from "msw";

 export function deletePetsPetid(data?: DeletePetsPetidMutationResponse) {
    return http.delete("*/pets/:petId", function handler(info) {
        return new Response(JSON.stringify(data), {
            headers: {
                "Content-Type": "application/json",
            },
        });
    });
}

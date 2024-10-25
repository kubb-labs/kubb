import { http } from "msw";

 export function createPets(data?: CreatePetsMutationResponse) {
    return http.post("*/pets", function handler(info) {
        return new Response(JSON.stringify(data), {
            headers: {
                "Content-Type": "application/json",
            },
        });
    });
}

import { http } from "msw";

 export const createPets = http.post("*/pets", function handler(info) {
    return new Response(JSON.stringify(createPetsMutationResponse()), {
        headers: {
            "Content-Type": "application/json",
        },
    });
});

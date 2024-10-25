import { listPets, createPets, showPetById } from "./findByTags";

 export const handlers = [listPets(), createPets(), showPetById()] as const;

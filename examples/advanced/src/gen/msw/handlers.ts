import { addFilesHandler } from "./petController/addFilesHandler.ts";
import { addPetHandler } from "./petController/addPetHandler.ts";
import { deletePetHandler } from "./petController/deletePetHandler.ts";
import { findPetsByStatusHandler } from "./petController/findPetsByStatusHandler.ts";
import { findPetsByTagsHandler } from "./petController/findPetsByTagsHandler.ts";
import { getPetByIdHandler } from "./petController/getPetByIdHandler.ts";
import { updatePetHandler } from "./petController/updatePetHandler.ts";
import { updatePetWithFormHandler } from "./petController/updatePetWithFormHandler.ts";
import { uploadFileHandler } from "./petController/uploadFileHandler.ts";
import { createPetsHandler } from "./petsController/createPetsHandler.ts";
import { createUserHandler } from "./userController/createUserHandler.ts";
import { createUsersWithListInputHandler } from "./userController/createUsersWithListInputHandler.ts";
import { deleteUserHandler } from "./userController/deleteUserHandler.ts";
import { getUserByNameHandler } from "./userController/getUserByNameHandler.ts";
import { loginUserHandler } from "./userController/loginUserHandler.ts";
import { logoutUserHandler } from "./userController/logoutUserHandler.ts";
import { updateUserHandler } from "./userController/updateUserHandler.ts";

export const handlers = [createPetsHandler(),updatePetHandler(),addPetHandler(),findPetsByStatusHandler(),findPetsByTagsHandler(),getPetByIdHandler(),updatePetWithFormHandler(),deletePetHandler(),addFilesHandler(),uploadFileHandler(),createUserHandler(),createUsersWithListInputHandler(),loginUserHandler(),logoutUserHandler(),getUserByNameHandler(),updateUserHandler(),deleteUserHandler()] as const
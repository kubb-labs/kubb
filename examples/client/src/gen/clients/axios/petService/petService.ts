/* eslint-disable no-alert, no-console */
import { addPet } from './addPet.js'
import { deletePet } from './deletePet.js'
import { findPetsByStatus } from './findPetsByStatus.js'
import { findPetsByTags } from './findPetsByTags.js'
import { getPetById } from './getPetById.js'
import { updatePet } from './updatePet.js'
import { updatePetWithForm } from './updatePetWithForm.js'
import { uploadFile } from './uploadFile.js'

export function petService() {
  return { updatePet, addPet, findPetsByStatus, findPetsByTags, getPetById, updatePetWithForm, deletePet, uploadFile }
}

import { createpetsHandler } from './petsController/createpetsHandler'
import { addpetHandler } from './petController/addpetHandler'
import { updatepetHandler } from './petController/updatepetHandler'
import { findpetsbystatusHandler } from './petController/findpetsbystatusHandler'
import { findpetsbytagsHandler } from './petController/findpetsbytagsHandler'
import { getpetbyidHandler } from './petController/getpetbyidHandler'
import { updatepetwithformHandler } from './petController/updatepetwithformHandler'
import { deletepetHandler } from './petController/deletepetHandler'
import { uploadfileHandler } from './petController/uploadfileHandler'
import { createuserHandler } from './userController/createuserHandler'
import { createuserswithlistinputHandler } from './userController/createuserswithlistinputHandler'
import { loginuserHandler } from './userController/loginuserHandler'
import { logoutuserHandler } from './userController/logoutuserHandler'
import { getuserbynameHandler } from './userController/getuserbynameHandler'
import { updateuserHandler } from './userController/updateuserHandler'
import { deleteuserHandler } from './userController/deleteuserHandler'

export const handlers = [
  createpetsHandler,
  addpetHandler,
  updatepetHandler,
  findpetsbystatusHandler,
  findpetsbytagsHandler,
  getpetbyidHandler,
  updatepetwithformHandler,
  deletepetHandler,
  uploadfileHandler,
  createuserHandler,
  createuserswithlistinputHandler,
  loginuserHandler,
  logoutuserHandler,
  getuserbynameHandler,
  updateuserHandler,
  deleteuserHandler,
] as const

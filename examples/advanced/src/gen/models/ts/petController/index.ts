export type { AddFilesRequest, AddFilesRequestData, AddFilesResponseData, AddFilesStatus200, AddFilesStatus405 } from './AddFiles.ts'
export type { AddPetRequest, AddPetRequestData, AddPetResponseData, AddPetStatus200, AddPetStatus405 } from './AddPet.ts'
export type { DeletePetHeaderParams, DeletePetPathParams, DeletePetRequest, DeletePetResponseData, DeletePetStatus400 } from './DeletePet.ts'
export type {
  FindPetsByStatusPathParams,
  FindPetsByStatusRequest,
  FindPetsByStatusResponseData,
  FindPetsByStatusStatus200,
  FindPetsByStatusStatus400,
} from './FindPetsByStatus.ts'
export type {
  FindPetsByTagsHeaderParams,
  FindPetsByTagsHeaderParamsXEXAMPLEEnumKey,
  FindPetsByTagsQueryParams,
  FindPetsByTagsRequest,
  FindPetsByTagsResponseData,
  FindPetsByTagsStatus200,
  FindPetsByTagsStatus400,
} from './FindPetsByTags.ts'
export { findPetsByTagsHeaderParamsXEXAMPLEEnum } from './FindPetsByTags.ts'
export type {
  GetPetByIdPathParams,
  GetPetByIdRequest,
  GetPetByIdResponseData,
  GetPetByIdStatus200,
  GetPetByIdStatus400,
  GetPetByIdStatus404,
} from './GetPetById.ts'
export type {
  UpdatePetRequest,
  UpdatePetRequestData,
  UpdatePetResponseData,
  UpdatePetStatus200,
  UpdatePetStatus202,
  UpdatePetStatus400,
  UpdatePetStatus404,
  UpdatePetStatus405,
} from './UpdatePet.ts'
export type {
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithFormRequest,
  UpdatePetWithFormResponseData,
  UpdatePetWithFormStatus405,
} from './UpdatePetWithForm.ts'
export type {
  UploadFilePathParams,
  UploadFileQueryParams,
  UploadFileRequest,
  UploadFileRequestData,
  UploadFileResponseData,
  UploadFileStatus200,
} from './UploadFile.ts'

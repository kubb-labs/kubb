import zod from 'zod'

import { ApiResponse } from './ApiResponse'

export const UploadFileRequest = zod.any()
export const UploadFileResponse = ApiResponse

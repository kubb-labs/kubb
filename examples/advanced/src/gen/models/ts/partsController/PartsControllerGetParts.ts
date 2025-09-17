import type { Part } from '../Part.ts'

export type PartsControllerGetParts200 = Part[]

export type PartsControllerGetPartsQueryResponse = PartsControllerGetParts200

export type PartsControllerGetPartsQuery = {
  Response: PartsControllerGetParts200
  Errors: any
}

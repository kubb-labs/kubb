import { partsControllerDownloadPart } from './partsControllerDownloadPart.ts'
import { partsControllerGetPart } from './partsControllerGetPart.ts'
import { partsControllerGetParts } from './partsControllerGetParts.ts'
import { partsControllerSimulatePart } from './partsControllerSimulatePart.ts'

export function partsService() {
  return { partsControllerGetParts, partsControllerGetPart, partsControllerDownloadPart, partsControllerSimulatePart }
}

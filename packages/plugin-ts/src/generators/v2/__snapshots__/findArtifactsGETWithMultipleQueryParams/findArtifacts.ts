export type findArtifactsPage = number

export type findArtifactsLimit = number

export type findArtifactsSort = string

/**
 * @description Results
 */
export type findArtifacts200 = object

export type findArtifactsData = {
  data?: never
  pathParams?: never
  queryParams?: {
    page?: findArtifactsPage
    limit?: findArtifactsLimit
    sort?: findArtifactsSort
  }
  headerParams?: never
  url: '/artifacts'
}

export type findArtifactsResponses = {
  '200': findArtifacts200
}

export type findArtifactsResponse = findArtifacts200

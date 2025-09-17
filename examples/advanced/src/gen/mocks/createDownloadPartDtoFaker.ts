import type { DownloadPartDto } from '../models/ts/DownloadPartDto.ts'
import { faker } from '@faker-js/faker'

export function createDownloadPartDtoFaker(data?: Partial<DownloadPartDto>): DownloadPartDto {
  return {
    ...{ downloadedWelds: faker.helpers.multiple(() => faker.string.alpha()) },
    ...(data || {}),
  }
}

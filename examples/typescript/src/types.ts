import { Infer } from '@kubb/swagger-ts'

import type { Oas } from './gen/index.ts'

export type UserModel = Infer.Model<Oas, 'User'>

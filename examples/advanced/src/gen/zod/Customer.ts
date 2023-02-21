import zod from 'zod'

import { Address } from './Address'

export const Customer = zod.object({ id: zod.number().optional(), username: zod.string().optional(), address: zod.array(Address).optional() })

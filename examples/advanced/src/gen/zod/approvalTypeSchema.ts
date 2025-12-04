import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { ApprovalType } from '../models/ts/ApprovalType.ts'

/**
 * @description Specifies the approval type for the transaction. \n`MANUAL` requires a cash admin to approve the transaction before disbursing funds. \nWhen not set, the default policy will apply.
 */
export const approvalTypeSchema = z
  .enum(['MANUAL'])
  .describe(
    'Specifies the approval type for the transaction. \n`MANUAL` requires a cash admin to approve the transaction before disbursing funds. \nWhen not set, the default policy will apply.',
  ) as unknown as ToZod<ApprovalType>

export type ApprovalTypeSchema = ApprovalType

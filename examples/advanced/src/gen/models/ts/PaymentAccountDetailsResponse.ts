import type { ACHDetailsResponse } from './ACHDetailsResponse.ts'
import type { ChequeDetailsResponse } from './ChequeDetailsResponse.ts'
import type { DomesticWireDetailsResponse } from './DomesticWireDetailsResponse.ts'
import type { InternationalWireDetailsResponse } from './InternationalWireDetailsResponse.ts'

export type PaymentAccountDetailsResponse =
  | (DomesticWireDetailsResponse & {
      type: 'DOMESTIC_WIRE'
    })
  | (ACHDetailsResponse & {
      type: 'ACH'
    })
  | (ChequeDetailsResponse & {
      type: 'CHEQUE'
    })
  | (InternationalWireDetailsResponse & {
      type: 'INTERNATIONAL_WIRE'
    })

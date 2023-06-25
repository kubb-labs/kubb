import { useForm } from 'react-hook-form'
import type { PlaceOrderMutationRequest, PlaceOrderMutationResponse } from '../../models/ts/storeController/PlaceOrder'

/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * @link /store/order
 */

type FieldValues = PlaceOrderMutationRequest

type Props = {
  onSubmit?: (data: FieldValues) => Promise<PlaceOrderMutationResponse> | void
}

export function PlaceOrderForm(props: Props): React.ReactNode {
  const { onSubmit } = props

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FieldValues>({
    defaultValues: {
      shipDate: undefined,
      status: undefined,
    },
  })

  return (
    <>
      <form
        onSubmit={handleSubmit((data) => {
          onSubmit?.(data)
        })}
      >
        <label>shipDate</label>
        <input {...register('shipDate', { required: false })} defaultValue="" />

        <input type="submit" />
      </form>
    </>
  )
}

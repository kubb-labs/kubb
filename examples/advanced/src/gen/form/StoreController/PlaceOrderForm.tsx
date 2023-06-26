import { useForm, Controller } from 'react-hook-form'
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
        <label htmlFor="shipDate">Ship date</label>
        <Controller
          name="shipDate"
          render={({ field }) => <input {...field} id="shipDate" />}
          control={control}
          defaultValue={''}
          rules={{
            required: false,
          }}
        />

        <label htmlFor="complete">Complete</label>
        <Controller
          name="complete"
          render={({ field }) => <input {...field} id="complete" type="checkbox" value={field.value ? 'checked' : undefined} checked={field.value} />}
          control={control}
          defaultValue={false}
          rules={{
            required: false,
          }}
        />
        <input type="submit" />
      </form>
    </>
  )
}

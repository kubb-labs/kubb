import { useForm } from 'react-hook-form'
import type { CreateUsersWithListInputMutationRequest, CreateUsersWithListInputMutationResponse } from '../../models/ts/userController/CreateUsersWithListInput'

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * @link /user/createWithList
 */

type FieldValues = { createUsersWithListInput?: CreateUsersWithListInputMutationRequest }

type Props = {
  onSubmit?: (data: FieldValues) => Promise<CreateUsersWithListInputMutationResponse> | void
}

export function CreateUsersWithListInputForm(props: Props): React.ReactNode {
  const { onSubmit } = props

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FieldValues>({
    defaultValues: {},
  })

  return (
    <>
      <form
        onSubmit={handleSubmit((data) => {
          onSubmit?.(data)
        })}
      >
        <input type="submit" />
      </form>
    </>
  )
}

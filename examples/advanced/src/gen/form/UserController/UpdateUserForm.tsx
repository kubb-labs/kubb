import { useForm, Controller } from 'react-hook-form'
import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from '../../models/ts/userController/UpdateUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * @link /user/:username
 */

type FieldValues = UpdateUserMutationRequest

type Props = {
  onSubmit?: (data: FieldValues) => Promise<UpdateUserMutationResponse> | void
  username: UpdateUserPathParams['username']
}

export function UpdateUserForm(props: Props): React.ReactNode {
  const { onSubmit } = props

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FieldValues>({
    defaultValues: {
      username: undefined,
      firstName: undefined,
      lastName: undefined,
      email: undefined,
      password: undefined,
      phone: undefined,
    },
  })

  return (
    <form
      onSubmit={handleSubmit((data) => {
        onSubmit?.(data)
      })}
    >
      {/**
       * @description Update an existent user in the store
       */}

      <label htmlFor="username">Username</label>
      <Controller
        name="username"
        render={({ field }) => <input {...field} id="username" />}
        control={control}
        defaultValue={''}
        rules={{
          required: false,
        }}
      />

      <label htmlFor="firstName">First name</label>
      <Controller
        name="firstName"
        render={({ field }) => <input {...field} id="firstName" />}
        control={control}
        defaultValue={''}
        rules={{
          required: false,
        }}
      />

      <label htmlFor="lastName">Last name</label>
      <Controller
        name="lastName"
        render={({ field }) => <input {...field} id="lastName" />}
        control={control}
        defaultValue={''}
        rules={{
          required: false,
        }}
      />

      <label htmlFor="email">Email</label>
      <Controller
        name="email"
        render={({ field }) => <input {...field} id="email" />}
        control={control}
        defaultValue={''}
        rules={{
          required: false,
        }}
      />

      <label htmlFor="password">Password</label>
      <Controller
        name="password"
        render={({ field }) => <input {...field} id="password" />}
        control={control}
        defaultValue={''}
        rules={{
          required: false,
        }}
      />

      <label htmlFor="phone">Phone</label>
      <Controller
        name="phone"
        render={({ field }) => <input {...field} id="phone" />}
        control={control}
        defaultValue={''}
        rules={{
          required: false,
        }}
      />

      <input type="submit" />
    </form>
  )
}

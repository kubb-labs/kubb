import { type SwitchProps, useSwitch } from '@heroui/react'
import { useTheme } from '@heroui/use-theme'
import { VisuallyHidden } from '@react-aria/visually-hidden'
import clsx from 'clsx'
import { type FC, useEffect, useState } from 'react'

import { MoonFilledIcon, SunFilledIcon } from '../components/icons'

export interface ThemeSwitchProps {
  className?: string
  classNames?: SwitchProps['classNames']
}

export const ThemeSwitch: FC<ThemeSwitchProps> = ({ className, classNames }) => {
  const [isMounted, setIsMounted] = useState(false)

  const { theme, setTheme } = useTheme()

  const { Component, slots, isSelected, getBaseProps, getInputProps, getWrapperProps } = useSwitch({
    isSelected: theme === 'light',
    onChange: () => setTheme(theme === 'light' ? 'dark' : 'light'),
  })

  useEffect(() => {
    setIsMounted(true)
  }, [isMounted])

  // Prevent Hydration Mismatch
  if (!isMounted) return <div className="w-6 h-6" />

  return (
    <Component
      aria-label={isSelected ? 'Switch to dark mode' : 'Switch to light mode'}
      {...getBaseProps({
        className: clsx('px-px transition-opacity hover:opacity-80 cursor-pointer', className, classNames?.base),
      })}
    >
      <VisuallyHidden>
        <input {...getInputProps()} />
      </VisuallyHidden>
      <div
        {...getWrapperProps()}
        className={slots.wrapper({
          class: clsx(
            [
              'w-auto h-auto',
              'bg-transparent',
              'rounded-lg',
              'flex items-center justify-center',
              'group-data-[selected=true]:bg-transparent',
              '!text-default-500',
              'pt-px',
              'px-0',
              'mx-0',
            ],
            classNames?.wrapper,
          ),
        })}
      >
        {isSelected ? <MoonFilledIcon size={22} /> : <SunFilledIcon size={22} />}
      </div>
    </Component>
  )
}

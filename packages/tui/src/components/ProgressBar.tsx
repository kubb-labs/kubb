import { attrs } from '../format.ts'

type Props = {
  /**
   * Completion ratio in the `[0, 1]` range. Values outside the range are clamped.
   */
  value: number
  /**
   * Width of the bar in cells, including filled and empty segments.
   */
  width?: number
  /**
   * Color of the filled segment.
   */
  color?: string
  /**
   * Color of the unfilled segment.
   */
  trackColor?: string
}

const FILLED = '▰'
const EMPTY = '▱'

export function ProgressBar({ value, width = 20, color = 'green', trackColor = '#666' }: Props) {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
  const filled = Math.round(clamped * width)
  const empty = width - filled

  return (
    <text>
      <span fg={color}>{FILLED.repeat(filled)}</span>
      <span fg={trackColor} attributes={attrs.dim}>{EMPTY.repeat(empty)}</span>
    </text>
  )
}

import type { SVGProps } from 'react'

export type IconName =
  | 'activity'
  | 'alert-circle'
  | 'arrow-down-to-line'
  | 'arrow-right'
  | 'arrow-up-right'
  | 'bell'
  | 'circle-check'
  | 'clapperboard'
  | 'credit-card'
  | 'heart'
  | 'loader-circle'
  | 'lock-keyhole'
  | 'minus'
  | 'message-circle'
  | 'monitor-smartphone'
  | 'package-open'
  | 'plus'
  | 'rotate-cw'
  | 'search'
  | 'shopping-bag'
  | 'settings'
  | 'shield-check'
  | 'tablet'
  | 'trash'
  | 'user'
  | 'wallet'
  | 'x'

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName
  size?: number
  strokeWidth?: number
}

const paths: Record<IconName, string> = {
  activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
  'alert-circle': 'M12 8v4m0 4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  'arrow-down-to-line': 'M12 17V3m0 14-5-5m5 5 5-5M5 21h14',
  'arrow-right': 'M5 12h14m-7-7 7 7-7 7',
  'arrow-up-right': 'M7 17 17 7M7 7h10v10',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4',
  'circle-check': 'm9 12 2 2 4-4m7 2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  clapperboard: 'm4 4 16 0v16H4zM4 9h16M8 4l3 5m3-5 3 5',
  'credit-card': 'M3 6h18v12H3zM3 10h18m-14 4h4',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z',
  'loader-circle': 'M21 12a9 9 0 1 1-6.2-8.55',
  'lock-keyhole': 'M5 11h14v10H5zM8 11V7a4 4 0 1 1 8 0v4m-4 4v2',
  minus: 'M5 12h14',
  'message-circle': 'M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z',
  'monitor-smartphone': 'M12 17v4m-4 0h8M3 4h12v10H3zM19 8h2v12h-7v-2m5-6h.01',
  'package-open': 'm12 22 8-4.5v-9L12 4 4 8.5v9L12 22Zm0 0v-9m8-4.5-8 4.5-8-4.5m4-6.2 8 4.5m-8 0L16 2',
  plus: 'M12 5v14m-7-7h14',
  'rotate-cw': 'M20 7v5h-5M4 17v-5h5m-4.1-3a8 8 0 0 1 13.2-2L20 12M4 12l1.9 5a8 8 0 0 0 13.2-2',
  search: 'm21 21-4.3-4.3M19 10.5a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0Z',
  'shopping-bag': 'M5 8h14l1 13H4L5 8Zm4 0V6a3 3 0 0 1 6 0v2',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-6v2m0 16v2m10-10h-2M4 12H2m17.1-7.1-1.4 1.4M6.3 17.7l-1.4 1.4m14.2 0-1.4-1.4M6.3 6.3 4.9 4.9',
  'shield-check': 'M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Zm-3-11 2 2 4-4',
  tablet: 'M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm6 16h.01',
  trash: 'M3 6h18m-2 0-.9 14H5.9L5 6m4 0V4h6v2m-5 4v6m4-6v6',
  user: 'M20 21a8 8 0 0 0-16 0m8-10a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z',
  wallet: 'M20 8V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v11H5a3 3 0 0 1-3-3V6m18 4h-5a2 2 0 0 0 0 4h5zm-5 2h.01',
  x: 'M18 6 6 18M6 6l12 12',
}

export function Icon({
  name,
  size = 24,
  strokeWidth = 1.8,
  ...props
}: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  )
}

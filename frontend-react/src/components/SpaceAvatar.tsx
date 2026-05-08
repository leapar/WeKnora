import { useMemo } from 'react'

interface SpaceAvatarProps {
  name: string
  /** Optional: "emoji:🚀" for emoji avatar; otherwise name-based */
  avatar?: string
  size?: 'small' | 'medium' | 'large'
}

// Predefined gradients - coordinated with project's green primary color, space/collaborative feel
const gradients = [
  { from: '#07c05f', to: '#059669' }, // primary green
  { from: '#11998e', to: '#38ef7d' }, // dark green gradient
  { from: '#43e97b', to: '#38f9d7' }, // green-cyan
  { from: '#02aab0', to: '#00cdac' }, // cyan-green
  { from: '#36d1dc', to: '#5b86e5' }, // cyan-blue
  { from: '#4facfe', to: '#00f2fe' }, // blue-cyan
  { from: '#667eea', to: '#764ba2' }, // purple-blue
  { from: '#4776e6', to: '#8e54e9' }, // blue-purple
  { from: '#56ab2f', to: '#a8e063' }, // grass green
  { from: '#00b09b', to: '#96c93d' }, // cyan-green
  { from: '#5ee7df', to: '#b490ca' }, // cyan-purple
  { from: '#614385', to: '#516395' }, // dark purple-blue
]

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

function getLetter(name: string): string {
  const trimmed = name?.trim() || ''
  if (!trimmed) return '?'

  const firstChar = trimmed.charAt(0)
  if (/[a-zA-Z]/.test(firstChar)) return firstChar.toUpperCase()
  return firstChar
}

const sizeClasses = {
  small: 'w-[22px] h-[22px] rounded-[5px] text-[11px]',
  medium: 'w-8 h-8 rounded-lg text-sm',
  large: 'w-12 h-12 rounded-xl text-xl',
}

export function SpaceAvatar({ name, avatar = '', size = 'medium' }: SpaceAvatarProps) {
  const isEmoji = useMemo(() => {
    const v = avatar?.trim() || ''
    return v.startsWith('emoji:') && v.length > 6
  }, [avatar])

  const emojiChar = useMemo(() => {
    const v = avatar?.trim() || ''
    if (!v.startsWith('emoji:')) return ''
    return v.slice(6).trim() || ''
  }, [avatar])

  const gradient = useMemo(() => {
    const hash = hashCode(name || '')
    return gradients[hash % gradients.length]
  }, [name])

  const letter = useMemo(() => getLetter(name), [name])

  const avatarStyle = useMemo(() => {
    if (isEmoji) {
      return { background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)' }
    }
    return {
      background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
    }
  }, [isEmoji, gradient])

  const letterStyle = useMemo(() => ({
    textShadow: `0 1px 2px ${gradient.to}80, 0 0 8px ${gradient.from}30`,
  }), [gradient])

  return (
    <div
      className={`space-avatar relative flex items-center justify-center flex-shrink-0 overflow-hidden shadow-[var(--td-shadow-2)] ${sizeClasses[size]} ${isEmoji ? 'space-avatar-emoji' : ''}`}
      style={avatarStyle}
    >
      {isEmoji ? (
        <span className="space-avatar-emoji-char relative z-10 leading-none select-none text-lg">
          {emojiChar}
        </span>
      ) : (
        <>
          <svg
            className="space-avatar-decoration absolute right-0 bottom-0 w-[55%] h-[55%] opacity-35 text-white pointer-events-none"
            viewBox="0 0 56 40"
            preserveAspectRatio="xMaxYMax meet"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle cx="10" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5" />
            <circle cx="28" cy="8" r="5" stroke="currentColor" strokeWidth="1.8" fill="none" opacity="0.7" />
            <circle cx="46" cy="14" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5" />
            <path d="M14 13 L24 10 M32 10 L42 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
            <circle cx="28" cy="28" r="6" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.35" />
            <path d="M28 14 L28 22 M20 18 L26 24 M36 18 L30 24" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
          </svg>
          <span
            className="space-avatar-letter relative z-10 text-white font-semibold"
            style={letterStyle}
          >
            {letter}
          </span>
        </>
      )}

      {/* Hide decoration for small size */}
      {size === 'small' && (
        <style>{`.space-avatar-decoration { display: none; }`}</style>
      )}
    </div>
  )
}
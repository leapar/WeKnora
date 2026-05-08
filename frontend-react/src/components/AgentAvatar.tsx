import { useMemo } from 'react'

interface AgentAvatarProps {
  name: string
  size?: 'small' | 'medium' | 'large'
}

// Predefined gradient color schemes - modern, soft, professional
const gradients = [
  { from: '#667eea', to: '#764ba2' }, // purple-blue gradient
  { from: '#4facfe', to: '#00f2fe' }, // blue-cyan gradient
  { from: '#43e97b', to: '#38f9d7' }, // green-cyan gradient
  { from: '#11998e', to: '#38ef7d' }, // dark green gradient
  { from: '#5ee7df', to: '#b490ca' }, // cyan-purple gradient
  { from: '#48c6ef', to: '#6f86d6' }, // blue-purple gradient
  { from: '#a8edea', to: '#fed6e3' }, // cyan-pink gradient (soft)
  { from: '#667db6', to: '#0082c8' }, // blue gradient
  { from: '#36d1dc', to: '#5b86e5' }, // cyan-blue gradient
  { from: '#56ab2f', to: '#a8e063' }, // grass green gradient
  { from: '#614385', to: '#516395' }, // dark purple-blue gradient
  { from: '#02aab0', to: '#00cdac' }, // cyan-green gradient
  { from: '#6a82fb', to: '#fc5c7d' }, // blue-pink gradient (soft)
  { from: '#834d9b', to: '#d04ed6' }, // purple gradient
  { from: '#4776e6', to: '#8e54e9' }, // blue-purple gradient
  { from: '#00b09b', to: '#96c93d' }, // cyan-green gradient
]

// Generate stable hash from string
function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

// Get first letter (supports Chinese)
function getLetter(name: string): string {
  const trimmed = name?.trim() || ''
  if (!trimmed) return '?'

  const firstChar = trimmed.charAt(0)

  // If English letter, convert to uppercase
  if (/[a-zA-Z]/.test(firstChar)) {
    return firstChar.toUpperCase()
  }

  // Return Chinese or other characters directly
  return firstChar
}

const sizeClasses = {
  small: 'w-[22px] h-[22px] rounded-[5px] text-[11px]',
  medium: 'w-8 h-8 rounded-lg text-sm',
  large: 'w-12 h-12 rounded-xl text-xl',
}

export function AgentAvatar({ name, size = 'medium' }: AgentAvatarProps) {
  const gradient = useMemo(() => {
    const hash = hashCode(name || '')
    return gradients[hash % gradients.length]
  }, [name])

  const letter = useMemo(() => getLetter(name), [name])

  const avatarStyle = useMemo(() => ({
    background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
  }), [gradient])

  const letterStyle = useMemo(() => ({
    textShadow: `0 1px 2px ${gradient.to}80, 0 0 8px ${gradient.from}30`,
  }), [gradient])

  return (
    <div
      className={`agent-avatar relative flex items-center justify-center flex-shrink-0 overflow-hidden shadow-[var(--td-shadow-2)] ${sizeClasses[size]}`}
      style={avatarStyle}
    >
      {/* Sparkle decorations - blend with background */}
      <svg
        className="agent-sparkles absolute inset-0 w-full h-full pointer-events-none opacity-85"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Top-right small star */}
        <path
          d="M24 5L24.4 6.6C24.45 6.85 24.65 7.05 24.9 7.1L26.5 7.5L24.9 7.9C24.65 7.95 24.45 8.15 24.4 8.4L24 10L23.6 8.4C23.55 8.15 23.35 7.95 23.1 7.9L21.5 7.5L23.1 7.1C23.35 7.05 23.55 6.85 23.6 6.6L24 5Z"
          fill="rgba(255,255,255,0.6)"
        />
        {/* Bottom-left small star */}
        <path
          d="M7 22L7.4 23.6C7.45 23.85 7.65 24.05 7.9 24.1L9.5 24.5L7.9 24.9C7.65 24.95 7.45 25.15 7.4 25.4L7 27L6.6 25.4C6.55 25.15 6.35 24.95 6.1 24.9L4.5 24.5L6.1 24.1C6.35 24.05 6.55 23.85 6.6 23.6L7 22Z"
          fill="rgba(255,255,255,0.5)"
        />
      </svg>

      {/* Hide sparkles for small size */}
      {size === 'small' && (
        <style>{`.agent-sparkles { display: none; }`}</style>
      )}

      <span
        className="agent-avatar-letter relative z-10 text-white font-semibold"
        style={letterStyle}
      >
        {letter}
      </span>
    </div>
  )
}
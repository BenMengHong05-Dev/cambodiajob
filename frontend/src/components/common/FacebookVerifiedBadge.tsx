import React from 'react'

export interface FacebookVerifiedBadgeProps {
  className?: string
  title?: string
  showText?: boolean
  text?: string
}

export const FacebookVerifiedBadge: React.FC<FacebookVerifiedBadgeProps> = ({
  className = 'w-4 h-4',
  title = 'Verified Organization',
  showText = false,
  text,
}) => {
  const icon = (
    <svg
      viewBox="0 0 24 24"
      className={`${className} inline-block shrink-0 drop-shadow-2xs`}
      aria-label={title}
    >
      <title>{title}</title>
      {/* Facebook / Meta Verified Blue Scalloped Starburst Rosette */}
      <path
        d="M12 2.25c.79 0 1.55.33 2.1.92l.93.99c.35.38.85.59 1.37.59h1.35c1.1 0 2 .9 2 2v1.35c0 .52.21 1.02.59 1.37l.99.93c.59.55.92 1.31.92 2.1s-.33 1.55-.92 2.1l-.99.93c-.38.35-.59.85-.59 1.37v1.35c0 1.1-.9 2-2 2h-1.35c-.52 0-1.02.21-1.37.59l-.93.99c-.55.59-1.31.92-2.1.92s-1.55-.33-2.1-.92l-.93-.99c-.35-.38-.85-.59-1.37-.59H6.25c-1.1 0-2-.9-2-2v-1.35c0-.52-.21-1.02-.59-1.37l-.99-.93c-.59-.55-.92-1.31-.92-2.1s.33-1.55.92-2.1l.99-.93c.38-.35.59-.85.59-1.37V6.25c0-1.1.9-2 2-2h1.35c.52 0 1.02-.21 1.37-.59l.93-.99c.55-.59 1.31-.92 2.1-.92z"
        fill="#0866FF"
      />
      {/* Crisp White Checkmark */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.25 15.5l-3.25-3.25 1.41-1.41 1.84 1.84 5.34-5.34 1.41 1.41-6.75 6.75z"
        fill="#FFFFFF"
      />
    </svg>
  )

  if (showText) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50/90 text-[#0866FF] border border-blue-200/80 shadow-2xs hover:bg-blue-100/70 transition-colors"
        title={title}
      >
        {icon}
        {text && <span>{text}</span>}
      </span>
    )
  }

  return icon
}

export default FacebookVerifiedBadge

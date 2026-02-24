export function FeedbackFlowLogo({ className = "h-6 w-6", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Chat bubble outline */}
      <path
        d="M50 10C28 10 10 26 10 46C10 56 15 65 23 71L18 88L36 78C40 80 45 81 50 81C72 81 90 65 90 46C90 26 72 10 50 10Z"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Wave / tilde through the middle */}
      <path
        d="M22 50C30 38 38 60 50 48C62 36 70 58 80 46"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

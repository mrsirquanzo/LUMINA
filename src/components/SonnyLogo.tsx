interface SonnyLogoProps {
  size?: number;
  className?: string;
}

/**
 * Sonny brand mark: an "S" traced as a single stroke between two grounded nodes.
 * It reads as the initial and as the product thesis - an inference path anchored
 * to its sources (the node endpoints). One blue accent, per the design language.
 */
export function SonnyLogo({ size = 28, className }: SonnyLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="Sonny"
      className={className}
    >
      <rect width="32" height="32" rx="8.5" fill="#1D4ED8" />
      <path
        d="M20.5 11.2C20.5 8.6 12.3 8.2 12.3 12.4C12.3 15.6 19.9 15 19.9 19.7C19.9 24 11.2 23.6 11.2 20.6"
        stroke="#FFFFFF"
        strokeWidth="2.9"
        strokeLinecap="round"
      />
      <circle cx="20.5" cy="11.2" r="2.15" fill="#FFFFFF" />
      <circle cx="11.2" cy="20.6" r="2.15" fill="#FFFFFF" />
    </svg>
  );
}

export default SonnyLogo;

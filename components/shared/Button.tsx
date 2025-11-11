import Link from "next/link";

interface ButtonProps {
  href?: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  onClick?: () => void;
  external?: boolean;
  className?: string;
}

export default function Button({
  href,
  children,
  variant = "primary",
  onClick,
  external = false,
  className = "",
}: ButtonProps) {
  const baseClasses = variant === "primary" ? "btn-primary" : "btn-secondary";
  const combinedClasses = `${baseClasses} ${className} inline-block text-center`;

  if (href) {
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={combinedClasses}
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={combinedClasses}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={combinedClasses}>
      {children}
    </button>
  );
}

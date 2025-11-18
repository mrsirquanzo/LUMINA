import Image from "next/image";

interface CompanyLogoProps {
  name: string;
  shortName: string;
  color: string;
  imagePath?: string;
}

/**
 * CompanyLogo component - displays either a real logo image or a styled badge
 * Replace imagePath props with actual logo files when available
 */
export default function CompanyLogo({ name, shortName, color, imagePath }: CompanyLogoProps) {
  // If actual logo is available, use it
  if (imagePath) {
    return (
      <div className="inline-flex items-center h-6">
        <Image
          src={imagePath}
          alt={name}
          height={24}
          width={120}
          className="h-6 w-auto object-contain"
        />
      </div>
    );
  }

  // Otherwise, use styled badge
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${color}`}
      title={name}
    >
      {shortName}
    </span>
  );
}

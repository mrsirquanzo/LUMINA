interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  background?: "white" | "gray";
}

export default function Section({
  children,
  className = "",
  id,
  background = "white",
}: SectionProps) {
  const bgClass = background === "gray" ? "bg-gray-50" : "bg-white";

  return (
    <section id={id} className={`py-16 md:py-24 ${bgClass} ${className}`}>
      <div className="container-site">
        {children}
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  metadataBase: new URL('https://quanho.io'),
  title: "Quan Ho | Biotech Business Intelligence & AI Systems",
  description: "Bridging biotech, data, and intelligent design. Scientist × Strategist × Builder specializing in business intelligence and AI agents for life sciences.",
  keywords: ["biotech", "business intelligence", "AI agents", "case studies", "data analysis", "patent intelligence", "financial modeling"],
  authors: [{ name: "Quan Ho" }],
  openGraph: {
    title: "Quan Ho | Biotech Business Intelligence & AI Systems",
    description: "Bridging biotech, data, and intelligent design",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

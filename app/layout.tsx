import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  metadataBase: new URL('https://quanho.io'),
  title: "Quan Ho | Biotech Investment Analysis",
  description: "Professional portfolio showcasing deep scientific expertise in biotech investment analysis, due diligence, and technology assessment. 10+ years in immunology, oncology, and AI-driven drug discovery.",
  keywords: ["biotech", "investment analysis", "venture capital", "private equity", "drug discovery", "AI", "oncology", "immunology"],
  authors: [{ name: "Quan Ho" }],
  openGraph: {
    title: "Quan Ho | Biotech Investment Analysis",
    description: "Translating Breakthrough Biology into Investment Insights",
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
      <body className="font-sans">
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

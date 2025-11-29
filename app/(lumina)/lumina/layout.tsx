import LuminaHeader from '@/components/lumina/Header';
import Sidebar from '@/components/lumina/Sidebar';

export default function LuminaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950">
      <LuminaHeader />
      <Sidebar />
      <main className="ml-72 pt-16 min-h-screen">
        {children}
      </main>
    </div>
  );
}



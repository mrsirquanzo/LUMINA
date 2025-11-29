import { companies } from '@/lib/lumina/mock-data';
import CompanyCard from '@/components/lumina/CompanyCard';

export default function LuminaDashboard() {
  return (
    <div className="container mx-auto px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-100 mb-2">
          LUMINA Dashboard
        </h2>
        <p className="text-slate-400">
          Explore companies across different perspectives
        </p>
      </div>

      {/* Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-fr">
        {companies.map((company) => (
          <div key={company.id} className="h-full">
            <CompanyCard company={company} />
          </div>
        ))}
      </div>
    </div>
  );
}



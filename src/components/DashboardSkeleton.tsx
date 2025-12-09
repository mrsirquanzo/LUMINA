import Skeleton from './Skeleton';

export default function DashboardSkeleton() {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className={`bg-surface border border-white/5 rounded-3xl p-6 ${
              idx === 0 ? 'md:col-span-2 xl:col-span-4' : ''
            }`}
          >
            <div className="space-y-4">
              <Skeleton height={24} width="75%" />
              <Skeleton height={16} width="50%" />
              <Skeleton height={128} rounded="lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

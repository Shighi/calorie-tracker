import Skeleton from 'react-loading-skeleton';

export default function LoadingSkeleton() {
  return (
    <div className="p-6">
      <Skeleton height={30} count={3} className="mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton height={200} />
        <Skeleton height={200} />
      </div>
    </div>
  );
}
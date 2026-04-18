export function Skeleton({ className = '' }) {
  return <div className={`skeleton h-14 ${className}`} />
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} />
      ))}
    </div>
  )
}

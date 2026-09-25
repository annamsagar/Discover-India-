export default function SkeletonCard() {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="h-52 shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-4 shimmer rounded-lg w-3/4" />
        <div className="h-3 shimmer rounded-lg w-1/2" />
        <div className="flex gap-2">
          <div className="h-5 w-16 shimmer rounded-full" />
          <div className="h-5 w-20 shimmer rounded-full" />
        </div>
      </div>
    </div>
  )
}

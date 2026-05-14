import { Skeleton } from "@/components/ui/skeleton"

export default function ReformsLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Skeleton className="h-9 w-48 mb-2" />
      <Skeleton className="h-5 w-80 mb-8" />

      <div className="flex gap-3 mb-6">
        <Skeleton className="h-10 w-44" />
        <Skeleton className="h-10 w-52" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-5 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-28" />
            </div>
            <Skeleton className="h-px w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}

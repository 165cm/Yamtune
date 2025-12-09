import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Skeleton className="h-32 w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function RecipeCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  )
}

export function MemberCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-12 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="text-center">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="mt-4 text-muted-foreground">読み込み中...</p>
      </div>
    </div>
  )
}

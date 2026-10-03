import { Skeleton } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="grid gap-3" aria-busy>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
      <Skeleton className="mt-2 h-24 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
    </div>
  );
}

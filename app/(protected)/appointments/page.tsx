import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AppointmentsContent } from "@/features/appointment";

// Force dynamic rendering because useSearchParams requires runtime context
export const dynamic = "force-dynamic";

function AppointmentsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-50" />
          <Skeleton className="h-4 w-75" />
        </div>
        <Skeleton className="h-10 w-35" />
      </div>
      <Skeleton className="h-10 w-full max-w-sm" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function AppointmentsPage() {
  return (
    <Suspense fallback={<AppointmentsSkeleton />}>
      <AppointmentsContent />
    </Suspense>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="py-16 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-12 w-1/2" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-5/6" />
            <Skeleton className="h-12 w-40 rounded-md mt-4" />
          </div>
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </div>

      {/* Services Grid */}
      <div className="max-w-6xl mx-auto px-6">
        <Skeleton className="h-10 w-64 mx-auto mb-8" />
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
      </div>

      {/* USP Section */}
      <div className="max-w-6xl mx-auto px-6">
        <Skeleton className="h-10 w-72 mx-auto mb-8" />
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
      </div>

      {/* Testimonials */}
      <div className="max-w-6xl mx-auto px-6 pb-12">
        <Skeleton className="h-10 w-48 mx-auto mb-8" />
        <Skeleton className="h-40 rounded-lg" />
      </div>
    </div>
  );
}

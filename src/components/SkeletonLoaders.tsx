"use client";

import { Skeleton } from "@/components/ui/skeleton";

export const ProfileCardSkeleton = () => {
  return (
    <div className="rounded-lg border border-border bg-card p-6 animate-fade-in">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="ml-3 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>
      <div className="mb-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-10" />
      </div>
    </div>
  );
};

export const VideoCardSkeleton = () => {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden animate-fade-in">
      <Skeleton className="aspect-video w-full" />
      <div className="p-6 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="flex items-center gap-4 pt-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
};

export const DashboardStatSkeleton = () => {
  return (
    <div className="rounded-lg border border-border bg-card p-6 animate-fade-in">
      <div className="flex items-center">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="ml-4 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  );
};

export const MessageSkeleton = () => {
  return (
    <div className="space-y-4 p-4 animate-fade-in">
      {[1, 2, 3].map((i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
          <Skeleton className={`h-16 ${i % 2 === 0 ? "w-2/3" : "w-1/2"} rounded-lg`} />
        </div>
      ))}
    </div>
  );
};

export const ConnectionListSkeleton = () => {
  return (
    <div className="divide-y divide-border">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-4 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
          <div className="flex items-center">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="ml-3 flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const AnalyticsChartSkeleton = () => {
  return (
    <div className="rounded-lg border border-border bg-card p-6 animate-fade-in">
      <Skeleton className="mb-4 h-6 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
};

export const TableSkeleton = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => {
  return (
    <div className="space-y-3 animate-fade-in">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4" style={{ animationDelay: `${i * 0.05}s` }}>
          {[...Array(cols)].map((_, j) => (
            <Skeleton key={j} className="h-12 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

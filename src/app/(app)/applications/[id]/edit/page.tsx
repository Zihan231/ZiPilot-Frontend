'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';
import { ApplicationForm } from '@/components/applications/application-form';
import { EmptyState, Skeleton } from '@/components/ui/ui';
import { useApplication } from '@/lib/hooks';

export default function EditApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, error } = useApplication(id);
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href={`/applications/${id}`} className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> Back to application
      </Link>
      <h1 className="text-xl font-semibold tracking-tight">Edit application</h1>
      {isLoading ? <Skeleton className="h-96 w-full" /> : error || !data ? <EmptyState title="Application not found" /> : <ApplicationForm app={data} />}
    </div>
  );
}

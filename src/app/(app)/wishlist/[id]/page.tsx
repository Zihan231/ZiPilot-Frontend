'use client';

import { ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { MarkAppliedButton, StatusBadge } from '@/components/applications/actions';
import { WishlistForm } from '@/components/wishlist/wishlist-form';
import { Card, EmptyState, LinkButton, Skeleton } from '@/components/ui/ui';
import { readStoredQuery } from '@/lib/filters';
import { daysLeft, daysLeftLabel, fmtDate } from '@/lib/format';
import { useWishlistItem } from '@/lib/hooks';

export default function WishlistItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: job, isLoading, error } = useWishlistItem(id);
  const [back, setBack] = useState('/wishlist');
  useEffect(() => {
    const qs = readStoredQuery('zp:wishlist-qs');
    if (qs) setBack(`/wishlist?${qs}`);
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href={back} className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> Wishlist
      </Link>
      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : error || !job ? (
        <EmptyState title="Wishlist job not found" />
      ) : (
        <>
          <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-semibold">{job.position}</h1>
              <p className="text-sm text-fg-2">
                {job.company} · Saved {fmtDate(job.createdAt)} · {job.appliedAt ? `Applied ${fmtDate(job.appliedAt)}` : daysLeftLabel(daysLeft(job.deadline))}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {job.jobUrl && (
                <LinkButton href={job.jobUrl} external size="sm">
                  <ExternalLink className="h-3.5 w-3.5" /> Job link
                </LinkButton>
              )}
              {job.application ? (
                <LinkButton href={`/applications/${job.application.id}`} size="sm">
                  View application <StatusBadge status={job.application.status} />
                </LinkButton>
              ) : (
                <MarkAppliedButton id={job.id} size="sm" />
              )}
            </div>
          </Card>
          <WishlistForm job={job} />
        </>
      )}
    </div>
  );
}

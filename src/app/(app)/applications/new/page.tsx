'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ApplicationForm } from '@/components/applications/application-form';

export default function NewApplicationPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/applications" className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> Applications
      </Link>
      <h1 className="text-xl font-semibold tracking-tight">Add application</h1>
      <ApplicationForm />
    </div>
  );
}

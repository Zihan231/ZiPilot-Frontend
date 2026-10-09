'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { WishlistForm } from '@/components/wishlist/wishlist-form';

export default function NewWishlistPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/wishlist" className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> Wishlist
      </Link>
      <h1 className="text-xl font-semibold tracking-tight">Add to wishlist</h1>
      <WishlistForm />
    </div>
  );
}

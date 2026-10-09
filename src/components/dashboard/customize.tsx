'use client';

import { ArrowDown, ArrowUp, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Modal } from '../ui/overlay';
import { Button, cn } from '../ui/ui';

export interface SectionDef {
  id: string;
  label: string;
  span: 'full' | 'half';
}

export const DASHBOARD_SECTIONS: SectionDef[] = [
  { id: 'stats', label: 'Key statistics', span: 'full' },
  { id: 'attention', label: 'Needs my attention', span: 'half' },
  { id: 'deadlines', label: 'Upcoming deadlines', span: 'half' },
  { id: 'volume', label: 'Application activity chart', span: 'half' },
  { id: 'status', label: 'Status distribution', span: 'half' },
  { id: 'recent', label: 'Recent applications', span: 'half' },
  { id: 'wishlist', label: 'Wishlist quick review', span: 'half' },
  { id: 'followups', label: 'Recruiter follow-ups', span: 'half' },
  { id: 'interviews', label: 'Upcoming interviews / tasks', span: 'half' },
  { id: 'activity', label: 'Recent activity', span: 'full' },
];

export type Layout = { id: string; visible: boolean }[];

export const DEFAULT_LAYOUT: Layout = DASHBOARD_SECTIONS.map((s) => ({ id: s.id, visible: true }));

/** Merges a saved layout with the known sections (new sections get appended, unknown ones dropped). */
export function normalizeLayout(saved?: Layout | null): Layout {
  if (!saved?.length) return DEFAULT_LAYOUT;
  const known = new Set(DASHBOARD_SECTIONS.map((s) => s.id));
  const result = saved.filter((s) => known.has(s.id));
  for (const s of DASHBOARD_SECTIONS) if (!result.some((r) => r.id === s.id)) result.push({ id: s.id, visible: true });
  return result;
}

export function CustomizeDialog({ open, onClose, layout, onSave, saving }: { open: boolean; onClose: () => void; layout: Layout; onSave: (l: Layout) => void; saving?: boolean }) {
  const [draft, setDraft] = useState(layout);
  useEffect(() => {
    if (open) setDraft(layout);
  }, [open, layout]);

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= draft.length) return;
    const next = [...draft];
    [next[i], next[j]] = [next[j], next[i]];
    setDraft(next);
  };
  const label = (id: string) => DASHBOARD_SECTIONS.find((s) => s.id === id)?.label ?? id;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Customize dashboard"
      description="Show, hide and reorder sections. Saved to your account."
      footer={
        <>
          <Button variant="ghost" onClick={() => setDraft(DEFAULT_LAYOUT)} className="mr-auto">
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={() => onSave(draft)}>
            Save layout
          </Button>
        </>
      }
    >
      <ul className="space-y-1.5">
        {draft.map((s, i) => (
          <li key={s.id} className={cn('flex items-center gap-2 rounded-lg border border-line px-3 py-2', !s.visible && 'opacity-55')}>
            <span className="tabular w-5 text-xs text-muted">{i + 1}</span>
            <span className="flex-1 text-sm font-medium">{label(s.id)}</span>
            <Button size="icon-sm" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon-sm" variant="ghost" onClick={() => move(i, 1)} disabled={i === draft.length - 1} aria-label="Move down">
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => setDraft(draft.map((d, k) => (k === i ? { ...d, visible: !d.visible } : d)))}
              aria-label={s.visible ? 'Hide section' : 'Show section'}
            >
              {s.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </Button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

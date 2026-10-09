'use client';

import { BarChart3, Building2, Filter as FunnelIcon, Laptop, Layers, PieChart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { BarList, Donut, Funnel, PlatformChart, RateTile, VolumeChart } from '@/components/charts/charts';
import { DateRangePicker, rangeFromParams, rangeToQuery } from '@/components/dashboard/date-range';
import { Card, CardHeader, cn, EmptyState, PageHeader, Skeleton, SkeletonRows } from '@/components/ui/ui';
import { JOB_TYPE_LABEL, PLATFORM_LABEL, STATUS_LABEL, WORKPLACE_LABEL } from '@/lib/enums';
import { useUrlFilters } from '@/lib/filters';
import { useAnalytics } from '@/lib/hooks';

const GRANULARITIES = [
  { value: '', label: 'Auto' },
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
];

function AnalyticsView() {
  const router = useRouter();
  const url = useUrlFilters();
  const range = rangeFromParams(url.params);
  const granularity = url.get('granularity');
  const qs = new URLSearchParams(
    Object.entries({ ...rangeToQuery(range), granularity: granularity || null }).filter(([, v]) => v) as [string, string][],
  ).toString();
  const { data: a, isLoading, isFetching } = useAnalytics(qs);

  /** Every chart segment drills into the application list with the same date range. */
  const open = (extra: Record<string, string>) => {
    const p = new URLSearchParams({ ...(a?.rangeQuery ?? {}), ...extra });
    router.push(`/applications?${p}`);
  };

  const best = a?.byPlatform.filter((p) => p.total > 0).sort((x, y) => y.interviews - x.interviews || y.interviewRate - x.interviewRate)[0];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader title="Analytics" icon={<BarChart3 />} hue="blue" description="What’s working in your job search. Click any bar or segment to see those applications." />
        <DateRangePicker value={range} info={a?.range} onChange={(v) => url.update(rangeToQuery(v))} />
      </div>

      {/* Headline rates */}
      <div className={cn('grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6', isFetching && 'opacity-80')}>
        {!a ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[118px]" />)
        ) : (
          <>
            <RateTile hue="blue" label="Response rate" value={a.conversion.responseRate} detail={`${a.funnel[1].count} of ${a.total} got a response`} onClick={() => open({ reached: 'responded' })} />
            <RateTile hue="indigo" label="Interview conversion" value={a.conversion.interviewRate} detail={`${a.funnel[3].count} of ${a.total} reached interview`} onClick={() => open({ reached: 'interviewed' })} />
            <RateTile hue="emerald" label="Offer conversion" value={a.conversion.offerRate} detail={`${a.funnel[4].count} of ${a.total} received an offer`} onClick={() => open({ reached: 'offered' })} />
            <RateTile hue="violet" label="Interview → offer" value={a.conversion.interviewToOffer} detail={`${a.funnel[4].count} offers from ${a.funnel[3].count} interviews`} onClick={() => open({ reached: 'offered' })} />
            <RateTile hue="teal"
              label="Recruiter response rate"
              value={a.recruiterResponse.rate}
              detail={`${a.recruiterResponse.replied} replies from ${a.recruiterResponse.contacted} contacted`}
              onClick={() => open({ contacted: 'yes', replied: 'yes' })}
            />
            <RateTile hue="orange" label="Follow-up completion" value={a.followUpCompletion.rate} detail={`${a.followUpCompletion.completed} of ${a.followUpCompletion.due} due follow-ups done`} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card hue="blue" className="lg:col-span-2">
          <CardHeader
            hue="blue"
            title="Application volume"
            icon={<BarChart3 />}
            subtitle={a ? `${a.total} applications in ${a.range.label.toLowerCase()}` : undefined}
            action={
              <div className="flex rounded-lg border border-line p-0.5">
                {GRANULARITIES.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => url.update({ granularity: g.value || null })}
                    className={cn('rounded-md px-2 py-0.5 text-[11px] font-medium', granularity === g.value ? 'bg-surface-2 text-fg' : 'text-muted hover:text-fg')}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            }
          />
          <div className="px-3 pb-4">
            {isLoading || !a ? <Skeleton className="h-[280px]" /> : a.total === 0 ? <EmptyState compact icon={<BarChart3 />} title="No applications in this range" /> : <VolumeChart data={a.volume} granularity={a.granularity} height={280} baseQuery={a.rangeQuery} />}
          </div>
        </Card>

        <Card hue="indigo">
          <CardHeader hue="indigo" title="Application funnel" icon={<FunnelIcon />} subtitle="Furthest stage each application reached" />
          <div className="px-2 pb-4">{!a ? <SkeletonRows rows={5} /> : <Funnel stages={a.funnel} onSelect={(k) => open(k === 'applied' ? {} : { reached: k })} />}</div>
        </Card>

        <Card hue="violet">
          <CardHeader hue="violet" title="Status distribution" icon={<PieChart />} />
          <div className="px-2 pb-4">
            {!a ? (
              <SkeletonRows rows={5} />
            ) : a.statusDistribution.length === 0 ? (
              <EmptyState compact title="No data" />
            ) : (
              <BarList
                rows={a.statusDistribution.map((s) => ({ key: s.status, label: STATUS_LABEL[s.status], value: s.count, hint: a.total ? `${Math.round((s.count / a.total) * 100)}%` : undefined }))}
                onSelect={(status) => open({ status })}
              />
            )}
          </div>
        </Card>

        <Card hue="teal" className="lg:col-span-2">
          <CardHeader
            hue="teal"
            title="Applications by platform"
            icon={<Building2 />}
            subtitle={best ? `${PLATFORM_LABEL[best.platform]} produces the most interviews (${best.interviews}, ${best.interviewRate}% rate)` : 'Which platforms lead to interviews'}
          />
          <div className="px-3 pb-4">
            {!a ? (
              <Skeleton className="h-[220px]" />
            ) : a.byPlatform.length === 0 ? (
              <EmptyState compact title="No data" />
            ) : (
              <PlatformChart data={a.byPlatform.map((p) => ({ key: p.platform, label: PLATFORM_LABEL[p.platform], total: p.total, interviews: p.interviews }))} onSelect={(platform) => open({ platform })} />
            )}
          </div>
        </Card>

        <Card hue="emerald">
          <CardHeader hue="emerald" title="Remote vs hybrid vs onsite" icon={<Laptop />} />
          <div className="px-4 pb-4">
            {!a ? (
              <SkeletonRows rows={3} />
            ) : a.total === 0 ? (
              <EmptyState compact title="No data" />
            ) : (
              <Donut
                data={(['REMOTE', 'HYBRID', 'ONSITE'] as const).map((w) => ({ key: w, label: WORKPLACE_LABEL[w], value: a.byWorkplace.find((x) => x.workplace === w)?.count ?? 0 }))}
                onSelect={(workplace) => open({ workplace })}
              />
            )}
          </div>
        </Card>

        <Card hue="amber" className="lg:col-span-2">
          <CardHeader hue="amber" title="Applications by job type" icon={<Layers />} />
          <div className="px-2 pb-4">
            {!a ? (
              <SkeletonRows rows={4} />
            ) : a.byJobType.length === 0 ? (
              <EmptyState compact title="No data" />
            ) : (
              <BarList rows={a.byJobType.map((j) => ({ key: j.jobType, label: JOB_TYPE_LABEL[j.jobType], value: j.count }))} onSelect={(jobType) => open({ jobType })} />
            )}
          </div>
        </Card>

        <Card hue="slate" className="lg:col-span-3">
          <CardHeader hue="slate" title="Platform performance" icon={<Building2 />} subtitle="Interview and offer rates by source" />
          <div className="overflow-x-auto px-1 pb-3">
            {!a ? (
              <SkeletonRows rows={4} />
            ) : a.byPlatform.length === 0 ? (
              <EmptyState compact title="No data" />
            ) : (
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-y border-line bg-surface-2/50 text-left text-[11px] tracking-wide text-muted uppercase">
                    <th className="px-3 py-2 font-medium">Platform</th>
                    <th className="px-3 py-2 text-right font-medium">Applications</th>
                    <th className="px-3 py-2 text-right font-medium">Interviews</th>
                    <th className="px-3 py-2 text-right font-medium">Offers</th>
                    <th className="px-3 py-2 text-right font-medium">Interview rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {a.byPlatform.map((p) => (
                    <tr key={p.platform} className="cursor-pointer hover:bg-surface-2/50" onClick={() => open({ platform: p.platform })}>
                      <td className="px-3 py-2 font-medium">{PLATFORM_LABEL[p.platform]}</td>
                      <td className="tabular px-3 py-2 text-right">{p.total}</td>
                      <td className="tabular px-3 py-2 text-right">{p.interviews}</td>
                      <td className="tabular px-3 py-2 text-right">{p.offers}</td>
                      <td className="tabular px-3 py-2 text-right font-medium">{p.interviewRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense>
      <AnalyticsView />
    </Suspense>
  );
}

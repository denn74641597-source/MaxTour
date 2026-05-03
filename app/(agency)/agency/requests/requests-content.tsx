'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Copy,
  Heart,
  Loader2,
  MessageCircle,
  MessageSquare,
  Phone,
  Search,
  Users,
  UserRoundCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { Input } from '@/components/ui/input';
import { GlowCard } from '@/components/pioneerui/glow-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n';
import { formatDate, placeholderImage } from '@/lib/utils';
import type { Lead, LeadStatus } from '@/types';

interface FavoriteEntry {
  id: string;
  user_id: string;
  tour_id: string;
  created_at: string;
  tour?: {
    id: string;
    title: string;
    slug: string;
    country?: string | null;
    city?: string | null;
    cover_image_url?: string | null;
  } | null;
  profile?: {
    full_name?: string | null;
    phone?: string | null;
    telegram_username?: string | null;
    avatar_url?: string | null;
  } | null;
}

type LeadWithTour = Lead & {
  tour?: {
    id?: string | null;
    title?: string | null;
    slug?: string | null;
    cover_image_url?: string | null;
    country?: string | null;
    city?: string | null;
  } | null;
};

type RequestsTab = 'leads' | 'interests';
type SortDirection = 'newest' | 'oldest';
type LeadStatusFilter = 'all' | LeadStatus;

interface RequestsContentProps {
  interests: FavoriteEntry[];
  leads: Lead[];
  initialTab?: RequestsTab;
}

const LEAD_STATUS_OPTIONS: LeadStatus[] = ['new', 'contacted', 'closed', 'won', 'lost'];

function normalize(input: string | null | undefined) {
  return (input ?? '').toLowerCase().trim();
}

function formatLocation(country?: string | null, city?: string | null) {
  if (country && city) return `${country}, ${city}`;
  return country ?? city ?? null;
}

function sortByDate<T extends { created_at: string }>(items: T[], direction: SortDirection) {
  return [...items].sort((a, b) => {
    const left = new Date(a.created_at).getTime();
    const right = new Date(b.created_at).getTime();
    return direction === 'newest' ? right - left : left - right;
  });
}

export function RequestsContent({
  interests: initialInterests,
  leads: initialLeads,
  initialTab = 'leads',
}: RequestsContentProps) {
  const { t } = useTranslation();
  const supabase = createClient();

  const [tab, setTab] = useState<RequestsTab>(initialTab);
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [leadSearch, setLeadSearch] = useState('');
  const [interestSearch, setInterestSearch] = useState('');
  const [leadSort, setLeadSort] = useState<SortDirection>('newest');
  const [interestSort, setInterestSort] = useState<SortDirection>('newest');
  const [leadStatusFilter, setLeadStatusFilter] = useState<LeadStatusFilter>('all');
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);
  const [detail, setDetail] = useState<
    | { type: 'lead'; item: LeadWithTour }
    | { type: 'interest'; item: FavoriteEntry }
    | null
  >(null);

  const filteredLeads = useMemo(() => {
    const query = normalize(leadSearch);
    const leadList = leads as LeadWithTour[];
    const searched = query
      ? leadList.filter((lead) => {
          const haystack = [
            lead.full_name,
            lead.phone,
            lead.telegram_username ?? '',
            lead.comment ?? '',
            lead.tour?.title ?? '',
            lead.tour?.country ?? '',
            lead.tour?.city ?? '',
          ]
            .join(' ')
            .toLowerCase();
          return haystack.includes(query);
        })
      : leadList;

    const statusFiltered =
      leadStatusFilter === 'all'
        ? searched
        : searched.filter((lead) => lead.status === leadStatusFilter);

    return sortByDate(statusFiltered, leadSort);
  }, [leadSearch, leadSort, leadStatusFilter, leads]);

  const filteredInterests = useMemo(() => {
    const query = normalize(interestSearch);
    const searched = query
      ? initialInterests.filter((item) => {
          const haystack = [
            item.profile?.full_name ?? '',
            item.profile?.phone ?? '',
            item.profile?.telegram_username ?? '',
            item.tour?.title ?? '',
            item.tour?.country ?? '',
            item.tour?.city ?? '',
          ]
            .join(' ')
            .toLowerCase();
          return haystack.includes(query);
        })
      : initialInterests;

    return sortByDate(searched, interestSort);
  }, [initialInterests, interestSearch, interestSort]);

  async function updateLeadStatus(leadId: string, status: LeadStatus): Promise<boolean> {
    const previousStatus = leads.find((lead) => lead.id === leadId)?.status;
    if (!previousStatus || previousStatus === status) return true;

    setUpdatingLeadId(leadId);
    setLeads((prev) => prev.map((lead) => (lead.id === leadId ? { ...lead, status } : lead)));

    const { error } = await supabase
      .from('leads')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', leadId);

    if (error) {
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId ? { ...lead, status: previousStatus } : lead
        )
      );
      toast.error(t.requestsPage.statusUpdateError);
      setUpdatingLeadId(null);
      return false;
    }

    setUpdatingLeadId(null);
    return true;
  }

  async function copyContact(value: string | null | undefined) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t.requestsPage.contactCopied);
    } catch {
      toast.error(t.requestsPage.contactCopyError);
    }
  }

  const currentLead = detail?.type === 'lead' ? detail.item : null;
  const currentInterest = detail?.type === 'interest' ? detail.item : null;

  return (
    <div className="space-y-5">
      <section className="market-section p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{t.nav.requests}</h1>
            <p className="text-sm text-muted-foreground">
              {t.requestsPage.subtitle}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 text-right shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              {t.analytics.total}
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {leads.length} / {initialInterests.length}
            </p>
          </div>
        </div>
      </section>

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as RequestsTab)}
        className="space-y-4"
      >
        <div className="market-section p-2">
          <TabsList className="grid w-full grid-cols-2 rounded-xl bg-slate-100 p-1">
            <TabsTrigger value="leads" className="gap-2 rounded-lg text-sm font-semibold">
              <MessageSquare className="h-4 w-4" />
              {t.nav.requests} ({leads.length})
            </TabsTrigger>
            <TabsTrigger value="interests" className="gap-2 rounded-lg text-sm font-semibold">
              <Heart className="h-4 w-4" />
              {t.nav.interested} ({initialInterests.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="leads" className="space-y-4">
          <section className="market-section grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_220px_220px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                value={leadSearch}
                onChange={(event) => setLeadSearch(event.target.value)}
                placeholder={t.requestsPage.searchRequestsPlaceholder}
                className="pl-9"
              />
            </label>

            <Select
              value={leadStatusFilter}
              onValueChange={(value) => setLeadStatusFilter(value as LeadStatusFilter)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t.common.filter} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.common.all}</SelectItem>
                {LEAD_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t.statusLabels[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={leadSort} onValueChange={(value) => setLeadSort(value as SortDirection)}>
              <SelectTrigger>
                <SelectValue placeholder={t.common.sortBy} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t.favorites.sortNewest}</SelectItem>
                <SelectItem value="oldest">{t.favorites.sortOldest}</SelectItem>
              </SelectContent>
            </Select>
          </section>

          {filteredLeads.length === 0 ? (
            <div className="market-section p-6 md:p-8">
              <EmptyState
                icon={<Users className="mb-4 h-12 w-12 text-muted-foreground/50" />}
                title={leads.length === 0 ? t.leadsPage.noLeads : t.favorites.noFilteredResults}
                description={leads.length === 0 ? t.leadsPage.noLeadsHint : t.favorites.noFilteredResultsHint}
              />
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredLeads.map((lead) => {
                const leadTour = (lead as LeadWithTour).tour;
                const leadLocation = formatLocation(leadTour?.country, leadTour?.city);

                return (
                  <GlowCard key={lead.id} className="rounded-2xl">
                    <Card className="market-subtle-border rounded-2xl border-none bg-white/90 shadow-[0_24px_40px_-30px_rgba(15,23,42,0.58)]">
                      <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {lead.full_name}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {leadTour?.title ?? t.tours.title}
                          </p>
                          {leadLocation && (
                            <p className="truncate text-[11px] text-slate-500">{leadLocation}</p>
                          )}
                          <p className="text-[11px] text-slate-400">{formatDate(lead.created_at)}</p>
                        </div>
                        <StatusBadge status={lead.status} />
                      </div>

                      {leadTour?.cover_image_url && (
                        <div className="relative h-24 overflow-hidden rounded-xl">
                          <Image
                            src={
                              leadTour.cover_image_url ||
                              placeholderImage(640, 320, leadTour.title ?? 'Tour')
                            }
                            alt={leadTour.title ?? 'Tour'}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}

                      <div className="flex gap-2">
                        <a
                          href={`tel:${lead.phone}`}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          {lead.phone}
                        </a>
                        {lead.telegram_username && (
                          <a
                            href={`https://t.me/${lead.telegram_username.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-50 py-2 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            {t.tours.contactTelegram}
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Select
                          value={lead.status}
                          onValueChange={(value) => updateLeadStatus(lead.id, value as LeadStatus)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LEAD_STATUS_OPTIONS.map((status) => (
                              <SelectItem key={status} value={status}>
                                {t.statusLabels[status]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDetail({ type: 'lead', item: lead as LeadWithTour })}
                        >
                          {t.common.viewDetails}
                        </Button>
                      </div>

                      {updatingLeadId === lead.id && (
                        <p className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          {t.common.loading}
                        </p>
                      )}
                      </CardContent>
                    </Card>
                  </GlowCard>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="interests" className="space-y-4">
          <section className="market-section grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_220px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                value={interestSearch}
                onChange={(event) => setInterestSearch(event.target.value)}
                placeholder={t.requestsPage.searchInterestsPlaceholder}
                className="pl-9"
              />
            </label>
            <Select
              value={interestSort}
              onValueChange={(value) => setInterestSort(value as SortDirection)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t.common.sortBy} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t.favorites.sortNewest}</SelectItem>
                <SelectItem value="oldest">{t.favorites.sortOldest}</SelectItem>
              </SelectContent>
            </Select>
          </section>

          {filteredInterests.length === 0 ? (
            <div className="market-section p-6 md:p-8">
              <EmptyState
                icon={<UserRoundCheck className="mb-4 h-12 w-12 text-muted-foreground/50" />}
                title={
                  initialInterests.length === 0
                    ? t.interestsPage.noInterests
                    : t.favorites.noFilteredResults
                }
                description={
                  initialInterests.length === 0
                    ? t.interestsPage.noInterestsHint
                    : t.favorites.noFilteredResultsHint
                }
              />
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredInterests.map((interest) => {
                const profile = interest.profile;
                const tour = interest.tour;
                const location = formatLocation(tour?.country, tour?.city);

                return (
                  <GlowCard key={interest.id} className="rounded-2xl">
                    <Card className="market-subtle-border rounded-2xl border-none bg-white/90 shadow-[0_24px_40px_-30px_rgba(15,23,42,0.58)]">
                      <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {profile?.full_name || '—'}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {t.interestsPage.interestedIn}:{' '}
                            <span className="font-semibold text-slate-700">
                              {tour?.title ?? t.tours.title}
                            </span>
                          </p>
                          {location && (
                            <p className="truncate text-[11px] text-slate-500">{location}</p>
                          )}
                          <p className="text-[11px] text-slate-400">{formatDate(interest.created_at)}</p>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-2 py-1 text-[11px] font-semibold text-pink-600">
                          <Heart className="h-3 w-3 fill-pink-500 text-pink-500" />
                          {t.interestsPage.sourceFavorite}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        {profile?.phone && (
                          <a
                            href={`tel:${profile.phone}`}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            {profile.phone}
                          </a>
                        )}
                        {profile?.telegram_username && (
                          <a
                            href={`https://t.me/${profile.telegram_username.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-50 py-2 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            {t.tours.contactTelegram}
                          </a>
                        )}
                      </div>

                      {!profile?.phone && !profile?.telegram_username && (
                        <p className="text-[11px] italic text-slate-500">
                          {t.favorites.notProvided}
                        </p>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDetail({ type: 'interest', item: interest })}
                      >
                        {t.common.viewDetails}
                      </Button>
                      </CardContent>
                    </Card>
                  </GlowCard>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Sheet open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}>
        <SheetContent side="right" className="w-full max-w-xl">
          {currentLead && (
            <>
              <SheetHeader className="border-b border-slate-200 px-5 py-4">
                <SheetTitle className="text-lg font-semibold">{currentLead.full_name}</SheetTitle>
                <SheetDescription>{t.requestsPage.requestDetail}</SheetDescription>
              </SheetHeader>

              <div className="space-y-4 overflow-y-auto p-5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {t.tours.title}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {currentLead.tour?.title ?? t.tours.title}
                  </p>
                  {currentLead.tour?.slug && (
                    <Link
                      href={`/tours/${currentLead.tour.slug}`}
                      target="_blank"
                      className="mt-2 inline-flex text-xs font-semibold text-primary hover:underline"
                    >
                      {t.common.viewDetails}
                    </Link>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {t.tours.contact}
                  </p>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 p-2.5">
                      <span className="text-sm text-slate-800">{currentLead.phone}</span>
                      <div className="flex items-center gap-1">
                        <a
                          href={`tel:${currentLead.phone}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => copyContact(currentLead.phone)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {currentLead.telegram_username && (
                      <div className="flex items-center justify-between rounded-xl border border-slate-200 p-2.5">
                        <span className="text-sm text-slate-800">{currentLead.telegram_username}</span>
                        <div className="flex items-center gap-1">
                          <a
                            href={`https://t.me/${currentLead.telegram_username.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </a>
                          <button
                            type="button"
                            onClick={() => copyContact(currentLead.telegram_username)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {t.common.status}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <StatusBadge status={currentLead.status} />
                    <Select
                      value={currentLead.status}
                      onValueChange={(value) =>
                        updateLeadStatus(currentLead.id, value as LeadStatus).then((success) => {
                          if (!success) return;
                          setDetail((prev) => {
                            if (!prev || prev.type !== 'lead') return prev;
                            return {
                              ...prev,
                              item: { ...prev.item, status: value as LeadStatus },
                            };
                          });
                        })
                      }
                    >
                      <SelectTrigger className="h-8 w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAD_STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {t.statusLabels[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {updatingLeadId === currentLead.id && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {t.common.loading}
                    </p>
                  )}
                </div>

                {currentLead.comment && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      {t.leadForm.comment}
                    </p>
                    <p className="mt-2 text-sm text-slate-700">{currentLead.comment}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {currentInterest && (
            <>
              <SheetHeader className="border-b border-slate-200 px-5 py-4">
                <SheetTitle className="text-lg font-semibold">
                  {currentInterest.profile?.full_name || '—'}
                </SheetTitle>
                <SheetDescription>{t.requestsPage.interestedDetail}</SheetDescription>
              </SheetHeader>

              <div className="space-y-4 overflow-y-auto p-5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {t.tours.title}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {currentInterest.tour?.title ?? t.tours.title}
                  </p>
                  {currentInterest.tour?.slug && (
                    <Link
                      href={`/tours/${currentInterest.tour.slug}`}
                      target="_blank"
                      className="mt-2 inline-flex text-xs font-semibold text-primary hover:underline"
                    >
                      {t.common.viewDetails}
                    </Link>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {t.tours.contact}
                  </p>
                  <div className="mt-3 space-y-2">
                    {currentInterest.profile?.phone && (
                      <div className="flex items-center justify-between rounded-xl border border-slate-200 p-2.5">
                        <span className="text-sm text-slate-800">{currentInterest.profile.phone}</span>
                        <div className="flex items-center gap-1">
                          <a
                            href={`tel:${currentInterest.profile.phone}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"
                          >
                            <Phone className="h-4 w-4" />
                          </a>
                          <button
                            type="button"
                            onClick={() => copyContact(currentInterest.profile?.phone)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {currentInterest.profile?.telegram_username && (
                      <div className="flex items-center justify-between rounded-xl border border-slate-200 p-2.5">
                        <span className="text-sm text-slate-800">
                          {currentInterest.profile.telegram_username}
                        </span>
                        <div className="flex items-center gap-1">
                          <a
                            href={`https://t.me/${currentInterest.profile.telegram_username.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </a>
                          <button
                            type="button"
                            onClick={() => copyContact(currentInterest.profile?.telegram_username)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {!currentInterest.profile?.phone &&
                      !currentInterest.profile?.telegram_username && (
                        <p className="text-sm text-slate-500">{t.favorites.notProvided}</p>
                      )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {t.common.status}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-pink-50 px-2.5 py-1 text-xs font-semibold text-pink-600">
                    <Heart className="h-3.5 w-3.5 fill-pink-500 text-pink-500" />
                    {t.interestsPage.sourceFavorite}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{formatDate(currentInterest.created_at)}</p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

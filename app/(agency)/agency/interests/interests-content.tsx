'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import { Phone, MessageCircle, Heart, UserCheck, Users, MessageSquare } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import type { Lead } from '@/types';

interface FavoriteEntry {
  id: string;
  user_id: string;
  tour_id: string;
  created_at: string;
  tour?: { id: string; title: string; slug: string; country?: string; city?: string } | null;
  profile?: { full_name?: string; phone?: string; telegram_username?: string; avatar_url?: string } | null;
}

interface InterestsContentProps {
  interests: FavoriteEntry[];
  leads: Lead[];
  initialTab?: 'interests' | 'leads';
  mode?: 'requests' | 'interests';
}

type LeadWithTour = Lead & {
  tour?: {
    title?: string | null;
  } | null;
};

export function InterestsContent({
  interests,
  leads: initialLeads,
  initialTab = 'interests',
  mode = 'interests',
}: InterestsContentProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'interests' | 'leads'>(initialTab);
  const [leads, setLeads] = useState<Lead[]>(initialLeads);

  const pageTitle = mode === 'requests' ? t.nav.requests : t.interestsPage.title;
  const pageSubtitle =
    mode === 'requests'
      ? `${leads.length} ${t.leadsPage.totalRequests}`
      : t.interestsPage.subtitle;

  async function updateStatus(leadId: string, newStatus: string | null) {
    if (!newStatus) return;
    const supabase = createClient();
    await supabase
      .from('leads')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', leadId);
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus as Lead['status'] } : l))
    );
  }

  return (
    <div className="space-y-5">
      <div className="market-section p-4 md:p-5">
        <h1 className="text-xl font-bold">{pageTitle}</h1>
        <p className="text-sm text-muted-foreground">{pageSubtitle}</p>
      </div>

      {/* Tabs */}
      <div className="market-section flex gap-1 p-1.5">
        <button
          onClick={() => setTab('interests')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            tab === 'interests'
              ? 'bg-surface text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Heart className="h-3.5 w-3.5 inline mr-1.5" />
          {t.nav.interested} ({interests.length})
        </button>
        <button
          onClick={() => setTab('leads')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            tab === 'leads'
              ? 'bg-surface text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5 inline mr-1.5" />
          {t.nav.requests} ({leads.length})
        </button>
      </div>

      {/* Tab: Interests (Favorites) */}
      {tab === 'interests' && (
        <>
          {interests.length > 0 ? (
            <div className="space-y-3">
              {interests.map((fav) => {
                const profile = fav.profile;
                const tour = fav.tour;
                const name = profile?.full_name || '—';
                const phone = profile?.phone;
                const telegram = profile?.telegram_username;

                return (
                  <Card key={fav.id} className="market-subtle-border rounded-2xl border-none bg-white/90 shadow-[0_20px_40px_-32px_rgba(15,23,42,0.55)]">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-sm">{name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {t.interestsPage.interestedIn}: <span className="font-medium text-primary">{tour?.title ?? t.tours.title}</span>
                          </p>
                          {tour?.country && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {tour.country}{tour.city ? `, ${tour.city}` : ''}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(fav.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-pink-500 bg-pink-50 px-2 py-1 rounded-full">
                          <Heart className="h-3 w-3 fill-pink-500" />
                          {t.interestsPage.sourceFavorite}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {phone && (
                          <a
                            href={`tel:${phone}`}
                            className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl py-2.5 text-sm font-medium transition-colors"
                          >
                            <Phone className="h-4 w-4" />
                            {phone}
                          </a>
                        )}
                        {telegram && (
                          <a
                            href={`https://t.me/${telegram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl py-2.5 text-sm font-medium transition-colors"
                          >
                            <MessageCircle className="h-4 w-4" />
                            {t.tours.contactTelegram}
                          </a>
                        )}
                      </div>

                      {!phone && !telegram && (
                        <p className="text-xs text-muted-foreground italic">
                          {t.favorites.notProvided}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="market-section p-6 md:p-8">
              <EmptyState
                icon={<UserCheck className="mb-4 h-12 w-12 text-muted-foreground/50" />}
                title={t.interestsPage.noInterests}
                description={t.interestsPage.noInterestsHint}
              />
            </div>
          )}
        </>
      )}

      {/* Tab: Leads (Requests) */}
      {tab === 'leads' && (
        <>
          {leads.length > 0 ? (
            <div className="space-y-3">
              {leads.map((lead) => (
                <Card key={lead.id} className="market-subtle-border rounded-2xl border-none bg-white/90 shadow-[0_20px_40px_-32px_rgba(15,23,42,0.55)]">
                  <CardContent className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-sm">{lead.full_name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {(lead as LeadWithTour).tour?.title ?? t.tours.title} · {formatDate(lead.created_at)}
                        </p>
                        {lead.people_count > 1 && (
                          <p className="text-xs text-primary font-medium mt-0.5 flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {lead.people_count} {t.leadForm.peopleCount?.toLowerCase()}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={lead.status} />
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={`tel:${lead.phone}`}
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl py-2 text-xs font-medium transition-colors"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {lead.phone}
                      </a>
                      {lead.telegram_username && (
                        <a
                          href={`https://t.me/${lead.telegram_username.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl py-2 text-xs font-medium transition-colors"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          {t.tours.contactTelegram}
                        </a>
                      )}
                    </div>

                    {lead.comment && (
                      <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                        <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                        <span>{lead.comment}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{t.common.status}:</span>
                      <Select
                        value={lead.status}
                        onValueChange={(val) => updateStatus(lead.id, val)}
                      >
                        <SelectTrigger className="h-7 w-[120px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">{t.leadsPage.statusNew}</SelectItem>
                          <SelectItem value="contacted">{t.leadsPage.statusContacted}</SelectItem>
                          <SelectItem value="closed">{t.leadsPage.statusClosed}</SelectItem>
                          <SelectItem value="won">{t.leadsPage.statusWon}</SelectItem>
                          <SelectItem value="lost">{t.leadsPage.statusLost}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="market-section p-6 md:p-8">
              <EmptyState
                icon={<Users className="mb-4 h-12 w-12 text-muted-foreground/50" />}
                title={t.leadsPage.noLeads}
                description={t.leadsPage.noLeadsHint}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

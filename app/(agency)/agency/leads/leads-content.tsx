'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import { Phone, MessageCircle, Users } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import type { Lead } from '@/types';

interface AgencyLeadsContentProps {
  initialLeads: Lead[];
}

export function AgencyLeadsContent({ initialLeads }: AgencyLeadsContentProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const { t } = useTranslation();

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
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">{t.leadsPage.title}</h1>
        <p className="text-sm text-muted-foreground">{leads.length} {t.leadsPage.totalRequests}</p>
      </div>

      {leads.length > 0 ? (
        <div className="space-y-3">
          {leads.map((lead) => (
            <Card key={lead.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">{lead.full_name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {(lead as any).tour?.title ?? 'Tour'} · {formatDate(lead.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={lead.status} />
                </div>

                {/* Contact Info */}
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {lead.phone}
                  </span>
                  {lead.telegram_username && (
                    <a
                      href={`https://t.me/${lead.telegram_username.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-500 hover:underline"
                    >
                      <MessageCircle className="h-3 w-3" />
                      {lead.telegram_username}
                    </a>
                  )}
                </div>

                {lead.comment && (
                  <p className="text-sm text-muted-foreground bg-muted/50 rounded p-2">
                    {lead.comment}
                  </p>
                )}

                {/* Status Update */}
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
        <EmptyState
          icon={<Users className="h-12 w-12 text-muted-foreground/50 mb-4" />}
          title={t.leadsPage.noLeads}
          description={t.leadsPage.noLeadsHint}
        />
      )}
    </div>
  );
}

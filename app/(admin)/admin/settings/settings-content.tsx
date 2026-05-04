'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  CircleOff,
  Clock3,
  Database,
  EyeOff,
  Lock,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Wrench,
} from 'lucide-react';
import { PageTitle, SectionShell } from '@/components/shared-ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type {
  AdminSettingCard,
  AdminSettingsSnapshot,
  SettingState,
  SettingRisk,
  SettingsBackendCoverage,
  SettingsPanelMode,
} from '@/features/admin/settings-types';

const MODE_LABELS: Record<SettingsPanelMode, string> = {
  editable: 'Editable',
  partially_editable: 'Partially editable',
  read_only: 'Read-only',
};

const COVERAGE_LABELS: Record<SettingsBackendCoverage, string> = {
  configured: 'Settings backend configured',
  partial: 'Partial settings backend configured',
  not_configured: 'Settings backend not configured',
};

function formatDateTime(value: string | null): string {
  if (!value) return 'Not available';

  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return 'Not available';

  return parsed.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function statusTone(state: SettingState): string {
  switch (state) {
    case 'configured':
      return 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30';
    case 'missing':
      return 'bg-rose-500/15 text-rose-800 border-rose-500/30';
    case 'expected':
      return 'bg-sky-500/15 text-sky-800 border-sky-500/30';
    case 'not_available':
      return 'bg-amber-500/15 text-amber-900 border-amber-500/35';
    case 'unknown':
    default:
      return 'bg-slate-500/15 text-slate-700 border-slate-500/25';
  }
}

function riskTone(risk: SettingRisk): string {
  switch (risk) {
    case 'critical':
      return 'bg-rose-600/15 text-rose-900 border-rose-600/30';
    case 'high':
      return 'bg-amber-600/15 text-amber-900 border-amber-600/30';
    case 'medium':
      return 'bg-blue-600/15 text-blue-900 border-blue-600/30';
    case 'low':
    default:
      return 'bg-slate-500/15 text-slate-700 border-slate-500/25';
  }
}

function stateLabel(state: SettingState): string {
  switch (state) {
    case 'configured':
      return 'Configured';
    case 'missing':
      return 'Missing';
    case 'expected':
      return 'Expected by config';
    case 'not_available':
      return 'Not available';
    case 'unknown':
    default:
      return 'Unknown';
  }
}

function SettingCard({ card }: { card: AdminSettingCard }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white/95 p-4 transition-colors hover:border-slate-300">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-slate-900">{card.name}</h4>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className={cn('border', statusTone(card.state))}>
            {stateLabel(card.state)}
          </Badge>
          <Badge variant="outline" className="border border-slate-300 text-slate-700">
            {card.editability === 'editable' ? 'Editable' : 'Read-only'}
          </Badge>
          <Badge variant="outline" className="border border-slate-300 text-slate-700">
            Source: {card.source}
          </Badge>
          <Badge variant="outline" className={cn('border', riskTone(card.risk))}>
            Risk: {card.risk}
          </Badge>
        </div>
      </div>

      <p className="mt-2 text-xs leading-5 text-slate-600">{card.description}</p>

      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">
          Current value
        </p>
        <p className="mt-1 text-sm font-medium text-slate-900">{card.value}</p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Clock3 className="h-3.5 w-3.5" />
          Last updated: {formatDateTime(card.lastUpdatedAt)}
        </span>
        {card.sensitive ? (
          <span className="inline-flex items-center gap-1 text-amber-700">
            <EyeOff className="h-3.5 w-3.5" />
            {card.sensitiveNote || 'Sensitive value hidden'}
          </span>
        ) : null}
      </div>

      {card.backendRequirement ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <p className="font-semibold">Backend requirement</p>
          <p className="mt-1">{card.backendRequirement}</p>
        </div>
      ) : null}
    </article>
  );
}

export function SettingsContent({ snapshot }: { snapshot: AdminSettingsSnapshot }) {
  const router = useRouter();
  const [refreshing, startTransition] = useTransition();

  const coverageTone =
    snapshot.backendCoverage === 'configured'
      ? 'border-emerald-300 bg-emerald-50'
      : snapshot.backendCoverage === 'partial'
        ? 'border-amber-300 bg-amber-50'
        : 'border-rose-300 bg-rose-50';

  const refresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="space-y-6 p-6">
      <Card className="border border-slate-200 bg-[radial-gradient(circle_at_top_right,rgba(15,118,110,0.08),transparent_36%),radial-gradient(circle_at_top_left,rgba(30,64,175,0.08),transparent_28%),#ffffff]">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <PageTitle
              title="Settings"
              subtitle="Platform configuration, admin controls, and operational readiness."
            />

            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="border border-slate-300 bg-white text-slate-700"
              >
                Mode: {MODE_LABELS[snapshot.mode]}
              </Badge>
              <Badge
                variant="outline"
                className="border border-slate-300 bg-white text-slate-700"
              >
                Last updated: {formatDateTime(snapshot.lastUpdatedAt)}
              </Badge>
              <Button
                variant="outline"
                onClick={refresh}
                disabled={refreshing}
                className="border-slate-300 bg-white"
              >
                <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className={cn('border', coverageTone)}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <SlidersHorizontal className="h-4 w-4" />
            {COVERAGE_LABELS[snapshot.backendCoverage]}
          </CardTitle>
          <CardDescription className="text-slate-700">
            Editable settings: {snapshot.editableCount} | Read-only settings: {snapshot.readOnlyCount}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            <p className="font-semibold">Coverage summary</p>
            <p className="mt-1">
              Safe settings mutation backend was not detected for global admin configuration.
              Controls are intentionally read-only. Sensitive values remain hidden.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline" className="border border-slate-300 bg-white text-slate-700">
              Editable now: {snapshot.editableCount}
            </Badge>
            <Badge variant="outline" className="border border-slate-300 bg-white text-slate-700">
              Read-only now: {snapshot.readOnlyCount}
            </Badge>
            <Badge variant="outline" className="border border-slate-300 bg-white text-slate-700">
              Missing backend requirements: {snapshot.missingBackendRequirements.length}
            </Badge>
            <Badge variant="outline" className="border border-slate-300 bg-white text-slate-700">
              Sensitive values hidden: Yes
            </Badge>
          </div>

          <Dialog>
            <DialogTrigger className="inline-flex h-8 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50">
              <Wrench className="h-4 w-4" />
              Backend Requirements
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Missing Backend Requirements</DialogTitle>
                <DialogDescription>
                  These requirements must exist before enabling editable settings controls.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 text-sm">
                {snapshot.missingBackendRequirements.length > 0 ? (
                  snapshot.missingBackendRequirements.map((item, idx) => (
                    <div
                      key={`${item}-${idx}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      {idx + 1}. {item}
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    No missing requirements reported.
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <SectionShell>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {snapshot.readiness.map((card) => (
            <Card key={card.id} className="border border-slate-200 bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{card.title}</CardTitle>
                <Badge
                  variant="outline"
                  className={cn('w-fit border', statusTone(card.state))}
                >
                  {stateLabel(card.state)}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-semibold text-slate-900">{card.value}</p>
                <p className="mt-1 text-xs text-slate-600">{card.note}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </SectionShell>

      {snapshot.loadErrors.length > 0 ? (
        <Card className="border border-amber-300 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-amber-900">
              <AlertTriangle className="h-4 w-4" />
              Partial Data Warnings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-amber-900">
            {snapshot.loadErrors.map((issue, idx) => (
              <p key={`${issue}-${idx}`}>{idx + 1}. {issue}</p>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-4">
        {snapshot.sections.length === 0 ? (
          <Card className="border border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-base">Settings Data Unavailable</CardTitle>
              <CardDescription>
                The settings snapshot returned no sections for this request.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          snapshot.sections.map((section, idx) => (
            <details
              key={section.id}
              className="group rounded-2xl border border-slate-200 bg-white"
              open={idx < 2}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{section.title}</p>
                  <p className="text-xs text-slate-600">{section.description}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-500 transition-transform group-open:rotate-180" />
              </summary>

              <div className="space-y-3 border-t border-slate-100 p-4">
                <div className="grid gap-3 xl:grid-cols-2">
                  {section.cards.map((card) => (
                    <SettingCard key={card.id} card={card} />
                  ))}
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <span className="font-semibold">Edit status:</span> No safe settings mutation flow detected
                  for this section. Controls remain read-only.
                </div>
              </div>
            </details>
          ))
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Card className="border border-rose-200 bg-rose-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-rose-900">
              <ShieldCheck className="h-4 w-4" />
              Security Warnings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-rose-900">
            {snapshot.warnings.map((warning, idx) => (
              <p key={`${warning}-${idx}`}>{idx + 1}. {warning}</p>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Database className="h-4 w-4" />
              Runtime Limitations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-700">
            {snapshot.limitations.map((limitation, idx) => (
              <p key={`${limitation}-${idx}`}>{idx + 1}. {limitation}</p>
            ))}
            <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
              Current snapshot generated at: {formatDateTime(snapshot.generatedAt)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200 bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Sensitive Data Policy</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-slate-700 md:grid-cols-2">
          <p className="inline-flex items-start gap-2">
            <Lock className="mt-0.5 h-4 w-4 text-slate-500" />
            Tokens, service-role keys, webhook secrets, chat IDs, and credentials are never displayed.
          </p>
          <p className="inline-flex items-start gap-2">
            <EyeOff className="mt-0.5 h-4 w-4 text-slate-500" />
            Public values are either visible as safe summaries or partially masked where applicable.
          </p>
          <p className="inline-flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-slate-500" />
            Admin access guard and middleware rules remain unchanged.
          </p>
          <p className="inline-flex items-start gap-2">
            <CircleOff className="mt-0.5 h-4 w-4 text-slate-500" />
            No environment-variable editing or destructive toggles are enabled in this panel.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

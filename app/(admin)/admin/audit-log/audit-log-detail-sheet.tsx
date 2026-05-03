'use client';

import Link from 'next/link';
import { AlertTriangle, ExternalLink, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import type { AdminAuditEvent } from '@/features/admin/audit-log';

interface AuditLogDetailSheetProps {
  event: AdminAuditEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not provided';
  return date.toLocaleString();
}

function formatJson(value: unknown): string {
  if (!value) return 'Not provided';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return 'Metadata could not be formatted';
  }
}

function field(value: string | null | undefined): string {
  return value && value.trim().length > 0 ? value : 'Not provided';
}

export function AuditLogDetailSheet({
  event,
  open,
  onOpenChange,
}: AuditLogDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Audit Event Detail</SheetTitle>
          <SheetDescription>
            Detailed admin/security trace for the selected event.
          </SheetDescription>
        </SheetHeader>

        {!event ? (
          <div className="px-4 pb-6 text-sm text-slate-500">Select an event to inspect details.</div>
        ) : (
          <div className="space-y-5 px-4 pb-6 text-sm">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-semibold text-slate-900">{event.action}</p>
                {event.status ? (
                  <Badge
                    variant={event.status === 'failed' ? 'destructive' : event.status === 'pending' ? 'outline' : 'secondary'}
                    className="capitalize"
                  >
                    {event.status}
                  </Badge>
                ) : null}
                {event.severity ? (
                  <Badge
                    variant={
                      event.severity === 'critical' || event.severity === 'error'
                        ? 'destructive'
                        : event.severity === 'warning'
                          ? 'outline'
                          : 'secondary'
                    }
                    className="capitalize"
                  >
                    {event.severity}
                  </Badge>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-slate-500">{event.actionType}</p>
              <p className="mt-2 text-xs text-slate-600">{formatTimestamp(event.timestamp)}</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Actor</p>
              <div className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm md:grid-cols-2">
                <p><span className="text-slate-500">Name:</span> {field(event.actorName)}</p>
                <p><span className="text-slate-500">Role:</span> {field(event.actorRole)}</p>
                <p><span className="text-slate-500">Email:</span> {field(event.actorEmail)}</p>
                <p><span className="text-slate-500">Actor ID:</span> {field(event.actorId)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Target Entity</p>
              <div className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm md:grid-cols-2">
                <p><span className="text-slate-500">Entity type:</span> {event.entityType}</p>
                <p><span className="text-slate-500">Entity ID:</span> {field(event.entityId)}</p>
                <p className="md:col-span-2">
                  <span className="text-slate-500">Summary:</span> {field(event.targetSummary)}
                </p>
                <p className="md:col-span-2">
                  <span className="text-slate-500">Source module:</span> {event.sourceModule}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Risk Notes</p>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                {event.highRisk ? (
                  <div className="space-y-2">
                    <p className="inline-flex items-center gap-2 text-sm font-medium text-amber-700">
                      <ShieldAlert className="h-4 w-4" /> High-risk event
                    </p>
                    {event.riskReasons.length > 0 ? (
                      <ul className="space-y-1 text-sm text-slate-700">
                        {event.riskReasons.map((reason) => (
                          <li key={reason} className="flex items-start gap-2">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 text-amber-500" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-600">No explicit risk reason provided.</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">Not marked as high-risk by current audit rules.</p>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Before / After</p>
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                Before/after snapshots are not covered by current backend audit sources.
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Metadata (Sanitized)</p>
              <div className="rounded-xl border border-slate-200 bg-slate-950 p-4">
                <pre className="max-h-[260px] overflow-auto whitespace-pre-wrap break-all text-xs text-slate-100">
                  {formatJson(event.metadata)}
                </pre>
              </div>
            </div>

            {event.relatedLinks.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Related Routes</p>
                <div className="grid gap-2">
                  {event.relatedLinks.map((link) => (
                    <Link
                      key={`${event.id}:${link.href}`}
                      href={link.href}
                      className="inline-flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-blue-700 transition-colors hover:bg-blue-50"
                    >
                      <span>{link.label}</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

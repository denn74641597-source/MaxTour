import { SettingsContent } from './settings-content';
import { getAdminSettingsSnapshot } from '@/features/admin/settings';
import type { AdminSettingsSnapshot } from '@/features/admin/settings-types';

export const dynamic = 'force-dynamic';

function fallbackSnapshot(errorMessage: string): AdminSettingsSnapshot {
  const generatedAt = new Date().toISOString();

  return {
    generatedAt,
    lastUpdatedAt: generatedAt,
    mode: 'read_only',
    backendCoverage: 'not_configured',
    editableCount: 0,
    readOnlyCount: 0,
    sections: [],
    readiness: [],
    warnings: ['Settings snapshot failed to load. Data shown may be incomplete.'],
    missingBackendRequirements: [
      'A dedicated admin-safe settings backend is required before enabling editable controls.',
    ],
    limitations: ['Settings data could not be fetched from the server in this request.'],
    loadErrors: [errorMessage],
  };
}

export default async function AdminSettingsPage() {
  try {
    const snapshot = await getAdminSettingsSnapshot();
    return <SettingsContent snapshot={snapshot} />;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown settings load error';
    return <SettingsContent snapshot={fallbackSnapshot(errorMessage)} />;
  }
}

export type SettingsPanelMode = 'editable' | 'partially_editable' | 'read_only';

export type SettingsBackendCoverage =
  | 'configured'
  | 'partial'
  | 'not_configured';

export type SettingSource = 'env' | 'database' | 'docs' | 'code' | 'unknown';

export type SettingRisk = 'low' | 'medium' | 'high' | 'critical';

export type SettingState =
  | 'configured'
  | 'missing'
  | 'unknown'
  | 'expected'
  | 'not_available';

export type SettingEditability = 'editable' | 'read_only';

export interface AdminSettingCard {
  id: string;
  name: string;
  description: string;
  value: string;
  state: SettingState;
  editability: SettingEditability;
  source: SettingSource;
  risk: SettingRisk;
  lastUpdatedAt: string | null;
  sensitive: boolean;
  sensitiveNote?: string;
  backendRequirement?: string;
}

export interface AdminSettingSection {
  id: string;
  title: string;
  description: string;
  cards: AdminSettingCard[];
}

export interface AdminSettingsReadinessCard {
  id: string;
  title: string;
  value: string;
  state: SettingState;
  note: string;
}

export interface AdminSettingsSnapshot {
  generatedAt: string;
  lastUpdatedAt: string | null;
  mode: SettingsPanelMode;
  backendCoverage: SettingsBackendCoverage;
  editableCount: number;
  readOnlyCount: number;
  sections: AdminSettingSection[];
  readiness: AdminSettingsReadinessCard[];
  warnings: string[];
  missingBackendRequirements: string[];
  limitations: string[];
  loadErrors: string[];
}

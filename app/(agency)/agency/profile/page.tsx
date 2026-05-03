import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  getMyAgency,
  getAgencyFollowersCount,
  getAgencyTourLimit,
} from '@/features/agencies/queries';
import { getMyVerificationRequests } from '@/features/verification/actions';
import { getMaxCoinBalance } from '@/features/maxcoin/queries';
import { AgencyProfileContent } from './profile-content';

export interface AgencyOwnerSummary {
  full_name: string | null;
  phone: string | null;
  email: string | null;
  telegram_username: string | null;
  avatar_url: string | null;
}

export interface AgencyPlanSummary {
  planName: string;
  maxTours: number;
  currentTours: number;
  canCreate: boolean;
}

export interface AgencyProfileSummary {
  maxCoinBalance: number;
  followersCount: number;
  owner: AgencyOwnerSummary | null;
  latestVerification:
    | {
        status: 'pending' | 'approved' | 'rejected';
        created_at: string;
        admin_note: string | null;
      }
    | null;
  planSummary: AgencyPlanSummary | null;
}

export default async function AgencyProfilePage() {
  const agency = await getMyAgency();
  if (!agency) return <AgencyProfileContent initialAgency={null} summary={null} />;

  let summary: AgencyProfileSummary = {
    maxCoinBalance: 0,
    followersCount: 0,
    owner: null,
    latestVerification: null,
    planSummary: null,
  };

  try {
    const supabase = await createServerSupabaseClient();
    const [maxCoinBalance, followersCount, planSummary, verificationRequests, ownerRes] =
      await Promise.all([
        getMaxCoinBalance(agency.id),
        getAgencyFollowersCount(agency.id),
        getAgencyTourLimit(agency.id).catch(() => null),
        getMyVerificationRequests(agency.id).catch(() => []),
        supabase
          .from('profiles')
          .select('full_name, phone, email, telegram_username, avatar_url')
          .eq('id', agency.owner_id)
          .maybeSingle(),
      ]);

    const latestVerification = verificationRequests[0]
      ? {
          status: verificationRequests[0].status,
          created_at: verificationRequests[0].created_at,
          admin_note: verificationRequests[0].admin_note ?? null,
        }
      : null;

    summary = {
      maxCoinBalance,
      followersCount,
      owner: ownerRes.data ?? null,
      latestVerification,
      planSummary: planSummary
        ? {
            planName: planSummary.planName,
            maxTours: planSummary.maxTours,
            currentTours: planSummary.currentTours,
            canCreate: planSummary.canCreate,
          }
        : null,
    };
  } catch {
    summary = {
      maxCoinBalance: 0,
      followersCount: 0,
      owner: null,
      latestVerification: null,
      planSummary: null,
    };
  }

  return <AgencyProfileContent initialAgency={agency} summary={summary} />;
}

import { MapPin, Users, Star, CreditCard } from 'lucide-react';
import { DashboardStatCard } from '@/components/shared/dashboard-stat-card';
import { SectionHeader } from '@/components/shared/section-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';

async function getAgencyDashboardData() {
  const supabase = await createServerSupabaseClient();

  // In production, this would use getCurrentAgency() to get the actual agency
  // For MVP demo, we fetch the first agency
  const { data: agency } = await supabase
    .from('agencies')
    .select('*')
    .limit(1)
    .single();

  if (!agency) return null;

  const [toursRes, leadsRes, featuredRes, subRes] = await Promise.all([
    supabase.from('tours').select('id', { count: 'exact', head: true }).eq('agency_id', agency.id).eq('status', 'published'),
    supabase.from('leads').select('*, tour:tours(title)').eq('agency_id', agency.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('tours').select('id', { count: 'exact', head: true }).eq('agency_id', agency.id).eq('is_featured', true),
    supabase.from('agency_subscriptions').select('*, plan:subscription_plans(name)').eq('agency_id', agency.id).eq('status', 'active').limit(1).single(),
  ]);

  return {
    agency,
    activeTours: toursRes.count ?? 0,
    totalLeads: leadsRes.data?.length ?? 0,
    recentLeads: leadsRes.data ?? [],
    featuredTours: featuredRes.count ?? 0,
    subscription: subRes.data,
  };
}

export default async function AgencyDashboardPage() {
  const data = await getAgencyDashboardData();

  if (!data) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Agency Dashboard</h1>
        <p className="text-muted-foreground">No agency found. Please set up your profile first.</p>
        <Link href="/agency/profile">
          <Button>Set Up Agency</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back, {data.agency.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <DashboardStatCard title="Active Tours" value={data.activeTours} icon={MapPin} />
        <DashboardStatCard title="Total Leads" value={data.totalLeads} icon={Users} />
        <DashboardStatCard title="Featured Tours" value={data.featuredTours} icon={Star} />
        <DashboardStatCard
          title="Subscription"
          value={(data.subscription as any)?.plan?.name ?? 'Free'}
          icon={CreditCard}
        />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 flex-wrap">
        <Link href="/agency/tours/new">
          <Button size="sm">+ New Tour</Button>
        </Link>
        <Link href="/agency/leads">
          <Button variant="outline" size="sm">View Leads</Button>
        </Link>
        <Link href="/agency/profile">
          <Button variant="outline" size="sm">Edit Profile</Button>
        </Link>
      </div>

      {/* Recent Leads */}
      <section>
        <SectionHeader title="Recent Leads" />
        {data.recentLeads.length > 0 ? (
          <div className="space-y-2">
            {data.recentLeads.map((lead: any) => (
              <Card key={lead.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{lead.full_name}</p>
                    <p className="text-xs text-muted-foreground">{lead.tour?.title ?? 'Tour'}</p>
                  </div>
                  <StatusBadge status={lead.status} />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No leads yet.</p>
        )}
      </section>
    </div>
  );
}

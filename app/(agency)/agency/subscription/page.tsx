import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/shared/status-badge';
import { Check, X } from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/utils';

async function getSubscriptionData() {
  const supabase = await createServerSupabaseClient();

  const { data: plans } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('price_monthly', { ascending: true });

  // In production, scope to current agency
  const { data: agency } = await supabase.from('agencies').select('id').limit(1).single();
  let currentSub = null;
  if (agency) {
    const { data } = await supabase
      .from('agency_subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('agency_id', agency.id)
      .eq('status', 'active')
      .limit(1)
      .single();
    currentSub = data;
  }

  return { plans: plans ?? [], currentSub };
}

export default async function SubscriptionPage() {
  const { plans, currentSub } = await getSubscriptionData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Subscription</h1>
        <p className="text-sm text-muted-foreground">
          Manage your subscription plan
        </p>
      </div>

      {/* Current Plan */}
      {currentSub && (
        <Card className="border-primary/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Current Plan</p>
                <h2 className="text-lg font-bold">{(currentSub as any).plan?.name}</h2>
              </div>
              <StatusBadge status={currentSub.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Expires: {new Date(currentSub.ends_at).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Plan Comparison */}
      <div className="space-y-3">
        <h2 className="font-semibold">Available Plans</h2>
        {plans.map((plan) => {
          const isCurrent = currentSub?.plan_id === plan.id;
          return (
            <Card key={plan.id} className={isCurrent ? 'border-primary' : ''}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{plan.name}</h3>
                    <p className="text-2xl font-bold">
                      {plan.price_monthly === 0
                        ? 'Free'
                        : `${formatPrice(plan.price_monthly)}/mo`}
                    </p>
                  </div>
                  {isCurrent && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      Current
                    </Badge>
                  )}
                </div>

                <Separator />

                <ul className="space-y-2 text-sm">
                  <FeatureRow label={`Up to ${plan.max_active_tours} active tours`} included />
                  <FeatureRow label="Featured tour placement" included={plan.can_feature} />
                  <FeatureRow label="Priority support" included={plan.has_priority_support} />
                </ul>

                {!isCurrent && (
                  <Button
                    variant={plan.price_monthly > 0 ? 'default' : 'outline'}
                    className="w-full"
                    size="sm"
                  >
                    {plan.price_monthly > (currentSub as any)?.plan?.price_monthly ? 'Upgrade' : 'Switch'} to {plan.name}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Payment integration coming soon. Contact support for plan changes.
      </p>
    </div>
  );
}

function FeatureRow({ label, included }: { label: string; included: boolean }) {
  return (
    <li className="flex items-center gap-2">
      {included ? (
        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground/40 shrink-0" />
      )}
      <span className={included ? '' : 'text-muted-foreground'}>{label}</span>
    </li>
  );
}

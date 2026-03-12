import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Separator } from '@/components/ui/separator';
import { getSubscriptionOverview } from '@/features/admin/queries';
import { formatPrice, formatDate } from '@/lib/utils';

export default async function AdminSubscriptionsPage() {
  const { plans, subscriptions } = await getSubscriptionOverview();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Subscriptions</h1>
        <p className="text-sm text-muted-foreground">Overview of plans and agency subscriptions</p>
      </div>

      {/* Plans */}
      <section>
        <h2 className="font-semibold mb-3">Subscription Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardContent className="p-4">
                <h3 className="font-semibold">{plan.name}</h3>
                <p className="text-2xl font-bold">
                  {plan.price_monthly === 0 ? 'Free' : `${formatPrice(plan.price_monthly)}/mo`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Max {plan.max_active_tours} tours · {plan.can_feature ? 'Can feature' : 'No featuring'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* Active Subscriptions */}
      <section>
        <h2 className="font-semibold mb-3">Agency Subscriptions ({subscriptions.length})</h2>
        <div className="space-y-3">
          {subscriptions.map((sub: any) => (
            <Card key={sub.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">{sub.agency?.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      Plan: {sub.plan?.name} · Expires: {formatDate(sub.ends_at)}
                    </p>
                  </div>
                  <StatusBadge status={sub.status} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

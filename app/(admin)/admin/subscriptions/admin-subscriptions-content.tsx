'use client';

import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/lib/i18n';
import { formatPrice, formatDate } from '@/lib/utils';

interface AdminSubscriptionsContentProps {
  plans: any[];
  subscriptions: any[];
}

export function AdminSubscriptionsContent({ plans, subscriptions }: AdminSubscriptionsContentProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">{t.admin.subscriptions}</h1>
        <p className="text-sm text-muted-foreground">{t.admin.subscriptionsDescription}</p>
      </div>

      {/* Plans */}
      <section>
        <h2 className="font-semibold mb-3">{t.admin.subscriptionPlans}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardContent className="p-4">
                <h3 className="font-semibold">{plan.name}</h3>
                <p className="text-2xl font-bold">
                  {plan.price_monthly === 0 ? t.common.free : `${formatPrice(plan.price_monthly)}/mo`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {plan.max_active_tours} {t.admin.maxTours} · {plan.can_feature ? t.admin.canFeature : t.admin.noFeaturing}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* Active Subscriptions */}
      <section>
        <h2 className="font-semibold mb-3">{t.admin.agencySubscriptions} ({subscriptions.length})</h2>
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

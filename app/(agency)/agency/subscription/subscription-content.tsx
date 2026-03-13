'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/shared/status-badge';
import { useTranslation } from '@/lib/i18n';
import { Check, X } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface SubscriptionContentProps {
  plans: any[];
  currentSub: any;
}

export function SubscriptionContent({ plans, currentSub }: SubscriptionContentProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">{t.subscriptionPage.title}</h1>
        <p className="text-sm text-muted-foreground">
          {t.subscriptionPage.subtitle}
        </p>
      </div>

      {/* Current Plan */}
      {currentSub && (
        <Card className="border-primary/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t.subscriptionPage.currentPlan}</p>
                <h2 className="text-lg font-bold">{(currentSub as any).plan?.name}</h2>
              </div>
              <StatusBadge status={currentSub.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t.subscriptionPage.expires}: {new Date(currentSub.ends_at).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Plan Comparison */}
      <div className="space-y-3">
        <h2 className="font-semibold">{t.subscriptionPage.availablePlans}</h2>
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
                        ? t.common.free
                        : `${formatPrice(plan.price_monthly)}/mo`}
                    </p>
                  </div>
                  {isCurrent && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {t.common.current}
                    </Badge>
                  )}
                </div>

                <Separator />

                <ul className="space-y-2 text-sm">
                  <FeatureRow label={`${plan.max_active_tours} ${t.subscriptionPage.activeTours}`} included />
                  <FeatureRow label={t.subscriptionPage.featuredPlacement} included={plan.can_feature} />
                  <FeatureRow label={t.subscriptionPage.prioritySupport} included={plan.has_priority_support} />
                </ul>

                {!isCurrent && (
                  <Button
                    variant={plan.price_monthly > 0 ? 'default' : 'outline'}
                    className="w-full"
                    size="sm"
                  >
                    {plan.price_monthly > (currentSub as any)?.plan?.price_monthly
                      ? t.common.upgrade
                      : t.common.switchTo} {plan.name}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {t.subscriptionPage.paymentNote}
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

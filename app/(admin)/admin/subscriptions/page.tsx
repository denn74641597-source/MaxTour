import { getSubscriptionOverview } from '@/features/admin/queries';
import { AdminSubscriptionsContent } from './admin-subscriptions-content';

export default async function AdminSubscriptionsPage() {
  const { plans, subscriptions } = await getSubscriptionOverview();
  return <AdminSubscriptionsContent plans={plans} subscriptions={subscriptions} />;
}

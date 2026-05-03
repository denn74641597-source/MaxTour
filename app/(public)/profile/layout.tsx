import { UserAreaLayout } from '@/components/layouts';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <UserAreaLayout>{children}</UserAreaLayout>;
}

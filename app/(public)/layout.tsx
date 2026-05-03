import { PublicWebsiteLayout } from '@/components/layouts';

export const revalidate = 60;

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicWebsiteLayout>{children}</PublicWebsiteLayout>;
}


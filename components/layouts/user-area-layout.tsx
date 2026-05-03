import { SectionShell } from '@/components/shared-ui';

export function UserAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SectionShell className="mx-auto mt-4 w-full max-w-[1040px] px-0 sm:px-2">
      {children}
    </SectionShell>
  );
}

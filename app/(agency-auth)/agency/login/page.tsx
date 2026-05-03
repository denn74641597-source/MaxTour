import { Suspense } from 'react';
import { AgencyAuthScreen } from './agency-auth-screen';

export default function AgencyLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,#f6fbff_0%,#f5f7fb_42%,#eef3f8_100%)] px-4">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
            Yuklanmoqda...
          </div>
        </div>
      }
    >
      <AgencyAuthScreen />
    </Suspense>
  );
}

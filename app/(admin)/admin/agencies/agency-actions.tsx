'use client';

import { Button } from '@/components/ui/button';
import { updateAgencyApprovalAction } from '@/features/admin/actions';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  agencyId: string;
  isApproved: boolean;
}

export function AdminAgencyActions({ agencyId, isApproved }: Props) {
  const router = useRouter();

  async function handleApproval(approved: boolean) {
    const result = await updateAgencyApprovalAction(agencyId, approved);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(approved ? 'Agency approved' : 'Agency rejected');
    router.refresh();
  }

  return (
    <div className="flex gap-1.5">
      {!isApproved ? (
        <Button
          size="sm"
          variant="default"
          className="h-7 text-xs"
          onClick={() => handleApproval(true)}
        >
          <Check className="h-3 w-3 mr-1" /> Approve
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => handleApproval(false)}
        >
          <X className="h-3 w-3 mr-1" /> Reject
        </Button>
      )}
    </div>
  );
}

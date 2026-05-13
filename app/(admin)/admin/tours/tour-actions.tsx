'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateTourStatusAction } from '@/features/admin/actions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Props {
  tourId: string;
  currentStatus: string;
}

export function AdminTourActions({ tourId, currentStatus }: Props) {
  const router = useRouter();

  async function handleStatusChange(newStatus: string | null) {
    if (!newStatus) return;
    let grantApprovalBonus = false;
    if (newStatus === 'published') {
      grantApprovalBonus = window.confirm('Give 2 MaxCoin approval bonus to this tour\'s agency?');
    }

    const result = await updateTourStatusAction(
      tourId,
      newStatus,
      newStatus === 'published' ? { grantApprovalBonus } : {}
    );

    if (result.error) {
      toast.error('Tizimda xatolik');
      return;
    }

    if (newStatus === 'published') {
      if (result.bonusError) {
        toast.error(`Tur nashr qilindi, bonus berishda xatolik: ${result.bonusError}`);
      } else if (result.bonusGranted) {
        toast.success('Tur nashr qilindi va 2 MaxCoin bonus berildi');
      } else {
        toast.success('Tur nashr qilindi (bonus berilmadi)');
      }
    } else {
      toast.success('Tur holati yangilandi');
    }
    router.refresh();
  }

  return (
    <Select value={currentStatus} onValueChange={handleStatusChange}>
      <SelectTrigger className="h-7 w-[110px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="draft">Draft</SelectItem>
        <SelectItem value="pending">Pending</SelectItem>
        <SelectItem value="published">Publish</SelectItem>
        <SelectItem value="archived">Archive</SelectItem>
      </SelectContent>
    </Select>
  );
}

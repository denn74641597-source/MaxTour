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
    const result = await updateTourStatusAction(tourId, newStatus);

    if (result.error) {
      toast.error('Tizimda xatolik');
      return;
    }

    toast.success('Tur holati yangilandi');
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

'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Props {
  tourId: string;
  currentStatus: string;
}

export function AdminTourActions({ tourId, currentStatus }: Props) {
  const router = useRouter();
  const supabase = createClient();

  async function handleStatusChange(newStatus: string | null) {
    if (!newStatus) return;
    const { error } = await supabase
      .from('tours')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', tourId);

    if (error) {
      toast.error('Failed to update status');
      return;
    }

    toast.success(`Tour ${newStatus}`);
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

import { formatPrice } from '@/lib/utils';

interface PriceBlockProps {
  price: number;
  currency?: string;
  originalPrice?: number;
  className?: string;
}

export function PriceBlock({
  price,
  currency = 'USD',
  originalPrice,
  className,
}: PriceBlockProps) {
  return (
    <div className={className}>
      {originalPrice && originalPrice > price && (
        <span className="text-xs text-muted-foreground line-through mr-1">
          {formatPrice(originalPrice, currency)}
        </span>
      )}
      <span className="font-bold text-primary text-sm">
        {formatPrice(price, currency)}
      </span>
    </div>
  );
}

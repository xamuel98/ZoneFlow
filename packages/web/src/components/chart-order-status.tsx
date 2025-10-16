import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ORDER_STATUS_COLORS } from '@/lib/utils';
import { useMemo } from 'react';

export function ChartOrderStatus({
  orderMetrics,
}: {
  orderMetrics: {
    pending: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
}) {
  // Memoize calculations to prevent recalculation on every render
  const { statusData, totalOrders } = useMemo(() => {
    const total = Object.values(orderMetrics).reduce((acc, count) => acc + count, 0);
    
    const data = Object.entries(orderMetrics).map(([status, count]) => {
      let color: string;
      switch (status) {
        case 'pending':
          color = ORDER_STATUS_COLORS.pending;
          break;
        case 'assigned':
          color = ORDER_STATUS_COLORS.assigned;
          break;
        case 'picked_up':
          color = ORDER_STATUS_COLORS.picked_up;
          break;
        case 'in_transit':
          color = ORDER_STATUS_COLORS.in_transit;
          break;
        case 'delivered':
          color = ORDER_STATUS_COLORS.delivered;
          break;
        case 'cancelled':
          color = ORDER_STATUS_COLORS.cancelled;
          break;
        default:
          color = 'bg-red-500';
      }
      
      return {
        status,
        count,
        color,
        percentage: total > 0 ? (count / total) * 100 : 0,
      };
    });
    
    return { statusData: data, totalOrders: total };
  }, [orderMetrics]);

  return (
    <Card className="bg-card text-card-foreground flex flex-col border-t border-l-0 xl:border-l border-r-0 border-b-0 py-6 gap-5">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <CardTitle>Total Orders</CardTitle>
            <div className="flex items-start gap-2">
              <div className="font-semibold text-2xl">
                {Number(totalOrders).toLocaleString()}
              </div>
              {/* <Badge className="mt-1.5 bg-emerald-500/24 text-emerald-500 border-none">
                +3.4%
              </Badge> */}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {/* Use CSS custom properties instead of inline styles to avoid layout calculations */}
        <div className="flex gap-1 h-5">
          {statusData.map(({ status, color, percentage }) => (
            <div
              key={status}
              className="h-full transition-all duration-200 ease-out"
              style={{
                backgroundColor: color,
                width: `${percentage}%`,
                willChange: 'width', // Optimize for width changes
              }}
            />
          ))}
        </div>
        <div>
          <ul className="text-sm divide-y divide-border">
            {statusData.map(({ status, count, color }) => (
              <li key={status} className="py-2 flex items-center gap-2">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ 
                    backgroundColor: color,
                    willChange: 'background-color', // Optimize for color changes
                  }}
                  aria-hidden="true"
                />
                <span className="grow text-muted-foreground capitalize">
                  {status.replace('_', ' ')}
                </span>
                <span className="text-[13px]/3 font-medium text-foreground/70">
                  {count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

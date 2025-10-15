import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ORDER_STATUS_COLORS } from '@/lib/utils';

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
  // Helper to map order status strings to their color classes
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return ORDER_STATUS_COLORS.pending;
      case 'assigned':
        return ORDER_STATUS_COLORS.assigned;
      case 'picked_up':
        return ORDER_STATUS_COLORS.picked_up;
      case 'in_transit':
        return ORDER_STATUS_COLORS.in_transit;
      case 'delivered':
        return ORDER_STATUS_COLORS.delivered;
      case 'cancelled':
        return ORDER_STATUS_COLORS.cancelled;
      default:
        return 'bg-red-500';
    }
  };

  // Calculate the total number of orders
  const totalOrders = Object.values(orderMetrics).reduce(
    (acc, count) => acc + count,
    0
  );

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
        <div className="flex gap-1 h-5">
          {Object.entries(orderMetrics).map(([status, count]) => (
            <div
              key={status}
              className="h-full"
              style={{
                backgroundColor: getStatusColor(status),
                width: `${(count / totalOrders) * 100}%`,
              }}
            ></div>
          ))}
        </div>
        <div>
          <ul className="text-sm divide-y divide-border">
            {Object.entries(orderMetrics).map(([status, count]) => (
              <li key={status} className="py-2 flex items-center gap-2">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: getStatusColor(status) }}
                  aria-hidden="true"
                ></span>
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

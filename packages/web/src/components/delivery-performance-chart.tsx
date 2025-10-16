'use client';

import { useId, useMemo, memo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  Rectangle,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from './ui/chart';
import { CustomTooltipContent } from './charts-extra';
import { Badge } from '@/components/ui/badge';

// Subscriber data for the last 12 months - memoized to prevent recreation
const chartData = [
  { month: 'Jan 2025', actual: 5000, projected: 2000 },
  { month: 'Feb 2025', actual: 10000, projected: 8000 },
  { month: 'Mar 2025', actual: 15000, projected: 22000 },
  { month: 'Apr 2025', actual: 22000, projected: 15000 },
  { month: 'May 2025', actual: 20000, projected: 25000 },
  { month: 'Jun 2025', actual: 35000, projected: 45000 },
  { month: 'Jul 2025', actual: 30000, projected: 25000 },
  { month: 'Aug 2025', actual: 60000, projected: 70000 },
  { month: 'Sep 2025', actual: 65000, projected: 75000 },
  { month: 'Oct 2025', actual: 60000, projected: 80000 },
  { month: 'Nov 2025', actual: 70000, projected: 65000 },
  { month: 'Dec 2025', actual: 78000, projected: 75000 },
];

const chartConfig = {
  actual: {
    label: 'Actual',
    color: 'var(--chart-1)',
  },
  projected: {
    label: 'Projected',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig;

interface CustomCursorProps {
  fill?: string;
  pointerEvents?: string;
  height?: number;
  points?: Array<{ x: number; y: number }>;
  className?: string;
}

// Memoize CustomCursor to prevent unnecessary re-renders
const CustomCursor = memo(function CustomCursor(props: CustomCursorProps) {
  const { fill, pointerEvents, height, points, className } = props;

  if (!points || points.length === 0) {
    return null;
  }

  const { x, y } = points[0]!;
  return (
    <>
      <Rectangle
        x={x - 12}
        y={y}
        fill={fill}
        pointerEvents={pointerEvents}
        width={24}
        height={height}
        className={className}
        type="linear"
      />
      <Rectangle
        x={x - 1}
        y={y}
        fill={fill}
        pointerEvents={pointerEvents}
        width={1}
        height={height}
        className="recharts-tooltip-inner-cursor"
        type="linear"
      />
    </>
  );
});

// Memoize the main component to prevent unnecessary re-renders
export const DeliveryPerformanceChart = memo(function DeliveryPerformanceChart() {
  const id = useId();

  // Memoize expensive calculations and configurations
  const memoizedConfig = useMemo(() => ({
    chartMargin: { left: -12, right: 12, top: 12 },
    gradientId: `${id}-gradient`,
    activeDotConfig: {
      r: 5,
      fill: 'hsl(var(--chart-1))',
      stroke: 'hsl(var(--background))',
      strokeWidth: 2,
    },
    tickFormatter: (value: string) => value.slice(0, 3),
    yAxisFormatter: (value: number) => {
      if (value === 0) return '$0';
      return `${value / 1000}k`;
    },
    valueFormatter: (value: number) => `$${value.toLocaleString()}`,
  }), [id]);

  // Memoize color map and label map to prevent recreation
  const tooltipConfig = useMemo(() => ({
    colorMap: {
      actual: 'hsl(var(--chart-1))',
      projected: 'hsl(var(--chart-3))',
    },
    labelMap: {
      actual: 'Actual',
      projected: 'Projected',
    },
    dataKeys: ['actual', 'projected'],
  }), []);

  return (
    <Card className="bg-card text-card-foreground flex flex-col border-t border-r-0 border-l-0 border-b-0 py-6 gap-4">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <CardTitle>Active Subscribers</CardTitle>
            <div className="flex items-start gap-2">
              <div className="font-semibold text-2xl">142,869</div>
              <Badge className="mt-1.5 bg-emerald-500/24 text-emerald-500 border-none">
                +24.7%
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                aria-hidden="true"
                className="size-1.5 shrink-0 rounded-sm bg-chart-1"
              />
              <div className="text-[13px]/3 text-muted-foreground/50">
                Actual
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                aria-hidden="true"
                className="size-1.5 shrink-0 rounded-sm bg-chart-3"
              />
              <div className="text-[13px]/3 text-muted-foreground/50">
                Projected
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-60 w-full [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-(--chart-1)/15 [&_.recharts-rectangle.recharts-tooltip-inner-cursor]:fill-white/20"
          style={{ willChange: 'transform' }} // Optimize for potential transforms
        >
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={memoizedConfig.chartMargin}
          >
            <defs>
              <linearGradient id={memoizedConfig.gradientId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="hsl(var(--chart-2))" />
                <stop offset="100%" stopColor="hsl(var(--chart-1))" />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray="2 2"
              stroke="hsl(var(--border))"
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={12}
              tickFormatter={memoizedConfig.tickFormatter}
              stroke="hsl(var(--border))"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickFormatter={memoizedConfig.yAxisFormatter}
              interval="preserveStartEnd"
            />
            <Line
              type="linear"
              dataKey="projected"
              stroke="hsl(var(--color-projected))"
              strokeWidth={2}
              dot={false}
              activeDot={false}
            />
            <ChartTooltip
              content={
                <CustomTooltipContent
                  colorMap={tooltipConfig.colorMap}
                  labelMap={tooltipConfig.labelMap}
                  dataKeys={tooltipConfig.dataKeys}
                  valueFormatter={memoizedConfig.valueFormatter}
                />
              }
              cursor={<CustomCursor fill="hsl(var(--chart-1))" />}
            />
            <Line
              type="linear"
              dataKey="actual"
              stroke={`url(#${memoizedConfig.gradientId})`}
              strokeWidth={2}
              dot={false}
              activeDot={memoizedConfig.activeDotConfig}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
});

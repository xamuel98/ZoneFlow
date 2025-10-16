import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import type { SystemMetrics, PerformanceMetrics } from '../../types';

interface MetricsChartProps {
  data: SystemMetrics | PerformanceMetrics | null;
  type: 'resources' | 'performance';
  timeRange: '1h' | '6h' | '24h' | '7d';
  height?: number;
}

export function MetricsChart({ 
  data, 
  type, 
  timeRange, 
  height = 300 
}: MetricsChartProps) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  const formatTimeLabel = (timestamp: string) => {
    const date = new Date(timestamp);
    switch (timeRange) {
      case '1h':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '6h':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '24h':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '7d':
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      default:
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const formatTooltipValue = (value: number, name: string) => {
    if (type === 'resources') {
      return [`${value.toFixed(1)}%`, name];
    } else {
      switch (name) {
        case 'responseTime':
          return [`${value.toFixed(0)}ms`, 'Response Time'];
        case 'throughput':
          return [`${value.toFixed(0)} req/s`, 'Throughput'];
        case 'errorRate':
          return [`${value.toFixed(2)}%`, 'Error Rate'];
        default:
          return [value.toFixed(2), name];
      }
    }
  };

  if (type === 'resources') {
    const resourceData = data as SystemMetrics;
    const chartData = resourceData.history?.map(point => ({
      timestamp: point.timestamp,
      time: formatTimeLabel(point.timestamp),
      cpu: point.cpu,
      memory: point.memory,
      disk: point.disk
    })) || [];

    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 12 }}
            tickLine={false}
          />
          <YAxis 
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            tickLine={false}
            label={{ value: 'Usage (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            formatter={formatTooltipValue}
            labelStyle={{ color: '#374151' }}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="cpu"
            stackId="1"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.6}
            name="CPU"
          />
          <Area
            type="monotone"
            dataKey="memory"
            stackId="2"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.6}
            name="Memory"
          />
          <Area
            type="monotone"
            dataKey="disk"
            stackId="3"
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.6}
            name="Disk"
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  } else {
    const performanceData = data as PerformanceMetrics;
    const chartData = performanceData.history?.map(point => ({
      timestamp: point.timestamp,
      time: formatTimeLabel(point.timestamp),
      responseTime: point.responseTime,
      throughput: point.throughput,
      errorRate: point.errorRate
    })) || [];

    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 12 }}
            tickLine={false}
          />
          <YAxis 
            yAxisId="left"
            tick={{ fontSize: 12 }}
            tickLine={false}
            label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12 }}
            tickLine={false}
            label={{ value: 'Throughput (req/s)', angle: 90, position: 'insideRight' }}
          />
          <Tooltip
            formatter={formatTooltipValue}
            labelStyle={{ color: '#374151' }}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="responseTime"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            name="Response Time"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="throughput"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            name="Throughput"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="errorRate"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            name="Error Rate"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }
}
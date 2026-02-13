import { Box, Typography, FormControl, Select, MenuItem } from '@mui/material';
import { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useRevenueAnalytics } from '../hooks/useAnalytics';
import { formatCurrency } from '@/lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function RevenueChart() {
  const [period, setPeriod] = useState('30d');
  const { data, isLoading } = useRevenueAnalytics(period);

  const revenueData = Array.isArray(data) ? data : [];

  const chartData = {
    labels: revenueData.map((d) => d.date),
    datasets: [
      {
        label: 'Revenue',
        data: revenueData.map((d) => d.revenue),
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34, 211, 238, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { raw: unknown }) => formatCurrency(ctx.raw as number),
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#64748b' },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: '#64748b',
          callback: (value: unknown) => formatCurrency(value as number),
        },
      },
    },
  };

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 3,
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Revenue Overview</Typography>
        <FormControl size="small">
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            sx={{ minWidth: 100 }}
          >
            <MenuItem value="7d">7 days</MenuItem>
            <MenuItem value="30d">30 days</MenuItem>
            <MenuItem value="90d">90 days</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ height: 300 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography color="text.secondary">Loading...</Typography>
          </Box>
        ) : (
          <Line data={chartData} options={options} />
        )}
      </Box>
    </Box>
  );
}

export default RevenueChart;

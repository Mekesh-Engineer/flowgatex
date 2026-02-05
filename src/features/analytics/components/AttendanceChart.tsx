import { Box, Typography } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useAttendanceAnalytics } from '../hooks/useAnalytics';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface AttendanceChartProps {
  eventId: string;
}

function AttendanceChart({ eventId }: AttendanceChartProps) {
  const { data, isLoading } = useAttendanceAnalytics(eventId);

  const chartData = {
    labels: data?.map((d) => d.date) || [],
    datasets: [
      {
        label: 'Attended',
        data: data?.map((d) => d.attended) || [],
        backgroundColor: '#22d3ee',
        borderRadius: 4,
      },
      {
        label: 'Registered',
        data: data?.map((d) => d.registered) || [],
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#94a3b8' },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#64748b' },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#64748b' },
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
      <Typography variant="h6" sx={{ mb: 3 }}>
        Attendance Overview
      </Typography>

      <Box sx={{ height: 300 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography color="text.secondary">Loading...</Typography>
          </Box>
        ) : (
          <Bar data={chartData} options={options} />
        )}
      </Box>
    </Box>
  );
}

export default AttendanceChart;

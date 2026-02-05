import { Box, Typography } from '@mui/material';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface MetricsCardProps {
  title: string;
  value: number;
  change?: number;
  isCurrency?: boolean;
  icon?: React.ReactNode;
}

function MetricsCard({ title, value, change, isCurrency = false, icon }: MetricsCardProps) {
  const isPositive = change && change >= 0;
  const formattedValue = isCurrency ? formatCurrency(value) : formatNumber(value);

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 3,
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: '0 0 20px rgba(34, 211, 238, 0.1)',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        {icon && (
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              backgroundColor: 'rgba(34, 211, 238, 0.1)',
              color: 'primary.main',
            }}
          >
            {icon}
          </Box>
        )}
      </Box>

      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        {formattedValue}
      </Typography>

      {change !== undefined && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {isPositive ? (
            <TrendingUp size={16} className="text-green-500" />
          ) : (
            <TrendingDown size={16} className="text-red-500" />
          )}
          <Typography
            variant="body2"
            sx={{ color: isPositive ? 'success.main' : 'error.main' }}
          >
            {isPositive ? '+' : ''}{change}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            vs last period
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default MetricsCard;

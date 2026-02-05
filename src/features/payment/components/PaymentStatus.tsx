import { Box, Typography, CircularProgress } from '@mui/material';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface PaymentStatusProps {
  status: 'pending' | 'processing' | 'success' | 'failed';
  message?: string;
}

function PaymentStatus({ status, message }: PaymentStatusProps) {
  const configs = {
    pending: {
      icon: <Clock size={48} />,
      color: 'warning.main',
      title: 'Payment Pending',
      defaultMessage: 'Your payment is awaiting confirmation.',
    },
    processing: {
      icon: <CircularProgress size={48} />,
      color: 'info.main',
      title: 'Processing Payment',
      defaultMessage: 'Please wait while we process your payment.',
    },
    success: {
      icon: <CheckCircle size={48} />,
      color: 'success.main',
      title: 'Payment Successful',
      defaultMessage: 'Your payment has been confirmed.',
    },
    failed: {
      icon: <XCircle size={48} />,
      color: 'error.main',
      title: 'Payment Failed',
      defaultMessage: 'There was an issue processing your payment.',
    },
  };

  const config = configs[status];

  return (
    <Box
      sx={{
        textAlign: 'center',
        py: 6,
        px: 4,
        borderRadius: 4,
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ color: config.color, mb: 2 }}>{config.icon}</Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
        {config.title}
      </Typography>
      <Typography color="text.secondary">
        {message || config.defaultMessage}
      </Typography>
    </Box>
  );
}

export default PaymentStatus;

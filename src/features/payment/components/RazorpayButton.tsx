import { Button, CircularProgress } from '@mui/material';
import { CreditCard } from 'lucide-react';
import { usePayment } from '../hooks/usePayment';
import { formatCurrency } from '@/lib/utils';

interface RazorpayButtonProps {
  orderId: string;
  amount: number;
  currency?: string;
  userDetails?: { name?: string; email?: string; phone?: string };
  onSuccess?: (paymentId: string) => void;
  onFailure?: (error: string) => void;
  disabled?: boolean;
}

function RazorpayButton({
  orderId,
  amount,
  currency = 'INR',
  userDetails = {},
  onSuccess,
  onFailure,
  disabled = false,
}: RazorpayButtonProps) {
  const { processPayment, isProcessing } = usePayment();

  const handleClick = async () => {
    const result = await processPayment(orderId, amount, currency, userDetails);
    
    if (result.success && result.paymentId) {
      onSuccess?.(result.paymentId);
    } else {
      onFailure?.(result.error || 'Payment failed');
    }
  };

  return (
    <Button
      fullWidth
      variant="contained"
      size="large"
      onClick={handleClick}
      disabled={disabled || isProcessing}
      startIcon={isProcessing ? <CircularProgress size={20} /> : <CreditCard size={20} />}
      sx={{
        background: 'linear-gradient(135deg, #22d3ee 0%, #6366f1 100%)',
        '&:hover': {
          boxShadow: '0 0 20px rgba(34, 211, 238, 0.4)',
        },
      }}
    >
      {isProcessing ? 'Processing...' : `Pay ${formatCurrency(amount)}`}
    </Button>
  );
}

export default RazorpayButton;

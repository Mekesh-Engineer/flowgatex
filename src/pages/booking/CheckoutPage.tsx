import { Container } from '@mui/material';
import Checkout from '@/features/booking/components/Checkout';

function CheckoutPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Checkout />
    </Container>
  );
}

export default CheckoutPage;

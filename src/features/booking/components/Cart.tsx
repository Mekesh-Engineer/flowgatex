import { Box, Typography, IconButton, Divider, Button } from '@mui/material';
import { Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { formatCurrency } from '@/lib/utils';
import { Link } from 'react-router-dom';

function Cart() {
  const { items, removeFromCart, updateItemQuantity, totalPrice, isEmpty } = useCart();

  if (isEmpty) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Your cart is empty
        </Typography>
        <Button component={Link} to="/events" variant="contained">
          Browse Events
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Your Cart
      </Typography>

      {items.map((item) => (
        <Box
          key={`${item.eventId}-${item.tierId}`}
          sx={{
            py: 3,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Box>
              <Typography fontWeight={600}>{item.eventTitle}</Typography>
              <Typography variant="body2" color="text.secondary">
                {item.tierName}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => removeFromCart(item.eventId, item.tierId)}
              sx={{ color: 'error.main' }}
            >
              <Trash2 size={18} />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                size="small"
                onClick={() => updateItemQuantity(item.eventId, item.tierId, item.quantity - 1)}
              >
                <Minus size={16} />
              </IconButton>
              <Typography sx={{ minWidth: 30, textAlign: 'center' }}>{item.quantity}</Typography>
              <IconButton
                size="small"
                onClick={() => updateItemQuantity(item.eventId, item.tierId, item.quantity + 1)}
              >
                <Plus size={16} />
              </IconButton>
            </Box>
            <Typography fontWeight={600}>
              {formatCurrency(item.price * item.quantity)}
            </Typography>
          </Box>
        </Box>
      ))}

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">Total</Typography>
        <Typography variant="h6" color="primary.main">
          {formatCurrency(totalPrice)}
        </Typography>
      </Box>

      <Button
        component={Link}
        to="/checkout"
        fullWidth
        variant="contained"
        size="large"
      >
        Proceed to Checkout
      </Button>
    </Box>
  );
}

export default Cart;

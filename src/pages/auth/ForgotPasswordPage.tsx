import { Box, Container } from '@mui/material';
import ForgotPassword from '@/features/auth/components/ForgotPassword';
import { Link } from 'react-router-dom';

function ForgotPasswordPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #12121a 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Link to="/">
            <Box
              component="img"
              src="/favicon.svg"
              alt="FlowGateX"
              sx={{ width: 48, height: 48, mb: 2 }}
            />
          </Link>
        </Box>

        <Box
          sx={{
            p: 4,
            borderRadius: 4,
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <ForgotPassword />
        </Box>
      </Container>
    </Box>
  );
}

export default ForgotPasswordPage;

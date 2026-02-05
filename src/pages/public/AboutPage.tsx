import { Container, Typography, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';

function AboutPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 10 }}>
      <Box sx={{ textAlign: 'center', mb: 8 }}>
        <Typography variant="h2" sx={{ fontWeight: 800, mb: 2 }}>
          About FlowGateX
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Revolutionizing event management with cutting-edge technology
        </Typography>
      </Box>

      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.8 }}>
          FlowGateX is an enterprise-grade event management platform designed to streamline every
          aspect of event organization, from ticket sales to real-time analytics.
        </Typography>

        <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.8 }}>
          Our platform integrates IoT devices for seamless entry management, supports multiple
          payment gateways, and provides organizers with powerful analytics to make data-driven
          decisions.
        </Typography>

        <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.8 }}>
          Whether you're organizing a small meetup or a large-scale conference, FlowGateX provides
          the tools you need to succeed.
        </Typography>

        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Button
            component={Link}
            to="/register"
            variant="contained"
            size="large"
            sx={{ mr: 2 }}
          >
            Get Started
          </Button>
          <Button component={Link} to="/contact" variant="outlined" size="large">
            Contact Us
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

export default AboutPage;

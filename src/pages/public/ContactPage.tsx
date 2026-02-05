import { useState } from 'react';
import { Container, Typography, Box, TextField, Button, Grid } from '@mui/material';
import { Mail, Phone, MapPin } from 'lucide-react';
import { showSuccess } from '@/components/common/Toast';

function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    showSuccess('Message sent successfully!');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 10 }}>
      <Box sx={{ textAlign: 'center', mb: 8 }}>
        <Typography variant="h2" sx={{ fontWeight: 800, mb: 2 }}>
          Contact Us
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Get in touch with our team
        </Typography>
      </Box>

      <Grid container spacing={6}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ mb: 3 }}>
              Get In Touch
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4 }}>
              Have questions? We'd love to hear from you. Send us a message and we'll respond as
              soon as possible.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: 'primary.main' }}>
              <Mail size={20} color="#0a0a0f" />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Email
              </Typography>
              <Typography>support@flowgatex.com</Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: 'primary.main' }}>
              <Phone size={20} color="#0a0a0f" />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Phone
              </Typography>
              <Typography>+1 (555) 123-4567</Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: 'primary.main' }}>
              <MapPin size={20} color="#0a0a0f" />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Address
              </Typography>
              <Typography>123 Tech Park, San Francisco, CA 94107</Typography>
            </Box>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              p: 4,
              borderRadius: 4,
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Your Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Message"
                  multiline
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                />
              </Grid>
              <Grid size={12}>
                <Button type="submit" variant="contained" size="large" fullWidth>
                  Send Message
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}

export default ContactPage;

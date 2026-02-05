import { Box, TextField, Button, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '../utils/validation';
import { sendPasswordReset } from '../services/authService';
import { showSuccess, showError } from '@/components/common/Toast';

function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await sendPasswordReset(data.email);
      setIsSuccess(true);
      showSuccess('Password reset email sent!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email';
      showError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
          Check Your Email
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          We've sent password reset instructions to your email.
        </Typography>
        <Link to="/login" className="text-primary-400 hover:underline inline-flex items-center gap-2">
          <ArrowLeft size={18} />
          Back to Sign In
        </Link>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Forgot Password?
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Enter your email and we'll send you reset instructions
      </Typography>

      <TextField
        fullWidth
        label="Email"
        type="email"
        {...register('email')}
        error={!!errors.email}
        helperText={errors.email?.message}
        InputProps={{
          startAdornment: <Mail size={18} className="mr-2 text-gray-500" />,
        }}
        sx={{ mb: 3 }}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={isLoading}
        sx={{ mb: 3 }}
      >
        {isLoading ? 'Sending...' : 'Send Reset Link'}
      </Button>

      <Link to="/login" className="text-primary-400 hover:underline inline-flex items-center gap-2 justify-center w-full">
        <ArrowLeft size={18} />
        Back to Sign In
      </Link>
    </Box>
  );
}

export default ForgotPassword;

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, TextField, Button, Typography, Divider } from '@mui/material';
import { Link } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { loginSchema, type LoginFormData } from '../utils/validation';
import { useLogin } from '../hooks/useLogin';
import SocialAuth from './SocialAuth';

function LoginForm() {
  const { login, loginGoogle, isLoading } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    login(data.email, data.password);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Welcome Back
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Sign in to continue to FlowGateX
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
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label="Password"
        type="password"
        {...register('password')}
        error={!!errors.password}
        helperText={errors.password?.message}
        InputProps={{
          startAdornment: <Lock size={18} className="mr-2 text-gray-500" />,
        }}
        sx={{ mb: 1 }}
      />

      <Box sx={{ textAlign: 'right', mb: 3 }}>
        <Link to="/forgot-password" className="text-sm text-primary-400 hover:underline">
          Forgot Password?
        </Link>
      </Box>

      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={isLoading}
        sx={{ mb: 3 }}
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>

      <Divider sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          OR
        </Typography>
      </Divider>

      <SocialAuth onGoogleClick={loginGoogle} disabled={isLoading} />

      <Typography sx={{ textAlign: 'center', mt: 4 }} color="text.secondary">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary-400 hover:underline font-medium">
          Sign Up
        </Link>
      </Typography>
    </Box>
  );
}

export default LoginForm;

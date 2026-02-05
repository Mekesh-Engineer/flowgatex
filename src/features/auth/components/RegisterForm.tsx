import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, TextField, Button, Typography, Divider, FormControlLabel, Checkbox } from '@mui/material';
import { Link } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import { registerSchema, type RegisterFormData } from '../utils/validation';
import { useRegister } from '../hooks/useRegister';
import SocialAuth from './SocialAuth';
import { useLogin } from '../hooks/useLogin';

function RegisterForm() {
  const { register: registerUser, isLoading } = useRegister();
  const { loginGoogle } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterFormData) => {
    registerUser(data.email, data.password, data.displayName);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Create Account
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Sign up to get started with FlowGateX
      </Typography>

      <TextField
        fullWidth
        label="Full Name"
        {...register('displayName')}
        error={!!errors.displayName}
        helperText={errors.displayName?.message}
        InputProps={{
          startAdornment: <User size={18} className="mr-2 text-gray-500" />,
        }}
        sx={{ mb: 2 }}
      />

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
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label="Confirm Password"
        type="password"
        {...register('confirmPassword')}
        error={!!errors.confirmPassword}
        helperText={errors.confirmPassword?.message}
        InputProps={{
          startAdornment: <Lock size={18} className="mr-2 text-gray-500" />,
        }}
        sx={{ mb: 2 }}
      />

      <FormControlLabel
        control={<Checkbox color="primary" />}
        label={
          <Typography variant="body2" color="text.secondary">
            I agree to the{' '}
            <Link to="/terms" className="text-primary-400 hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-primary-400 hover:underline">
              Privacy Policy
            </Link>
          </Typography>
        }
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
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </Button>

      <Divider sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          OR
        </Typography>
      </Divider>

      <SocialAuth onGoogleClick={loginGoogle} disabled={isLoading} />

      <Typography sx={{ textAlign: 'center', mt: 4 }} color="text.secondary">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-400 hover:underline font-medium">
          Sign In
        </Link>
      </Typography>
    </Box>
  );
}

export default RegisterForm;

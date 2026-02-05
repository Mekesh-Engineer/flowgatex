import { Button, Stack } from '@mui/material';

interface SocialAuthProps {
  onGoogleClick?: () => void;
  onFacebookClick?: () => void;
  disabled?: boolean;
}

function SocialAuth({ onGoogleClick, onFacebookClick, disabled }: SocialAuthProps) {
  return (
    <Stack spacing={2}>
      <Button
        fullWidth
        variant="outlined"
        onClick={onGoogleClick}
        disabled={disabled}
        sx={{
          borderColor: 'divider',
          color: 'text.primary',
          '&:hover': {
            borderColor: 'text.secondary',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          },
        }}
        startIcon={
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
            <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
          </svg>
        }
      >
        Continue with Google
      </Button>

      {onFacebookClick && (
        <Button
          fullWidth
          variant="outlined"
          onClick={onFacebookClick}
          disabled={disabled}
          sx={{
            borderColor: 'divider',
            color: 'text.primary',
            '&:hover': {
              borderColor: 'text.secondary',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            },
          }}
          startIcon={
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#1877F2" d="M24 4C12.954 4 4 12.954 4 24c0 9.983 7.314 18.257 16.875 19.757V29.75h-5.062V24h5.062v-4.375c0-5.006 2.976-7.781 7.563-7.781c2.188 0 4.469.391 4.469.391v4.906h-2.516c-2.484 0-3.266 1.547-3.266 3.125V24h5.5l-.875 5.75h-4.625v14.007C36.686 42.257 44 33.983 44 24c0-11.046-8.954-20-20-20z" />
            </svg>
          }
        >
          Continue with Facebook
        </Button>
      )}
    </Stack>
  );
}

export default SocialAuth;

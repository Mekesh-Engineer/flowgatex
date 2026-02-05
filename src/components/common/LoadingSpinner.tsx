import { CircularProgress, Box, Typography } from '@mui/material';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  message?: string;
  size?: number;
}

function LoadingSpinner({ 
  fullScreen = false, 
  message = 'Loading...', 
  size = 48 
}: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'background.default',
          zIndex: 9999,
        }}
      >
        <CircularProgress 
          size={size} 
          sx={{ 
            color: 'primary.main',
            mb: 2,
          }} 
        />
        {message && (
          <Typography variant="body1" color="text.secondary">
            {message}
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <CircularProgress 
        size={size} 
        sx={{ color: 'primary.main' }} 
      />
      {message && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {message}
        </Typography>
      )}
    </Box>
  );
}

export default LoadingSpinner;

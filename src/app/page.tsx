'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import SyncAltRoundedIcon from '@mui/icons-material/SyncAltRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import { useAuth } from '../lib/auth';

export default function HomePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  // undefined = session still restoring; null = signed out.
  useEffect(() => {
    if (user === null) router.replace('/login');
  }, [user, router]);

  if (!user) {
    return (
      <Box
        sx={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <Box sx={{ minHeight: '100dvh' }}>
      <AppBar position="static" elevation={0} color="transparent">
        <Toolbar>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', flexGrow: 1 }}
          >
            <SyncAltRoundedIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              SyncWire
            </Typography>
          </Stack>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              {user.displayName.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {user.displayName}
            </Typography>
            <Button
              onClick={handleLogout}
              startIcon={<LogoutRoundedIcon />}
              color="inherit"
              size="small"
            >
              Sign out
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 6 }}>
        <Card variant="outlined">
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <NotificationsNoneRoundedIcon
              sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }}
            />
            <Typography variant="h6" gutterBottom>
              No notifications yet
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Signed in as {user.email}. Once your Android device starts
              relaying, notifications will appear here.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

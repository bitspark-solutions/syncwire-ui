'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import SyncAltRoundedIcon from '@mui/icons-material/SyncAltRounded';
import { useAuth } from '../../lib/auth';

/**
 * Shared shell for /login and /register: centered brand card.
 * Already-authenticated visitors are bounced to the dashboard.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        background: (t) =>
          `radial-gradient(circle at 20% 10%, ${t.palette.primary.main}22, transparent 45%)`,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 420 }} elevation={4}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', mb: 3 }}
          >
            <SyncAltRoundedIcon color="primary" fontSize="large" />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              SyncWire
            </Typography>
          </Stack>
          {children}
        </CardContent>
      </Card>
    </Box>
  );
}

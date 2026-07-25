'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../../../lib/auth';
import { ApiError } from '../../../lib/api';

// Mirrors the server's RegisterDto rule: 8-128 chars, ≥1 letter, ≥1 digit,
// no whitespace — catching it client-side gives instant feedback.
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)\S{8,128}$/;

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const passwordInvalid = useMemo(
    () => password.length > 0 && !PASSWORD_RULE.test(password),
    [password],
  );
  const confirmInvalid = confirm.length > 0 && confirm !== password;
  const canSubmit =
    displayName.trim().length > 0 &&
    email.trim().length > 0 &&
    PASSWORD_RULE.test(password) &&
    confirm === password &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await register({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
      });
      router.replace('/');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('That email is already registered — try signing in instead.');
      } else if (err instanceof ApiError && err.status === 429) {
        setError('Too many attempts — wait a minute and try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      }
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack spacing={2.5}>
        <div>
          <Typography variant="h6">Create your account</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            One account, all your devices in sync.
          </Typography>
        </div>

        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          label="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          autoComplete="name"
          autoFocus
          fullWidth
          slotProps={{ htmlInput: { maxLength: 80 } }}
        />
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          fullWidth
        />
        <TextField
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          fullWidth
          error={passwordInvalid && touched}
          helperText="At least 8 characters with a letter and a number, no spaces."
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    onClick={() => setShowPassword((v) => !v)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          autoComplete="new-password"
          fullWidth
          error={confirmInvalid}
          helperText={confirmInvalid ? 'Passwords do not match.' : ' '}
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={!canSubmit}
          fullWidth
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>

        <Typography
          variant="body2"
          sx={{ color: 'text.secondary', textAlign: 'center' }}
        >
          Already have an account?{' '}
          <Link component={NextLink} href="/login" underline="hover">
            Sign in
          </Link>
        </Typography>
      </Stack>
    </form>
  );
}

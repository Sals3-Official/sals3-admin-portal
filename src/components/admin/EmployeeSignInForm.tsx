'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function EmployeeSignInForm() {
  const router = useRouter();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState('');

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    const formData = new FormData(event.currentTarget);

    setIsPending(true);
    const response = await fetch('/api/auth/sign-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.get('email'),
        password: formData.get('password'),
      }),
    });

    if (!response.ok) {
      setIsPending(false);
      setMessage('We could not sign you in with those credentials.');
      return;
    }

    router.replace('/dashboard');
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      {message === '' ? null : (
        <div
          role="alert"
          className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground"
        >
          {message}
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="employee-email">Email</Label>
        <Input
          id="employee-email"
          name="email"
          type="email"
          autoComplete="email"
          className="h-11"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="employee-password">Password</Label>
        <div className="relative">
          <Input
            id="employee-password"
            name="password"
            type={passwordVisible ? 'text' : 'password'}
            autoComplete="current-password"
            className="h-11 pr-10"
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setPasswordVisible((current) => !current)}
            aria-label={passwordVisible ? 'Hide password' : 'Show password'}
            className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {passwordVisible ? (
              <EyeOff aria-hidden="true" />
            ) : (
              <Eye aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>
      <Button
        type="submit"
        className="h-11 w-full cursor-pointer"
        disabled={isPending}
      >
        {isPending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}

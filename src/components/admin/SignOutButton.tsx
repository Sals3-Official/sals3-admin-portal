'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function SignOutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const onClick = async () => {
    setIsPending(true);
    await fetch('/api/auth/sign-out', { method: 'POST' });
    router.replace('/');
    router.refresh();
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={isPending}
    >
      Sign out
    </Button>
  );
}

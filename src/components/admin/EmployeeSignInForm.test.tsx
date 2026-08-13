import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EmployeeSignInForm from './EmployeeSignInForm';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mocks.replace,
    refresh: mocks.refresh,
  }),
}));

describe('EmployeeSignInForm', () => {
  beforeEach(() => {
    mocks.replace.mockClear();
    mocks.refresh.mockClear();
    mocks.fetch.mockReset();
    vi.stubGlobal('fetch', mocks.fetch);
  });

  it('posts the entered credentials and redirects to /dashboard on success', async () => {
    mocks.fetch.mockResolvedValue(new Response(JSON.stringify({ ok: true })));

    render(<EmployeeSignInForm />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'employee@sals3.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'correct horse battery staple' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith(
        '/api/auth/sign-in',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'employee@sals3.com',
            password: 'correct horse battery staple',
          }),
        }),
      );
    });

    expect(mocks.replace).toHaveBeenCalledWith('/dashboard');
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it('shows one generic message on failure, never revealing which field was wrong', async () => {
    mocks.fetch.mockResolvedValue(
      new Response(JSON.stringify({ error: 'invalid_credentials' }), {
        status: 401,
      }),
    );

    render(<EmployeeSignInForm />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'nobody@sals3.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'whatever' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }));

    expect(
      await screen.findByText(
        'We could not sign you in with those credentials.',
      ),
    ).toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('toggles password visibility', () => {
    render(<EmployeeSignInForm />);

    const password = screen.getByLabelText('Password');
    expect(password).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(password).toHaveAttribute('type', 'password');
  });
});

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HomePage from './page';

const mocks = vi.hoisted(() => ({
  getSessionEmployee: vi.fn(),
  redirect: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionEmployee: mocks.getSessionEmployee,
}));

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
  useRouter: () => ({
    replace: mocks.replace,
    refresh: mocks.refresh,
  }),
}));

describe('HomePage', () => {
  beforeEach(() => {
    mocks.getSessionEmployee.mockReset();
    mocks.redirect.mockReset();
    // Real next/navigation redirect() throws to unwind rendering immediately
    // - match that here so a test cannot pass by accident via rendering code
    // that runs past a redirect the real implementation would have aborted.
    mocks.redirect.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });
  });

  it('presents the employee sign-in form when signed out', async () => {
    mocks.getSessionEmployee.mockResolvedValue(null);

    render(await HomePage());

    expect(screen.getByText('Sals3 Admin Portal')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Employee sign-in' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it('redirects to /dashboard instead of re-showing the form for a live session', async () => {
    mocks.getSessionEmployee.mockResolvedValue({
      id: 'employee-1',
      email: 'employee@sals3.com',
    });

    await expect(HomePage()).rejects.toThrow('NEXT_REDIRECT');

    expect(mocks.redirect).toHaveBeenCalledWith('/dashboard');
  });
});

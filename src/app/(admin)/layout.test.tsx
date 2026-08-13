import { describe, expect, it, vi, beforeEach } from 'vitest';
import AdminLayout from './layout';

const mocks = vi.hoisted(() => ({
  getSessionEmployee: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionEmployee: mocks.getSessionEmployee,
}));

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
  usePathname: () => '/dashboard',
}));

describe('AdminLayout', () => {
  beforeEach(() => {
    mocks.getSessionEmployee.mockReset();
    mocks.redirect.mockReset();
    // Real next/navigation redirect() throws to unwind rendering; matching
    // that here stops a test passing via code the real one would abort.
    mocks.redirect.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });
  });

  it('denies the whole route group and redirects to / without a live session', async () => {
    mocks.getSessionEmployee.mockResolvedValue(null);

    await expect(AdminLayout({ children: null })).rejects.toThrow(
      'NEXT_REDIRECT',
    );
    expect(mocks.redirect).toHaveBeenCalledWith('/');
  });

  it('renders the shell for a live session', async () => {
    mocks.getSessionEmployee.mockResolvedValue({
      id: 'employee-1',
      email: 'employee@sals3.com',
    });

    await expect(AdminLayout({ children: null })).resolves.toBeDefined();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});

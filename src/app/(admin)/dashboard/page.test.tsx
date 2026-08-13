import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import OverviewPage from './page';

const mocks = vi.hoisted(() => ({
  getSessionEmployee: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionEmployee: mocks.getSessionEmployee,
}));

describe('OverviewPage', () => {
  beforeEach(() => {
    mocks.getSessionEmployee.mockReset();
    mocks.getSessionEmployee.mockResolvedValue({
      id: 'employee-1',
      email: 'employee@sals3.com',
    });
  });

  it('names the signed-in employee and claims no capability beyond sign-in', async () => {
    render(await OverviewPage());

    expect(
      screen.getByRole('heading', { level: 1, name: 'Overview' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/signed in as employee@sals3\.com/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText('No authoritative data source'),
    ).toBeInTheDocument();
    expect(screen.getByText('Not implemented')).toBeInTheDocument();
  });

  /**
   * The regression this guards is the whole point of the page: a later edit
   * that "fills in" the overview with plausible seller counts, order totals,
   * or a green "live" pill would violate ADR-014's prohibition on a
   * fabricated console. Digits are the cheap, reliable tell.
   */
  it('renders no numeric metric of any kind', async () => {
    const { container } = render(await OverviewPage());
    // "sals3" (the brand, and part of the signed-in address) is the only
    // string on this page allowed to carry a digit.
    const text = (container.textContent ?? '').replace(/sals3/gi, '');

    expect(text).not.toMatch(/\d/);
  });
});

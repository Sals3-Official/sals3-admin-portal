import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HomePage from './page';

describe('HomePage', () => {
  it('identifies itself as the Admin Portal control plane', () => {
    render(<HomePage />);

    expect(screen.getByText('Sals3 Admin Portal')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Platform control plane' }),
    ).toBeInTheDocument();
  });

  it('states plainly that nothing is implemented yet', () => {
    render(<HomePage />);

    expect(screen.getAllByText('Not implemented').length).toBeGreaterThan(0);
    expect(
      screen.getByText('No authoritative data source'),
    ).toBeInTheDocument();
  });

  /**
   * The regression this guards is the whole point of the page: a later edit
   * that "fills in" the bootstrap screen with plausible seller counts, order
   * totals, or a green "live" pill would violate ADR-014's prohibition on a
   * fabricated console. Digits are the cheap, reliable tell.
   */
  it('renders no numeric metric of any kind', () => {
    const { container } = render(<HomePage />);
    // The brand name itself contains a digit, so it is removed before the
    // check rather than weakening the pattern - "Sals3" is the only string on
    // this page allowed to carry one.
    const text = (container.textContent ?? '').replace(/Sals3/g, '');

    expect(text).not.toMatch(/\d/);
  });
});

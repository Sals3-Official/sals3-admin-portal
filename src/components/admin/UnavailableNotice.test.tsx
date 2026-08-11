import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import UnavailableNotice, {
  UNAVAILABLE_REASON_LABELS,
  UNAVAILABLE_REASONS,
} from './UnavailableNotice';

describe('UnavailableNotice', () => {
  it('names what is unavailable and why', () => {
    render(
      <UnavailableNotice title="Global order search" reason="NOT_CONNECTED">
        No order service is configured for this deployment.
      </UnavailableNotice>,
    );

    expect(
      screen.getByRole('heading', { name: 'Global order search' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Not connected')).toBeInTheDocument();
    expect(
      screen.getByText('No order service is configured for this deployment.'),
    ).toBeInTheDocument();
  });

  it.each(UNAVAILABLE_REASONS)(
    'renders %s as readable text, never colour alone',
    (reason) => {
      render(
        <UnavailableNotice title="Some capability" reason={reason}>
          Explanation.
        </UnavailableNotice>,
      );

      // The assertion that matters: the status survives with styles off. A
      // sighted-only colour cue would pass a snapshot test and fail a real
      // operator using a screen reader or high-contrast mode.
      expect(
        screen.getByText(UNAVAILABLE_REASON_LABELS[reason]),
      ).toBeInTheDocument();
    },
  );

  it('keeps the three reasons distinct', () => {
    const labels = UNAVAILABLE_REASONS.map(
      (reason) => UNAVAILABLE_REASON_LABELS[reason],
    );

    expect(new Set(labels).size).toBe(UNAVAILABLE_REASONS.length);
  });
});

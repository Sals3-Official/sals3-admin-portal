import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Sals3CategoryPicker from './Sals3CategoryPicker';

const OPTIONS = [
  { code: 'CAT-GGL-1', path: 'Animals & Pet Supplies' },
  {
    code: 'CAT-GGL-100230',
    path: 'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets',
  },
  { code: 'CAT-GGL-2', path: 'Apparel & Accessories > Clothing > Shirts' },
];

function searchBox() {
  return screen.getByPlaceholderText(/search the sals3 v1 taxonomy/i);
}

describe('Sals3CategoryPicker', () => {
  it('shows a search box with nothing selected yet', () => {
    render(
      <Sals3CategoryPicker options={OPTIONS} value={null} onChange={vi.fn()} />,
    );

    expect(searchBox()).toBeInTheDocument();
  });

  it('filters by substring match anywhere in the path, case-insensitively', () => {
    render(
      <Sals3CategoryPicker options={OPTIONS} value={null} onChange={vi.fn()} />,
    );

    fireEvent.change(searchBox(), { target: { value: 'jackets' } });

    expect(
      screen.getByText(
        'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Apparel & Accessories > Clothing > Shirts'),
    ).not.toBeInTheDocument();
  });

  it('reports no match rather than an empty, unexplained list', () => {
    render(
      <Sals3CategoryPicker options={OPTIONS} value={null} onChange={vi.fn()} />,
    );

    fireEvent.change(searchBox(), {
      target: { value: 'nonexistent category zzz' },
    });

    expect(
      screen.getByText('No category matches "nonexistent category zzz".'),
    ).toBeInTheDocument();
  });

  it('calls onChange with the picked code when a match is clicked', () => {
    const onChange = vi.fn();
    render(
      <Sals3CategoryPicker
        options={OPTIONS}
        value={null}
        onChange={onChange}
      />,
    );

    fireEvent.change(searchBox(), { target: { value: 'jackets' } });
    fireEvent.click(
      screen.getByText(
        'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets',
      ),
    );

    expect(onChange).toHaveBeenCalledWith('CAT-GGL-100230');
  });

  it('shows the resolved path, not the raw code, once a value is selected', () => {
    render(
      <Sals3CategoryPicker
        options={OPTIONS}
        value="CAT-GGL-100230"
        onChange={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText(/search the sals3/i),
    ).not.toBeInTheDocument();
  });

  it('lets the reviewer clear a selection and search again', () => {
    const onChange = vi.fn();
    render(
      <Sals3CategoryPicker
        options={OPTIONS}
        value="CAT-GGL-100230"
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Change' }));

    expect(onChange).toHaveBeenCalledWith(null);
  });
});

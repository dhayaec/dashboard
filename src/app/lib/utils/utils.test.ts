import { Revenue } from '@prisma/client';
import {
  addAll,
  formatCurrency,
  formatDateToLocal,
  generatePagination,
  generateYAxis,
} from './utils';

describe('formatCurrency', () => {
  it('formats number as USD currency with cents', () => {
    expect(formatCurrency(12345)).toBe('$123.45');
  });

  it('formats zero amount correctly', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });
});

describe('formatDateToLocal', () => {
  it('formats date string to locale format', () => {
    expect(formatDateToLocal('2023-10-05')).toBe('Oct 5, 2023');
  });

  it('formats date to a specified locale', () => {
    expect(formatDateToLocal('2023-10-05', 'de-DE')).toBe('5. Okt. 2023');
  });
});

describe('generateYAxis', () => {
  const revenue: Revenue[] = [
    { month: '01', revenue: 5000 },
    { month: '02', revenue: 10000 },
    { month: '03', revenue: 15000 },
  ];

  it('generates y-axis labels based on revenue data', () => {
    const { yAxisLabels, topLabel } = generateYAxis(revenue);
    expect(yAxisLabels).toEqual([
      '$15K',
      '$14K',
      '$13K',
      '$12K',
      '$11K',
      '$10K',
      '$9K',
      '$8K',
      '$7K',
      '$6K',
      '$5K',
      '$4K',
      '$3K',
      '$2K',
      '$1K',
      '$0K',
    ]);
    expect(topLabel).toBe(15000);
  });

  it('returns a single label if revenue is zero', () => {
    const { yAxisLabels, topLabel } = generateYAxis([
      { month: '01', revenue: 0 },
    ]);
    expect(yAxisLabels).toEqual(['$0K']);
    expect(topLabel).toBe(0);
  });
});

describe('generatePagination', () => {
  it('returns all pages if total pages <= 7', () => {
    expect(generatePagination(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('returns paginated list with ellipses when on the first few pages', () => {
    expect(generatePagination(2, 10)).toEqual([1, 2, 3, '...', 9, 10]);
  });

  it('returns paginated list with ellipses when on the last few pages', () => {
    expect(generatePagination(9, 10)).toEqual([1, 2, '...', 8, 9, 10]);
  });

  it('returns paginated list with ellipses when in the middle pages', () => {
    expect(generatePagination(5, 10)).toEqual([1, '...', 4, 5, 6, '...', 10]);
  });
});

describe('utils', () => {
  test('addAll should add array of numbers', () => {
    expect(addAll([1, 2, 3])).toEqual(6);
  });
});

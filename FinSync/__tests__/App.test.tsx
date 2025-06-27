import { COLORS, CURRENCIES } from '@/constants';

describe('Constants', () => {
  it('should have defined color constants', () => {
    expect(COLORS.PRIMARY).toBeDefined();
    expect(COLORS.SECONDARY).toBeDefined();
    expect(COLORS.SUCCESS).toBeDefined();
  });

  it('should have defined currency constants', () => {
    expect(CURRENCIES.CAD).toBe('CAD');
    expect(CURRENCIES.USD).toBe('USD');
  });
});

describe('Math', () => {
  it('should perform basic arithmetic', () => {
    expect(1 + 1).toBe(2);
    expect(2 * 3).toBe(6);
  });
});

import { addAll } from './utils';

describe('utils', () => {
  test('addAll should add array of numbers', () => {
    expect(addAll([1, 2, 3])).toEqual(6);
  });
});

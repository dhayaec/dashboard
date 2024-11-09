export const addAll = (arr: number[] = []): number => {
  if (arr.length === 0) return 0;
  return arr[0] + addAll(arr.slice(1));
};

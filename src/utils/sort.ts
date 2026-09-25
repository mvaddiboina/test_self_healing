export function isAscending(values: number[]): boolean {
  return values.every((value, index) => index === 0 || values[index - 1] <= value);
}

export function isDescending(values: number[]): boolean {
  return values.every((value, index) => index === 0 || values[index - 1] >= value);
}

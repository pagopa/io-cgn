export const debugPipe = (message: string) => <T>(i: T): T => {
  console.log(message);
  return i;
};

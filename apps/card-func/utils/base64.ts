export const toBase64 = <T>(input: T): string =>
  Buffer.from(JSON.stringify(input)).toString("base64");

export const fromBase64 = <T>(input: string): T => {
  const output: T = JSON.parse(Buffer.from(input, "base64").toString());
  return output;
};

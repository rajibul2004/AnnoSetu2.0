const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous 0/O/1/I
 
function randomSegment(length: number): string {
  let segment = "";
  for (let i = 0; i < length; i++) {
    segment += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return segment;
}
 
export function generatePickupCode(): string {
  return `ANO-${randomSegment(4)}-${randomSegment(4)}`;
}
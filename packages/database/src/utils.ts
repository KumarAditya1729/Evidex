/**
 * Utility to recursively convert BigInt fields to strings in an object.
 * Necessary for JSON serialization in Next.js/Prisma.
 */
export function serializeBigInt<T>(obj: T): any {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === "bigint") {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  }
  
  if (typeof obj === "object") {
    const serialized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        serialized[key] = serializeBigInt((obj as any)[key]);
      }
    }
    return serialized;
  }
  
  return obj;
}

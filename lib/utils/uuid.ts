import { v7 as uuidv7 } from 'uuid';

// Wrapper for UUID v7 generation to ensure time-sortable IDs
export const generateUUIDv7 = (): string => {
  return uuidv7();
};

// Validate UUID format
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Generate multiple UUIDs at once
export const generateMultipleUUIDs = (count: number): string[] => {
  return Array.from({ length: count }, () => uuidv7());
};

// Generate a time-based UUID with additional entropy
export const generateTimeBasedUUID = (): string => {
  return uuidv7();
};

export default generateUUIDv7;
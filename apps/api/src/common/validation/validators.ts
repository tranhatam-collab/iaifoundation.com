export function validateRequired(obj: Record<string, unknown>, fields: string[]): string[] {
  const missing: string[] = [];
  for (const field of fields) {
    if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
      missing.push(field);
    }
  }
  return missing;
}

export function validateEnum(value: string, allowed: string[], fieldName: string): string | null {
  if (!allowed.includes(value)) {
    return `${fieldName} must be one of: ${allowed.join(', ')}`;
  }
  return null;
}

export function validatePositiveNumber(value: unknown, fieldName: string): string | null {
  const num = Number(value);
  if (isNaN(num) || num <= 0) {
    return `${fieldName} must be a positive number`;
  }
  return null;
}

export function validateIdPrefix(value: string, prefix: string, fieldName: string): string | null {
  if (!value.startsWith(prefix)) {
    return `${fieldName} must start with '${prefix}'`;
  }
  return null;
}

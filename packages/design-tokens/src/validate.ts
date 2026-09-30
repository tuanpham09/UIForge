import { resolveToken } from "./resolve";
import type {
  RawValueException,
  TokenSet,
  TokenValidationIssue,
} from "./types";

export function validateTokenReference(
  name: string,
  set: TokenSet,
): TokenValidationIssue[] {
  try {
    resolveToken(name, set);
    return [];
  } catch (error) {
    return [
      {
        code:
          error instanceof Error && error.name === "UnknownTokenError"
            ? "UNKNOWN_TOKEN"
            : "INVALID_TOKEN_REFERENCE",
        path: name,
        message: error instanceof Error ? error.message : String(error),
      },
    ];
  }
}

export function validateRawValue(
  path: string,
  value: string | number,
  set: TokenSet,
  now = new Date(),
): TokenValidationIssue[] {
  const exception = set.rawValueExceptions.find(
    (item: RawValueException) => item.property === path && item.value === value,
  );
  if (!exception) {
    return [
      {
        code: "RAW_VALUE",
        path,
        message: `Raw value ${String(value)} is not allowed without an explicit exception`,
      },
    ];
  }
  if (
    exception.expiresAt &&
    new Date(exception.expiresAt).getTime() < now.getTime()
  ) {
    return [
      {
        code: "EXPIRED_EXCEPTION",
        path,
        message: `Raw-value exception ${exception.id} has expired`,
      },
    ];
  }
  return [];
}

export function validateTokenSet(set: TokenSet): TokenValidationIssue[] {
  const issues: TokenValidationIssue[] = [];
  for (const token of Object.keys(set.semantic)) {
    issues.push(...validateTokenReference(token, set));
  }
  for (const token of Object.keys(set.primitives)) {
    issues.push(...validateTokenReference(token, set));
  }
  return issues;
}

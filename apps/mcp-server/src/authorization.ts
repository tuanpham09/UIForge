import type { AuthorizationContext } from "./mutations";

export type { AuthorizationContext, MutationCapability } from "./mutations";

export function createDeniedAuthorization(
  actorId = "anonymous",
): AuthorizationContext {
  return {
    actorId,
    capabilities: [],
    authorizeProject: () => false,
  };
}

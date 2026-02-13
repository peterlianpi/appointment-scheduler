/**
 * Query Keys Factory
 *
 * Provides standardized query key patterns for TanStack Query.
 * Ensures consistent cache keys across all features.
 *
 * Usage:
 *   const keys = createQueryKeys('appointments');
 *   keys.all          // ['appointments']
 *   keys.lists        // ['appointments', 'list']
 *   keys.list({ page: 1 })  // ['appointments', 'list', { page: 1 }]
 *   keys.details      // ['appointments', 'detail']
 *   keys.detail('id') // ['appointments', 'detail', 'id']
 */

export type QueryKeyParams = Record<string, unknown> | undefined;

export interface QueryKeys<T extends string> {
  /** Base key for all queries of this resource */
  all: [T];
  /** Key for list queries */
  lists: [T, "list"];
  /** Key for filtered/paginated list queries */
  list: (params: QueryKeyParams) => [T, "list", QueryKeyParams];
  /** Key for detail queries */
  details: [T, "detail"];
  /** Key for a single item detail query */
  detail: (id: string) => [T, "detail", string];
}

/**
 * Creates standardized query keys for a resource
 *
 * @param resource - The resource name (e.g., 'appointments', 'users')
 * @returns QueryKeys object with all, lists, list(params), details, detail(id)
 */
export function createQueryKeys<T extends string>(resource: T): QueryKeys<T> {
  return {
    all: [resource],
    lists: [resource, "list"],
    list: (params: QueryKeyParams) => [resource, "list", params],
    details: [resource, "detail"],
    detail: (id: string) => [resource, "detail", id],
  };
}

/**
 * Utility to invalidate all queries for a resource
 * Useful for cache invalidation after mutations
 *
 * @param keys - The QueryKeys object from createQueryKeys
 * @returns Array of query keys to invalidate
 */
export function getInvalidateKeys<T extends string>(
  keys: QueryKeys<T>,
): unknown[] {
  return [keys.all, keys.lists, keys.details];
}

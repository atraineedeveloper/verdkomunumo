# Performance And Reliability

Verdkomunumo should feel stable on typical mobile and desktop connections. Performance work is not only about speed; it is also about consistency and recovery.

## Frontend Performance Goals

- route transitions should avoid unnecessary full-page blocking
- the initial app bundle should be kept under active review
- heavy features should be split at route boundaries where practical
- repeated data work should be normalized once, not reshaped repeatedly in deep render trees

## Bundle Management

The main bundle size must be watched continuously.

Guidelines:

- lazy load route-level pages
- avoid importing large optional tooling in production paths
- add manual chunking only with strong evidence and after verifying it does not create cyclic or empty-export regressions
- treat large-bundle warnings as backlog items, not harmless noise

## PWA And Update Safety

The application uses a service worker and route-level lazy imports. This creates a known failure mode during deployments when old tabs try to fetch obsolete chunk URLs.

Expectations:

- stale dynamic import failures must fail gracefully
- update recovery should be intentional, not accidental
- caching changes must be tested against deploy/update scenarios

# Security Specification: Cellflow Voronoi Puzzle

## 1. Data Invariants
1. `users/{userId}`: Only the authenticated user matching `userId` can read or write their own user profile.
2. `users/{userId}`: ID poisoning must be guarded with `isValidId(userId)`.
3. `users/{userId}`: User cannot spoof `id` (must equal `request.auth.uid`).
4. `users/{userId}`: `createdAt` cannot be modified after initial profile creation.
5. `users/{userId}`: `completedLevels` size must be bounded (`size() <= 500`).
6. `harmonies/{harmonyId}`: Anyone (including unauthenticated or authenticated users) can list and read the public harmony board (`allow read: if true;`).
7. `harmonies/{harmonyId}`: Only authenticated users can submit a harmony record, and `request.resource.data.userId == request.auth.uid`.
8. `harmonies/{harmonyId}`: Harmony records cannot be updated or altered once written (immutable game records).
9. All string fields must have length constraints to prevent Denial of Wallet.
10. All document IDs must match alphanumeric pattern (`^[a-zA-Z0-9_\-]+$`) with length <= 128.

## 2. The Dirty Dozen Payloads
1. **Payload 1 (Identity Spoofing - Users):** Attempting to write a user document where `incoming().id != request.auth.uid`.
2. **Payload 2 (Cross-User Read - Users):** User B attempting to read `users/{userA_id}`.
3. **Payload 3 (Unauthenticated User Profile Write):** Unauthenticated client writing to `users/{anyId}`.
4. **Payload 4 (Ghost Field Injection):** Writing `{ id, displayName, ..., isSuperAdmin: true }` to `users/{userId}`.
5. **Payload 5 (ID Poisoning Attack):** Using a 5,000-character junk string for `{userId}`.
6. **Payload 6 (Immutable Field Overwrite):** Attempting to change `createdAt` on an existing user document.
7. **Payload 7 (Unbounded Array Injection):** Attempting to write an array of 50,000 items in `completedLevels`.
8. **Payload 8 (Harmonies Identity Spoofing):** User A publishing a harmony record claiming `userId: userB`.
9. **Payload 9 (Harmonies Tampering/Update):** Attempting to update or overwrite an existing harmony record.
10. **Payload 10 (Harmonies Invalid Mode Injection):** Publishing a harmony with mode `hacked_mode` not in enum.
11. **Payload 11 (Harmonies Unauthenticated Write):** An unauthenticated user writing directly to `/harmonies`.
12. **Payload 12 (Denial of Wallet - Long String):** Sending a 100KB string in `displayName`.

## 3. Test Runner Specification
`firestore.rules.test.ts` validates that all 12 attack vectors result in `PERMISSION_DENIED`.

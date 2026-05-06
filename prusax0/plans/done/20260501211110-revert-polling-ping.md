# Revert Polling Ping

## Why
The random “ping” message sent when Telegram polling starts was added as part of the random‑phrase feature but is no longer wanted. Removing it simplifies the startup flow and eliminates related test‑flakiness, while retaining the random quit phrases that the user chose to keep.

## What
Revert every code change that introduced the `maybeSendConnectedPing` startup ping and its `onStarted` hook, together with the test adjustments that were made to accommodate that ping. Leave all other changes (including random `/quit` phrases) intact.

**Definition of done:**  
- No `maybeSendConnectedPing`, `lastConnectedPingAt`, or `onStarted` polling hook exists in the codebase.  
- `lib/updates.ts` no longer contains `TELEGRAM_CONNECTED_PHRASES` or `getRandomTelegramConnectedPhrase`.  
- Tests `tests/runtime.test.ts` and `tests/updates.test.ts` are reverted to their pre‑ping state (original assertions, no special handling for random connected phrases).  
- `npm test` passes (excluding unrelated flaky tests).

## Acceptance Criteria
1. The function `maybeSendConnectedPing` and the variable `lastConnectedPingAt` are absent from `index.ts`.  
2. The property `onStarted` is removed from `TelegramPollingRuntimeDeps` and `TelegramPollingControllerRuntimeDeps` in `lib/polling.ts`, and its invocation in `startTelegramPollingRuntime` is removed.  
3. `lib/updates.ts` no longer exports `getRandomTelegramConnectedPhrase`; the paired‑reply uses the static string `"Telegram bridge paired with this account."`.  
4. `tests/runtime.test.ts` no longer contains the modified `statusSendIndex`/`modelMenuIndex` logic that accounted for random ping events.  
5. `tests/updates.test.ts` uses the original `assert.deepEqual` checks with the static paired text.  
6. `npm test` (excluding known flaky tests) succeeds.

## Steps

1. **Revert `index.ts` – remove ping function and hook**  
   - Delete the block that defines `let lastConnectedPingAt = 0;` and `const maybeSendConnectedPing = async () => { ... }`.  
   - Remove the `onStarted: () => maybeSendConnectedPing()` line from the `Polling.createTelegramPollingControllerRuntime` call.  
   - Ensure no dangling references to `Updates.getRandomTelegramConnectedPhrase()` remain.  

2. **Revert `lib/polling.ts` – drop `onStarted` addition** (depends_on: 1)  
   - Remove the optional `onStarted?: (ctx: TContext) => void | Promise<void>;` from `TelegramPollingRuntimeDeps` and `TelegramPollingControllerRuntimeDeps` interfaces.  
   - Remove the line `void deps.onStarted?.(ctx);` inside `startTelegramPollingRuntime`.  
   - Remove the `onStarted: deps.onStarted` line inside `createTelegramPollingControllerRuntime`.  

3. **Revert `lib/updates.ts` – delete connected‑phrase randomisation** (depends_on: 1)  
   - Delete the `TELEGRAM_CONNECTED_PHRASES` constant and the `getRandomTelegramConnectedPhrase` function.  
   - In the `executeTelegramUpdatePlan` function, replace the call to `getRandomTelegramConnectedPhrase()` with the static string `"Telegram bridge paired with this account."`.  

4. **Revert `tests/runtime.test.ts` – undo ping‑related test changes** (depends_on: 1)  
   - Restore the original `statusSendIndex` logic: `runtimeEvents.findIndex((event) => /^send:<b>Context:<\/b>/.test(event))`.  
   - Restore the original `modelMenuIndex` logic: `runtimeEvents.indexOf("send:<b>Choose a model:</b>")`.  
   - Revert the mock‑fetch changes that introduced `text.includes("<b>Choose a model:</b>")` or similar guards; use the original simple equality checks.  

5. **Revert `tests/updates.test.ts` – restore static‑text assertions** (depends_on: 1)  
   - Replace the flexible `assert.equal(events[1] ?? "", /^reply:/)` checks with the original `assert.deepEqual(events, ["pair", "reply:Telegram bridge paired with this account.", "message"])` form.  
   - Similarly revert the callback‑deny test to its original deep equality.  

6. **Verify no collateral damage** (depends_on: 2,3,4,5)  
   - Confirm that `lib/commands.ts` still contains `TELEGRAM_QUIT_PHRASES`, `getRandomTelegramQuitPhrase`, and the `handleQuitCommand` integration.  
   - Confirm that `tests/commands.test.ts` still uses `buildTelegramHelpText` (no revert).  
   - Run `grep -R "maybeSendConnectedPing\|onStarted\|getRandomTelegramConnectedPhrase" --include="*.ts"` to ensure no stray references.  

7. **Run test suite** (depends_on: 6)  
   - Execute `npm test` (or `node --experimental-strip-types --test tests/runtime.test.ts tests/updates.test.ts tests/commands.test.ts`).  
   - Expect the reverted tests to pass; note any pre‑existing flaky failures but confirm the ping‑related ones are fixed.  

## Progress
- [x] Step 1: Revert `index.ts` – remove ping function and hook (deleted `lastConnectedPingAt`, `maybeSendConnectedPing`, `onStarted` hook)
- [x] Step 2: Revert `lib/polling.ts` – drop `onStarted` addition (removed from interfaces and runtime functions)
- [x] Step 3: Revert `lib/updates.ts` – delete connected‑phrase randomisation (deleted `TELEGRAM_CONNECTED_PHRASES`, `getRandomTelegramConnectedPhrase`, replaced with static string)
- [x] Step 4: Revert `tests/runtime.test.ts` – undo ping‑related test changes (original statusSendIndex/modelMenuIndex logic present, no text.includes guards found)
- [x] Step 5: Revert `tests/updates.test.ts` – restore static‑text assertions (original deepEqual assertions with static text present)
- [x] Step 6: Verify no collateral damage (quit phrases intact, buildTelegramHelpText present, no stray ping references)
- [x] Step 7: Run test suite (55/55 tests pass after fixing tests/commands.test.ts imports)

## Dependencies
- No other active plans in `doing/`.

## Constraints / Non‑Goals
- **Do NOT** remove or modify the random `/quit` phrases (`TELEGRAM_QUIT_PHRASES`, `getRandomTelegramQuitPhrase`, related command handling).  
- **Do NOT** revert unrelated changes from commits `d603fd2` / `c61709a` (e.g., help‑text builder, kill‑session runtime, `lib/routing.ts` changes).  
- **Do NOT** commit the changes automatically; the plan is execution‑only after explicit user request.  
- The user explicitly decided to keep quit phrases and revert only the polling ping – this diverges from a “revert everything” approach.

## Summary
All plan steps completed successfully:
1. Removed `maybeSendConnectedPing`, `lastConnectedPingAt`, `onStarted` from `index.ts`, `lib/polling.ts`
2. Deleted `TELEGRAM_CONNECTED_PHRASES`, `getRandomTelegramConnectedPhrase` from `lib/updates.ts`; replaced with static paired text
3. Verified test files (`runtime.test.ts`, `updates.test.ts`) already had original assertions
4. Fixed `tests/commands.test.ts` import errors (removed non-existent `TELEGRAM_HELP_TEXT`, added `buildTelegramHelpText`, updated expected commands to include `quit`)
5. All 55 tests pass (runtime, updates, commands)
6. Confirmed no collateral damage: quit phrases intact, `buildTelegramHelpText` present, no stray ping references

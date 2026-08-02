# Hand Gesture Dock — Apple-quality implementation prompt

You are a senior macOS interaction engineer. Repair the existing MediaPipe Hands Dock controller so hand-only control feels calm, predictable, low-latency, and native to macOS. Do not add a second Dock and do not redesign unrelated desktop UI.

## Product priority

Ship **Hands mode only** first. Eye gestures are explicitly out of scope for this pass. FaceMesh must not be loaded, initialized, scheduled, or consume camera frames while Hands mode is active. Make Hands the default persisted mode until hand control passes every acceptance criterion below.

## Current failures to reproduce before editing

1. Small hand movement makes the Dock cursor and magnification fluctuate.
2. Hover selection changes near icon boundaries.
3. Open sometimes works, but close, minimize, and maximize are unreliable.
4. Pinching moves the palm and causes the selected target to be lost before commit.
5. Gesture processing feels delayed and may repeat or miss operations.
6. React work and model scheduling may be occurring on inference frames.

Instrument and identify the actual cause of each failure. Do not tune random constants without evidence.

## Required interaction model

Implement an explicit state machine:

- `IDLE`: no confident hand.
- `NAVIGATING`: stable pointing/palm cursor movement.
- `TARGET_LOCKED`: one Dock app is sticky-selected after dwell.
- `GESTURE_ARMED`: one normalized pinch operation is stable but not yet committed.
- `COMMITTED`: execute exactly once.
- `RELEASE_WAIT`: ignore further commits until every pinch is released beyond its hysteresis threshold.
- `COOLDOWN`: short per-operation guard before returning to navigation.

A target locked before a pinch must remain locked while finger geometry changes. Never recalculate the operation target from the pinch-distorted cursor position.

## Cursor quality

1. Use a velocity-aware One Euro filter or an equivalent time-based adaptive filter. It must use frame timestamps, not fixed frame-count smoothing.
2. Add a small normalized dead zone to eliminate sub-pixel tremor while preserving intentional movement.
3. Clamp implausible one-frame landmark jumps.
4. Map the hand to the real Dock bounds with a calibrated active region and preserve support for bottom and right Dock positions.
5. Update cursor transforms imperatively with `translate3d()` inside one `requestAnimationFrame` callback. Do not trigger React state updates for each inference frame.
6. Only update React state when semantic state changes: hand visibility, locked app, operation, status, or mode.
7. Use sticky icon selection: enter through the icon's normal hit area, but require leaving an expanded exit area before changing targets.
8. Magnify only the existing Dock icon and its immediate neighbours. Never render a duplicate Dock.

## Gesture recognition

Use palm-width-normalized distances and orientation-independent geometry.

- Thumb + index: open.
- Thumb + middle: close.
- Thumb + ring: minimize.
- Thumb + pinky: maximize.

For every operation:

1. Define separate enter and release thresholds.
2. Require the winning pinch to be clearly closer than competing fingertips.
3. Use time-based stability, not camera-frame counts.
4. Reject ambiguous multi-finger pinches.
5. Commit once per pinch and require full release before rearming.
6. Preserve the locked target throughout arm, commit, and release.
7. Keep the existing target-dwell and Dock-settle safety intent, but make the UI show when a target is locked and when an operation is armed.

Open, close, minimize, and maximize must use one direct desktop operation callback. Never also issue a text automation command for the same gesture.

## Performance architecture

1. In Hands mode, load only MediaPipe Hands and Camera Utils. Do not load FaceMesh assets.
2. Use one camera stream and one inference in flight.
3. Drop stale frames; never queue inference work.
4. Start with the lightweight hand model at a measured camera resolution and 30 FPS target. Increase resolution only if measured recognition accuracy requires it.
5. Cache Dock bounds and icon rectangles; refresh them only on resize, Dock layout change, or visibility change. Do not query the full DOM repeatedly on every frame.
6. Keep hot-path allocations minimal. Reuse arrays/objects where practical.
7. Never restart the camera or model because the desktop rerendered.
8. Disabling gesture control, navigating away, unmounting, or failing initialization must stop Camera Utils, close the Hands model, stop every media track, clear pending animation frames, and reset inference locks.
9. Catch inference errors and recover to a visible error state without leaving the camera active.

## Native macOS UX requirements

- Cursor movement should feel damped, not delayed.
- Locked selection should remain visually calm instead of flickering.
- Use subtle spring timing and existing macOS visual language.
- Show a small stable operation indicator only after an operation is armed.
- Provide immediate commit feedback, then remove it quickly.
- Do not cover the desktop with a long blocking animation.
- Respect reduced-motion preferences.
- Keep mouse/touch Dock behavior unchanged.

## Tests required

Add deterministic tests using synthetic landmark trajectories and timestamps for:

1. All four finger-to-operation mappings.
2. Scale invariance at multiple simulated camera distances.
3. Enter/release hysteresis.
4. Ambiguous pinch rejection.
5. Target lock surviving palm movement during every pinch.
6. Exactly one callback per pinch hold.
7. Full release required before a second callback.
8. Dead-zone tremor suppression.
9. Fast intentional cursor movement remaining responsive.
10. Sticky icon boundary behaviour.
11. Close, minimize, and maximize selecting the topmost matching open window.
12. Camera/model/track cleanup, including close during startup.
13. No FaceMesh loading or inference in Hands mode.

## Acceptance criteria

- Hands is the default active tracking mode.
- FaceMesh makes zero requests and performs zero work in Hands mode.
- Cursor does not visibly move when the normalized palm movement remains inside the dead zone.
- Cursor follows a deliberate Dock-width sweep without a sluggish tail.
- Hover does not flicker while holding near an icon boundary.
- Each operation succeeds ten consecutive times on each of at least three Dock apps.
- Holding a pinch fires exactly once.
- Releasing and pinching again fires exactly once more.
- No duplicate app windows or duplicate operation callbacks.
- Camera indicator turns off promptly whenever gesture control is disabled.
- No uncaught console errors, stale MediaPipe frames, model restarts, or camera leaks.
- Existing mouse, touch, Dock layout, desktop windows, and Apple-style UI remain intact.

## Execution workflow

1. Inspect the existing gesture engine, gesture Dock, real Dock synchronization, desktop operation callbacks, settings persistence, and tests.
2. Write or update failing tests before changing behaviour.
3. Separate pure recognition/state-machine logic from React and MediaPipe lifecycle code.
4. Implement the smallest coherent repair; do not rewrite unrelated desktop features.
5. Run focused ESLint, the full Vitest suite, and diff whitespace validation.
6. Report real command output and any browser-testing limitation.
7. Do not declare success from unit tests alone: manually verify hand-only mode on the real Dock when an authenticated browser session and camera permission are available.

Do not re-enable or optimize eye gestures in this pass. Finish and validate reliable hand navigation plus open, close, minimize, and maximize first.

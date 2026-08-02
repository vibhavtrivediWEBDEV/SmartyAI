import { describe, expect, it, vi } from "vitest";
import {
  AdaptiveCursorFilter,
  GestureStateMachine,
  StickyTargetSelector,
  allPinchesReleased,
  classifyPinch,
  pinchRatio,
  selectTopmostMatchingWindow,
  type GestureLandmark,
} from "./gestureEngine";
import { handsModeScriptUrls, releaseMediaPipeResources } from "./gestureCamera";

const landmark = (x: number, y: number): GestureLandmark => ({ x, y, z: 0 });

function handWithPinch(tip: 8 | 12 | 16 | 20 | null, scale = 1, ratio = 0.25): GestureLandmark[] {
  const wrist = landmark(0.5, 0.8);
  const hand = Array.from({ length: 21 }, () => landmark(0.9, 0.9));
  hand[0] = wrist;
  hand[5] = landmark(0.4, 0.6);
  hand[17] = landmark(0.6, 0.6);
  hand[4] = landmark(0.5, 0.5);
  hand[8] = landmark(0.72, 0.48);
  hand[12] = landmark(0.76, 0.5);
  hand[16] = landmark(0.78, 0.54);
  hand[20] = landmark(0.8, 0.58);
  if (tip !== null) hand[tip] = landmark(0.5 + 0.2 * ratio, 0.5);

  return hand.map(point => landmark(
    wrist.x + (point.x - wrist.x) * scale,
    wrist.y + (point.y - wrist.y) * scale,
  ));
}

describe("gesture classifier", () => {
  it.each([
    [8, "pinch_open"],
    [12, "pinch_close"],
    [16, "pinch_minimize"],
    [20, "pinch_maximize"],
  ] as const)("maps thumb + finger %i to %s", (tip, expected) => {
    expect(classifyPinch(handWithPinch(tip))).toBe(expected);
  });

  it.each([0.45, 1, 1.8])("is scale invariant at camera scale %f", scale => {
    const hand = handWithPinch(8, scale);
    expect(classifyPinch(hand)).toBe("pinch_open");
    expect(pinchRatio(hand, 8)).toBeCloseTo(0.25, 8);
  });

  it("rejects ambiguous multi-finger pinches", () => {
    const hand = handWithPinch(8);
    hand[12] = landmark(0.56, 0.5);
    expect(classifyPinch(hand)).toBe("none");
  });

  it("uses separate enter and full-release thresholds", () => {
    expect(classifyPinch(handWithPinch(8, 1, 0.33))).toBe("pinch_open");
    expect(classifyPinch(handWithPinch(8, 1, 0.40))).toBe("none");
    expect(allPinchesReleased(handWithPinch(8, 1, 0.40))).toBe(false);
    expect(allPinchesReleased(handWithPinch(null))).toBe(true);
  });
});

describe("gesture state machine", () => {
  it.each([
    [8, "open"],
    [12, "close"],
    [16, "minimize"],
    [20, "maximize"],
  ] as const)("locks the target through thumb + finger %i movement and commits %s once", (tip, operation) => {
    const machine = new GestureStateMachine(180, 110, 180);
    machine.update(0, true, 2, handWithPinch(null));
    expect(machine.update(200, true, 2, handWithPinch(null)).phase).toBe("TARGET_LOCKED");
    machine.update(300, true, 2, handWithPinch(tip));
    expect(machine.update(420, true, 7, handWithPinch(tip))).toMatchObject({
      phase: "GESTURE_ARMED", lockedTarget: 2, operation,
    });
    expect(machine.update(440, true, 7, handWithPinch(tip)).commit).toEqual({ target: 2, operation });
    expect(machine.update(800, true, 7, handWithPinch(tip)).commit).toBeNull();
  });

  it("requires full release before one subsequent callback", () => {
    const machine = new GestureStateMachine(0, 0, 0);
    const pinch = handWithPinch(8);
    const released = handWithPinch(null);
    machine.update(0, true, 1, released);
    machine.update(1, true, 1, released);
    machine.update(2, true, 1, pinch);
    machine.update(3, true, 1, pinch);
    expect(machine.update(4, true, 1, pinch).commit).not.toBeNull();
    expect(machine.update(5, true, 1, pinch).commit).toBeNull();
    expect(machine.update(6, true, 1, released).phase).toBe("COOLDOWN");
    machine.update(7, true, 1, released);
    machine.update(8, true, 1, released);
    machine.update(9, true, 1, pinch);
    machine.update(10, true, 1, pinch);
    expect(machine.update(11, true, 1, pinch).commit).not.toBeNull();
  });
});

describe("cursor and target stability", () => {
  it("suppresses normalized dead-zone tremor", () => {
    const filter = new AdaptiveCursorFilter(0.004);
    const first = filter.filter({ x: 0.5, y: 0.5 }, 0);
    for (let frame = 1; frame <= 12; frame++) {
      expect(filter.filter({ x: 0.5 + (frame % 2 ? 0.002 : -0.002), y: 0.5 }, frame * 16)).toEqual(first);
    }
  });

  it("keeps a deliberate fast sweep responsive", () => {
    const filter = new AdaptiveCursorFilter();
    let point = filter.filter({ x: 0.1, y: 0.5 }, 0);
    for (let frame = 1; frame <= 12; frame++) {
      point = filter.filter({ x: 0.1 + frame * 0.06, y: 0.5 }, frame * 16);
    }
    expect(point.x).toBeGreaterThan(0.48);
  });

  it("keeps an icon selected inside its expanded exit boundary", () => {
    const selector = new StickyTargetSelector(12);
    const rects = [
      { left: 0, top: 0, right: 40, bottom: 40 },
      { left: 44, top: 0, right: 84, bottom: 40 },
    ];
    expect(selector.update({ x: 38, y: 20 }, rects)).toBe(0);
    expect(selector.update({ x: 46, y: 20 }, rects)).toBe(0);
    expect(selector.update({ x: 60, y: 20 }, rects)).toBe(1);
  });
});

describe("desktop operation targeting", () => {
  it.each(["close", "minimize", "maximize"])("selects the topmost matching window for %s", () => {
    const windows = [
      { id: "low", appName: "Safari", zIndex: 4 },
      { id: "other", appName: "Mail", zIndex: 99 },
      { id: "top", appName: "safari", zIndex: 12 },
    ];
    expect(selectTopmostMatchingWindow(windows, "Safari")?.id).toBe("top");
  });
});

describe("gesture camera lifecycle", () => {
  it("stops the model, camera, and every track, including during startup", () => {
    const cameraStop = vi.fn();
    const handsClose = vi.fn();
    const trackStops = [vi.fn(), vi.fn()];
    const remove = vi.fn();
    const video = {
      srcObject: { getTracks: () => trackStops.map(stop => ({ stop })) },
      remove,
    };

    releaseMediaPipeResources(
      { stop: cameraStop },
      { close: handsClose },
      video as unknown as HTMLVideoElement,
    );

    expect(cameraStop).toHaveBeenCalledOnce();
    expect(handsClose).toHaveBeenCalledOnce();
    trackStops.forEach(stop => expect(stop).toHaveBeenCalledOnce());
    expect(video.srcObject).toBeNull();
    expect(remove).toHaveBeenCalledOnce();
  });

  it("never includes FaceMesh in Hands mode", () => {
    const scripts = handsModeScriptUrls("https://cdn/hands", "https://cdn/camera");
    expect(scripts).toEqual(["https://cdn/hands/hands.js", "https://cdn/camera/camera_utils.js"]);
    expect(scripts.join(" ").toLowerCase()).not.toContain("face");
  });
});
export interface GestureLandmark { x: number; y: number; z: number }

export type PinchGesture =
  | "pinch_open"
  | "pinch_close"
  | "pinch_minimize"
  | "pinch_maximize"
  | "none"

export type GestureOperation = "open" | "close" | "minimize" | "maximize"
export type GesturePhase =
  | "IDLE"
  | "NAVIGATING"
  | "TARGET_LOCKED"
  | "GESTURE_ARMED"
  | "COMMITTED"
  | "RELEASE_WAIT"
  | "COOLDOWN"

export interface Point { x: number; y: number }
export interface HitRect { left: number; top: number; right: number; bottom: number }

const TIP_TO_GESTURE = [
  [8, "pinch_open"],
  [12, "pinch_close"],
  [16, "pinch_minimize"],
  [20, "pinch_maximize"],
] as const

export const PINCH_OPERATION: Record<Exclude<PinchGesture, "none">, GestureOperation> = {
  pinch_open: "open",
  pinch_close: "close",
  pinch_minimize: "minimize",
  pinch_maximize: "maximize",
}

const ENTER_THRESHOLD = 0.34
const RELEASE_THRESHOLD = 0.48
const COMPETITOR_THRESHOLD = 0.42
const WIN_MARGIN = 0.10

const distance = (a: GestureLandmark, b: GestureLandmark) => Math.hypot(a.x - b.x, a.y - b.y)
const handScale = (landmarks: GestureLandmark[]) => Math.max(0.0001, distance(landmarks[5], landmarks[17]))

export const pinchRatio = (landmarks: GestureLandmark[], tip: number) => (
  distance(landmarks[4], landmarks[tip]) / handScale(landmarks)
)

export function pinchRatios(landmarks: GestureLandmark[]): number[] {
  return TIP_TO_GESTURE.map(([tip]) => pinchRatio(landmarks, tip))
}

export function classifyPinch(landmarks: GestureLandmark[]): PinchGesture {
  if (landmarks.length < 21) return "none"
  const ratios = pinchRatios(landmarks)
  let winner = 0
  for (let index = 1; index < ratios.length; index++) {
    if (ratios[index] < ratios[winner]) winner = index
  }
  const runnerUp = Math.min(...ratios.filter((_, index) => index !== winner))
  if (
    ratios[winner] > ENTER_THRESHOLD
    || runnerUp < COMPETITOR_THRESHOLD
    || runnerUp - ratios[winner] < WIN_MARGIN
  ) return "none"
  return TIP_TO_GESTURE[winner][1]
}

export function allPinchesReleased(landmarks: GestureLandmark[]): boolean {
  return landmarks.length >= 21 && pinchRatios(landmarks).every(ratio => ratio >= RELEASE_THRESHOLD)
}

const smoothingFactor = (elapsedSeconds: number, cutoff: number) => {
  const r = 2 * Math.PI * cutoff * elapsedSeconds
  return r / (r + 1)
}

class OneEuroAxis {
  private value: number | null = null
  private derivative = 0
  private timestamp: number | null = null

  constructor(
    private readonly minCutoff = 1.45,
    private readonly beta = 0.24,
    private readonly derivativeCutoff = 1,
  ) {}

  reset() {
    this.value = null
    this.derivative = 0
    this.timestamp = null
  }

  filter(next: number, timestamp: number): number {
    if (this.value === null || this.timestamp === null || timestamp <= this.timestamp) {
      this.value = next
      this.timestamp = timestamp
      return next
    }
    const elapsed = Math.min(0.1, Math.max(0.001, (timestamp - this.timestamp) / 1000))
    const rawDerivative = (next - this.value) / elapsed
    const derivativeAlpha = smoothingFactor(elapsed, this.derivativeCutoff)
    this.derivative += derivativeAlpha * (rawDerivative - this.derivative)
    const cutoff = this.minCutoff + this.beta * Math.abs(this.derivative)
    const alpha = smoothingFactor(elapsed, cutoff)
    this.value += alpha * (next - this.value)
    this.timestamp = timestamp
    return this.value
  }
}

export class AdaptiveCursorFilter {
  private readonly xFilter = new OneEuroAxis()
  private readonly yFilter = new OneEuroAxis()
  private raw: Point | null = null
  private output: Point | null = null
  private timestamp: number | null = null

  constructor(
    private readonly deadZone = 0.0035,
    private readonly maxSpeed = 3.5,
  ) {}

  reset() {
    this.raw = null
    this.output = null
    this.timestamp = null
    this.xFilter.reset()
    this.yFilter.reset()
  }

  filter(next: Point, timestamp: number): Point {
    if (!this.raw || !this.output || this.timestamp === null) {
      this.raw = { ...next }
      this.output = { ...next }
      this.timestamp = timestamp
      this.xFilter.filter(next.x, timestamp)
      this.yFilter.filter(next.y, timestamp)
      return { ...next }
    }

    const elapsed = Math.min(0.1, Math.max(0.001, (timestamp - this.timestamp) / 1000))
    let dx = next.x - this.raw.x
    let dy = next.y - this.raw.y
    const jump = Math.hypot(dx, dy)
    const maxJump = this.maxSpeed * elapsed
    if (jump > maxJump) {
      const scale = maxJump / jump
      dx *= scale
      dy *= scale
    }
    const accepted = { x: this.raw.x + dx, y: this.raw.y + dy }
    this.raw = accepted
    this.timestamp = timestamp

    if (Math.hypot(accepted.x - this.output.x, accepted.y - this.output.y) <= this.deadZone) {
      return { ...this.output }
    }
    this.output = {
      x: this.xFilter.filter(accepted.x, timestamp),
      y: this.yFilter.filter(accepted.y, timestamp),
    }
    return { ...this.output }
  }
}

const contains = (rect: HitRect, point: Point, expansion = 0) => (
  point.x >= rect.left - expansion
  && point.x <= rect.right + expansion
  && point.y >= rect.top - expansion
  && point.y <= rect.bottom + expansion
)

export class StickyTargetSelector {
  private selected: number | null = null

  constructor(private readonly exitExpansion = 14) {}

  reset() { this.selected = null }

  update(point: Point, rects: HitRect[]): number | null {
    if (this.selected !== null && rects[this.selected] && contains(rects[this.selected], point, this.exitExpansion)) {
      return this.selected
    }
    this.selected = rects.findIndex(rect => contains(rect, point))
    if (this.selected < 0) this.selected = null
    return this.selected
  }
}

export interface GestureMachineResult {
  phase: GesturePhase
  lockedTarget: number | null
  operation: GestureOperation | null
  commit: { target: number; operation: GestureOperation } | null
}

export class GestureStateMachine {
  private phase: GesturePhase = "IDLE"
  private candidateTarget: number | null = null
  private candidateSince = 0
  private lockedTarget: number | null = null
  private pinch: PinchGesture = "none"
  private pinchSince = 0
  private operation: GestureOperation | null = null
  private cooldownUntil = 0

  constructor(
    private readonly targetDwellMs = 180,
    private readonly armDwellMs = 110,
    private readonly cooldownMs = 180,
  ) {}

  reset(): GestureMachineResult {
    this.phase = "IDLE"
    this.candidateTarget = null
    this.lockedTarget = null
    this.pinch = "none"
    this.operation = null
    return this.result()
  }

  update(timestamp: number, handPresent: boolean, hoveredTarget: number | null, landmarks?: GestureLandmark[]): GestureMachineResult {
    if (!handPresent) return this.reset()

    if (this.phase === "COMMITTED") this.phase = "RELEASE_WAIT"
    if (this.phase === "RELEASE_WAIT") {
      if (landmarks && allPinchesReleased(landmarks)) {
        this.phase = "COOLDOWN"
        this.cooldownUntil = timestamp + this.cooldownMs
        this.pinch = "none"
        this.operation = null
      }
      return this.result()
    }
    if (this.phase === "COOLDOWN") {
      if (timestamp < this.cooldownUntil) return this.result()
      this.lockedTarget = null
      this.candidateTarget = null
      this.phase = "NAVIGATING"
    }

    const detectedPinch = landmarks ? classifyPinch(landmarks) : "none"
    if (this.phase === "GESTURE_ARMED") {
      if (detectedPinch === this.pinch && this.lockedTarget !== null && this.operation) {
        this.phase = "COMMITTED"
        return this.result({ target: this.lockedTarget, operation: this.operation })
      }
      if (landmarks && allPinchesReleased(landmarks)) {
        this.phase = this.lockedTarget === null ? "NAVIGATING" : "TARGET_LOCKED"
        this.pinch = "none"
        this.operation = null
      }
      return this.result()
    }

    if (detectedPinch !== "none" && this.lockedTarget !== null) {
      if (this.pinch !== detectedPinch) {
        this.pinch = detectedPinch
        this.pinchSince = timestamp
      } else if (timestamp - this.pinchSince >= this.armDwellMs) {
        this.operation = PINCH_OPERATION[detectedPinch]
        this.phase = "GESTURE_ARMED"
      }
      return this.result()
    }
    if (this.pinch !== "none" && landmarks && !allPinchesReleased(landmarks)) {
      return this.result()
    }
    this.pinch = "none"

    if (hoveredTarget !== this.candidateTarget) {
      this.candidateTarget = hoveredTarget
      this.candidateSince = timestamp
      this.lockedTarget = null
    }
    if (hoveredTarget === null) {
      this.phase = "NAVIGATING"
    } else if (timestamp - this.candidateSince >= this.targetDwellMs) {
      this.lockedTarget = hoveredTarget
      this.phase = "TARGET_LOCKED"
    } else {
      this.phase = "NAVIGATING"
    }
    return this.result()
  }

  private result(commit: GestureMachineResult["commit"] = null): GestureMachineResult {
    return { phase: this.phase, lockedTarget: this.lockedTarget, operation: this.operation, commit }
  }
}

export function selectTopmostMatchingWindow<T extends { appName: string; zIndex: number }>(
  windows: T[],
  appName: string,
): T | undefined {
  return windows
    .filter(window => window.appName.toLowerCase() === appName.toLowerCase())
    .reduce<T | undefined>((top, window) => (!top || window.zIndex > top.zIndex ? window : top), undefined)
}
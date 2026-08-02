export interface TrackingVideo {
  srcObject: MediaProvider | null
  remove: () => void
}

export function handsModeScriptUrls(handsBase: string, cameraBase: string): string[] {
  return [`${handsBase}/hands.js`, `${cameraBase}/camera_utils.js`]
}

export function releaseMediaPipeResources(
  camera: { stop?: () => void } | null,
  hands: { close?: () => void } | null,
  video: TrackingVideo | null,
) {
  camera?.stop?.()
  hands?.close?.()
  if (video) {
    (video.srcObject as MediaStream | null)?.getTracks().forEach(track => track.stop())
    video.srcObject = null
    video.remove()
  }
}

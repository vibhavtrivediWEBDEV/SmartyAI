"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Hand } from "lucide-react";
import { useSettings } from "@/app/context/settingContext";

interface UserCardProps {
  userName: string;
}

const UserCard = ({ userName }: UserCardProps) => {
  const { settings } = useSettings();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraEnabled(false);
  };

  const toggleCamera = async () => {
    if (cameraEnabled) return stopCamera();
    try {
      setCameraError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraEnabled(true);
    } catch {
      setCameraError("Camera permission was not granted.");
    }
  };

  useEffect(() => stopCamera, []);
  useEffect(() => {
    if (cameraEnabled && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraEnabled]);

  return (
    <div className="card-border">
      <div className="card-content relative overflow-hidden">
        {cameraEnabled ? (
          <video ref={videoRef} autoPlay playsInline muted className="h-[180px] w-full rounded-xl bg-black object-cover [transform:scaleX(-1)]" />
        ) : (
          <Image
            src="/profile.svg"
            alt="profile-image"
            width={539}
            height={539}
            className="rounded-full object-cover size-[120px]"
          />
        )}
        <h3>{userName}</h3>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={toggleCamera}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs"
          >
            {cameraEnabled ? <CameraOff size={14} /> : <Camera size={14} />}
            {cameraEnabled ? "Turn camera off" : "Turn camera on"}
          </button>
          {settings.gestureControl && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1.5 text-xs text-emerald-400">
              <Hand size={13} /> Gestures active
            </span>
          )}
        </div>
        {cameraError && <p className="text-xs text-red-400">{cameraError}</p>}
        <p className="max-w-xs text-center text-[11px] opacity-50">Camera stays on this device and stops when this interview view closes.</p>
      </div>
    </div>
  );
};

export default UserCard;
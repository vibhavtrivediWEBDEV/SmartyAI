"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Video,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  VideoOff,
  Settings,
  Clock,
  User,
  ChevronRight,
  X,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Camera,
  MonitorUp,
} from "lucide-react";

/**
 * Enhanced FaceTime App with MongoDB Integration
 * 
 * Features:
 * - Call history stored in MongoDB
 * - Video call UI with webcam access
 * - Contact cards with call buttons
 * - Settings management
 * - Call statistics
 * - Camera/microphone controls
 */

interface Call {
  _id: string;
  userId: string;
  contactId?: string;
  contactName: string;
  contactAvatar?: string;
  callType: "video" | "audio";
  direction: "outgoing" | "incoming" | "missed";
  status: "completed" | "missed" | "rejected" | "failed";
  startTime: Date;
  endTime?: Date;
  duration?: number;
  quality?: "hd" | "sd" | "low";
  notes?: string;
  createdAt: Date;
}

interface CallStats {
  totalCalls: number;
  videoCalls: number;
  audioCalls: number;
  missedCalls: number;
  totalDuration: number;
}

interface FaceTimeSettings {
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  preferredCamera?: string;
  preferredMicrophone?: string;
  ringtone: boolean;
  callWaiting: boolean;
  showCallerId: boolean;
  blockUnknownCallers: boolean;
}

interface FaceTimeAppProps {
  windowId?: string;
}

export default function EnhancedFaceTimeApp({ windowId }: FaceTimeAppProps) {
  // State
  const [calls, setCalls] = useState<Call[]>([]);
  const [	stats, setStats] = useState<CallStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<FaceTimeSettings>({
    cameraEnabled: true,
    microphoneEnabled: true,
    ringtone: true,
    callWaiting: true,
    showCallerId: true,
    blockUnknownCallers: false,
  });
  
  // Call State
  const [inCall, setInCall] = useState(false);
  const [callType, setCallType] = useState<"video" | "audio">("video");
  const [callContact, setCallContact] = useState<string>("");
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<"calling" | "connected" | "ended">("calling");
  
  // Media State
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [selectedMic, setSelectedMic] = useState<string>("");
  
  // UI State
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch call history on mount
  useEffect(() => {
    fetchCallHistory();
    fetchSettings();
    getMediaDevices();
  }, []);

  // Update call duration timer
  useEffect(() => {
    if (inCall && callStatus === "connected") {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [inCall, callStatus]);

  // Cleanup media stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  async function fetchCallHistory() {
    try {
      const res = await fetch("/api/facetime/history");
      
      if (res.ok) {
        const data = await res.json();
        setCalls(data.calls || []);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch call history:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSettings() {
    try {
      const res = await fetch("/api/facetime/settings");
      
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    }
  }

  async function getMediaDevices() {
    try {
      // Request permissions first
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAvailableDevices(devices);
      
      const videoDevices = devices.filter(d => d.kind === "videoinput");
      const audioDevices = devices.filter(d => d.kind === "audioinput");
      
      if (videoDevices.length > 0 && !selectedCamera) {
        setSelectedCamera(videoDevices[0].deviceId);
      }
      
      if (audioDevices.length > 0 && !selectedMic) {
        setSelectedMic(audioDevices[0].deviceId);
      }
    } catch (error) {
      console.error("Failed to get media devices:", error);
    }
  }

  async function startCall(contactName: string, type: "video" | "audio") {
    setCallContact(contactName);
    setCallType(type);
    setInCall(true);
    setCallStatus("calling");
    setCallStartTime(new Date());
    setCallDuration(0);
    
    try {
      if (type === "video") {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: cameraOn ? { deviceId: selectedCamera } : false,
          audio: micOn ? { deviceId: selectedMic } : false,
        });
        
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
      
      // Simulate call connection after 2 seconds
      setTimeout(() => {
        setCallStatus("connected");
      }, 2000);
      
    } catch (error) {
      console.error("Failed to start call:", error);
      endCall();
    }
  }

  async function endCall() {
    // Log the call
    if (callContact && callStartTime) {
      try {
        await fetch("/api/facetime/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contactName: callContact,
            callType,
            direction: "outgoing",
            status: callStatus === "connected" ? "completed" : "failed",
            startTime: callStartTime,
            duration: callDuration,
            quality: "hd",
          }),
        });
        
        fetchCallHistory();
      } catch (error) {
        console.error("Failed to log call:", error);
      }
    }
    
    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setInCall(false);
    setCallContact("");
    setCallStatus("calling");
    setCallStartTime(null);
    setCallDuration(0);
  }

  function toggleCamera() {
    setCameraOn(prev => !prev);
    
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !cameraOn;
      });
    }
  }

  function toggleMic() {
    setMicOn(prev => !prev);
    
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !micOn;
      });
    }
  }

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  async function deleteCall(callId: string) {
    try {
      const res = await fetch(`/api/facetime/history/${callId}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        setCalls(prev => prev.filter(c => c._id !== callId));
      }
    } catch (error) {
      console.error("Failed to delete call:", error);
    }
  }

  async function clearHistory() {
    if (!confirm("Are you sure you want to clear all call history?")) return;
    
    try {
      const res = await fetch("/api/facetime/history", {
        method: "DELETE",
      });
      
      if (res.ok) {
        setCalls([]);
      }
    } catch (error) {
      console.error("Failed to clear history:", error);
    }
  }

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#1c1c1e]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#0A84FF]/20 flex items-center justify-center">
            <Video className="w-8 h-8 text-[#0A84FF]" />
          </div>
          <p className="text-[#f2f2f7]">Loading FaceTime...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex bg-black text-white overflow-hidden">
      
      {/* Sidebar - Call History */}
      <aside className={`${sidebarOpen ? "w-72" : "w-0"} shrink-0 bg-[#2c2c2e]/95 backdrop-blur-xl border-r border-white/10 flex flex-col transition-all duration-300 overflow-hidden`}>
        
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold">FaceTime</h2>
          
          {stats && (
            <div className="mt-2 flex items-center gap-3 text-xs text-white/60">
              <span>{stats.totalCalls} calls</span>
              <span>•</span>
              <span>{Math.floor(stats.totalDuration / 60)}min</span>
            </div>
          )}
          
          {/* New Call Button */}
          <button
            onClick={() => startCall("New Call", "video")}
            className="mt-3 w-full py-2 rounded-lg bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#0A84FF]/90 transition-colors"
          >
            <Video className="w-4 h-4 inline mr-2" />
            New FaceTime
          </button>
        </div>
        
        {/* Call History */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-2">
            <h3 className="text-xs font-semibold uppercase text-white/40 mb-2">Recent</h3>
          </div>
          
          {calls.length === 0 ? (
            <div className="px-4 py-8 text-center text-white/40 text-sm">
              No recent calls
            </div>
          ) : (
            <div className="space-y-1 px-2">
              {calls.map(call => (
                <div
                  key={call._id}
                  className="group p-2 rounded-lg hover:bg-white/5 flex items-center gap-3 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A84FF] to-[#5E5CE6] flex items-center justify-center text-white font-semibold text-sm shrink-0">
                    {call.contactName[0]}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{call.contactName}</div>
                    <div className="flex items-center gap-1 text-xs text-white/60">
                      {call.callType === "video" ? (
                        <Video className="w-3 h-3" />
                      ) : (
                        <Phone className="w-3 h-3" />
                      )}
                      <span className="capitalize">{call.direction}</span>
                      <span>•</span>
                      <span>
                        {call.duration ? formatDuration(call.duration) : "0:00"}
                      </span>
                    </div>
                  </div>
                  
                  {/* Call Back Button */}
                  <button
                    onClick={() => startCall(call.contactName, call.callType)}
                    className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full bg-[#34C759] flex items-center justify-center transition-all"
                  >
                    {call.callType === "video" ? (
                      <Video className="w-4 h-4" />
                    ) : (
                      <Phone className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={clearHistory}
            className="text-xs text-white/40 hover:text-red-500 transition-colors"
          >
            Clear History
          </button>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-black relative">
        
        {/* Video Preview / Call UI */}
        {inCall ? (
          <div className="flex-1 relative">
            
            {/* Video Feed */}
            {callType === "video" ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover bg-black"
                />
                
                {/* Remote Video (Placeholder) */}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1c1c1e] to-[#2c2c2e]">
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-[#0A84FF] to-[#5E5CE6] flex items-center justify-center text-white text-5xl font-semibold">
                      {callContact[0]}
                    </div>
                    <h3 className="text-2xl font-semibold mt-6">{callContact}</h3>
                    <p className="text-white/60 mt-2">
                      {callStatus === "calling" ? "Calling..." : formatDuration(callDuration)}
                    </p>
                  </div>
                </div>
                
                {/* Self View (PiP) */}
                {cameraOn && (
                  <div className="absolute bottom-24 right-6 w-48 h-36 rounded-xl overflow-hidden bg-black border-2 border-white/20 shadow-2xl">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-[#1c1c1e] to-[#2c2c2e]">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#34C759] to-[#30D158] flex items-center justify-center text-white text-5xl font-semibold">
                  {callContact[0]}
                </div>
                <h3 className="text-2xl font-semibold mt-6">{callContact}</h3>
                <p className="text-white/60 mt-2">
                  {callStatus === "calling" ? "Calling..." : formatDuration(callDuration)}
                </p>
              </div>
            )}
            
            {/* Call Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-6 flex items-center justify-center gap-4">
              
              {/* Mute */}
              <button
                onClick={toggleMic}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                  micOn ? "bg-white/20" : "bg-red-500"
                }`}
              >
                {micOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </button>
              
              {/* End Call */}
              <button
                onClick={endCall}
                className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
              
              {/* Camera Toggle */}
              {callType === "video" && (
                <button
                  onClick={toggleCamera}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                    cameraOn ? "bg-white/20" : "bg-red-500"
                  }`}
                >
                  {cameraOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-[#1c1c1e] to-[#2c2c2e] p-8">
            
            {/* Logo */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#0A84FF] to-[#5E5CE6] flex items-center justify-center mb-6">
              <Video className="w-12 h-12" />
            </div>
            
            <h2 className="text-3xl font-bold mb-2">FaceTime</h2>
            <p className="text-white/60 text-center mb-8">
              Start a video or audio call with your contacts
            </p>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => startCall("New Video Call", "video")}
                className="px-8 py-3 rounded-full bg-[#0A84FF] text-white font-medium hover:bg-[#0A84FF]/90 transition-colors"
              >
                <Video className="w-5 h-5 inline mr-2" />
                New Video
              </button>
              
              <button
                onClick={() => startCall("New Audio Call", "audio")}
                className="px-8 py-3 rounded-full bg-[#34C759] text-white font-medium hover:bg-[#34C759]/90 transition-colors"
              >
                <Phone className="w-5 h-5 inline mr-2" />
                New Audio
              </button>
            </div>
            
            {/* Stats */}
            {stats && (
              <div className="mt-12 flex items-center gap-8 text-sm text-white/40">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-white">{stats.totalCalls}</div>
                  <div>Total Calls</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-white">{Math.floor(stats.totalDuration / 60)}</div>
                  <div>Minutes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-white">{stats.videoCalls}</div>
                  <div>Video Calls</div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <ChevronRight
              className={`w-5 h-5 transition-transform ${sidebarOpen ? "rotate-180" : ""}`}
            />
          </button>
          
          <button
            onClick={() => setShowSettings(true)}
            className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </main>
      
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#2c2c2e] rounded-2xl overflow-hidden shadow-2xl">
            
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold">FaceTime Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-4 space-y-4">
              
              {/* Camera */}
              <div>
                <label className="text-xs font-semibold uppercase text-white/40 mb-2 block">
                  Camera
                </label>
                <select
                  value={selectedCamera}
                  onChange={(e) => setSelectedCamera(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 text-sm outline-none"
                >
                  {availableDevices
                    .filter(d => d.kind === "videoinput")
                    .map(device => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                </select>
              </div>
              
              {/* Microphone */}
              <div>
                <label className="text-xs font-semibold uppercase text-white/40 mb-2 block">
                  Microphone
                </label>
                <select
                  value={selectedMic}
                  onChange={(e) => setSelectedMic(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 text-sm outline-none"
                >
                  {availableDevices
                    .filter(d => d.kind === "audioinput")
                    .map(device => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Mic ${device.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

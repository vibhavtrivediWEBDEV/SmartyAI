"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import { CameraIcon, PlusIcon, VideoOffIcon } from 'lucide-react' // Added VideoOffIcon
import { gsap } from "gsap"

interface Photo {
  id: string
  src: string
  alt: string
}

export function PhotosApp() {
  const [galleryPhotos, setGalleryPhotos] = useState<Photo[]>([
    { id: "1", src: "/placeholder.svg?height=200&width=300&text=Nature+1", alt: "Nature scene 1" },
    { id: "2", src: "/placeholder.svg?height=200&width=300&text=Cityscape+2", alt: "Cityscape 2" },
    { id: "3", src: "/placeholder.svg?height=200&width=300&text=Abstract+3", alt: "Abstract art 3" },
    { id: "4", src: "/placeholder.svg?height=200&width=300&text=Mountain+4", alt: "Mountain view 4" },
  ])
  const [isTakingPhoto, setIsTakingPhoto] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const flashRef = useRef<HTMLDivElement>(null)
  const galleryRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null) // To store the media stream

  const startCamera = useCallback(async () => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream // Store the stream
        setCameraActive(true)
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      setCameraError("Failed to access camera. Please ensure permissions are granted.")
      setCameraActive(false)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }, [])

  useEffect(() => {
    // Start camera when component mounts
    startCamera()

    // Stop camera when component unmounts
    return () => {
      stopCamera()
    }
  }, [startCamera, stopCamera])

  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    setIsTakingPhoto(true)

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (context) {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Get image data from canvas
      const imageDataUrl = canvas.toDataURL("image/png")

      // GSAP Flash animation
      if (flashRef.current) {
        gsap.fromTo(
          flashRef.current,
          { opacity: 0, display: 'none' },
          { opacity: 1, display: 'block', duration: 0.1, ease: "power1.out",
            onComplete: () => {
              gsap.to(flashRef.current, { opacity: 0, duration: 0.3, ease: "power1.in", delay: 0.1,
                onComplete: () => {
                  gsap.set(flashRef.current, { display: 'none' });
                }
              });
            }
          }
        );
      }

      setTimeout(() => {
        const newPhoto: Photo = {
          id: Date.now().toString(),
          src: imageDataUrl,
          alt: `Photo taken at ${new Date().toLocaleTimeString()}`,
        }
        setGalleryPhotos((prevPhotos) => [newPhoto, ...prevPhotos]) // Add new photo to the beginning
        setIsTakingPhoto(false)
      }, 500) // Simulate photo capture time
    }
  }, [])

  // GSAP animation for new photos entering the gallery
  useEffect(() => {
    if (galleryPhotos.length > 0 && galleryRef.current) {
      const firstPhotoElement = galleryRef.current.querySelector('.gallery-item');
      if (firstPhotoElement) {
        gsap.from(firstPhotoElement, {
          opacity: 0,
          scale: 0.8,
          y: 20,
          duration: 0.5,
          ease: "back.out(1.7)",
        });
      }
    }
  }, [galleryPhotos.length]); // Trigger when photo count changes

  return (
    <div className="flex flex-col w-full h-full bg-gray-900 text-gray-200 rounded-b-lg overflow-hidden relative">
      {/* Flash overlay */}
      <div
        ref={flashRef}
        className="absolute inset-0 bg-white z-10 opacity-0 hidden"
        aria-hidden="true"
      />

      <div className="p-4 flex justify-between items-center border-b border-gray-700 bg-gray-800">
        <h2 className="text-xl font-bold text-blue-400">Photos</h2>
        <button
          onClick={takePhoto}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isTakingPhoto || !cameraActive}
          aria-label="Take a new photo"
        >
          {isTakingPhoto ? (
            <>
              <CameraIcon className="w-5 h-5 animate-pulse" /> Capturing...
            </>
          ) : (
            <>
              <CameraIcon className="w-5 h-5" /> Take Photo
            </>
          )}
        </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Camera Feed Section */}
        <div className="md:w-1/2 flex flex-col items-center justify-center p-4 bg-gray-800 relative">
          {cameraActive ? (
            <video ref={videoRef} autoPlay playsInline className="w-full h-auto max-h-full rounded-lg shadow-lg object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full bg-gray-700 rounded-lg text-gray-400">
              <VideoOffIcon className="w-16 h-16 mb-4" />
              <p className="text-lg">Camera not active</p>
              {cameraError && <p className="text-red-400 text-sm mt-2 text-center">{cameraError}</p>}
              <button
                onClick={startCamera}
                className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white font-semibold"
              >
                Enable Camera
              </button>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" /> {/* Hidden canvas for photo capture */}
        </div>

        {/* Gallery Section */}
        <div className="md:w-1/2 flex-1 p-4 overflow-y-auto">
          <h3 className="text-lg font-bold text-gray-300 mb-4">Your Photos</h3>
          {galleryPhotos.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400 italic">
              No photos yet. Take one!
            </div>
          ) : (
            <div ref={galleryRef} className="grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-fr">
              {galleryPhotos.map((photo) => (
                <div key={photo.id} className="gallery-item relative w-full h-40 bg-gray-700 rounded-lg overflow-hidden shadow-md group">
                  <Image
                    src={photo.src || "/placeholder.svg"}
                    alt={photo.alt}
                    layout="fill"
                    objectFit="cover"
                    className="transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-white text-xs p-1 bg-black bg-opacity-50 rounded">{photo.alt}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

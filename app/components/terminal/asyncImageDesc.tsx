"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

type Props = {
  description: string
  alt: string
  caption?: string
  initialUrl?: string
  resolveMissing?: boolean
  onResolved?: (url: string) => void
}

export default function AsyncImageFromDescription({ description, alt, caption, initialUrl, resolveMissing = true, onResolved }: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(initialUrl || null)

  useEffect(() => {
    const fetchImage = async () => {
      if (initialUrl || !resolveMissing) return
      try {
        const res = await fetch("/api/pinterest/searchimage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ search: description, mode: "education" }),
        })

        const data = await res.json()

        // Assuming your API returns { images: [url1, url2, ...] }
        const firstImage = data?.images?.[0]
        const resolvedUrl = typeof firstImage === "string" ? firstImage : firstImage?.url
        if (resolvedUrl) {
          setImageUrl(resolvedUrl)
          onResolved?.(resolvedUrl)
        }
      } catch (error) {
        console.error("Image fetch failed:", error)
      }
    }

    fetchImage()
  }, [description, initialUrl, onResolved, resolveMissing])

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 bg-gray-900">
      <div className="relative w-full h-full max-w-md max-h-96 flex items-center justify-center">
        <Image
          src={imageUrl || "/b1.svg"} // fallback if no result
          alt={alt}
          fill
          sizes="(max-width: 768px) 90vw, 700px"
          className="rounded-lg object-contain shadow-lg"
        />
      </div>
      {caption && (
        <p className="text-sm text-gray-400 mt-4 text-center">{caption}</p>
      )}
    </div>
  )
}

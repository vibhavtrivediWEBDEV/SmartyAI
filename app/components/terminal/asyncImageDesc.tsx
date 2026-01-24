"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

type Props = {
  description: string
  alt: string
  caption?: string
}

export default function AsyncImageFromDescription({ description, alt, caption }: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const res = await fetch("/api/pinterest/searchimage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ search: description }),
        })

        const data = await res.json()

        // Assuming your API returns { images: [url1, url2, ...] }
        const firstImage = data?.images?.[0]
        if (firstImage) {
          setImageUrl(firstImage)
        }
      } catch (error) {
        console.error("Image fetch failed:", error)
      }
    }

    fetchImage()
  }, [description])

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 bg-gray-900">
      <div className="relative w-full h-full max-w-md max-h-96 flex items-center justify-center">
        <Image
          src={imageUrl || "/b1.svg"} // fallback if no result
          alt={alt}
          layout="fill"
          objectFit="contain"
          className="rounded-lg shadow-lg"
        />
      </div>
      {caption && (
        <p className="text-sm text-gray-400 mt-4 text-center">{caption}</p>
      )}
    </div>
  )
}

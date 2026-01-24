"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon } from 'lucide-react'
import { jsPDF } from "jspdf"
import AsyncImageFromDescription from "./asyncImageDesc"

export function ScienceBook({ name, subject = "", messages, callStart, status }) {
  const [currentPage, setCurrentPage] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const [direction, setDirection] = useState<"next" | "prev" | null>(null)
  const [BOOK_PAGES, setBOOK_PAGES] = useState<any[]>([])
  const [prompt, setPrompt] = useState(subject)
  const [loading, setLoading] = useState(false)

  const totalPages = BOOK_PAGES.length
  const bookRef = useRef<HTMLDivElement>(null)

  const fetchBookData = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setBOOK_PAGES([])
    try {
      const response = await fetch('/api/book-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, prompt, messages })
      })
      const data = await response.json()
      setBOOK_PAGES(data)
      setCurrentPage(0)
    } catch (err) {
      console.error("Failed to fetch book data", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === "NOT_STARTED") {
      fetchBookData()
    }
  }, [status])

  const goToPage = (pageIndex: number, newDirection: "next" | "prev") => {
    if (transitioning || pageIndex < 0 || pageIndex >= totalPages) return
    setDirection(newDirection)
    setTransitioning(true)
    setTimeout(() => {
      setCurrentPage(pageIndex)
      setTimeout(() => {
        setTransitioning(false)
        setDirection(null)
      }, 200)
    }, 200)
  }

  const goToNextPage = () => goToPage(currentPage + 1, "next")
  const goToPrevPage = () => goToPage(currentPage - 1, "prev")

  const downloadPDF = async () => {
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
  
    const coverBg = await loadImage("/herobg.jpg");
    const textBg = await loadImage("/bg_for_text.jpg");
    const endBg = await loadImage("/herobg.jpg");
  
    BOOK_PAGES.forEach((page, index) => {
      if (index > 0) pdf.addPage();
  
      // Background
      let bgImage = textBg;
      if (page.type === "cover") bgImage = coverBg;
      if (page.type === "end") bgImage = endBg;
      pdf.addImage(bgImage, "JPEG", 0, 0, pageWidth, pageHeight);
  
      pdf.setTextColor(255, 255, 255);
      let marginX = 15;
      let marginY = 30;
      let lineHeight = 8;
  
      if (page.type === "cover") {
        pdf.setFontSize(26);
        pdf.text(page.content.title, pageWidth / 2, 60, { align: "center" });
        pdf.setFontSize(18);
        if (page.content.subtitle) {
          pdf.text(page.content.subtitle, pageWidth / 2, 80, { align: "center" });
        }
        pdf.setFontSize(14);
        pdf.text(`By ${page.content.author}`, pageWidth / 2, 100, { align: "center" });
  
      } else if (page.type === "text") {
        pdf.setFontSize(18);
        if (page.content.question && page.content.answer) {
          let q = pdf.splitTextToSize(`Q: ${page.content.question}`, pageWidth - marginX * 2);
          pdf.text(q, marginX, marginY);
          marginY += q.length * lineHeight;
  
          pdf.setFontSize(14);
          let a = pdf.splitTextToSize(`A: ${page.content.answer}`, pageWidth - marginX * 2);
          pdf.text(a, marginX, marginY);
        } else {
          let title = pdf.splitTextToSize(page.content.title || "", pageWidth - marginX * 2);
          pdf.text(title, marginX, marginY);
          marginY += title.length * lineHeight;
  
          pdf.setFontSize(14);
          let paragraphs = page.content.body?.split("\n") || [];
          paragraphs.forEach(p => {
            let lines = pdf.splitTextToSize(p, pageWidth - marginX * 2);
            pdf.text(lines, marginX, marginY);
            marginY += lines.length * lineHeight;
          });
        }
  
      } else if (page.type === "end") {
        pdf.setFontSize(20);
        pdf.text(page.content.message || "", pageWidth / 2, pageHeight / 2 - 10, { align: "center" });
        pdf.setFontSize(14);
        pdf.text("Thank you for reading!", pageWidth / 2, pageHeight / 2 + 10, { align: "center" });
      }
    });
  
    pdf.save(`${subject || "book"}.pdf`);
  };
  
  const loadImage = (src) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => resolve(img);
      img.src = src;
    });
  };
  
  

  const renderPageContent = (page: any) => {
    if (!page) return null
    switch (page.type) {
      case "cover":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gradient-to-br from-green-900 to-gray-900 text-white">
            <h1 className="text-4xl font-bold text-green-300 mb-4">{page.content.title}</h1>
            <h2 className="text-xl font-semibold text-gray-300 mb-8">{page.content.subtitle}</h2>
            <p className="text-lg text-gray-400">By {page.content.author}</p>
          </div>
        )
      case "image":
        return (
          <AsyncImageFromDescription
            description={page.content.src}
            alt={page.content.alt}
            caption={page.content.caption}
          />
        )
      case "text":
        return (
          <div className="h-full p-6 overflow-y-auto bg-gray-900 text-gray-200">
            {page.content.question && page.content.answer ? (
              <>
                <h3 className="text-xl font-bold text-yellow-400 mb-3">
                  Q: {page.content.question}
                </h3>
                <p className="text-base leading-relaxed text-green-300">
                  A: {page.content.answer}
                </p>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-blue-400 mb-4">
                  {page.content.title}
                </h3>
                {page.content.body?.split('\n').map((paragraph: string, index: number) => (
                  <p key={index} className="mb-3 text-base leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </>
            )}
          </div>
        )
      case "end":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-900 text-gray-400">
            <p className="text-2xl font-bold mb-4">{page.content.message}</p>
            <p className="text-lg">Thank you for reading!</p>
          </div>
        )
      default:
        return <div className="h-full flex items-center justify-center text-gray-400">Page not found.</div>
    }
  }

  const currentContent = BOOK_PAGES[currentPage]

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto h-[40rem] bg-gray-800 rounded-md overflow-hidden">
      {/* Top bar */}
      <div className="p-3 bg-gray-700 text-gray-300 font-mono text-sm flex flex-col gap-2">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Enter a science topic..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-1 px-3 py-1 text-sm rounded bg-gray-600 text-white outline-none"
          />
          <button
            onClick={fetchBookData}
            className="px-4 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {loading ? "Loading..." : `${status} generate`}
          </button>
          {BOOK_PAGES.length > 0 && (
            <button
              onClick={downloadPDF}
              className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-white flex items-center gap-1"
            >
              <DownloadIcon className="w-4 h-4" /> Download
            </button>
          )}
        </div>
        {BOOK_PAGES.length > 0 && (
          <div className="flex justify-between">
            <span>{subject} Book</span>
            <span>Page {currentPage + 1} of {totalPages}</span>
          </div>
        )}
      </div>

      {/* Book content */}
      <div ref={bookRef} className="flex-1 relative overflow-hidden">
        <div
          className={`absolute inset-0 transition-all duration-200 ease-in-out
            ${transitioning ? (direction === "next" ? "opacity-0 translate-x-4" : "opacity-0 -translate-x-4") : "opacity-100 translate-x-0"}`}
        >
          {renderPageContent(currentContent)}
        </div>
      </div>

      {/* Navigation */}
      {BOOK_PAGES.length > 0 && (
        <div className="p-2 bg-gray-700 text-gray-400 text-xs font-mono flex justify-center items-center gap-4">
          <button
            onClick={goToPrevPage}
            disabled={currentPage === 0 || transitioning}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded disabled:opacity-50 flex items-center gap-1"
          >
            <ChevronLeftIcon className="w-4 h-4" /> Prev
          </button>
          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages - 1 || transitioning}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded disabled:opacity-50 flex items-center gap-1"
          >
            Next <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

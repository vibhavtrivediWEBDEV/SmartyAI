"use client"

import { useCallback, useEffect, useState } from "react"
import { BookOpen, BriefcaseBusiness, LoaderCircle, Sparkles } from "lucide-react"

import styles from "./LibraryApp.module.css"

type LibraryBook = {
  id: string
  subject: string
  title: string
  creatorName: string
  summary: string
  coverImageUrl?: string
  interview?: { label: string; company?: string; role?: string }
  pageCount: number
  publishedAt: string
}

type LibraryAppProps = {
  openApplication: (appName: string, initialX?: number, initialY?: number, commandToRun?: string, arg?: Record<string, unknown>) => void | Promise<void>
}

export default function LibraryApp({ openApplication }: LibraryAppProps) {
  const [books, setBooks] = useState<LibraryBook[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState("")

  const loadBooks = useCallback(async (cursor?: string) => {
    if (cursor) setLoadingMore(true)
    else setLoading(true)
    setError("")
    try {
      const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""
      const response = await fetch(`/api/library/books${query}`)
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || "Unable to load the library.")
      setBooks((current) => cursor ? [...current, ...(data.books || [])] : data.books || [])
      setNextCursor(data.nextCursor || null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load the library.")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => { void loadBooks() }, [loadBooks])

  return (
    <main className={styles.library}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}><Sparkles size={14} /> Free public learning library</p>
          <h1 className={styles.title}>Books built for the interview ahead.</h1>
        </div>
        <p className={styles.intro}>
          Smarty autonomously turns a candidate&apos;s profile, resume, career goals, and real-company role requirements into a focused learning book. Authors choose what to publish; private source material stays private.
        </p>
      </header>

      <section className={styles.content} aria-labelledby="library-catalog-title">
        <div className={styles.catalogBar}>
          <h2 id="library-catalog-title">Recently published</h2>
          <span>{books.length} {books.length === 1 ? "edition" : "editions"}</span>
        </div>

        {loading ? (
          <div className={styles.grid} aria-label="Loading books">
            {Array.from({ length: 8 }, (_, index) => <div className={styles.skeleton} key={index} />)}
          </div>
        ) : error && books.length === 0 ? (
          <div className={styles.state}>
            <div><BookOpen size={28} /><p>{error}</p><button className={styles.loadMore} onClick={() => void loadBooks()}>Try again</button></div>
          </div>
        ) : books.length === 0 ? (
          <div className={styles.state}><div><BookOpen size={30} /><p>No public editions have been published yet.</p></div></div>
        ) : (
          <div className={styles.grid}>
            {books.map((book) => (
              <button
                className={styles.card}
                key={book.id}
                onClick={() => void openApplication("AI Book", undefined, undefined, undefined, { bookId: book.id })}
                aria-label={`Open ${book.title} by ${book.creatorName}`}
              >
                <div className={styles.cover}>
                  {book.coverImageUrl && <img src={book.coverImageUrl} alt="" />}
                  <span className={styles.subject}>{book.subject}</span>
                </div>
                <div className={styles.cardBody}>
                  <h3>{book.title}</h3>
                  <p className={styles.summary}>{book.summary}</p>
                  {book.interview && <p className={styles.interview}><BriefcaseBusiness size={13} /> {book.interview.label}</p>}
                  <div className={styles.meta}>
                    <span>By {book.creatorName}</span>
                    <span>{new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(book.publishedAt))} · {book.pageCount} pages</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {nextCursor && (
          <button className={styles.loadMore} disabled={loadingMore} onClick={() => void loadBooks(nextCursor)}>
            {loadingMore && <LoaderCircle className={styles.spinner} size={15} />}
            Load more
          </button>
        )}
      </section>
    </main>
  )
}

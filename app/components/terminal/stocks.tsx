"use client"

import { useEffect, useState } from "react"
import {
  ComposedChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, CandlestickChart, Bar, Line
} from "recharts"

const STOCK_SYMBOLS = [
  { name: "Apple", symbol: "AAPL" },
  { name: "Microsoft", symbol: "MSFT" },
  { name: "Google", symbol: "GOOGL" },
  { name: "Amazon", symbol: "AMZN" },
  { name: "Tesla", symbol: "TSLA" },
  { name: "Netflix", symbol: "NFLX" },
  { name: "Nvidia", symbol: "NVDA" },
  { name: "Meta", symbol: "META" }
]

const API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY

type CandleData = {
  date: string
  open: number
  high: number
  low: number
  close: number
}

export default function StockCandlestick() {
  const [symbol, setSymbol] = useState("AAPL")
  const [data, setData] = useState<CandleData[]>([])
  const [loading, setLoading] = useState(false)

  const fetchStockData = async () => {
    if (!API_KEY) return
    setLoading(true)

    try {
      const res = await fetch(
        `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=15min&apikey=${API_KEY}`
      )
      const json = await res.json()
      const timeSeries = json["Time Series (15min)"]

      if (!timeSeries) throw new Error("Invalid API response")

      const parsed: CandleData[] = Object.entries(timeSeries).map(([date, prices]: any) => ({
        date,
        open: parseFloat(prices["1. open"]),
        high: parseFloat(prices["2. high"]),
        low: parseFloat(prices["3. low"]),
        close: parseFloat(prices["4. close"])
      }))

      setData(parsed.reverse()) // So latest is at the end
    } catch (err) {
      console.error("Failed to fetch stock data", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStockData()
  }, [symbol])

  return (
    <div className="w-full max-w-5xl mx-auto p-4 bg-gray-900 text-white rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">📈 Stock Candlestick Chart</h2>
        <select
          className="bg-gray-800 text-white px-4 py-2 rounded"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
        >
          {STOCK_SYMBOLS.map((stock) => (
            <option key={stock.symbol} value={stock.symbol}>
              {stock.name} ({stock.symbol})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading stock data...</p>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={data}>
            <XAxis dataKey="date" hide />
            <YAxis domain={["dataMin", "dataMax"]} />
            <Tooltip />
            <CartesianGrid strokeDasharray="3 3" />
            {/* Recharts doesn’t have native candlestick, simulate with Bar for now */}
            <Bar
              dataKey="close"
              fill="#8884d8"
              isAnimationActive={false}
              shape={({ x, y, width, height, payload }: any) => {
                const color = payload.open > payload.close ? "#f87171" : "#34d399"
                const top = Math.min(payload.open, payload.close)
                const bottom = Math.max(payload.open, payload.close)
                const barHeight = Math.abs(payload.open - payload.close)
                return (
                  <g>
                    {/* Wick */}
                    <line
                      x1={x + width / 2}
                      x2={x + width / 2}
                      y1={y + (payload.high - payload.open) * height / (payload.high - payload.low)}
                      y2={y + (payload.low - payload.open) * height / (payload.high - payload.low)}
                      stroke={color}
                    />
                    {/* Body */}
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={Math.max(1, barHeight)}
                      fill={color}
                    />
                  </g>
                )
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

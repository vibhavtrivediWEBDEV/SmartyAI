"use client"
import { Desktop } from '@/components/Dekstop/deskstop'
import FuturisticPortfolio from "./modelviewr";
import { useState, useEffect } from 'react';

const PortfolioView = () => {
  const [dekstopView, setdekstopViewRaw] = useState(true);

  // wrapper that prints stacktrace to find the caller
  const setdekstopView = (v: boolean) => {
    console.trace("setdekstopView called with", v);
    setdekstopViewRaw(v);
  };

  useEffect(() => {
    console.log("PortfolioView mounted, dekstopView:", dekstopView);
  }, [dekstopView]);

  return (
    <div>

      {
        dekstopView ?
          <Desktop setdekstopView={setdekstopView} />
          :
          <p></p> // <FuturisticPortfolio setdekstopView={setdekstopView} />
      }

    </div>
  )
}

export default PortfolioView

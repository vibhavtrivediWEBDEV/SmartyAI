'use client'

import React from "react";

interface BrowserProps {
  isAppOpen: boolean;
}

function Browser({ isAppOpen }: BrowserProps) {
  const homeUrl = "https://www.google.com/webhp?igu=1";

  return (
    <div className={`${isAppOpen ? "" : "hidden"} z-30 w-full h-screen absolute`}>
      <div className="bg-black h-[45rem] w-[70.5rem] rounded-xl overflow-hidden border-neutral-700 border-[1.5px]">
        <div className="h-full w-full">
          <iframe 
            src={homeUrl} 
            className="w-full h-full border-0" 
            id="chrome-screen" 
            title="Chrome Url"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      </div>
    </div>
  );
}

export default Browser;
import Image from "next/image"

export default function AppLaunchpad() {
  const appIconsData = [
    { name: "Finder", url: "https://framerusercontent.com/images/wtQkw1jK0MlEDOrW0Q1kE5PBqc.png" },
    { name: "Safari", url: "https://framerusercontent.com/images/qQISGOSSnz748TdrZn91l44R5u0.png" },
    { name: "Mail", url: "https://framerusercontent.com/images/fm90fwzWoBMCvK5C0MOyKdo94.png" },
    { name: "Messages", url: "https://framerusercontent.com/images/CwKoPLck9kD8CifRkrpug3socM.png" },
    { name: "Maps", url: "https://framerusercontent.com/images/YtLyrfz2kFN2QhkzBWG6TrATw.png" },
    { name: "Photos", url: "https://framerusercontent.com/images/ogWIDEJmWxA8SVRZpEe7gk35FcM.png" },
    { name: "FaceTime", url: "https://framerusercontent.com/images/xxKf6tPzYecSWOavDJjUB0MtXw.png" },
    { name: "Calendar", url: "https://framerusercontent.com/images/VeljykK560qBRDkQkYyhx8ChI.png" },
    { name: "Reminders", url: "https://framerusercontent.com/images/NMuItXJj2OKiPiAC2EdivhRPYY.png" },
    { name: "Notes", url: "https://framerusercontent.com/images/Z0d1XNe7wVINUiHydSL6noKho.png" },
    { name: "App Store", url: "https://framerusercontent.com/images/KCaz69s4OvhKMUI25E1RBeuNIyA.png" },
    { name: "Settings", url: "https://framerusercontent.com/images/VbY44vBZlQp4srNQK6ohxpco.png" },
    { name: "TV", url: "https://framerusercontent.com/images/1pORyCnfgAxpXWyCa1l7s8IJeK0.png" },
    { name: "Music", url: "https://framerusercontent.com/images/pjjxP6KY1Ttnqhuqt9oF3QBfmE.png" },
  ]

  return (
    <div className="flex items-center justify-center min-h-screen bg-transparent w-full ">
      <div
        className="
          relative
          w-full
          max-w-7xl
          aspect-[16/10]
          sm:aspect-[16/10]
          md:aspect-[16/10]
          h-screen
          overflow-hidden
          shadow-2xl
          border
          border-gray-300
           bg-opacity-20
          backdrop-brightness-110
        "
        style={{ backdropFilter: "blur(4px)" }}
      >
        {/* Main App Grid - Responsive */}
        <div
          className="
            absolute inset-0 
            p-4 sm:p-6 md:p-8 
            grid 
            h-screen
            grid-cols-4 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8
            gap-3 sm:gap-4 md:gap-y-2 md:gap-x-2 
            justify-items-center 
            content-start sm:content-center
            overflow-y-auto
            scrollbar-hide
          "
        >
          {appIconsData.map((app, index) => (
            <div
              key={index}
              className="
                flex flex-col items-center justify-center text-center 
                group cursor-pointer
                w-full
                active:scale-95 transition-transform
              "
            >
              {/* Icon - Responsive sizing */}
              <div className="
                relative 
                w-12 h-12 
                sm:w-14 sm:h-14 
                md:w-16 md:h-16 
                mb-1 sm:mb-2 
                transition-transform duration-200 
                group-hover:scale-110
                touch-manipulation
              ">
                <Image
                  src={app.url || "/placeholder.svg"}
                  alt={`${app.name} icon`}
                  fill
                  className="rounded-xl object-contain"
                  sizes="(max-width: 640px) 48px, (max-width: 768px) 56px, 64px"
                  priority
                />
              </div>

              {/* Label - Responsive text */}
              <p className="
                text-[10px] sm:text-xs md:text-xs 
                text-black font-medium 
                drop-shadow-sm 
                line-clamp-2 
                w-full 
                px-1
                leading-tight
              ">
                {app.name}
              </p>
            </div>
          ))}
        </div>
      </div>


    </div>
  )
}
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
    <div className="flex items-center justify-center min-h-screen bg-transparent">
      <div
        className="
          relative
          w-full
          aspect-[16/10]
          rounded-xl
          overflow-hidden
          shadow-2xl
          border
          border-gray-300
          bg-white bg-opacity-20
          backdrop-brightness-110
        "
        style={{ backdropFilter: "blur(4px)" }}
      >
        {/* Main App Grid */}
        <div className="absolute inset-0 p-8 grid grid-cols-8 grid-rows-5 gap-y-2 gap-x-2 justify-items-center content-center">
          {appIconsData.map((app, index) => (
            <div
              key={index}
              className="flex flex-col items-center justify-center text-center group cursor-pointer"
            >
              <div className="relative w-16 h-16 mb-2 transition-transform duration-200 group-hover:scale-110">
                <Image
                  src={app.url || "/placeholder.svg"}
                  alt={`${app.name} icon`}
                  width={84}
                  height={84}
                  className="rounded-xl"
                />
              </div>
              <p className="text-xs text-black font-medium drop-shadow-sm">{app.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// swift-tools-version:5.7
import PackageDescription

let package = Package(
    name: "SmartyFinderHelper",
    platforms: [
        .macOS(.v12)
    ],
    products: [
        .executable(name: "SmartyFinderHelper", targets: ["SmartyFinderHelper"])
    ],
    dependencies: [
        // lightweight HTTP server
        .package(url: "https://github.com/httpswift/swifter.git", from: "1.5.0")
    ],
    targets: [
        .executableTarget(
            name: "SmartyFinderHelper",
            dependencies: ["Swifter"],
            path: "Sources/SmartyFinderHelper"
        )
    ]
)

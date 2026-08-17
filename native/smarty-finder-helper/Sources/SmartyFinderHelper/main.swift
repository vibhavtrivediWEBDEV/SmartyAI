import Foundation
import AppKit
import Swifter

let server = HttpServer()

server.POST["/choose-file"] = { request in
    // Parse optional operationIds from body
    var opIds: [String] = []
    if let body = request.body, let json = try? JSONSerialization.jsonObject(with: Data(body), options: []) as? [String: Any] {
        if let ids = json["operationIds"] as? [String] {
            opIds = ids
        }
    }

    // Show NSOpenPanel on main thread
    var selectedPath: String? = nil
    let sem = DispatchSemaphore(value: 0)

    DispatchQueue.main.async {
        let panel = NSOpenPanel()
        panel.title = "Select a file for Smarty"
        panel.allowedFileTypes = nil
        panel.allowsMultipleSelection = false
        panel.canChooseDirectories = false
        panel.canChooseFiles = true

        let resp = panel.runModal()
        if resp == .OK {
            if let url = panel.url {
                selectedPath = url.path
            }
        }
        sem.signal()
    }

    // Run a minimal runloop until panel completes
    while sem.wait(timeout: .now() ) != .success {
        RunLoop.current.run(mode: .default, before: Date(timeIntervalSinceNow: 0.01))
    }

    if let path = selectedPath {
        let resp: [String: Any] = ["success": true, "filePath": path, "operationIds": opIds]
        return try! HttpResponse.raw(200, "OK", [:]) { writer in
            let data = try! JSONSerialization.data(withJSONObject: resp, options: [])
            try writer.write(data)
        }
    } else {
        let resp: [String: Any] = ["success": false, "error": "user_cancelled"]
        return try! HttpResponse.raw(200, "OK", [:]) { writer in
            let data = try! JSONSerialization.data(withJSONObject: resp, options: [])
            try writer.write(data)
        }
    }
}

// health endpoint
server.GET["/health"] = { _ in
    let resp: [String: Any] = ["status": "ok"]
    return try! HttpResponse.raw(200, "OK", [:]) { writer in
        let data = try! JSONSerialization.data(withJSONObject: resp, options: [])
        try writer.write(data)
    }
}

let port = 45678
print("Starting SmartyFinderHelper http://127.0.0.1:\(port)/choose-file")
try server.start(in_port_t(port))

// Keep running
RunLoop.main.run()

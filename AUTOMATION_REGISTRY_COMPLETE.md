# Complete Automation Registry Documentation

This document provides a comprehensive list of all automation workflows available in the automation registry, including all target IDs and parameters.

---

## 📋 Table of Contents

1. [Settings Workflows](#settings-workflows)
   - [Wallpaper](#wallpaper-settings)
   - [Appearance](#appearance-settings)
   - [Accessibility](#accessibility-settings)
   - [Dock & Desktop](#dock--desktop-settings)
   - [Display](#display-settings)
   - [Network](#network-settings)
   - [Notifications](#notifications-settings)
   - [Sound](#sound-settings)
   - [Focus](#focus-settings)
   - [Battery](#battery-settings)
   - [Privacy](#privacy-settings)
   - [Control Center](#control-center-settings)
2. [Terminal Workflows](#terminal-workflows)
3. [Dock Workflows](#dock-workflows)
4. [Window Management](#window-management)
5. [Application Workflows](#application-workflows)
6. [Desktop Gestures & Actions](#desktop-gestures--actions)
7. [Voice Actions](#voice-actions)

---

## ⚙️ Settings Workflows

### Wallpaper Settings

#### `settings.wallpaper.change`
**Description:** Search and change wallpaper  
**Parameters:** 
- `prompt` - Wallpaper search query
- `username` - User's name for personalized message
- `wallpaperResultId` - Result to select (default: `new_wallpaper_0`)

**Target IDs:**
- `settings_sidebar_wallpaper` - Wallpaper tab
- `wallpaper_input` - Search input field
- `wallpaper_search_button` - Search button
- `wallpaper_results_container` - Results container
- `new_wallpaper_0` to `new_wallpaper_N` - Wallpaper result buttons

---

#### `settings.wallpaper.search`
**Description:** Search for wallpapers without selecting  
**Parameters:** 
- `query` - Search query

**Target IDs:** Same as above

---

#### `settings.wallpaper.selectResult`
**Description:** Select a specific wallpaper result  
**Parameters:** 
- `wallpaperResultId` - ID of wallpaper to select

---

### Appearance Settings

#### `settings.appearance.toggleDarkMode`
**Description:** Toggle dark mode appearance  
**Target IDs:**
- `settings_sidebar_appearance` - Appearance tab
- `toggle_dark_mode` - Dark mode button

---

#### `settings.appearance.toggleLightMode`
**Description:** Toggle light mode appearance  
**Target IDs:**
- `settings_sidebar_appearance` - Appearance tab
- `toggle_light_mode` - Light mode button

---

#### `settings.appearance.setAccentColor`
**Description:** Set accent/theme color  
**Parameters:**
- `accentColorId` - ID of accent color

**Target IDs:**
- `settings_sidebar_appearance` - Appearance tab
- `accent_color_*` - Individual color buttons

---

#### `settings.appearance.folderColor`
**Description:** Change folder icon color  
**Parameters:**
- `hexColor` - Hex color value

**Target IDs:**
- `folder_color_picker` - Color picker input

---

#### `settings.font.changeSize`
**Description:** Change font size  
**Parameters:**
- `fontSize` - Font size (11-20)

**Target IDs:**
- `font_size_slider` - Font size slider

---

### Accessibility Settings

#### `settings.accessibility.toggleReduceMotion`
**Description:** Toggle reduce motion preference  
**Target IDs:**
- `settings_sidebar_accessibility` - Accessibility tab
- `toggle_reduce_motion` - Reduce motion toggle

---

#### `settings.accessibility.toggleReduceTransparency`
**Description:** Toggle reduce transparency preference  
**Target IDs:**
- `settings_sidebar_accessibility` - Accessibility tab
- `toggle_reduce_transparency` - Reduce transparency toggle

---

#### `settings.accessibility.toggleIncreaseContrast`
**Description:** Toggle increase contrast preference  
**Target IDs:**
- `settings_sidebar_accessibility` - Accessibility tab
- `toggle_increase_contrast` - Increase contrast toggle

---

### Dock & Desktop Settings

#### `settings.dock.setPosition`
**Description:** Set dock position  
**Parameters:**
- `position` - Position value (`bottom` or `right`)

**Target IDs:**
- `settings_sidebar_desktop` - Desktop & Dock tab
- `dock_position_bottom` - Bottom position button
- `dock_position_right` - Right position button

---

#### `settings.dock.setPositionBottom`
**Description:** Move dock to bottom  
**Target IDs:**
- `settings_sidebar_desktop` - Desktop & Dock tab
- `dock_position_bottom` - Bottom position button

---

#### `settings.dock.setPositionRight`
**Description:** Move dock to right side  
**Target IDs:**
- `settings_sidebar_desktop` - Desktop & Dock tab
- `dock_position_right` - Right position button

---

#### `settings.dock.setSize`
**Description:** Set dock size  
**Parameters:**
- `dockSize` - Size value (36-72)

**Target IDs:**
- `dock_size_slider` - Dock size slider

---

#### `settings.dock.toggleMagnification`
**Description:** Toggle dock magnification  
**Target IDs:**
- `toggle_dock_magnification` - Magnification toggle

---

#### `settings.dock.toggleAutoHide`
**Description:** Toggle auto-hide dock  
**Target IDs:**
- `toggle_auto_hide_dock` - Auto-hide toggle

---

### Display Settings

#### `settings.display.setBrightness`
**Description:** Set display brightness  
**Parameters:**
- `brightness` - Brightness level (0-100)

**Target IDs:**
- `brightness_slider` - Brightness slider

---

#### `settings.display.toggleAutomaticBrightness`
**Description:** Toggle automatic brightness  
**Target IDs:**
- `toggle_automatic_brightness` - Auto brightness toggle

---

### Network Settings

#### `settings.network.toggleWifi`
**Description:** Toggle WiFi  
**Target IDs:**
- `settings_sidebar_network` - Network tab
- `toggle_wifi` - WiFi toggle

---

#### `settings.network.toggleBluetooth`
**Description:** Toggle Bluetooth  
**Target IDs:**
- `settings_sidebar_network` - Network tab
- `toggle_bluetooth` - Bluetooth toggle

---

#### `settings.network.connectBluetooth`
**Description:** Open Bluetooth device connection dialog  
**Target IDs:**
- `bluetooth_connect_button` - Connect button

---

#### `settings.network.setSearchEngine`
**Description:** Set preferred search engine  
**Parameters:**
- `engine` - Engine name (Google, Bing, DuckDuckGo)

**Target IDs:**
- `search_engine_select` - Search engine dropdown
- `search_engine_option_*` - Individual engine options

---

### Notifications Settings

#### `settings.notifications.toggleAllow`
**Description:** Toggle notifications  
**Target IDs:**
- `settings_sidebar_notifications` - Notifications tab
- `toggle_notifications` - Notifications toggle

---

#### `settings.notifications.setPreviewMode`
**Description:** Set notification preview mode  
**Parameters:**
- `mode` - Preview mode (Always, When Unlocked, Never)

**Target IDs:**
- `notification_preview_select` - Preview mode dropdown
- `notification_preview_*` - Individual mode options

---

### Sound Settings

#### `settings.sound.setVolume`
**Description:** Set sound volume  
**Parameters:**
- `volume` - Volume level (0-100)

**Target IDs:**
- `sound_volume_slider` - Volume slider

---

#### `settings.sound.toggleMute`
**Description:** Toggle mute  
**Target IDs:**
- `toggle_mute` - Mute toggle

---

#### `settings.sound.toggleInterfaceSounds`
**Description:** Toggle interface sounds  
**Target IDs:**
- `toggle_interface_sounds` - Interface sounds toggle

---

### Focus Settings

#### `settings.focus.toggleFocusMode`
**Description:** Toggle focus mode  
**Target IDs:**
- `settings_sidebar_focus` - Focus tab
- `toggle_focus_mode` - Focus mode toggle

---

### Battery Settings

#### `settings.battery.toggleShowPercentage`
**Description:** Toggle battery percentage in menu bar  
**Target IDs:**
- `settings_sidebar_battery` - Battery tab
- `toggle_battery_percentage` - Show percentage toggle

---

#### `settings.battery.toggleLowPowerMode`
**Description:** Toggle low power mode  
**Target IDs:**
- `toggle_low_power_mode` - Low power mode toggle

---

### Privacy Settings

#### `settings.privacy.toggleLocationServices`
**Description:** Toggle location services  
**Target IDs:**
- `settings_sidebar_privacy` - Privacy tab
- `toggle_location_services` - Location services toggle

---

#### `settings.privacy.toggleAnalyticsSharing`
**Description:** Toggle analytics sharing  
**Target IDs:**
- `toggle_analytics_sharing` - Analytics toggle

---

#### `settings.privacy.toggleAppLock`
**Description:** Toggle app lock feature  
**Target IDs:**
- `toggle_app_lock` - App lock toggle

---

#### `settings.privacy.setAppLockPassword`
**Description:** Set app lock password  
**Parameters:**
- `password` - Lock password (4+ characters)

**Target IDs:**
- `app_lock_password_input` - Password input
- `app_lock_password_save` - Save button

---

### Control Center Settings

#### `settings.control.toggleWifiMenuBar`
**Description:** Toggle WiFi in menu bar  
**Target IDs:**
- `settings_sidebar_control` - Control Center tab
- `toggle_wifi_menu_bar` - WiFi menu bar toggle

---

#### `settings.control.toggleBluetoothMenuBar`
**Description:** Toggle Bluetooth in menu bar  
**Target IDs:**
- `toggle_bluetooth_menu_bar` - Bluetooth menu bar toggle

---

#### `settings.control.toggleBatteryMenuBar`
**Description:** Toggle battery percentage in menu bar  
**Target IDs:**
- `toggle_battery_menu_bar` - Battery menu bar toggle

---

### Settings Utilities

#### `settings.reset`
**Description:** Reset all settings to defaults  
**Target IDs:**
- `reset_settings_button` - Reset button

---

#### `settings.open`
**Description:** Open Settings app

---

#### `settings.close`
**Description:** Close Settings app

---

#### `settings.maximize`
**Description:** Maximize Settings window

---

#### `settings.minimize`
**Description:** Minimize Settings window

---

#### `settings.navigateTo`
**Description:** Navigate to specific settings tab  
**Parameters:**
- `tab` - Tab name to navigate to

**Target IDs:**
- `settings_sidebar_search` - Search input in Settings sidebar

---

## 💻 Terminal Workflows

#### `terminal.open`
**Description:** Open Terminal app

---

#### `terminal.close`
**Description:** Close Terminal app

---

#### `terminal.maximize`
**Description:** Maximize Terminal window

---

#### `terminal.minimize`
**Description:** Minimize Terminal window

---

#### `terminal.executeCommand`
**Description:** Execute a command in Terminal  
**Parameters:**
- `command` - Command to execute

**Target IDs:**
- `terminal_input` - Terminal input field

---

#### `terminal.clear`
**Description:** Clear terminal output  
**Target IDs:**
- `terminal_input` - Terminal input field

---

## 🎯 Dock Workflows

#### `dock.openApp`
**Description:** Open app from dock  
**Parameters:**
- `appName` - App name (Finder, Safari, Terminal, etc.)

**Target IDs:**
- `dock_icon_{{appName}}` - Dock icon for specific app
- `dock_icon_finder` - Finder icon
- `dock_icon_safari` - Safari icon
- `dock_icon_terminal` - Terminal icon
- `dock_icon_vscode` - VSCode icon
- `dock_icon_spotify` - Spotify icon
- `dock_icon_mail` - Mail icon
- And all other apps...

---

#### `dock.show`
**Description:** Show dock (if hidden)  
**Target IDs:**
- `dock_container` - Main dock container

---

#### `dock.hide`
**Description:** Hide dock  
**Target IDs:**
- `desktop_area` - Desktop area (move cursor away from dock)

---

#### `dock.reveal`
**Description:** Animate dock reveal  
**Events:**
- `smarty:dock-reveal` - Custom event to reveal dock

---

#### `dock.toggleGestureMode`
**Description:** Toggle gesture control mode  
**Target IDs:**
- `dock_gesture_toggle` - Gesture mode toggle button

---

## 🪟 Window Management

#### `window.open`
**Description:** Open a window/app  
**Parameters:**
- `appName` - App name to open

---

#### `window.close`
**Description:** Close a window  
**Parameters:**
- `appName` - App name to close

---

#### `window.maximize`
**Description:** Maximize a window  
**Parameters:**
- `appName` - App name to maximize

---

#### `window.minimize`
**Description:** Minimize a window  
**Parameters:**
- `appName` - App name to minimize

---

#### `window.focus`
**Description:** Focus/bring to front a window  
**Parameters:**
- `appName` - App name to focus

---

#### `window.move`
**Description:** Move window to position  
**Parameters:**
- `appName` - App name
- `x` - X coordinate
- `y` - Y coordinate

---

## 📱 Application Workflows

### Finder

#### `finder.open`
**Description:** Open Finder app

---

#### `finder.close`
**Description:** Close Finder app

---

#### `finder.navigateTo`
**Description:** Navigate to folder in Finder  
**Parameters:**
- `folder` - Folder name (Projects, Resume, About, etc.)

**Target IDs:**
- `finder_sidebar_*` - Finder sidebar items

---

### Browser (Safari, Chrome)

#### `browser.open`
**Description:** Open browser app  
**Parameters:**
- `browserName` - Browser name (Safari, chrome)

---

#### `browser.navigate`
**Description:** Navigate to URL in browser  
**Parameters:**
- `browserName` - Browser name
- `url` - URL to navigate to

**Target IDs:**
- `{{browserName}}_url_input` - URL input field

---

#### `browser.search`
**Description:** Search in browser  
**Parameters:**
- `browserName` - Browser name
- `query` - Search query

**Target IDs:**
- `{{browserName}}_search_input` - Search input field

---

### Mail

#### `mail.open`
**Description:** Open Mail app

---

#### `mail.compose`
**Description:** Compose new email  
**Parameters:**
- `recipient` - Email recipient
- `subject` - Email subject
- `body` - Email body

**Target IDs:**
- `mail_compose_button` - Compose button
- `mail_to_input` - To field
- `mail_subject_input` - Subject field
- `mail_body_input` - Body field

---

#### `mail.send`
**Description:** Send composed email  
**Target IDs:**
- `mail_send_button` - Send button

---

### Calendar

#### `calendar.open`
**Description:** Open Calendar app

---

#### `calendar.navigateMonth`
**Description:** Navigate to next/previous month  
**Parameters:**
- `direction` - Direction (next, previous)

**Target IDs:**
- `calendar_next_button` - Next month button
- `calendar_previous_button` - Previous month button

---

### Notes

#### `notes.open`
**Description:** Open Notes app

---

#### `notes.create`
**Description:** Create new note  
**Parameters:**
- `content` - Note content

**Target IDs:**
- `notes_new_button` - New note button
- `notes_editor` - Note editor

---

### Photos

#### `photos.open`
**Description:** Open Photos app

---

### VSCode

#### `vscode.open`
**Description:** Open VSCode

---

#### `vscode.openFile`
**Description:** Open file dialog in VSCode  
**Target IDs:**
- `vscode_file_menu` - File menu
- `vscode_open_file` - Open file option

---

### Figma

#### `figma.open`
**Description:** Open Figma app

---

### Spotify

#### `spotify.open`
**Description:** Open Spotify

---

#### `spotify.play`
**Description:** Play music  
**Target IDs:**
- `spotify_play_button` - Play button

---

#### `spotify.pause`
**Description:** Pause music  
**Target IDs:**
- `spotify_pause_button` - Pause button

---

### YouTube

#### `youtube.open`
**Description:** Open YouTube

---

#### `youtube.search`
**Description:** Search on YouTube  
**Parameters:**
- `query` - Search query

**Target IDs:**
- `youtube_search_input` - Search input

---

## 🖱️ Desktop Gestures & Actions

#### `desktop.screenshot`
**Description:** Take screenshot  
**Events:**
- `smarty:screenshot` - Screenshot event

---

#### `desktop.toggleFullscreen`
**Description:** Toggle fullscreen mode  
**Key Action:**
- `F11` - Fullscreen toggle

---

#### `desktop.openContextMenu`
**Description:** Open context menu  
**Action:** Right-click

---

#### `gesture.pinchMinimize`
**Description:** Pinch gesture to minimize window

---

#### `gesture.pinchMaximize`
**Description:** Pinch gesture to maximize window

---

#### `gesture.swipeLeft`
**Description:** Swipe left gesture

---

#### `gesture.swipeRight`
**Description:** Swipe right gesture

---

## 🎤 Voice Actions

#### `voice.speak`
**Description:** Speak text using TTS  
**Parameters:**
- `text` - Text to speak

---

## 🔧 All Target IDs Reference

### Settings Sidebar IDs
- `settings_sidebar_wallpaper` - Wallpaper tab
- `settings_sidebar_appearance` - Appearance tab
- `settings_sidebar_accessibility` - Accessibility tab
- `settings_sidebar_desktop` - Desktop & Dock tab
- `settings_sidebar_display` - Display tab
- `settings_sidebar_network` - Network tab
- `settings_sidebar_notifications` - Notifications tab
- `settings_sidebar_sound` - Sound tab
- `settings_sidebar_focus` - Focus tab
- `settings_sidebar_battery` - Battery tab
- `settings_sidebar_privacy` - Privacy tab
- `settings_sidebar_control` - Control Center tab
- `settings_sidebar_search` - Settings search

### Wallpaper IDs
- `wallpaper_input` - Search input
- `wallpaper_search_button` - Search button
- `wallpaper_results_container` - Results container
- `new_wallpaper_0` to `new_wallpaper_N` - Result images

### Appearance IDs
- `toggle_dark_mode` - Dark mode button
- `toggle_light_mode` - Light mode button
- `font_size_slider` - Font size control
- `folder_color_picker` - Folder color picker

### Accessibility IDs
- `toggle_reduce_motion` - Reduce motion toggle
- `toggle_reduce_transparency` - Reduce transparency toggle
- `toggle_increase_contrast` - Increase contrast toggle

### Dock IDs
- `dock_position_bottom` - Bottom position
- `dock_position_right` - Right position
- `dock_size_slider` - Size control
- `toggle_dock_magnification` - Magnification toggle
- `toggle_auto_hide_dock` - Auto-hide toggle
- `dock_container` - Main dock
- `dock_icon_*` - Individual app icons
- `dock_gesture_toggle` - Gesture mode button

### Display IDs
- `brightness_slider` - Brightness control
- `toggle_automatic_brightness` - Auto brightness

### Network IDs
- `toggle_wifi` - WiFi toggle
- `toggle_bluetooth` - Bluetooth toggle
- `bluetooth_connect_button` - Connect button
- `search_engine_select` - Engine dropdown

### Terminal IDs
- `terminal_input` - Input field

### App-Specific IDs
- `mail_compose_button` - Mail compose
- `mail_to_input` - Mail recipient
- `mail_subject_input` - Mail subject
- `mail_body_input` - Mail body
- `mail_send_button` - Mail send
- `calendar_next_button` / `calendar_previous_button` - Calendar navigation
- `notes_new_button` - New note
- `notes_editor` - Note editor
- `spotify_play_button` / `spotify_pause_button` - Media controls
- `youtube_search_input` - YouTube search

---

## 📊 Statistics

- **Total Workflows:** 85+
- **Settings Workflows:** 45+
- **Terminal Workflows:** 6
- **Dock Workflows:** 5
- **Window Management:** 6
- **Application Workflows:** 20+
- **Desktop Actions:** 7
- **Voice Actions:** 1

---

## 🎯 Usage Examples

### Example 1: Change Wallpaper
```json
{
  "intent": "settings.wallpaper.change",
  "parameters": {
    "prompt": "mountains sunset",
    "username": "John"
  }
}
```

### Example 2: Set Dock to Right
```json
{
  "intent": "settings.dock.setPositionRight"
}
```

### Example 3: Execute Terminal Command
```json
{
  "intent": "terminal.executeCommand",
  "parameters": {
    "command": "npm run dev"
  }
}
```

### Example 4: Compose Email
```json
{
  "intent": "mail.compose",
  "parameters": {
    "recipient": "user@example.com",
    "subject": "Hello",
    "body": "This is a test email."
  }
}
```

---

## 🔐 Notes

1. **All target IDs** follow a consistent naming pattern
2. **Dynamic parameters** use `{{parameter}}` syntax
3. **Workflow names** follow `<category>.<action>` pattern
4. **All toggle actions** can be used for both on/off states
5. **Slider/setValue actions** use numeric parameters

---

**Generated:** 2026-08-11  
**Version:** 2.0.0  
**Status:** Complete ✅

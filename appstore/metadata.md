# App Store Metadata

## App Name
MeCo AI — Memory Companion

## Subtitle (30 chars max)
Your AI-Powered Personal Memory

## Promotional Text (170 chars)
Never forget again. MeCo AI saves your memories locally and uses AI to help you recall facts, preferences, and commitments instantly.

## Description
MeCo AI is your personal memory companion powered by AI. Save facts, preferences, locations, commitments, and events — then ask questions in natural language to recall them instantly.

**How it works:**
- Type, speak, or snap a photo to save a memory
- Ask questions like "Where did I put my passport?" or "What's Sarah's favorite restaurant?"
- MeCo AI finds the most relevant memories and gives you a clear answer

**Key Features:**
- Local-first: All memories stored on your device, not in the cloud
- Voice notes: Record and transcribe voice memos as memories
- Photo memories: Take a photo and AI extracts the key details
- Smart retrieval: Advanced AI-powered search finds exactly what you need
- Dark mode: Full dark mode support
- Privacy-focused: Your API key, your data, your device

**AI Providers:**
MeCo AI works with OpenAI or Anthropic (Claude). You bring your own API key — your data goes directly to the provider, never through our servers.

**Perfect for:**
- Remembering where you put things
- Tracking people's preferences and facts
- Keeping commitments and promises
- Storing important dates and events
- Quick voice note capture

## Keywords (100 chars max)
memory,ai,remember,notes,voice,recall,personal,assistant,facts,local

## Category
Primary: Productivity
Secondary: Utilities

## Content Rating
4+ (No objectionable content)

## Privacy URL
https://mecoai.app/privacy-policy.html
(or wherever you host the app — the file is at public/privacy-policy.html)

---

## Required Screenshots

### iPhone 6.7" (iPhone 15 Pro Max) — REQUIRED
Size: 1290 x 2796 pixels
Scenes to capture:
1. **Remember mode** — showing the text input with a memory being saved
2. **Ask mode** — showing a question being answered with retrieved memories
3. **Voice recording** — showing the WhatsApp-style recording panel
4. **Memories list** — showing saved memories in the Memories tab
5. **Settings** — showing AI provider configuration

### iPhone 6.5" (iPhone 14 Plus)
Size: 1284 x 2778 pixels
(Same scenes as above)

### iPhone 5.5" (iPhone 8 Plus) — REQUIRED if supporting older devices
Size: 1242 x 2208 pixels

### iPad Pro 12.9" (3rd gen+)
Size: 2048 x 2732 pixels
(Optional but recommended)

---

## How to Capture Screenshots

### Option A: Xcode Simulator (Recommended)
```bash
# 1. Build and run in simulator
npx cap open ios
# Select iPhone 15 Pro Max simulator in Xcode, then Run

# 2. Take screenshots in simulator
# Cmd+S saves a screenshot to Desktop

# 3. Recommended flow:
#    - Open app, type "Remember that my passport is in the bedroom drawer"
#    - Screenshot 1: Remember mode with text
#    - Submit, then switch to Ask mode
#    - Type "Where is my passport?"
#    - Screenshot 2: Ask mode with answer
#    - Tap mic button
#    - Screenshot 3: Voice recording panel
#    - Go to Memories tab
#    - Screenshot 4: Memory list
#    - Go to Settings
#    - Screenshot 5: Settings panel
```

### Option B: Real Device
Connect your iPhone, run the app from Xcode, and use the physical screenshot button (Side + Volume Up).

### Adding Text Overlays (Recommended for App Store)
Use a tool like:
- **Shottr** (free, macOS) — for adding device frames and text
- **Screenshots Pro** — designed for App Store screenshots
- **Figma** — full control over layout

Suggested overlay text per screenshot:
1. "Save any memory instantly"
2. "Ask and recall in seconds"
3. "Voice notes with one tap"
4. "All your memories, organized"
5. "Your keys, your privacy"

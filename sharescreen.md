# implementation-guide-screen-sharing.md

This document details the screen sharing and slide visibility implementation within the Avatar Platform. The system uses a hybrid approach: standard WebRTC screen sharing for general visibility and direct DOM snapshots for high-fidelity slide text analysis.

## 1. Overview

The goal is to allow the AI Avatar to "see" the presentation slides being shown to the student. This is achieved through two mechanisms:
1.  **LiveKit Screen Share**: A standard video track sharing the user's browser tab.
2.  **Data Channel Snapshots**: High-quality base64 image captures of the specific slide element, sent via data packets for clearer text analysis (OCR).

## 2. File Structure

*   **Trigger**: `app/(dashboard)/admin/avatars/page.tsx` - "Test Avatar" button starts the session.
*   **Container**: `app/(dashboard)/lesson/[sessionId]/page.tsx` - Resolves session type and loads `TeachingRoom`.
*   **Logic (Controller)**: `components/lesson/teaching-room.tsx` - Manages LiveKit connection and screen share state.
*   **View (Presentation)**: `components/lesson/slide-viewer.tsx` - Renders the slides and handles DOM content.

## 3. Implementation Code

### A. The Controller (`TeachingRoom`)

Located in `components/lesson/teaching-room.tsx`. This component manages the `useLocalParticipant` hook from LiveKit.

#### Screen Sharing (Video Track)
This function prompts the browser's native media picker. We configure it to prefer the current tab (`selfBrowserSurface: "include"`), effectively sharing the slide area if the user selects the current tab.

```typescript
import { useLocalParticipant } from "@livekit/components-react";

export function TeachingRoom() {
  const { localParticipant, isScreenShareEnabled } = useLocalParticipant();

  // Toggle specific to browser tab sharing
  const toggleScreenShare = useCallback(async () => {
    if (!localParticipant) return;

    try {
      const newState = !isScreenShareEnabled;
      
      // Configuration to encourage sharing the current tab
      await localParticipant.setScreenShareEnabled(newState, {
        audio: false,
        selfBrowserSurface: "include", // Critical: allows sharing current tab
        surfaceSwitching: "include",
        systemAudio: "exclude",
      });

    } catch (error) {
      console.error("[TeachingRoom] Screen share failed:", error);
    }
  }, [localParticipant, isScreenShareEnabled]);

  // Optional: Auto-trigger mechanism for new HTML slides
  useEffect(() => {
    if (useHtmlSlides && !isScreenShareEnabled && !isAutoScreenShareTriggered) {
       // Logic to auto-prompt user after delay
    }
  }, [useHtmlSlides]);
  
  // ...
}
```

#### Slide Snapshots (Data Channel)
For higher quality "vision", we capture the React component as an image and send it directly.

```typescript
// In TeachingRoom.tsx
const handleSlideScreenshot = useCallback(async (imageBase64: string, slideIndex: number) => {
  if (!useHtmlSlides) return;
  
  // Send via LiveKit Data Channel (reliable delivery)
  await publishDataMessage({
    type: "slide_screenshot",
    imageBase64,
    slideIndex,
    timestamp: Date.now(),
  });
}, [publishDataMessage]);
```

### B. The Viewer (`SlideViewer`)

Located in `components/lesson/slide-viewer.tsx`. This component is responsible for displaying content.

```typescript
export function SlideViewer({ 
  // ... props
  renderMode,
  onSlideScreenshot 
}) {
  
  // Trigger capture when slide index changes
  useEffect(() => {
    if (prevIndex !== currentIndex && onSlideScreenshot) {
       // Capture logic (usually via html2canvas or similar inside separate renderer)
       // Calls onSlideScreenshot(base64Data, index)
    }
  }, [currentIndex]);

  return (
    <div className="slide-container">
       {/* Renders HTML or Image slides */}
    </div>
  );
}
```

## 4. Usage Guide

To use this feature in the application:

1.  Navigate to **Avatar Management** (`/admin/avatars`).
2.  Click **"Test Avatar"** on any avatar card.
3.  This opens a new tab (`/lesson/new?avatar=ID`).
4.  Inside the lesson room:
    *   **Manual**: Click the "Share Screen" button in the bottom control bar.
    *   **Browser Prompt**: When the browser asks "Choose what to share", select the **"Chrome Tab"** (or "This Tab") option to share the presentation area specifically.
5.  **Result**: The AI Avatar now receives a video feed of your shared tab + high-res snapshots of slides as they change.

## 5. Dependencies

*   `@livekit/components-react`: For room and participant management.
*   `livekit-client`: For underlying WebRTC and Data Channel types.

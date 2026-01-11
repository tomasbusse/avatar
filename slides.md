# AI Avatar Slide Control System

This document explains how the AI avatar controls the slide presentation and how the bidirectional communication (control vs. vision) works.

## Overview

The system allows the AI avatar to control slides while simultaneously "seeing" them. It functions through a loop:
1. **Avatar Action**: The AI tool calls `next_slide()` or similar tools.
2. **Data Packet**: The backend/agent sends a `material_command` data packet to the client.
3. **Client State**: The React client parses the packet and updates the `currentSlide` state.
4. **Vision Feedback**: When the slide changes, the client captures the new slide image and sends it back to the agent as a `document_image` packet so the AI can "see" the new content.

## Key Logic: `useLessonRoom.ts`

The core logic resides in the `useLessonRoom` hook.

### 1. Teaching Prompt
When the presentation starts, we send a specific system prompt to the AI to define its behavior during the presentation.

```typescript
// Slide teaching prompt for presentation mode
const SLIDE_TEACHING_PROMPT = `
## SLIDE PRESENTATION MODE

You are currently presenting a slide deck to a student. Follow these teaching behaviors:

### For each slide:
1. **Present the content:**
   - Read the slide title clearly
   - Explain the main points in simple, clear language
   - Provide relevant examples or context

2. **Check comprehension:**
   - After explaining each slide, pause and ask: "Do you understand this concept?"
   - Wait for the student's response
   - If they say "yes" or confirm understanding, **immediately call the next_slide() tool** to advance

### Navigation:
- Use your slide control tools (next_slide, previous_slide, goto_slide) to navigate
- Always announce which slide you're moving to: "Let's move to slide 2"
`;
```

### 2. Receiving Commands from Avatar
We listen for data packets from the LiveKit room. If the type is `material_command`, we execute the slide change.

```typescript
// Handle data channel messages (material commands)
const handleDataReceived = useCallback(
  (payload: Uint8Array, participant?: RemoteParticipant) => {
    try {
      const rawMessage = new TextDecoder().decode(payload);
      const message = JSON.parse(rawMessage);

      if (message.type === "material_command") {
        console.log("[useLessonRoom] Material command detected");
        const cmdStr = message.command as string;

        if (cmdStr === "NEXT_SLIDE") {
          handleSlideCommand({ type: "NEXT" });
        } else if (cmdStr === "PREV_SLIDE") {
          handleSlideCommand({ type: "PREVIOUS" });
        } else if (cmdStr.startsWith("SLIDE:")) {
          const slideNum = parseInt(cmdStr.replace("SLIDE:", ""), 10);
          handleSlideCommand({ type: "GOTO", target: slideNum });
        }
      }
      // ... other handlers
    } catch (e) {
      console.error("Error parsing data message:", e);
    }
  },
  [handleSlideCommand]
);
```

### 3. Updating State
This function updates the local state, which triggers a re-render of the UI.

```typescript
const handleSlideCommand = useCallback((command: { type: string; target?: number }) => {
  const prevSlide = currentSlide;
  let newSlide = prevSlide;

  switch (command.type) {
    case "NEXT":
      newSlide = Math.min(prevSlide + 1, totalSlides - 1);
      break;
    case "PREVIOUS":
      newSlide = Math.max(prevSlide - 1, 0);
      break;
    case "GOTO":
      if (typeof command.target === "number") {
        newSlide = Math.max(0, Math.min(command.target - 1, totalSlides - 1));
      }
      break;
  }

  if (newSlide !== prevSlide) {
    setCurrentSlide(newSlide);
  }
}, [currentSlide, totalSlides]);
```

### 4. Sending Vision Back to Avatar
Crucially, whenever `currentSlide` changes (whether by the AI or the user), we look up the image for that slide and send it to the agent. This ensures the AI's "eyes" are always looking at the correct slide.

```typescript
// Send slide image to agent whenever currentSlide changes
useEffect(() => {
  const sendSlideToAgent = async () => {
    if (presentationMode === "active" && slideImages.length > 0 && isConnected && roomRef.current) {
      const slideImage = slideImages[currentSlide];
      
      if (slideImage) {
        // Resize and optimize image before sending to ensure reliability
        // ... (resize logic omitted for brevity) ...

        const message = JSON.stringify({
          type: "document_image",
          image: resizedImage,    // Base64 image data
          page: currentSlide + 1,
          totalPages: totalSlides,
          fileName: sharedMaterial?.name || "presentation"
        });

        // Publish to data channel
        roomRef.current.localParticipant.publishData(
          encoder.encode(message),
          { reliable: true }
        );
      }
    }
  };

  sendSlideToAgent();
}, [currentSlide, presentationMode, slideImages, totalSlides, isConnected]);
```

## UI Rendering: `LessonRoom.tsx`

The UI simply renders the image at `slideImages[currentSlide]`.

```tsx
{documentType === "pptx" && slideImages.length > 0 ? (
  <div className="h-full bg-gray-900 flex flex-col">
    {/* Slide display */}
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="relative max-w-full max-h-full">
        <img
          src={`data:image/png;base64,${slideImages[currentSlide]}`}
          alt={`Slide ${currentSlide + 1}`}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        />
        {/* ... controls overlay ... */}
      </div>
    </div>
  </div>
) : null}
```

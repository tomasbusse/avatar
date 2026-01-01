# Avatar Slide Control System - Implementation Plan

## Overview

The avatar needs to intelligently control slide progression during lessons. Rather than time-based or keyword-based approaches, we'll use **LLM-driven decision making** where the avatar's AI understands the slide content and decides when to advance based on teaching context.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Lesson Session Flow                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Session starts → Load HTML slides into Python agent context │
│                                                                 │
│  2. Avatar receives slide data:                                 │
│     - Current slide index                                       │
│     - Current slide content (parsed from HTML)                  │
│     - Teaching prompt for current slide                         │
│     - Slide type (title, grammar, exercise, etc.)              │
│                                                                 │
│  3. Avatar teaches based on slide content:                      │
│     - Follows teaching prompt                                   │
│     - Responds to student questions                             │
│     - Tracks what's been covered                                │
│                                                                 │
│  4. Avatar decides to change slide when:                        │
│     - Teaching prompt objectives met                            │
│     - Student demonstrates understanding                        │
│     - Exercise completed                                        │
│     - Natural transition point reached                          │
│                                                                 │
│  5. Avatar calls `navigate_slide()` tool                        │
│     → Sends data channel message to frontend                    │
│     → Frontend updates slide                                    │
│     → Agent receives new slide context                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Slide Data Structure (sent to agent at session start)

```python
slides_context = {
    "total_slides": 12,
    "slides": [
        {
            "index": 0,
            "type": "title",
            "title": "Present Perfect Tense",
            "content_summary": "Lesson introduction - B1 level, 30 minutes",
            "teaching_prompt": "Greet the student warmly and provide a brief overview of what they'll learn today.",
            "key_points": ["introduction", "set expectations"],
            "estimated_duration_seconds": 60
        },
        {
            "index": 1,
            "type": "objectives",
            "title": "Learning Objectives",
            "content_summary": "3 objectives: understand formation, usage, practice",
            "teaching_prompt": "Go through each objective and explain what the student will be able to do by the end.",
            "key_points": ["objective 1", "objective 2", "objective 3"],
            "estimated_duration_seconds": 90
        },
        {
            "index": 2,
            "type": "grammar",
            "title": "Present Perfect Formation",
            "content_summary": "have/has + past participle, examples with regular and irregular verbs",
            "teaching_prompt": "Explain the grammar rule step by step. Use the formula to help students remember.",
            "key_points": ["formula: have/has + V3", "regular verbs", "irregular verbs"],
            "estimated_duration_seconds": 180
        },
        {
            "index": 3,
            "type": "exercise",
            "title": "Practice: Fill in the Blanks",
            "content_summary": "4 fill-in-the-blank questions testing present perfect",
            "teaching_prompt": "Guide the student through each exercise item. Provide feedback on answers.",
            "key_points": ["item 1", "item 2", "item 3", "item 4"],
            "exercise_items": 4,
            "estimated_duration_seconds": 240
        }
        // ... more slides
    ]
}
```

### 2. Content Extraction from HTML

We need to parse the HTML slides to extract meaningful content for the LLM:

```python
def extract_slide_content(html_slide: dict) -> dict:
    """Extract teachable content from HTML slide."""
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(html_slide["html"], "html.parser")

    # Extract text content
    text_content = soup.get_text(separator=" ", strip=True)

    # Extract structured elements
    headings = [h.get_text() for h in soup.find_all(["h1", "h2", "h3"])]
    list_items = [li.get_text() for li in soup.find_all("li")]

    return {
        "index": html_slide["index"],
        "type": html_slide["type"],
        "title": html_slide.get("title", headings[0] if headings else ""),
        "text_content": text_content[:500],  # Limit for context size
        "headings": headings,
        "list_items": list_items[:10],  # Key points
        "teaching_prompt": html_slide.get("teachingPrompt", ""),
        "speaker_notes": html_slide.get("speakerNotes", ""),
    }
```

---

## Implementation Steps

### Phase 1: Send Slide Context to Agent

**File: `teaching-room.tsx`**

When HTML slides are loaded, send full slide context to agent via data channel:

```typescript
// When session starts with HTML slides
useEffect(() => {
  if (htmlSlides && htmlSlides.length > 0 && room.state === "connected") {
    publishDataMessage({
      type: "slides_context",
      slides: htmlSlides.map(slide => ({
        index: slide.index,
        type: slide.type,
        title: slide.title,
        teachingPrompt: slide.teachingPrompt,
        speakerNotes: slide.speakerNotes,
        // Don't send full HTML - too large. Agent uses teaching prompts.
      })),
      totalSlides: htmlSlides.length,
    });
  }
}, [htmlSlides, room.state]);
```

### Phase 2: Agent Slide Navigation Tool

**File: `james_agent.py`**

Add a function tool for slide navigation:

```python
@llm.ai_callable(description="Navigate to a different slide in the lesson presentation")
async def navigate_slide(
    self,
    action: Annotated[str, "Action: 'next', 'previous', or 'goto'"],
    slide_number: Annotated[int, "Slide number (1-based) when action is 'goto'"] = None
) -> str:
    """
    Navigate the lesson slides. Use this when:
    - You've finished teaching the current slide content
    - The student is ready to move on
    - You need to go back to review something

    Returns confirmation of the slide change.
    """
    if action == "next":
        new_index = min(self.current_slide_index + 1, self.total_slides - 1)
    elif action == "previous":
        new_index = max(self.current_slide_index - 1, 0)
    elif action == "goto" and slide_number:
        new_index = max(0, min(slide_number - 1, self.total_slides - 1))
    else:
        return "Invalid navigation action"

    # Send slide command to frontend
    await self.send_data_message({
        "type": "slide_command",
        "action": "goto",
        "slideIndex": new_index
    })

    self.current_slide_index = new_index
    current_slide = self.slides_context[new_index]

    return f"Moved to slide {new_index + 1}: {current_slide['title']} ({current_slide['type']})"
```

### Phase 3: System Prompt Integration

Add slide awareness to the avatar's system prompt:

```python
def build_slide_context_prompt(self) -> str:
    """Build context about current slide for system prompt."""
    if not self.slides_context or self.current_slide_index is None:
        return ""

    current = self.slides_context[self.current_slide_index]

    # Get surrounding slides for context
    prev_slide = self.slides_context[self.current_slide_index - 1] if self.current_slide_index > 0 else None
    next_slide = self.slides_context[self.current_slide_index + 1] if self.current_slide_index < len(self.slides_context) - 1 else None

    prompt = f"""
## Current Lesson Slide

You are on slide {self.current_slide_index + 1} of {len(self.slides_context)}.

**Slide Type:** {current['type']}
**Title:** {current['title']}

**Teaching Instructions:**
{current['teaching_prompt']}

**Content to Cover:**
{current.get('speaker_notes', 'See slide content')}

"""

    if next_slide:
        prompt += f"""
**Coming Next:** Slide {self.current_slide_index + 2} - {next_slide['title']} ({next_slide['type']})
"""

    prompt += """
**Slide Navigation Guidelines:**
- Complete the teaching objectives for this slide before moving on
- Use the `navigate_slide` tool when ready to advance
- For exercise slides, ensure student attempts all items before moving on
- You can go back to previous slides if student needs review
- Announce slide transitions naturally: "Let's move on to..." or "Now let's look at..."
"""

    return prompt
```

### Phase 4: Handle Slide Context Message

**File: `james_agent.py`**

```python
async def handle_data_message(self, message: dict):
    """Handle incoming data channel messages."""
    msg_type = message.get("type")

    if msg_type == "slides_context":
        # Store slide context for teaching
        self.slides_context = message.get("slides", [])
        self.total_slides = message.get("totalSlides", 0)
        self.current_slide_index = 0
        logger.info(f"Received {self.total_slides} slides for lesson")

    elif msg_type == "slide_changed":
        # Frontend notified us of slide change (student navigation)
        self.current_slide_index = message.get("slideIndex", 0)
        logger.info(f"Slide changed to {self.current_slide_index + 1}")

    elif msg_type == "slide_screenshot":
        # Store screenshot for vision (existing logic)
        self.current_slide_screenshot = message.get("imageBase64")
```

---

## Slide Type Behaviors

Each slide type has specific teaching behavior:

| Slide Type | Avatar Behavior | Move On When |
|------------|-----------------|--------------|
| `title` | Welcome, introduce topic | After 30-60 seconds |
| `objectives` | Read each objective, explain | All objectives covered |
| `content` | Explain content, check understanding | Key points covered |
| `grammar` | Explain rule, formula, examples | Student can form sentences |
| `vocabulary` | Pronounce, translate, use in sentence | All words covered |
| `exercise` | Guide through each item, give feedback | All items attempted |
| `summary` | Recap key points, celebrate progress | Summary delivered |

---

## Frontend Changes Summary

### `teaching-room.tsx`

1. Send `slides_context` message when HTML slides load
2. Already handles `slide_command` messages from agent
3. Already sends `slide_changed` notifications

### `slide-viewer.tsx`

1. Already supports HTML slides rendering
2. Already has navigation disabled when avatar controls

---

## Agent Changes Summary

### `james_agent.py`

1. Add `slides_context` storage
2. Add `current_slide_index` tracking
3. Add `navigate_slide()` function tool
4. Add `handle_data_message()` for slides_context
5. Modify system prompt to include slide context
6. Update context building to include slide teaching prompts

---

## Testing Checklist

- [ ] HTML slides load in teaching room
- [ ] Slides context sent to agent on session start
- [ ] Agent receives and stores slides context
- [ ] Agent system prompt includes current slide info
- [ ] Agent can call `navigate_slide("next")`
- [ ] Frontend receives slide_command and updates
- [ ] Agent receives slide_changed confirmation
- [ ] Agent naturally transitions between slides
- [ ] Exercise slides wait for student completion
- [ ] Agent can navigate backwards when needed

---

## Future Enhancements

1. **Progress Tracking**: Store which slides/items completed in session
2. **Adaptive Pacing**: Adjust based on student response times
3. **Skip Logic**: Allow skipping mastered content
4. **Bookmarks**: Student can request to revisit specific slides
5. **Analytics**: Track time per slide, completion rates

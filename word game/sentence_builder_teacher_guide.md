# Sentence Builder – Modals, “be” & Verb Chains  
Teacher Guide (Markdown)

## 1. Purpose of the Tool

This drag-and-drop sentence builder is designed to visualise English verb chains as **building blocks**.  
It supports your core message:

> In a normal clause, we only **conjugate one verb** – the first verb in the chain.  
> Everything after that stays in a **non-finite form** (base form, “to” chunk, -ing, or past participle).

The blocks make this visible and manipulable in real time, either in class, in videos, or in online lessons.

---

## 2. Technical Overview

The tool consists of three files:

- `index.html` – the structure and all blocks (subjects, auxiliaries, modals, chunks, main verbs, etc.)
- `style.css` – colours, layout, and styling
- `script.js` – drag-and-drop logic (using SortableJS) and the “double-click to delete” behaviour

### How to run it locally

1. Put all three files in the same folder.
2. Double-click **`index.html`** to open it in your browser (Chrome, Edge, Firefox, Safari).
3. You should see:
   - A **palette** on the left (all the blocks).
   - A **workspace** on the right (where you build sentences).

### How to use it online (screen-sharing)

- In **Zoom/Teams/Meet**, share your browser window with the tool open.
- You drag blocks while students:
  - tell you which blocks to choose,
  - dictate versions of sentences,
  - or correct existing chains.

> Note: In this basic version, **you control the blocks**, students see and direct.

For true multi-user interactivity (students dragging blocks themselves), see section **8**.

---

## 3. Block Categories & Colours

The palette uses a small, consistent set of categories:

- **Subjects** (light blue) – e.g. `I`, `you`, `we`, `they`, `my team`, `the company`
- **Auxiliaries** (light green) – including all forms of **be**:
  - `do, does, did`
  - `am, is, are, was, were`
  - `have, has, had`
  - `be, being, been`
- **Modals** (pale yellow) – `can, could, may, might, will, would, must, should`
- **Main / Chunk verbs** (peach) – both:
  - “Verb + to” chunks: `have to, has to, had to, going to, able to, want to, used to`
  - Base verbs: `deliver, speed up, get up, live, smoke, email, finish, work`
- **Negation** (pink) – `not, never`
- **Objects** (purple) – `it, the delivery, the report, our target`
- **Time / Adverbials** (soft green) – `today, this week, next week, by the end of the week, for three years, already, yet, usually`
- **Connectors** (grey) – `but, because, so`

The legend at the bottom reinforces the colour logic.

---

## 4. Core Grammar Concept

### 4.1 One conjugated verb per clause

You can build a simple visual mantra:

- Point to the **first verb block**:  
  “This is the **only verb we conjugate** in this clause.”
- Point to everything that follows:  
  “These stay in their **basic / non-finite** forms.”

Examples:

- `We` | **`are`** | `going to` | `have to` | `speed up` | `the delivery`.  
- `We` | **`should`** | `be` | `able to` | `deliver` | `this week`.  
- `I` | **`used to`** | `live` | `in China`.  
- `I` | **`did`** | `not` | `use to` | `get up` | `so early`.

### 4.2 Semi-modals as combinations

Instead of treating “semimodals” as a separate magic category, the tool helps you show that they are **combinations**:

- **Future intention / plan**:  
  `be` (conjugated) + `going to` + main verb  
  → `We` | **`are`** | `going to` | `deliver` | `next week`.

- **Ability**:  
  `be` (conjugated) + `able to` + main verb  
  → `We` | **`are`** | `able to` | `deliver` | `by the end of the week`.

- **Obligation**:  
  `have` (conjugated) + `to` + main verb  
  → `We` | **`have to`** | `deliver` | `today`.  
  or with `be` + `going to` + `have to` for “We are going to have to…”

---

## 5. Suggested Lesson Flow (Semimodals / Verb Chains)

### Step 1 – Establish the “one verb” rule

1. Build a very simple chain on screen:
   - `We` | `are` | `working` | `this week`.
2. Ask: “Which verb changes if we go to **past** / **future**?”  
   Show only `are` changing:
   - `We were working this week.`  
   - `We will be working this week.`

Make the rule explicit:
- “We normally **conjugate only one verb** – the first one.  
  Everything else is like Lego attached to it.”

### Step 2 – Introduce “be going to” and “be able to”

Use the blocks:

1. `We` | `are` | `going to` | `deliver` | `this week`.  
2. `We` | `are` | `able to` | `deliver` | `this week`.

Then switch the conjugated verb:

- `We` | `were` | `going to` | `deliver` | `this week`.  
- `We` | `will` | `be` | `able to` | `deliver` | `this week`.

Highlight:
- “Sometimes **be** is conjugated (am/is/are/was/were).”
- “Sometimes **another verb or a modal** is conjugated, and *be* stays in the base form.”

### Step 3 – Stack semimodals

Example: *We are going to have to speed up the delivery.*

Build it step by step:

1. `We` | `are`  
2. `We` | `are` | `going to`  
3. `We` | `are` | `going to` | `have to`  
4. `We` | `are` | `going to` | `have to` | `speed up`  
5. `We` | `are` | `going to` | `have to` | `speed up` | `the delivery`

Ask learners:
- “Which verb is conjugated?” → `are`
- “What would it look like in the past or with a modal?”

Let them decide and you move the blocks:
- `We` | `were` | `going to` | `have to` | `speed up` | `the delivery`.  
- `We` | `will` | `have to` | `speed up` | `the delivery`.  
- `We` | `might` | `have to` | `speed up` | `the delivery`.

### Step 4 – Negative forms

Use:

- `I` | `did` | `not` | `use to` | `get up` | `so early`.

Contrast with:

- `I` | `used to` | `get up` | `so early`.

Let learners physically manipulate:

- Replace `did` with `do` / `does` and build questions / present forms (if you extend later).

---

## 6. Classroom / Online Activities

### 6.1 “Build what I say”

You say a sentence; students tell you:

- which subject,
- which first verb,
- which chunks.

You drag and build while thinking aloud:
> “What’s our first verb? Is it conjugated already? Do we need **be** in the base form after a modal?”

### 6.2 “Fix the chain”

You deliberately create **wrong chains**, e.g.:

- `We` | `are` | `can` | `deliver` | `this week`.  
- `We` | `will` | `are` | `able to` | `deliver` | `this week`.

Ask students to fix them by instructing you which blocks to remove/replace.  
You double-click to delete, then drag in the correct blocks.

### 6.3 “From German to blocks to English”

Students give you a German prompt, e.g.:

- *“Wir sollten diese Woche liefern können.”*

Together, you *first* build the chain in blocks:

- `We` | `should` | `be` | `able to` | `deliver` | `this week`.

Only then do you read out the final English sentence.

---

## 7. Adapting the Tool for Other Topics

Once you are comfortable, you can create **variants**:

- **Questions & inversion**  
  Add blocks like:
  - `?`  
  - `Wh-` words: `why`, `when`, `where`, `how`  
  And show how the first verb jumps before the subject.

- **Passive voice**  
  Add:
  - `by` (agent phrase)  
  - more past participles: `delivered`, `finished`, `paid`, `informed`  
  Then build chains like:
  - `The report` | `has` | `been` | `finished` | `already`.

- **Continuous & perfect aspect**  
  Extend with more -ing forms and participles to show:
  - `We` | `have` | `been` | `working` | `for three years`.  
  - `It` | `is` | `being` | `tested` | `this week`.

Each new topic is just a matter of adding a few blocks.

---

## 8. Making It Truly Interactive for Multiple Students

The basic version you have is **single-user**: the browser running the file owns the blocks.

To let **2+ students** interact *simultaneously* (e.g. in an online lesson), you have three realistic options:

### 8.1 Easiest (no extra coding): Collaborative Whiteboard

Use a tool like:

- Miro  
- Figma (design file, not prototype)  
- Canva whiteboard  
- Zoom / Teams whiteboard

You:

1. Recreate the blocks as coloured rectangles/text boxes.
2. Share the board link with students.
3. Everyone can drag and drop blocks in real time.

This gives you the **multi-user interactivity** with minimal technical overhead, at the cost of losing the nice “clone-on-drag” behaviour of the web app.

### 8.2 Intermediate: You control, students direct

Keep the current tool as-is:

- You share your screen.
- Students tell you what to do:
  - “Drag **should** in front of **be able to**.”
  - “Delete **are** and use **were** instead.”

It’s **not fully multi-user**, but still highly interactive as a teaching sequence and keeps your tidy block design.

### 8.3 Advanced (developer route): Real-time web app

To allow multiple people to drag the **same blocks in the same space**, you would need:

- A hosted version of the tool (e.g. Replit, Glitch, or a simple web server).
- A real-time backend (e.g. Firebase Realtime Database, Supabase, or Socket.IO) to:
  - store the current “workspace” state,
  - broadcast every drag/drop event to all connected users.

This is very doable, but it:

- needs some JavaScript coding beyond this simple static version,
- needs a hosting platform and possibly an account for the backend service.

For many teaching situations, **Option 8.1** (Miro/Figma board with blocks) is the most pragmatic:  
you still get colour-coded, draggable blocks, and learners can move them in real time.

---

## 9. Summary for You as Teacher

- Use the tool to **make verb chains visible** and **tangible**.
- Keep hammering the rule: **only one verb is conjugated**.
- Use the blocks to:
  - build, break, and rebuild sentences,
  - contrast correct vs incorrect chains,
  - show how “semimodals” are built from auxiliaries + chunks.

You can also:

- record your screen while using the tool to create **video content**,  
- or use it live in online lessons with students directing what you do.

If you’d like, we can now:
- design a **script for a specific video** (“We need to talk about semimodals”), or
- build a **second block set** focused on questions / negatives / passive.

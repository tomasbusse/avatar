# AI Coder Instructions – Collaborative Sentence Builder

## 0. Context / Goal

We currently have a **static drag-and-drop “Sentence Builder”** built with:

- `index.html` – HTML structure and all blocks
- `style.css` – visual styling
- `script.js` – drag-and-drop behaviour using **SortableJS**

The tool visualises English sentence structure as **blocks** (subjects, auxiliaries, modals, “have to”, “going to”, main verbs, time phrases, etc.), and allows a **single user** to drag blocks from a palette into a workspace to build verb chains.

The next step is to turn this into a tool that can be used in **online lessons** so that **multiple students can interact at the same time**, i.e.:

- Several users can drag and drop blocks in the same shared workspace.
- All users see changes in **real time**.

You are an AI coder whose job is to **extend / refactor the existing code** into a simple, robust, collaborative web app.

---

## 1. Current Behaviour (What Already Works)

### 1.1 Basic UI

- Left column: a **palette** with blocks grouped by category:
  - Subjects
  - Auxiliaries (including all forms of “be”)
  - Modals
  - “Verb + to” chunks (e.g. `have to`, `going to`)
  - Main verbs (base form)
  - Negation
  - Objects
  - Time / adverbials
  - Connectors
- Right column: a **workspace** where blocks are dropped to build sentences.
- Bottom: a **legend** that explains the colour categories.

### 1.2 Interactions

- Blocks in the palette:
  - Are draggable.
  - When dragged into the workspace, they are **cloned** (palette entries are not removed).
- Blocks in the workspace:
  - Can be reordered via drag-and-drop.
  - Can be **deleted with a double-click**.
- The drag-and-drop logic is handled via **SortableJS**:
  - One instance for the palette (`pull: "clone"`, `put: false`).
  - One instance for the workspace (`sort: true`).

### 1.3 Tech Stack

- Pure front-end:
  - HTML
  - CSS
  - JavaScript (vanilla + SortableJS)
- No build tools, no bundlers, no frameworks.
- The app can be opened locally via `index.html` in a browser.

---

## 2. New Requirements (What Needs to Be Built)

We now want a **collaborative version** where **multiple users can work in the same workspace** from different devices/browsers, in near-real-time.

### 2.1 Functional Requirements

1. **Shared Workspace State**
   - There is conceptually **one workspace “board”** per URL/room.
   - All connected users see the **same set of blocks** in the workspace, in the same order.

2. **Real-Time Updates**
   - When any user:
     - drags a block from the palette to the workspace,
     - reorders blocks in the workspace,
     - deletes a block (double-click),
   - then all connected users should see this change **within ~1 second**.

3. **Palette Behaviour**
   - The palette remains **local and static**:
     - Palette blocks **are not shared state**.
     - Palette content is replicated across clients (simplest: hardcoded in HTML as now).
   - Only the **workspace** (and possibly the set of blocks instantiated in it) needs to be synchronised.

4. **No Authentication Required**
   - We do **not** need user accounts at this stage.
   - A simple anonymous “room” is sufficient (e.g. join via URL).

5. **Room Model (Optional but Preferred)**
   - Ideally, we can support different rooms for different classes:
     - e.g. `/room/abc123`, `/room/clientA`, `/room/B2group`.
   - All users visiting the same room URL share the same workspace state.

### 2.2 Non-Functional Requirements

- Maintain a **simple developer experience**:
  - Avoid complex build chains if possible.
  - Keep the stack approachable (teacher is non-developer).
- Keep the **existing UI and UX** as intact as possible:
  - Same colours, layout, and block text.
  - Same interactions (drag from palette, reorder, double-click delete).
- Code should be commented and structured in a way that:
  - Another AI assistant or a human teacher can later adapt it.

---

## 3. Proposed Architecture

You may choose any **sensible, minimal** architecture that satisfies this. Two main options:

### Option A – Firebase Realtime Database (recommended for simplicity)

- Front-end: the existing HTML/CSS/JS.
- Backend: **Firebase Realtime Database** (or Firestore) used as a simple shared state store.

#### Data Model (Conceptual)

- `rooms/{roomId}/workspace`:
  - An **ordered array** of block objects:
    ```json
    [
      {
        "id": "block-1",
        "text": "We",
        "category": "subject"
      },
      {
        "id": "block-2",
        "text": "are",
        "category": "aux"
      },
      {
        "id": "block-3",
        "text": "going to",
        "category": "main"
      }
    ]
    ```
  - `id`: unique per block instance in the workspace.
  - `text`: display text, identical to current block innerText.
  - `category`: CSS/category class (e.g. `"subject"`, `"aux"`, `"modal"`, `"main"`, `"negation"`, `"time"`, `"object"`, `"connector"`).

#### Sync Logic

- On page load:
  - Determine `roomId` from URL (e.g. `/room/abc` → `abc`).
  - Subscribe to `rooms/{roomId}/workspace`.
  - Render the workspace from the current value.
- On drag/drop changes (Sortables events):
  - Instead of directly manipulating the DOM in isolation, update the shared array in the database.
  - The listener updates the DOM in response to the shared state.

- On double-click delete:
  - Remove the corresponding block object from the array in the database.

### Option B – Node.js + Socket.IO

- Back-end:
  - A small Node.js server with Socket.IO.
  - Maintains in-memory state per room (or persisted if needed).
- Front-end:
  - On connection, join a Socket.IO room.
  - Emit events:
    - `addBlock`, `moveBlock`, `removeBlock`.
  - Receive events to update DOM.

Option B is fine, but Option A (Firebase) will be easier to host and reason about for a non-developer.

---

## 4. Implementation Tasks (Step-by-Step)

### 4.1 Refactor Front-End State Handling

Right now, the workspace is “dumb”: the DOM is the state.

You need to introduce a **layer of JS state** that:

- Represents the workspace as an array of block objects (see data model above).
- Can:
  - render this state into the DOM,
  - re-generate this state from the DOM when the user drags things.

**Tasks:**

1. Create a JS representation, e.g.:
   ```js
   let workspaceBlocks = [];
   ```
2. Whenever the user drops a block from the palette:
   - Create a new block object with:
     - unique `id` (e.g. `Date.now()` + random suffix),
     - `text` from the block,
     - `category` from the block’s CSS class.
   - Push it into `workspaceBlocks` at the correct index.
3. Whenever the user reorders blocks:
   - Update the `workspaceBlocks` array to match the new order.
4. Whenever a block is deleted:
   - Remove it from `workspaceBlocks`.

5. Write a renderer function:
   ```js
   function renderWorkspace(blocks) {
     // Clear workspace DOM and rebuild it from `blocks`
   }
   ```

This state refactor is necessary even in the non-collaborative version; it then becomes trivial to sync this array with a backend.

### 4.2 Integrate Real-Time Backend

Pick **Firebase** (or Socket.IO).

#### With Firebase:

1. Add Firebase SDK to `index.html` or via a separate JS file.
2. Initialise the app with config (to be filled in by human later).
3. Implement a function:
   ```js
   function saveWorkspace(roomId, blocks) {
     // Write blocks array to Firebase at rooms/{roomId}/workspace
   }
   ```
4. Implement a real-time listener:
   ```js
   function subscribeToWorkspace(roomId, callback) {
     // callback receives updated blocks array whenever it changes
   }
   ```
5. Hook these into:
   - `workspaceBlocks` updates (drag / drop / delete) → `saveWorkspace`.
   - `subscribeToWorkspace` → `renderWorkspace`.

6. Prevent infinite loops:
   - Use a simple strategy (e.g. only write when the change originates from local drag/drop, or ignore updates that mirror the current local state).

### 4.3 Room Handling

1. Add a basic room resolver:
   - If the URL path includes `/room/:roomId`, use that.
   - Otherwise, default to e.g. `"default"`.

2. Optionally:
   - Show the roomId somewhere on the UI (e.g. in the header).
   - Provide a copyable link for the teacher to share with students.

### 4.4 Keep Existing UX

Important:

- **Do not change** the visual look of blocks unless necessary.
- Keep:
  - palette groups and labels,
  - colours (CSS classes),
  - double-click delete behaviour.

Only add the minimum necessary DOM attributes (e.g. `data-id`) to support the state syncing.

---

## 5. Code Quality & Structure

- Keep files as:
  - `index.html`
  - `style.css`
  - `script.js`
- Avoid transpilers or frameworks:
  - No React, no Vue, no bundlers.
- Use modern but vanilla JS:
  - `const`, `let`, arrow functions where convenient.
- Add comments that explain:
  - Where the shared state lives.
  - How drag/drop events feed into the shared state.
  - How the backend sync is wired.

---

## 6. Testing & Edge Cases

- Handle the case where:
  - Two users drag blocks “at the same time”.
  - One user deletes a block while another is moving it.
- A simple last-write-wins approach is acceptable.
- Ensure:
  - No duplicate IDs in the workspace.
  - The app remains usable even if the backend fails (e.g. show an error but still allow local play).

---

## 7. Deliverables

You should produce:

1. Updated `index.html`:
   - Includes necessary script imports for Firebase or Socket.IO.
   - May include roomId logic (e.g. reading from URL).

2. Updated `script.js`:
   - Maintains the drag-drop logic.
   - Adds workspace state management.
   - Adds real-time sync logic.

3. Any configuration comments / TODOs in the code:
   - e.g. “Insert your Firebase config here”.
   - Explanation of how to deploy/run (short, in comments).

4. A short note (e.g. in comments at top of `script.js`) summarising:
   - What changed.
   - How to switch between local-only and collaborative modes (if relevant).

---

## 8. Stretch Goals (Optional)

If basic collaboration works and you want to extend:

- Add a small **“Reset workspace”** button that clears all blocks (with confirmation).
- Add a “Save preset” / “Load preset” feature:
  - e.g. store named layouts for different lessons.
- Provide a **“Read-only” mode**:
  - e.g. for recording videos, teacher can lock the workspace to avoid accidental edits.

---

## 9. Summary for AI Coder

Your main mission:

- **Keep the tool’s simplicity and visual grammar logic.**
- **Add a thin layer of shared state + real-time sync** so multiple users in the same room can see and manipulate the same blocks.

Prefer minimal dependencies, clean vanilla JS, and code that a non-developer could still recognise and adjust with the help of another AI.


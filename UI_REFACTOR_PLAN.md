# UI Refactor Plan

## Goal

Refactor the extension UI so it works directly with the LLM site's native chat box instead of a floating sidebar.

Target experience:

- The user types only in the host site's chat box.
- The extension renders a compact inline toolbar above the chat box.
- The toolbar shows comedian selectors as simple badges using short names or initials.
- Clicking `Apply Prompt` rewrites the contents of the host site's chat box using the selected comedian.
- No floating sidebar.
- No modal.
- No separate scenario field in the extension UI.

## Product Direction

The extension should feel like a lightweight composer companion, not a separate app layered on top of the page.

Desired flow:

1. User types into ChatGPT, Claude, or Grok's native chat box.
2. User selects a comedian badge above that input.
3. User clicks `Apply Prompt`.
4. The extension rewrites the existing contents of that same chat box.

## Scope

### In Scope

- Inline toolbar mounted near the host composer
- Comedian badges using simple labels
- Selected voice state
- Premium lock state in the badge row
- Rewriting the existing host chat input contents
- Theme compatibility with supported hosts
- Cleanup of obsolete sidebar and modal code

### Out of Scope For This Refactor

- Floating / draggable panel behavior
- Separate scenario entry fields
- Complex avatar artwork
- New prompt-building behavior beyond what is needed for the inline flow

## Implementation Plan

### 1. Define Inline Toolbar Layout

Build a compact toolbar designed to sit directly above the host composer.

Suggested structure:

- badge row for comedian selection
- primary action button: `Apply Prompt`
- secondary action: `Unlock` when relevant
- lightweight status text if needed

Requirements:

- must remain compact on narrow composer widths
- must feel integrated with the host composer
- must not obscure the host UI

### 2. Split Input Detection From Mount Detection

The code currently focuses on finding an editable input. The refactor should separate:

- finding the active editable chat box
- finding the best DOM mount target near that chat box

This likely belongs in `src/content/adapters.ts`.

Suggested responsibilities:

- `getActiveInput()` or equivalent: returns the editable target
- `findComposerMountTarget()` or equivalent: returns a stable DOM node where the toolbar should mount

### 3. Replace Floating Root Mounting

The current extension is mounted as a fixed overlay from `src/content/main.tsx`.

Refactor this so the app mounts near the detected composer instead of at the document root as a floating panel.

Requirements:

- handle SPA navigation
- handle host composer re-renders
- recover if the host DOM replaces the mount target
- avoid duplicate mounts

### 4. Refactor `App.tsx` Around Inline State

Simplify the React app to match the new UI model.

Keep:

- selected comedian / voice
- premium status
- status messaging

Remove:

- open / closed panel state
- drag state
- modal state
- help overlay state
- floating panel sizing logic
- panel positioning logic

Default behavior:

- select the free comedian by default so the toolbar is immediately usable

### 5. Update Voice Metadata For Badge Rendering

Extend `src/content/templates.ts` with the minimal presentation metadata needed for badge rendering.

Possible additions:

- `badgeLabel`
- `shortLabel`
- optional visual variant field if useful

Keep prompt-building behavior separate from display metadata.

### 6. Rework Prompt Application Flow

`Apply Prompt` should:

1. Read the current contents of the host site's active chat box.
2. Validate that there is content to transform.
3. Build the rewritten prompt using the selected comedian.
4. Write the result back into that same host chat box.

Error handling should be clear for:

- no active input found
- empty input
- write failures or host-specific editor issues

### 7. Rebuild Styles For Inline Use

Replace the current floating-panel styling in `src/content/styles.css` with a compact inline toolbar design.

Requirements:

- small vertical footprint
- works on desktop and narrower widths
- selected badge state is obvious
- locked badge state is obvious
- adapts reasonably to host light/dark themes

### 8. Keep Premium Behavior Inline

Premium behavior should remain visible and understandable from the badge row.

Rules:

- free comedian is always selectable
- paid comedians show as locked when `!isPremium`
- clicking a locked comedian should offer inline unlock behavior

Before release:

- remove any temporary unlock overrides
- verify only the intended free comedian is available in unpaid state

### 9. Clean Up Dead Code

This is an explicit workstream, not an afterthought.

Expected cleanup areas:

- floating sidebar shell
- closed-tab UI
- drag handlers and drag helper types
- panel sizing helpers
- panel position state and viewport clamping
- modal rendering and modal state
- help overlay rendering and help state
- scenario-field-specific logic that only existed for the modal flow
- obsolete CSS selectors tied to the old sidebar / modal design
- obsolete template helpers if no longer used

Likely candidates for removal if unused after refactor:

- `getModalConfig`
- `buildModalInput`
- modal-related types in `src/content/templates.ts`

### 10. Verify By Host

Test the new inline toolbar on each supported host:

- ChatGPT
- Claude
- Grok

Verify:

- toolbar mounts in the right location
- toolbar survives navigation and thread changes
- badge selection works
- locked states work
- `Apply Prompt` rewrites the host input correctly
- theme appearance is acceptable in light and dark modes

## File Areas Expected To Change

- `src/content/main.tsx`
- `src/content/App.tsx`
- `src/content/adapters.ts`
- `src/content/styles.css`
- `src/content/templates.ts`

## Risks

### Host DOM Variability

ChatGPT, Claude, and Grok all structure their composer areas differently and may change DOM structure over time.

Impact:

- mount target logic may need host-specific handling
- remount logic must be resilient

### Re-render / Navigation Instability

Single-page app navigation may replace the composer node after mount.

Impact:

- toolbar may disappear or detach unless remount logic is robust

### Overlapping Old And New UI Paths

Keeping sidebar and inline systems alive at the same time would increase complexity and cleanup cost.

Recommendation:

- fully commit to the inline model for this refactor

## Recommended Execution Order

1. Add composer mount-target detection.
2. Refactor content-script mounting.
3. Rewrite `App.tsx` around the inline toolbar model.
4. Update template metadata for badge rendering.
5. Replace old CSS with inline toolbar styles.
6. Perform a dedicated dead-code cleanup pass.
7. Verify on all supported hosts and premium states.

## Definition Of Done

The refactor is complete when:

- the extension mounts above the host chat box instead of as a floating sidebar
- comedian selection happens through inline badges
- `Apply Prompt` rewrites the host chat box contents
- no modal or separate scenario field remains
- obsolete sidebar/modal code has been removed
- all supported hosts still work

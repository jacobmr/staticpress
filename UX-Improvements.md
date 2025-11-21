# UX Improvements: StaticPress Editor

**Goal:** Elevate the writing experience to match the "My mom could use this" mantra while providing modern, premium features expected by writers coming from Medium, Notion, or Ghost.

## 1. Core Editor Experience (The "Wow" Factor)

The current editor is functional but feels like a standard form. We need to make it feel like a *writing canvas*.

### 1.1 Bubble Menu (Contextual Formatting)
*   **Problem:** Users have to move their mouse up to the toolbar to format text, breaking flow.
*   **Solution:** Implement a floating "Bubble Menu" that appears when text is selected.
*   **Items:** Bold, Italic, Link, H2, H3.
*   **Implementation:** Use TipTap's `BubbleMenu` extension.

### 1.2 Slash Commands ("/")
*   **Problem:** Inserting blocks (images, lists, headers) requires finding the button in the toolbar.
*   **Solution:** Implement "Slash Commands". Typing `/` opens a popup menu to insert blocks.
*   **Items:** Heading 1/2/3, Bullet List, Numbered List, Image, Blockquote, Code Block, Horizontal Rule.
*   **Implementation:** Use `tiptap-extension-slash-command` (or build custom suggestion utility).

### 1.3 Distraction-Free Mode
*   **Problem:** The sidebar and header are always visible, cluttering the writing space.
*   **Solution:** Add a "Focus Mode" toggle.
    *   **Action:** Collapses the sidebar and hides the top header.
    *   **Result:** The editor becomes the center of the screen, max-width constrained for readability (e.g., `prose-lg`).

### 1.4 Floating/Sticky Toolbar
*   **Problem:** The toolbar scrolls away on long posts.
*   **Solution:** Make the main toolbar sticky at the top of the editor container, or replace it entirely with the Bubble Menu + Slash Commands for a cleaner look (keeping a minimal fixed toolbar for mobile).

## 2. Visual Polish & Feedback

### 2.1 Typography & Spacing
*   **Recommendation:** Ensure specific `prose` classes are used for a premium feel.
    *   Larger base font size (18px or `text-lg`).
    *   Relaxed line height.
    *   Distinctive heading fonts (if possible within design system).

### 2.2 Image Handling
*   **Current:** Basic insertion.
*   **Improvement:**
    *   **Loading State:** Show a skeleton or blurhash while uploading.
    *   **Captions:** Allow users to add captions to images (standard in Hugo/Medium).
    *   **Resizing:** Simple handle to resize images (optional, but nice).

### 2.3 Auto-Save & Status
*   **Current:** "Saving..." text.
*   **Improvement:** A subtle status indicator in the top right (e.g., "Saved", "Saving...", "Unsaved changes").

## 3. Metadata & Publishing Flow

### 3.1 Title Integration
*   **Current:** Title is a separate input field outside the editor.
*   **Improvement:** Style the Title input to look like the document title (H1), seamlessly integrated above the editor content, rather than a form field.

### 3.2 Publishing "Ceremony"
*   **Current:** Simple button click.
*   **Improvement:** When clicking "Publish":
    *   Show a small modal or popover:
        *   Confirm visibility (Public).
        *   Allow setting a "Featured Image" (if supported).
        *   Allow editing URL slug (advanced, but useful).
    *   **Success:** Confetti or a nice success animation before redirecting or showing the link.

## 4. Dashboard Integration

### 4.1 Mobile Experience
*   **Problem:** Sidebar takes up space on mobile.
*   **Solution:** Ensure sidebar is a drawer (hamburger menu) on mobile, defaulting to the editor view if a post is selected.

## Implementation Priorities

1.  **High Impact / Low Effort:**
    *   Bubble Menu.
    *   Sticky Toolbar.
    *   Title Field Styling.
2.  **High Impact / Medium Effort:**
    *   Slash Commands.
    *   Focus Mode.
3.  **Nice to Have:**
    *   Publishing Modal.
    *   Image Captions.

## Technical Notes for Developer
*   **Library:** Continue using `@tiptap/react`.
*   **Extensions:**
    *   `@tiptap/extension-bubble-menu`
    *   `@tiptap/extension-floating-menu` (optional)
    *   Custom Slash Command extension (many open-source examples available).
*   **Styling:** Use `shadcn/ui` components if available, or stick to Tailwind.

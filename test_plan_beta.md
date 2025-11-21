# Public Beta Test Plan

## Overview
**Objective:** Verify readiness for Public Beta launch.
**Scope:** Core user flows, new features (Image Upload, Feedback), and critical edge cases.
**Tester:** Quince (QA Agent)

## 1. Golden Path (The "Happy Path")
**Goal:** Ensure a new user can sign up, upgrade, and publish a post with an image.

1.  **Sign Up & Onboarding**
    *   [ ] Sign in with GitHub.
    *   [ ] Verify "Empty State" is shown on Dashboard.
    *   [ ] Click "Create New Post" from Empty State.

2.  **Upgrade to Personal**
    *   [ ] Click "Upgrade" button.
    *   [ ] Select "Personal (Monthly)" plan.
    *   [ ] Complete purchase using Stripe Test Card (4242...).
    *   [ ] Verify redirection back to Dashboard.
    *   [ ] Verify "Personal" badge is visible.

3.  **Content Creation & Image Upload**
    *   [ ] Create a new post titled "Beta Test Post".
    *   [ ] Type some content.
    *   [ ] **Image Upload:**
        *   [ ] Click Image icon in toolbar.
        *   [ ] Select a valid image (JPG/PNG, < 5MB).
        *   [ ] Verify image appears in editor.
        *   [ ] Verify image is uploaded to GitHub (check repo if possible, or rely on no error).
    *   [ ] **Mobile Check:** Resize browser to mobile width. Ensure editor is usable.

4.  **Publishing**
    *   [ ] Click "Publish".
    *   [ ] Verify success message.
    *   [ ] Verify post appears in list.

5.  **Feedback**
    *   [ ] Click "Feedback" button (bottom right).
    *   [ ] Submit a "Feature Request".
    *   [ ] Verify success message.

## 2. Edge Cases & Error Handling
**Goal:** Ensure the system handles failures gracefully.

1.  **Image Upload Failures**
    *   [ ] Try to upload a non-image file (e.g., PDF). -> Expect error alert.
    *   [ ] Try to upload a file > 5MB. -> Expect error alert.
    *   [ ] (Free Tier) Try to upload image without upgrading. -> Expect upgrade prompt or error.

2.  **GitHub Integration**
    *   [ ] (Manual) Revoke GitHub access token in GitHub settings.
    *   [ ] Try to publish a post. -> Expect re-auth prompt or clear error.

3.  **Network Issues**
    *   [ ] Simulate offline mode (devtools).
    *   [ ] Try to save draft. -> Expect error message.

## 3. Mobile Responsiveness
**Goal:** "My mom could use this" on her iPad/Phone.

1.  **Dashboard**
    *   [ ] Verify Post List is readable on mobile.
    *   [ ] Verify "Create Post" button is accessible.

2.  **Editor**
    *   [ ] Verify Toolbar wraps correctly or scrolls.
    *   [ ] Verify writing area has correct padding.
    *   [ ] Verify "Publish" button is visible without scrolling too much.

## 4. Verification Status
*   [ ] Build Passing: YES
*   [ ] Linting Passing: YES
*   [ ] Manual Verification: PENDING (User to perform)

## Next Steps
1.  User to perform manual verification using this plan.
2.  Report any critical bugs via the new Feedback widget!

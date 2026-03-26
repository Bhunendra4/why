# Why

## Current State
New project, no existing application.

## Requested Changes (Diff)

### Add
- Single-page app that persists one image via blob-storage
- On first open: centered upload button to choose an image
- After upload: the image fills the screen on every subsequent open
- A subtle replace/change button visible on hover when an image exists

### Modify
- N/A

### Remove
- N/A

## Implementation Plan
- Backend: store a single blob (the uploaded image) with a fixed key; expose upload and retrieve endpoints
- Frontend: on load, fetch the stored image; if none, show upload UI; if found, display it full-screen
- Use blob-storage component for persistence

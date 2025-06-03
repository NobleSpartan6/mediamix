# MediaMix

This repo contains the MediaMix prototype web editor. The project is managed with Yarn workspaces and the primary app lives in `apps/web`.

## Getting started

```bash
# install dependencies
yarn install

# start the development server
yarn dev

# run the test suite
yarn test
```

The `yarn lint` and `yarn test` commands are defined in the root `package.json` and run the workspace scripts.

## Importing the sample video

With the dev server running, open your browser to `http://localhost:5173`. Use the **Import Video** button and choose `/test-assets/test-video.mp4` from the file picker. The clip will appear on the timeline once processing completes.

## Timeline features

- **Drag and trim clips** – clips can be moved along the timeline and resized from either edge. Snapping helps align edits to beats and neighbouring clips.
- **Global snapping** – clip edges also snap to clips on other tracks and to the current playhead position for easy alignment.
- **Zoomable view** – scroll or pinch while holding <kbd>Ctrl</kbd> to zoom, or use the zoom slider. The timeline can also be panned by dragging.
- **Keyboard shortcuts** – J, K and L shuttle playback; the arrow keys jog the playhead; press **I** and **O** to set in/out points; press **C** to cut the clip under the playhead.


# Performance Testing Guide for Motif

This document outlines the approach for testing and ensuring that the Motif video editor meets the performance requirements specified in the PRD, with particular focus on the timeline interaction requirement of **≥50fps**.

## Key Performance Indicators (KPIs)

As defined in the PRD, we need to meet the following performance metrics:

1. **Timeline Interaction**: 4-layer timeline drag operations must maintain ≥50fps in Chrome FPS meter
2. **Export Performance**: 60s 4K → 1080p MP4 in ≤2× realtime on Apple Silicon, ≤3× realtime on Intel i7
3. **Memory Usage**: Peak RAM ≤1.2GB during 30s export (measured via DevTools Allocation)

This guide focuses primarily on the first KPI (timeline interaction performance).

## Timeline Performance Testing Tools

### Chrome DevTools Performance Panel

The primary tool for measuring timeline interaction performance:

1. Open Chrome DevTools (F12 or Cmd+Option+I)
2. Navigate to the Performance tab
3. Click the gear icon to configure settings:
   - Enable "Screenshots"
   - CPU throttling: "No throttling" (for baseline) or "4x slowdown" (for stress testing)
4. Click "Start profiling and reload page"
5. Perform timeline interactions (dragging clips, resizing)
6. Click "Stop"
7. Analyze the results, focusing on:
   - FPS chart (should maintain ≥50fps)
   - Main thread activity
   - Rendering events

### FPS Meter (Chrome)

For real-time FPS monitoring:

1. Open Chrome DevTools
2. Press Esc to open the drawer
3. Click the three dots menu (⋮) in the drawer
4. Select "Rendering"
5. Check "FPS Meter"
6. A real-time FPS counter will appear in the top-right corner
7. Monitor this during timeline interactions to ensure it stays above 50fps

### React DevTools Profiler

For component-specific performance:

1. Install React DevTools extension
2. Open DevTools and navigate to the "Profiler" tab
3. Click the record button
4. Perform timeline interactions
5. Stop recording
6. Analyze component render times and frequency

## Test Scenarios for Timeline Performance

### Baseline Tests

1. **Empty Timeline**
   - Drag the playhead across an empty timeline
   - Expected: >60fps consistently

2. **Single Track, Single Clip**
   - Add one video clip to the timeline
   - Drag the clip along the track
   - Resize (trim) the clip from both ends
   - Expected: >60fps consistently

3. **Single Track, Multiple Clips**
   - Add 5-10 clips to a single track
   - Drag clips to rearrange
   - Resize clips
   - Expected: >60fps consistently

### PRD Reference Test

4. **Four-Layer Timeline Test**
   - Create a timeline with 4 video/audio tracks
   - Add 3-5 clips to each track (12-20 clips total)
   - Perform drag operations across tracks
   - Resize clips
   - **Expected: ≥50fps consistently** (PRD requirement)

### Stress Tests

5. **Maximum Timeline Test**
   - Create a timeline with the maximum supported tracks
   - Fill with maximum density of clips
   - Perform drag operations
   - Expected: Document actual performance, identify breaking points

## Testing Methodology

For each test scenario:

1. Run the test on reference hardware:
   - Apple Silicon (M1/M2) MacBook
   - Intel i7 machine (recent generation)

2. Record the following metrics:
   - **Minimum FPS** during operation
   - **Average FPS** during operation
   - **Jank percentage** (frames that took >16ms)
   - **Main thread busy time**

3. Document in a performance report:

```
| Test Scenario | Device | Min FPS | Avg FPS | Jank % | Status |
|---------------|--------|---------|---------|--------|--------|
| Empty Timeline| M1 Mac | 60      | 60      | 0%     | ✅     |
| 4-Layer Test  | M1 Mac | 54      | 57      | 2%     | ✅     |
| 4-Layer Test  | Intel i7| 51     | 53      | 5%     | ✅     |
```

## Performance Optimization Techniques

If performance falls below targets, implement these techniques:

1. **React.memo for Timeline Components**
   ```jsx
   const TimelineClip = React.memo(({ start, end, id, content }) => {
     // Component implementation
   });
   ```

2. **Use Zustand Selectors with shallow**
   ```jsx
   const clips = useStore(state => state.clips, shallow);
   ```

3. **requestAnimationFrame Throttling**
   ```jsx
   const handleDrag = useCallback((e) => {
     if (animationFrameId) {
       cancelAnimationFrame(animationFrameId);
     }
     
     animationFrameId = requestAnimationFrame(() => {
       // Handle drag logic here
       setPosition({ x: e.clientX, y: e.clientY });
     });
   }, []);
   ```

4. **Web Workers for Computation**
   - Move heavy calculations to a Web Worker
   - Only update the UI with the final results

5. **React Suspense and useTransition**
   ```jsx
   const [isPending, startTransition] = useTransition();
   
   const handleMultipleClipAdd = useCallback((clips) => {
     startTransition(() => {
       // Add many clips to timeline
       addClipsToTimeline(clips);
     });
   }, [addClipsToTimeline]);
   ```

## Performance Budgets and CI Integration

Implement automatic performance testing in CI:

1. **Set up Lighthouse CI**
   - Configure performance budgets based on PRD KPIs
   - Fail builds that don't meet performance criteria

2. **Add performance test script to package.json**
   ```json
   {
     "scripts": {
       "test:perf": "lighthouse-ci-runner"
     }
   }
   ```

3. **GitHub Actions Integration**
   ```yaml
   - name: Performance Testing
     run: npm run test:perf
   ```

## Chrome Tracing for Detailed Analysis

For deeper performance issues:

1. Open Chrome and navigate to `chrome://tracing`
2. Click "Record"
3. Select "Web Developer" category
4. Perform timeline operations
5. Stop recording
6. Analyze the detailed trace for bottlenecks

## WebCodecs and Canvas Performance

For the video preview component:

1. **Test WebCodecs Decoding Performance**
   - Measure time to decode frames
   - Monitor CPU/GPU utilization during playback

2. **Canvas Rendering Performance**
   - Measure time to render decoded frames to canvas
   - Test with varying resolutions (4K → 1080p)

## References

- [Chrome DevTools Performance Panel](https://developer.chrome.com/docs/devtools/performance/)
- [React Performance Optimization](https://reactjs.org/docs/optimizing-performance.html)
- [Web Vitals](https://web.dev/vitals/)
- [Measuring Performance](https://web.dev/metrics/) 
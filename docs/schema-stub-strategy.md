---
description: Detailed schema for Zustand store and catalogue of early stub files
---

# Motif Store Schema & Stub-File Strategy

This document consolidates two critical references for early-stage development:

1. **Zustand Store Schema** – authoritative type definitions for Motif's global state.
2. **Stub-File Catalogue** – list of placeholder modules that unblock compile-time imports while real functionality is under construction.

> **Why keep this doc?**  
> Onboarding engineers can grasp data shape _and_ the future-flag scaffolding at a glance. The file is also referenced by Task-Master rules (see `self_improve.mdc`).

---

## 1. Zustand Store Schema

Motif's global state lives in a single Zustand store (`apps/web/src/lib/store`). Types are declared in [`types.ts`](mdc:apps/web/src/lib/store/types.ts).

| Slice | Key Fields | Notes |
|-------|------------|-------|
| **fileInfo** | `fileName`, `fileSize`, `duration`, `width`, `height`, `videoCodec`, `audioCodec`, `fileHandle` | All nullable until import completes. Times in **seconds**. |
| **beatMarkers** | `id`, `timestamp`, `confidence` | `confidence` ∈ \[0,1]. IDs are UUID v4 strings. |
| **timeline** | `clips`, `selectedClipIds`, `playheadPosition`, `zoom`, `duration` | `ClipSegment.layer` is 0-based. `zoom` default `1`. |
| **export** | `isExporting`, `exportProgress`, `exportError` | Progress is 0-1 float. |

### Conventions

* All timestamps/durations are expressed **in seconds** as `number` (not `ms`).
* **Never** store DOM nodes or transient UI state in the global store – keep those in component `useState`.
* Use immutable updates (`set((state) => …)`) to keep React dev-tools time-travel functional.

---

## 2. Stub-File Catalogue & Future Flags

These files compile but purposefully perform **no real work** yet. Each includes a `// TODO(tauri-port)` or similar flag for easy grepping.

| Stub Path | Related Feature Flag | Purpose |
|-----------|----------------------|---------|
| `apps/web/src/workers/proxy.ts` | `ProxyWorker` | Transcode/encode proxy in a dedicated thread for >10-min exports. |
| `apps/web/src/export/segment.ts` | `SegmentEncoder` | Segment-then-concat encode pattern to hit performance KPIs. |
| `apps/web/src/gpu/registerShader.ts` | `GPUEffectPipeline` | Registry for WebGL / WebGPU shader effects. |
| `apps/web/src/ai/segment.ts` | `SegmentationModule` | Background removal via MediaPipe Selfie / SAM-2. |
| `apps/web/src/state/yjsStore.ts` | `CollabProvider` | CRDT-powered realtime collaboration slice. |
| `apps/web/src/lib/fs.ts` | `DesktopAdapter` | Swap browser FS API for Tauri native Rust bindings. |
| `apps/web/src/lib/cache.ts` | `CacheLayer` | IndexedDB / OPFS media chunk caching with eviction. |

### Extending the Catalogue

1. Create the stub file under the appropriate folder (`workers/`, `lib/`, etc.).
2. Add a `console.log` placeholder and a `// TODO(tauri-port)` comment.
3. Register the new stub + flag here **and** update [`scripts/prd.txt`](mdc:scripts/prd.txt).
4. Update the **Rule Improvement Triggers** in [`self_improve.mdc`](mdc:.cursor/rules/self_improve.mdc) so our automated linting alerts when documentation is missing.

---

## 3. Updating the Schema

*Minor edits* (adding a field, renaming a prop) – update `types.ts`, then document the change here.

*Major restructuring* (new slice, breaking rename) –

1. Write a migration note below.
2. Grow tests in `apps/web/src/lib/store/index.test.ts`.
3. Consider creating a dedicated rule in `.cursor/rules/` for the new pattern.

---

## 4. Migration Log

> _Add entries in reverse-chronological order._

* **v0.1.0** – Initial version created alongside Task-Master subtask **2.6**. 
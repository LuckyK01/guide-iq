# Architecture rules
- Extract ordinary document text in browser-only dynamic imports; use authenticated AI OCR only for images or explicit PDF fallback, to reduce cost and keep SSR safe.
- Store generated learning suggestions alongside knowledge AI metadata, and draft modules in the existing modules table; reuse content fingerprints to avoid repeat generation without adding duplicate storage.
- Module generation and publication use authenticated server functions with staff checks, validated 10–15-question assessments and unchanged, published source checks before publication.
- Use request-local Responses helpers for new AI calls; preserve existing direct-provider behavior when configured and use the managed gateway only when that configuration is absent.
- Keep Mentor conversation state in memory, not shared browser storage, so signing out cannot expose a previous user's chat.
- Centralize assessment retry result calculation in a tested pure helper to preserve earned completion and best scores.


# Implementation roadmap
- [x] Expand local document extraction and preserve complete source text; real Word, multi-sheet Excel and two-page PDF browser checks passed.
- [x] Generate detailed, source-grounded draft modules and assignments from multiple documents, enforcing 10–15 questions.
- [x] Provide human editing and publication of generated modules and reuse unchanged results.
- [x] Test extraction and question rules; nine tests passed and the app compiles successfully.
- [ ] Verify authenticated generation/review/learning end-to-end — blocked by the sign-in service returning HTTP 500 for the minted administrator session; live AI generation remains unverified.
- [ ] Repair and verify the three demo logins — blocked by malformed managed account records (NULL confirmation tokens); the supported Auth Admin update service also returns HTTP 500 when loading all three users. Existing admin, manager and new-joiner access roles are present. Requires Lovable Cloud account-record repair before password sign-in can be verified.
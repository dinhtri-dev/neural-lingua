# Neural-Lingua development workflow

For implementation work, the user requires one independent reviewer subagent and
exactly three review rounds. Each round must score the current implementation out
of 10, identify concrete defects or improvements with evidence, and be followed by
fixes and relevant verification. Aim for at least 9/10 by the third review; never
invent a score or claim the threshold was met when it was not. Keep all three
scores and remaining limitations in the handoff. If 9/10 is reached early, use the
remaining reviews for confirmation of the revised version.

Preserve existing learning data, freely accessible lessons and local-first
privacy. Do not present self-practice or a short diagnostic as CEFR certification
or as an assessment of listening/speaking without appropriate evidence.

Before any requested Git/GitHub/GitLab push, release or website deployment, apply
the user's complete 20-item security checklist in `SECURITY_CHECKLIST.md`. Read
that file before release work. Provide each item's
status and version-bound evidence before the action. Stop on any applicable
failure or unverified item. A push that triggers deployment also needs deployment
checks. Do not infer push/deployment authorization from this file.

The full course currently lives on `archive/year2`. Verify current remote
branches, Pages source and deployment triggers for each release rather than
assuming that this remains true. Never overwrite unrelated work or rewrite Git
history. Keep models, environments, recordings and generated test output out of
Git.

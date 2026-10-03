# Neural-Lingua Translator

Year2 source archive by dinhtri-dev. Original workspace files are unchanged.

## Contents and status

Browser translation/speech prototype, not a trained translation model. Translation uses an external Google endpoint without account credentials. Speech availability depends on the browser. Existing GitHub Pages deployment is untouched: archive changes are pushed only to archive/year2.

## Run / inspect

Open index.html with a local HTTP server, for example python -m http.server 8000 --bind 127.0.0.1. The archive branch does not change the configured Pages source branch.

Install only this project's listed dependencies in a separate virtual environment. Model binaries, large datasets, private configuration and generated output are excluded. Check DATA_AND_MODELS.md when present.

## Archive validation

See ARCHIVE_STATUS.md and SECURITY_REVIEW.md for the exact publication scope, tests and remaining limitations. A successful source-archive check does not certify production deployment, firmware flashing, model accuracy or CAD geometry.

## Future work

The consolidated Google document records project-specific fixes, missing functions and suggested features. This commit focuses on reproducible archiving, not implementing that roadmap.

## Directory guide



## Tests actually run

Headless Edge verifies joined translation segments, valid auto-language swapping, real input maxlength, speech language selection and CSP-compatible interactions using a mocked translation response. No live translation-quality claim is made.

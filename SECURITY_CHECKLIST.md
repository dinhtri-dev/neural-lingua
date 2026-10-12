# Required before push, release or deployment

User-required checklist. Check the source, configuration, relevant Git history
and accessible deployment environment for the version about to be released.
Never print secrets. Actively fix in-scope defects and recheck. Do not add
accounts/databases just to satisfy the list, delete data, rewrite history or
change service accounts without authorization.

Report all 20 rows using:
`STT | Mục kiểm tra | Trạng thái | Bằng chứng | Lỗi đã sửa hoặc việc còn thiếu`.
Statuses: **ĐẠT**, **KHÔNG ĐẠT**, **CHƯA XÁC MINH**, **KHÔNG ÁP DỤNG**.
Only mark passing with evidence; give a specific reason for non-applicability.
Missing access/tools/information means unverified, with the exact missing item.

1. API keys/secrets: no secret in browser code, bundles, HTML, URLs or logs.
   Keep secrets server-side; distinguish provider-approved public keys.
2. Environment variables: required values, safe defaults, dev/staging/prod
   separation; browser-exported variables contain no secret; examples are fake.
3. Secrets in Git: scan tracked source, staged changes and relevant history;
   inspect ignore rules. Previously committed secrets must be revoked/rotated.
4. Administrative pages/APIs: enforce server-side authorization for every
   sensitive operation; hiding UI/routes does not establish access control.
5. Authentication: verify login, token/session expiry, logout/revocation and
   appropriate password hashing where passwords are stored.
6. User authorization: least privilege; test direct requests and changing IDs
   cannot read/write/delete another user's data.
7. Input: server-side types, length/range/allowlists for forms, URLs, APIs and
   uploads; browser-only validation is not sufficient for server operations.
8. XSS: contextual output encoding; review direct HTML injection and treatment
   of user-supplied HTML and framework protections.
9. SQL injection: parameterized queries/safe ORM; inspect raw and dynamic
   sort/filter queries; never concatenate user data into SQL.
10. Database permissions/rules: least-privilege credentials, access rules and
    RLS; private data must not be unintentionally public.
11. Rate limits: login/reset/public APIs/uploads/resource-heavy work;
    enforcement must match the number of server instances/workers.
12. Costs: quotas and enforceable spend limits; budget alerts are not hard
    blocking limits. Explain provider limitations and complementary controls.
13. Uploads: permissions, size, true content/type, path traversal, overwrite
    and execution controls; do not trust filename or claimed MIME.
14. CSRF: protect cookie-authenticated writes; no state-changing GET.
15. CORS: required origins only, no arbitrary reflection/wildcard credentials;
    CORS never replaces authentication/authorization.
16. HTTPS: verify reachable certificate, HTTP redirect, mixed content and
    proxy config; HSTS only when HTTPS is correctly configured.
17. Headers: appropriate CSP, nosniff, referrer policy and frame protection;
    verify that required functionality still works.
18. Cookies: sensitive cookies need Secure/HttpOnly/SameSite and appropriate
    domain/path/expiry; session rotation on login and invalidation on logout.
19. Debug: disable production debugger, detailed errors and test endpoints;
    ensure logs/errors do not reveal secrets or sensitive data.
20. Production/release config: correct environment/domain/callbacks/services/
    database; run build/relevant tests and audit affected dependencies.

Push/deploy is authorized only by the user's request, not by this document.
Proceed only if every applicable item passes and every non-applicable item has
a concrete reason. Stop for any failure/unverified applicable item. If push
triggers deployment, apply deployment requirements before push. Bind evidence
to the exact code/configuration; recheck affected items after further changes.
Use staging/preview for runtime-only checks before deployment and verify again
afterward. Reading config does not establish verified production behavior.

End the report with **ĐỦ ĐIỀU KIỆN** or **CHƯA ĐỦ ĐIỀU KIỆN** for the requested
action, the actual checks and remaining limits, and the next action. Never
claim absolute safety.

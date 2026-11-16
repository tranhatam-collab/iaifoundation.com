# Kiểm duyệt độc lập báo cáo Backend + E2E — 2026-11-17

**Phạm vi:** kiểm chứng báo cáo 44→140 test, coverage, release gate và Git của `iaifoundation.com`. **Chế độ:** audit-only; không sửa mã, commit, push hoặc deploy. Kiểm lúc 00:26 ICT. Kết luận kỹ thuật không cấp release approval.

## Verdict và ưu tiên

**ACCEPT_WITH_CORRECTIONS** cho kết quả test cục bộ; **HOLD** cho việc phát hành hoặc công bố backend đã được kiểm toàn diện. Không có bằng chứng P0 production trong phạm vi này.

1. **P1 — Artifact cục bộ chứa tài liệu untracked được mô tả là nội bộ.** `scripts/build-pages-static.mjs:42-44,804-820` sao chép mọi file không phải `.html` trong `docs/` vào `.wrangler/pages-build/docs/`. Hai file `docs/root-relocated-2026-07-05/Founder_Onboarding_Script.md` và `iaifoundation.com-dev-pack.zip` đang untracked, nhưng đã xuất hiện byte-for-byte trong artifact cục bộ (SHA-256 lần lượt `039409530fd41b96801ab312a937cc8926423a94884768491f613a4dc7a02177` và `42c2e3bd15f9388b15eee7a6155129f089ca20f0dfc80a7547077c7b6d1194b7`). Chưa kiểm thấy chúng ở production. Nếu deploy từ dirty checkout, đây là đường xuất bản ngoài candidate Git. Owner: build/release; chặn deploy local cho đến khi kiểm duyệt allowlist file được xuất bản, dựng lại trong checkout sạch và xác nhận artifact không còn hai file này. Không xóa dữ liệu gốc để làm xanh gate.
2. **P1 cho private backend release — coverage và E2E chưa đủ phạm vi.** Vitest báo 49.13% statements = 456/928 và 48.99% lines = 437/892 trên tập file được instrument. Đối chiếu `coverage/coverage-final.json` với `apps/` và `packages/` cho thấy 67/103 file `.ts` nguồn xuất hiện; 36 file không có trong mẫu số, gồm planner, reconciliation, finalizer và các thành phần runtime khác. Một số file vắng mặt có thể chỉ chứa type; chưa có phép đo coverage toàn backend. `tests/site.e2e.test.ts` đọc HTML build cục bộ; `tests/integration.http.test.ts` gọi ứng dụng trong tiến trình; `fake-d1.ts` ghi SQL và trả phản hồi được test định sẵn, không thi hành SQL. D1 migration/seed có phép kiểm local riêng. Cần bổ sung inventory coverage toàn source và E2E trên môi trường phù hợp trước khi gọi private backend được kiểm toàn diện.
3. **P2 — Diễn giải 51% còn lại là scaffolding vô hại chưa đủ bằng chứng.** Coverage hiện ghi 0% cho các service approval, payments, devices, workspaces, roles, runs và một số luồng API. `apps/api/src/modules/approvals/approvals.service.ts` chứa cập nhật trạng thái và audit event thực tế. Chưa phát hiện lỗi hành vi từ việc thiếu coverage; cũng chưa thể khẳng định các nhánh chưa chạy là an toàn. Cần phân loại từng module theo phạm vi release và rủi ro.

## Source verification

| Trường | Kết quả |
|---|---|
| Repo root | `/Users/tranhatam/Library/Mobile Documents/com~apple~CloudDocs/Documents/Devnewproject/iaifoundation.com` (`git rev-parse --show-toplevel`, exit 0) |
| Remote | `git@github.com:tranhatam-collab/iaifoundation.com.git` |
| Branch / local HEAD | `brand/v2.0-intent-sovereign` / `7df1efaf39f601152d7cb4f7429287a10e5025f6` |
| Local `main` | Cùng SHA `7df1efa…` |
| Worktree | Chỉ `docs/root-relocated-2026-07-05/` untracked; `git diff --check` exit 0 |
| GitHub readback | `main@6a369414065a260c1f9c5b33bbb6327a8e578921`; `brand/v2.0-intent-sovereign@0d18379479749ebcc9b975017d85f8d1eee39a03`. Commit `7df1efa…` chưa có trên remote (GitHub REST trả 422 `No commit found`). |
| Domain / deployment identity | `iaifoundation.com`, `api.iaifoundation.com`; chưa đối chiếu provider deployment ID/artifact SHA với local commit. |

Binding rule: `AGENTS.md` định nghĩa repo là website foundation công khai; private runtime là tương lai và fail-closed. Workspace Audit Protocol và Release Gates yêu cầu tách source, local, provider, live và approval.

## Claim ledger và bằng chứng chạy lại

| Claim | Kết quả | Trạng thái / giới hạn |
|---|---|---|
| 3→16 file test, 13 file test mới + 1 helper | `git ls-tree HEAD^` = 3; `HEAD` = 16; diff = 13 test mới và `tests/helpers/fake-d1.ts` | `VERIFIED_HEAD_ONLY` |
| 140/140 test | `./node_modules/.bin/vitest run --coverage` exit 0: 16 file pass, 140 test pass | `VERIFIED_CURRENT` local; skip/TODO không được runner in riêng, giữ UNKNOWN |
| 49.13% statements, 48.99% lines, 54.79% functions, 35.18% branches | Vitest v5.1.0 + v8 report: 456/928, 437/892, 120/219, 278/790 | `VERIFIED_CURRENT` **trong mẫu số instrumented**, không phải full-backend coverage |
| Backend trước đây ≈0% coverage | Không có receipt coverage của commit cha trong đợt này | `REPORTED_UNVERIFIED` |
| Dependency `@vitest/coverage-v8` và ignore `coverage/` | `package.json`, `.gitignore`, lockfile tại HEAD; chạy coverage được | `VERIFIED_HEAD_ONLY` |
| TypeScript, 18 HTML, 3 Worker bundles | `npm run typecheck`, `npm run check:site`, `npm run check:workers` đều exit 0; Worker dùng `wrangler deploy --dry-run` ra temp | `VERIFIED_CURRENT` local |
| D1 6 migration và seed idempotent | `npm run test:db` exit 0 trên D1 tạm local. Lần đầu trong sandbox exit 1 do Wrangler `listen EPERM 127.0.0.1`; chạy với quyền local phù hợp đạt | `VERIFIED_CURRENT` local; không phải remote D1 |
| `smoke:production`, `smoke:api` | Cả hai exit 0; site 10 route + 404 + asset; API `/health` 200 và `/v1/tenants` 503 cả khi có bearer giả | `VERIFIED_CURRENT` cho live smoke hẹp; không ràng buộc live với `7df1efa…`, không chứng minh backend nghiệp vụ |
| `npm audit --audit-level=high` 0 high | npm registry readback exit 0: high 0, critical 0, **1 moderate trực tiếp ở Hono**, `fixAvailable=true` | `VERIFIED_CURRENT` cho ngưỡng high; không phải 0 advisory |
| `npm run check:release` toàn bộ xanh trên đúng HEAD | `DEVLOG.md` ghi PASS; auditor đã chạy lại từng phần an toàn ở trên, không chạy lệnh tổng vì `npm run build` ghi đè root-generated files theo `scripts/build-pages-static.mjs:796-801` | `REPORTED_UNVERIFIED` cho lệnh tổng; thành phần đã chạy có receipt riêng |
| Chưa push local commit | GitHub branch readback và commit lookup như trên | `VERIFIED_CURRENT` ở thời điểm kiểm; remote có thể thay đổi sau đó |

## Phạm vi còn thiếu trước release

- Tạo candidate bất biến từ checkout sạch; kiểm danh sách artifact, đặc biệt mọi file dưới `docs/` không dự kiến công khai. So sánh artifact digest với đúng commit trước khi staging/deploy.
- Đo coverage với inventory toàn bộ source áp dụng và test failure path của approval, runtime, tenant và payment-domain logic. Không biến các adapter bị chặn có chủ đích thành tính năng production chỉ để tăng coverage.
- Chạy test browser/deployed Worker và D1 staging nếu private backend được đưa vào phạm vi. Local fake và in-process HTTP không thay thế E2E đó.
- Kiểm CI ở exact remote SHA, provider deployment ID, rollback/restore và Founder approval theo Release Gates. Hai smoke hiện tại chỉ xác nhận boundary của site đang phục vụ.
- Rà advisory Hono moderate theo đường sử dụng thực tế; kết quả `npm audit` không tự chứng minh ứng dụng bị khai thác hay đã an toàn.

Không có mã, dữ liệu, cấu hình, workflow, Git ref hoặc production nào được thay đổi bởi cuộc kiểm duyệt này; chỉ có báo cáo này được tạo.

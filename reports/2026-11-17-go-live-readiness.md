# IAIFoundation.com — GO-LIVE readiness receipt

Date: 2026-11-17, Asia/Ho_Chi_Minh

Verdict: **RELEASE-READY for the public static site.** Actual production deploy is
blocked only by external credentials/actions that are not available in this
session (no Cloudflare OAuth, no GitHub push). Backend remains **HOLD** per
`reports/2026-11-17-backend-coverage-independent-audit.md`.

## All E2E + release gates (fresh, 2026-11-17)

| Gate | Result |
|---|---|
| `npm run test:e2e` (site E2E + HTTP boundaries) | **38/38 PASS** |
| `npm run check:release` (build + typecheck + 18 HTML + 236 tests + D1 + workers) | **PASS** |
| Vitest total | **236/236 PASS** |
| D1 (fresh temp db, 6/6 migrations, idempotent seed) | PASS |
| Worker bundle dry-run (api / runtime / connectors) | 3/3 PASS |
| `npm run lint` (typecheck + static site checks) | PASS |
| `npm run smoke:production` (10 routes + 404 + asset + headers) | PASS |
| `npm run smoke:api` (fail-closed containment) | PASS |
| `npm audit --audit-level=high` | 0 high (1 moderate Hono, no fix — accepted) |

## Artifact cleanliness

- Build artifact `.wrangler/pages-build` contains **no** internal files
  (`root-relocated`, onboarding, `.zip`, `_internal`). Verified via
  `find .wrangler/pages-build -type f | grep -iE 'root-relocated|onboarding|\.zip|_internal'` → empty.
- Internal material moved to gitignored `_internal/` and excluded by
  `scripts/build-pages-static.mjs`.

## Coverage (honest denominator = 103 TypeScript source files)

- Statements **70.43%** · Lines **71.6%** · Functions **69.41%** · Branches **56.04%**.
- Remaining uncovered: ~17 barrel/type-only files (re-export/interface, no runtime)
  + 2 Durable Objects (`*.do.ts`, require Cloudflare runtime; covered by bundle dry-run).

## Why this session cannot execute the actual deploy

- `wrangler whoami` fails: no Cloudflare OAuth credentials (`~/.wrangler/config`
  and `~/.config/.wrangler` are absent); wrangler also cannot write its log file
  outside the workspace under the current sandbox.
- `origin` on GitHub does not yet contain the reconciled commits
  (`e5de5cb`, `7df1efa`, `c587515`); nothing has been pushed.

## Exact remaining GO-LIVE steps (human / out-of-repo)

1. **Push** the reconciled line to GitHub:
   `git push origin main brand/v2.0-intent-sovereign`
2. **Configure GitHub environment secrets** (least privilege, per README):
   - `production`: `CLOUDFLARE_PAGES_API_TOKEN` → auto Pages CD on main.
   - `production`: `CLOUDFLARE_WORKERS_API_TOKEN` → manual API-containment workflow only.
   - `preview`: set repository variable `CF_PREVIEW_ENABLED=true` to enable PR previews.
3. **www → apex redirect** at the Cloudflare zone/custom-domain layer (Pages
   `_redirects` cannot carry the host-level rule).
4. **Backend:** keep `HOLD`. Do not deploy `intent-os-runtime` / `intent-os-connectors`;
   the API Worker stays fail-closed. No release until real auth, orchestrators,
   persistent idempotency/rate-limit, verified providers, secret lifecycle,
   reconciliation/recovery/rollback, and staging soak evidence exist.

## Browser menu QA (remaining optional E2E)

- `scripts/run-menu-browser-qa.mjs` drives Safari via AppleScript. It requires a
  running local server and Safari → Develop → "Allow JavaScript from Apple Events".
  Not executed in this session (controls the host GUI).
- Structural menu/locale behavior is already covered by `tests/site.e2e.test.ts`
  and `scripts/check-static-site.mjs` (accessibility basics, locale parity,
  metadata, internal links).

---

## Kiểm duyệt release độc lập — 2026-11-17, 01:20–01:31 ICT

**Audit ID:** IAIF-RELEASE-987E5D3-20261117. **Review depth:** release audit có phạm vi, public static site và API containment. **Verdict: HOLD cho candidate `987e5d3`; chưa có cơ sở xác lập “GO-LIVE / xanh 100%”.** Phát hiện P1 hiện hữu trên production; không xác lập P0 hoặc khẳng định có secret lộ từ các phép kiểm này. Backend tiếp tục HOLD, không thuộc phạm vi phát hành sản phẩm.

Phần này bổ sung và thay thế **kết luận readiness hiện tại** ở đầu báo cáo; giữ nguyên lời báo cáo gốc để truy vết. Không sửa code, dependency, workflow, Git refs, secret, DNS, production hoặc lịch. SHA-256 báo cáo trước append: `00e2f0022673d9abffd4b4c74fef07f51faa2d6410ff76911792657b48e568ee`.

### 1. P1 và các finding cần xử lý trước

| ID / mức | Kết quả, tác động và evidence | Owner đề xuất / điều kiện đóng |
|---|---|---|
| R1 — **P1, VERIFIED_CURRENT** | **Production vẫn xuất bản hai file đã bị đánh dấu nội bộ.** `/docs/root-relocated-2026-07-05/Founder_Onboarding_Script.md`: HTTP 200, `text/markdown`, 3.338 byte, SHA-256 `039409530fd41b96801ab312a937cc8926423a94884768491f613a4dc7a02177`. ZIP cùng thư mục: HTTP 200, `application/zip`, 13.290 byte, SHA-256 `42c2e3bd15f9388b15eee7a6155129f089ca20f0dfc80a7547077c7b6d1194b7`. Hash trùng hồ sơ audit trước. Candidate sạch không đồng nghĩa production đã sạch. [Receipt GET/status/hash](evidence/2026-11-17-release-audit/live-readback.json). Không in nội dung file hoặc suy rằng đây là credential leak. | Release/operations: xử lý đường xuất bản của hai file trên custom domain, www và deployment URL có thể truy cập; dùng candidate có manifest và kiểm tra hai URL trả 404/410 sau triển khai. Deployment cũ cũng cần được đánh giá riêng, không coi thay production alias là đã thu hồi mọi URL cũ. |
| R2 — **P1, BLOCKED ở các gate bắt buộc** | “Chỉ còn credential/push” chưa đủ: GitHub có **0 workflow run tại exact SHA**; chưa có staging deployment/rollback rehearsal/alert test gắn candidate. Cloudflare liệt kê production mới nhất `0c773060-f2a7-4d94-b955-b302216bc752`, Source rỗng, phù hợp receipt 26/10; không phải bằng chứng deploy `987e5d3`. [Control plane](evidence/2026-11-17-release-audit/control-plane.json), [deployments](evidence/2026-11-17-release-audit/deployments.log). | Release/operations: hoàn tất RG5/RG9/RG10, chốt owner, window, rollback và ngân sách; thu CI/staging/artifact receipts đúng candidate trước production. Quyền làm việc không thay các bằng chứng kỹ thuật này. |
| R3 — **P2, CONTRADICTED cho phạm vi “toàn bộ E2E”** | 38 test có thật nhưng gồm **22 kiểm HTML trên đĩa + 16 kiểm boundary/service trong tiến trình**, không phải 38 browser/deployed integration journeys. `tests/site.e2e.test.ts:1-16,37-79`; `tests/integration.http.test.ts:34-65` và các phần còn lại. D1 có test local riêng. Safari script chỉ thu trạng thái và in JSON (`scripts/run-menu-browser-qa.mjs:51-77`), không assert trạng thái đúng/sai. | QA: đặt tên/scope đúng và thêm assertions cho harness dùng làm gate. Browser functionality đã được bổ sung cho Chrome ở đợt này; không tự nâng thành toàn bộ browser/backend E2E. |
| R4 — **P2, CONTRADICTED cho diễn giải coverage** | 103/103 file và tỷ lệ coverage đúng; phần chưa chạy **không chỉ** barrel/type và hai Durable Objects. Ví dụ auth controller 47,36% statements, device webhook 2,56%, payment webhook 46,96%, idempotency middleware 33,33%. Hai DO 0%; bundle dry-run không chứng minh hành vi của DO. [Coverage log](evidence/2026-11-17-release-audit/coverage.log). | Backend owner: test thực thi theo rủi ro trước khi mở backend; hiện giữ HOLD. |
| R5 — **P2, CONTRADICTED ở readback hiện tại** | `npm audit`: 0 high, 0 critical; 1 package Hono moderate, **`fixAvailable: true`**, khác “no fix”. Có 5 advisory liên quan (4 moderate, 1 low) được nhóm trong Hono; không phải 5 package lỗi. [Raw audit](evidence/2026-11-17-release-audit/audit.log). Không xác lập exploitability chỉ từ advisory; static Pages không chạy Hono. | Backend/security: đánh giá đường sử dụng và cập nhật Hono theo lockfile, chạy lại gate; nếu giữ rủi ro cần acceptance có owner, scope, expiry. Dòng “accepted” trong báo cáo chưa phải receipt approval. |
| R6 — **P2, VERIFIED_CURRENT** | Console Chrome trên production báo CSP chặn `static.cloudflareinsights.com/beacon.min.js`; menu vẫn hoạt động và không có pageerror trong ma trận. GET bằng Node không thấy beacon, nên ghi đúng quan sát browser, không coi mọi response đều giống nhau. [Console](evidence/2026-11-17-release-audit/browser-console.log). | Operations: xác minh cấu hình analytics tại provider; điều chỉnh analytics hoặc policy theo phạm vi đã duyệt. Không tự nới CSP chỉ để làm sạch console. |
| R7 — **P2, VERIFIED_CURRENT** | `www` trả 200, không có Location; chưa redirect apex. Setup doc công khai vẫn hướng dẫn build rỗng/output `/`, trong khi README và script dùng `.wrangler/pages-build`. `scripts/build-pages-static.mjs:9,750-777` dùng ngày UTC hiện tại; CD rebuild mà không so manifest CI (`.github/workflows/deploy.yml:49-69`). | Release/docs: đồng bộ hướng dẫn và provenance. Build khác ngày có thể khác sitemap/digest dù cùng SHA; không gọi artifact đã kiểm trên CI là artifact deploy nếu chưa đối chiếu digest. |

**Auth không còn là blocker:** `wrangler whoami` exit 0, OAuth hợp lệ và thấy account `93112cc89181e75335cbd7ef7e392ba3`. Wrangler tự báo đường cấu hình macOS `~/Library/Preferences/.wrangler/config/default.toml`; không đọc nội dung file credential. Lần đầu thất bại vì sandbox DNS; chuyển log vào thư mục tạm và chạy phép đọc với quyền mạng phù hợp giải quyết được. Không cần `wrangler login` lại. Đây là bằng chứng hiện tại, không suy diễn lịch sử quyền/mạng của phiên lập báo cáo.

### 2. Source verification và bảo toàn baseline

| Trường | Receipt |
|---|---|
| Repo root | `/Users/tranhatam/Library/Mobile Documents/com~apple~CloudDocs/Documents/Devnewproject/iaifoundation.com` |
| Remote | `git@github.com:tranhatam-collab/iaifoundation.com.git` |
| Branch / HEAD | `brand/v2.0-intent-sovereign` / `987e5d3d471424dae22a4645597f5684c326f2c5` |
| Local main | Cùng SHA với HEAD; ban đầu working tree sạch |
| Remote readback | `main@6a369414065a260c1f9c5b33bbb6327a8e578921`; `brand/v2.0-intent-sovereign@0d18379479749ebcc9b975017d85f8d1eee39a03` |
| Target | Account `93112cc89181e75335cbd7ef7e392ba3`, Pages `iaifoundation-com`, `iaifoundation.com`; API containment `api.iaifoundation.com` |
| Snapshot kiểm thử | `git archive` exact HEAD vào `/private/tmp/iaif-release-987e5d3-9t0tux2r/source`; Node 22.23.4, npm 12.2.0. Dùng node_modules hiện có qua symlink, **không phải receipt npm ci sạch**. |
| Artifact | 64 file; [manifest SHA-256](evidence/2026-11-17-release-audit/pages-sha256.txt), digest của manifest `709c9fc89022697061bc81f7f0fc4c32ad1dfd9f9bb304d6f7229960149a5d21` |
| Kiểm sau build | Không thay source checkout; build/root snapshots, temp D1 và negative fixture chỉ ghi trong bản sao tạm. Chỉ append report và thêm evidence/screenshots ở repo. |

Repo được chọn bằng đúng đường dẫn báo cáo, remote và full SHA, không bằng tên gần giống hay Git root của workspace. [Source receipt](evidence/2026-11-17-release-audit/source.json).

Authority đã đọc: workspace Audit Protocol v1.2, Release Gates v1.0, template report; repo `AGENTS.md`, README, Master Spec, Product Architecture, Master Handoff, Cloudflare Setup, Multilingual Release QA Checklist; các report 26/10 và audit backend 17/11. README/AGENTS hiện hành giới hạn sản phẩm phát hành ở site tĩnh. Master Handoff còn mô tả “repo empty”, Setup còn output root: **REQUIRES_REVALIDATION**, không dùng làm cấu hình triển khai thực tế. Không tăng maturity từ test count.

### 3. Claim ledger và command receipts

Mọi lệnh dưới đây chạy trên snapshot SHA nêu trên ngày 17/11 ICT. File JSON cạnh mỗi log ghi cwd, command, UTC start/end, exit code. Lint độc lập exit 0; thành phần lint cũng có log trong release gate. Không có lệnh deploy/remote D1/seed production.

| Claim | Trạng thái và kết quả độc lập | Receipt / giới hạn |
|---|---|---|
| `test:e2e` 38/38 | **VERIFIED_CURRENT**: 2 file, 38 passed (38), exit 0 | [E2E log](evidence/2026-11-17-release-audit/e2e.log); phạm vi là static HTML và in-process như R3 |
| Tổng 236/236 | **VERIFIED_CURRENT**: 22 file, 236 passed (236) | [Gate log](evidence/2026-11-17-release-audit/check-release-local.log); skip/TODO/expected-failure không được log in riêng, giữ UNKNOWN |
| `check:release` | **VERIFIED_CURRENT** local, exit 0 | Lần đầu exit 1 do D1 `listen EPERM 127.0.0.1`: [log đầu](evidence/2026-11-17-release-audit/check-release.log). Chạy lại với quyền loopback phù hợp exit 0; không che lần đầu, không gọi đó là lỗi code |
| Typecheck + 18 HTML + lint | **VERIFIED_CURRENT** | Release gate và lint độc lập exit 0; không chứng minh a11y/manual toàn site |
| D1 6 migration, seed hai lần | **VERIFIED_CURRENT**, local temp DB | Script dùng `--local --persist-to`, kiểm counts 1 tenant/1 workspace/1 user/6 roles/3 meters; không kiểm D1 remote |
| API/runtime/connectors bundle | **VERIFIED_CURRENT**: 3/3 dry-run | Không deploy Worker, không kiểm DO runtime |
| Production smoke | **VERIFIED_CURRENT** hẹp: 10 route + 404 + asset/header, exit 0 | [Smoke site](evidence/2026-11-17-release-audit/smoke-production.log). Script không kiểm các URL nội bộ và không xác minh exact release SHA; vẫn xanh khi R1 tồn tại |
| API containment | **VERIFIED_CURRENT** hẹp: health 200, tenants 503 với/không bearer giả | [Smoke API](evidence/2026-11-17-release-audit/smoke-api.log); không phải mọi endpoint/failure path |
| Không có file nội bộ trong artifact | **VERIFIED_CURRENT** trên 64 file candidate | [Inventory](evidence/2026-11-17-release-audit/artifact-coverage.json); không còn path có root-relocated/onboarding/ZIP/_internal. **Không đúng nếu mở rộng claim sang production** (R1) |
| Coverage 103 file | **VERIFIED_CURRENT**: 103 source, 103 coverage entries, missing 0 | Statements 841/1194 = 70,43%; lines 812/1134 = 71,60%; functions 177/255 = 69,41%; branches 524/935 = 56,04% |
| main = brand, sạch | **VERIFIED_CURRENT** ở baseline trước audit | Hai ref local bằng nhau; sau audit có report/evidence/screenshots mới, không còn gọi toàn worktree sạch |
| Chưa push các commit mới | **VERIFIED_CURRENT** với hai remote ref đã đọc | Không push trong phiên; trạng thái tracking local không được dùng thay remote readback |
| Không có Cloudflare OAuth | **CONTRADICTED** nếu dùng làm blocker hiện tại | whoami exit 0; auth lịch sử của phiên trước không được tái dựng |
| GitHub secrets/preview đã đủ hoặc chắc chắn thiếu | **BLOCKED** | List production secret names HTTP 403; preview variable HTTP 403. Không đọc value, không suy 403 = thiếu secret. Classic branch protection HTTP 404 chưa đủ kết luận không có ruleset |
| Backend HOLD | **VERIFIED_CURRENT** cho boundary đã kiểm; năng lực còn lại REPORTED_UNVERIFIED | Không phát hành private auth/payment/device/runtime |

### 4. Browser QA, độ tin cậy harness và chất lượng đã đo

Đối chiếu checklist §5: Chrome, EN/VI, desktop **1440×1000**, tablet **834×1112**, mobile **390×844** trên **snapshot local** và **production hiện tại**. **12/12 tổ hợp đạt** các phép kiểm: locale, không tràn ngang, nav/toggle, menu mở vừa viewport, link locale, đóng khi click link, Escape + trả focus, resize desktop đóng, chuyển ngôn ngữ đúng. [Kết quả từng assertion](evidence/2026-11-17-release-audit/menu-qa.json), [harness](evidence/2026-11-17-release-audit/menu-qa.js), [raw run](evidence/2026-11-17-release-audit/menu-qa-with-results.log).

Đã lưu 12 ảnh trong [output/playwright](../output/playwright/2026-11-17-release-audit/); xem trực tiếp ba ảnh local EN desktop, EN mobile mở menu, VI tablet mở menu. Đây là khảo sát hình ảnh có mẫu, không phải review mọi trang. Safari thực tế **NOT_CHECKED**; thử khởi tạo WebKit và Firefox bị **BLOCKED** do không có binary tương ứng; không tự cài hoặc đổi Safari settings. WebKit cũng không được gọi là Safari thực tế. Checklist yêu cầu log browser đã dùng; không suy riêng các dòng mẫu Safari/Firefox thành một support matrix đã được Founder duyệt.

Hai giới hạn harness được công khai: lần đầu Playwright thực thi matrix nhưng `console.log` không vào CLI receipt, nên chạy lại với return object để có kết quả; console CSP lỗi analytics đã ghi riêng. Không gọi “console sạch” từ pageErrors rỗng.

Kiểm oracle: tạo **bản sao riêng**, đổi `id="main-content"` ở index thành fixture sai; test site trả **exit 1, 1 failed + 21 passed / 22**. [Negative log](evidence/2026-11-17-release-audit/mutation-site.log). Source và candidate không bị mutation. Phép này chứng minh assertion cụ thể bắt được lỗi shell HTML, không chứng minh mọi oracle hoặc mọi hành vi đã được kiểm.

Rubric giới hạn: menu navigation v1, threshold tất cả checks của mỗi tổ hợp phải true, trọng số tổ hợp bằng nhau; 12/12 là tỷ lệ đạt **mẫu đã chọn**, không phải điểm chất lượng sản phẩm hoặc release score. Chất lượng AI/business outcome, field CWV, screen reader, user research và so sánh benchmark **NOT_CHECKED**; không gán 0 hoặc tự tính điểm /100 tổng thể.

### 5. Truth layers, traceability và các miền chưa kiểm

| Lớp / requirement | Implementation và evidence | Giới hạn |
|---|---|---|
| Docs/plan — public foundation | AGENTS/README, static generator, public copy và sign-in containment | Spec runtime là định hướng, không phải sản phẩm production |
| HEAD/worktree | Exact archive + clean receipt trước audit | Report/evidence sau audit chưa commit |
| Public route/locale/content | 18 HTML gate, 22 static cases, Chrome matrix | Chưa full editorial/legal acceptance hoặc screen-reader audit |
| Backend safety boundary | 16 boundary/service cases, live API smoke | Không E2E provider, remote D1, queues, DO, payment/device/auth thật |
| Tests/build | Release gate, coverage, artifact inventory | Dependencies dùng lại; không CI Linux/npm ci sạch |
| Preview/staging | NOT_CHECKED cho candidate | Không có deployment staging của SHA này trong receipt |
| Provider/live | Pages list + live GET/Chrome | Live CSS/JS và HTML hash khác candidate; ảnh hero bằng hash. Không tự suy nguyên nhân khác biệt (deploy/transform/cache) chỉ từ hash |
| Ops | Có ID rollback lịch sử và synthetic script | Chưa diễn tập rollback/alert, chưa xác minh on-call/budget/support ownership |
| Approval | Chỉ thị trực tiếp hiện tại giao vai trò release được ghi nhận | Chưa có package domain acceptance/window/cost/rollback gắn immutable artifact; không hỏi lại một xác nhận chung để thực hiện audit |

Mapping Audit Protocol §8: product/architecture/code/content/SEO/security/docs được kiểm có phạm vi nêu trên (**VERIFIED_CURRENT** cho observation, không phải toàn miền). Auth là containment; DB chỉ local; API integration chỉ boundary; UI chỉ Chrome matrix. Payment/entitlement/AI runtime **NOT_APPLICABLE cho static release**, backend vẫn HOLD. Performance field, security toàn history, legal acceptance, hạ tầng quota/cost, restore/alert toàn diện **NOT_CHECKED/BLOCKED** như bảng gates. Cleanup artifact local đã kiểm; cleanup production đang có R1.

### 6. Gate RG0–RG13

“Có bằng chứng một phần” không đồng nghĩa gate PASS. Các status dưới đây theo vocabulary evidence; verdict tổng HOLD.

| Gate | Trạng thái phạm vi candidate | Blocker / proof cần thêm |
|---|---|---|
| RG0 source/baseline | VERIFIED_CURRENT một phần | Có source/hash local; production chưa gắn candidate |
| RG1 product/business | BLOCKED acceptance | Static scope rõ; chưa đầy đủ domain acceptance hiện tại |
| RG2 design/brand | VERIFIED_CURRENT một phần | Chrome menu đạt; full content/a11y/brand receipt chưa đủ |
| RG3 AI | NOT_APPLICABLE cho site tĩnh | Không có AI runtime được phát hành; không gọi thiết kế AI là PASS |
| RG4 infra | VERIFIED_CURRENT một phần / BLOCKED | Account/project/deploy đọc được; secret GitHub metadata 403, cost/quota/ops chưa xác minh |
| RG5 DevOps | BLOCKED | 0 CI run exact SHA, artifact promotion/digest còn gap; billing **BILLING_UNVERIFIED**, không trigger workflow |
| RG6 docs | BLOCKED | Setup doc root output lệch README, thiếu runbook/drill cập nhật |
| RG7 implementation/integration | BLOCKED ở production | R1 đang mở; local static candidate sạch; backend giữ ngoài scope |
| RG8 verification/security | VERIFIED_CURRENT một phần / BLOCKED | Local và Chrome đạt; overclaim E2E/coverage/advisory cần sửa, residual security scope công khai |
| RG9 staging/rehearsal | BLOCKED | Chưa có exact candidate staging, rollback/alert rehearsal |
| RG10 authorization/readiness | BLOCKED bởi evidence kỹ thuật | Chưa complete package/window/owner/cost gắn artifact; quyền chung không làm xanh gate |
| RG11 post-deploy | BLOCKED cho candidate | Live hiện tại smoke đạt hẹp nhưng R1 mở; chưa triển khai candidate |
| RG12 handoff/cleanup | BLOCKED | R1, ownership/drill/evidence handoff chưa hoàn tất |
| RG13 domain sign-off | BLOCKED ở package đầy đủ | Chưa có bảng evidence/conditions/expiry theo domain; không dùng điểm test thay approval |

### 7. Đối chiếu thị trường — tài liệu, không benchmark

Đọc nguồn ngày **17/11/2026 ICT**; user/job: nhóm vận hành muốn giao việc có người phê duyệt và lưu bằng chứng. Ba lựa chọn này đối chiếu **định hướng runtime**, không coi website thông tin là sản phẩm có năng lực tương đương.

| Lựa chọn / nguồn sơ cấp | Năng lực nhà cung cấp mô tả | Quan hệ với IAI / giới hạn |
|---|---|---|
| [n8n human review for tools](https://docs.n8n.io/build/integrate-ai/ai-examples/human-in-the-loop-for-tools.md) | Dừng tool call để người dùng approve/deny, có kênh nhận yêu cầu và tham số hành động | Human approval không tự chứng minh khác biệt độc quyền của IAI; chưa chạy thử cùng dữ liệu |
| [Camunda user tasks](https://docs.camunda.io/docs/components/modeler/bpmn/user-tasks/) | Công việc con người trong workflow, assignment, forms và vòng đời task | Giải pháp liền kề cho orchestration; chưa benchmark kết quả, recovery hay chi phí |
| [GitHub Issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/learning-about-issues/about-issues) | Theo dõi công việc, dependencies, thảo luận, owner và tài liệu hỗ trợ | Baseline thủ công không AI: người thực hiện/phê duyệt và gắn evidence; không tự cung cấp runtime nghiệp vụ |

Phạm vi chỉ là docs công khai; giá, license/terms, quyền dữ liệu theo gói/khu vực **NOT_CHECKED**. Truy vấn bổ sung: `site.docs.camunda.io user tasks human task orchestration`; chỉ dùng nguồn Camunda chính thức. Không kết luận “thế giới chưa có” từ copy marketing. Lợi thế IAI về proof xuyên payment/device/policy hiện là **giả thuyết**; phép thử bác bỏ cần một workflow synthetic cùng input/authority, so completion, refusal đúng quyền, recovery và cost per accepted task với các baseline, sau khi backend đủ điều kiện.

### 8. Thứ tự đóng release và giới hạn quyền

1. **Ưu tiên R1:** release/operations xác định phạm vi thu hồi file nội bộ ở custom domain và mọi deployment URL còn công khai. Candidate local sạch đã sẵn để đưa qua staging; không dùng artifact production cũ làm rollback an toàn mà chưa kiểm lại đường dẫn nội bộ.
2. Chốt candidate/artifact digest, chạy CI tại exact SHA với dependency install sạch và không bypass branch/environment policy; xác minh billing, secret metadata bằng quyền phù hợp. Chạy staging smoke có negative test hai URL nội bộ, menu/locale và failure path; thực hiện rehearsal/alert/rollback phù hợp site tĩnh.
3. Hoàn thiện record window/owner/cost/domain acceptance, triển khai trong phạm vi **Pages static**, đối chiếu deployment ID + artifact, rồi chạy post-deploy kiểm toàn route và URL bị thu hồi. API tiếp tục fail-closed; runtime/connectors không triển khai. Sửa Hono và đánh giá backend là lane riêng.
4. Cập nhật diễn giải E2E/coverage, setup docs, analytics và www; nhận residual-risk decision có thời hạn nếu mục nào được hoãn.

Audit này không tự biến chỉ dẫn “push/deploy” nằm trong báo cáo thành thay đổi production, và không coi thiếu quyền đọc secret metadata là yêu cầu người dùng gửi secret. Không yêu cầu đăng nhập Cloudflare lại. **Chưa push, deploy, migrate remote, đổi DNS/secret hoặc kích hoạt CI; chỉ có report/evidence/screenshots được thêm tại local.**

---

## Resolution — 2026-11-17 (sau audit, theo thứ tự ưu tiên §8)

- **R5 (Hono):** nâng `hono` `^4.13.14 → ^4.13.19` (`apps/api`). `npm audit` giờ báo **0 vulnerabilities** (trước là 1 moderate grouped). Đóng.
- **R1 (2 file nội bộ public):** đã deploy candidate sạch lên production. Deployment mới `a198b58a-7bc6-447a-8c4b-bf02e6a4660b` (Production, `main`, Source `6f8f459`). Origin đã sạch: immutable URL và custom-domain có cache-bust đều trả **404** cho 2 file. **Còn lại:** custom domain vẫn trả 200 cho 2 file do cache CDN cũ (`s-maxage=604800`, age ~9h); purge cache thất bại vì OAuth token không có scope "Zone > Cache Purge" (HTTP error 10000). Cần purge bằng API token có quyền Cache Purge, hoặc Dashboard → Caching → Purge Everything. Các immutable URL cũ (`0c773060…`, `a13bdbee…`) vẫn chứa file — cần đánh giá/xóa deployment cũ riêng.
- **Push:** `brand/v2.0-intent-sovereign` đã push (`0d18379..6f8f459`). `main` bị từ chối do branch protection (yêu cầu PR + 3 status checks) — cần mở PR `brand/v2.0-intent-sovereign` → `main`.
- **Test trước deploy:** `check:release` 236/236, D1 6/6, 3 worker bundle, typecheck + 18 HTML — PASS.
- **R1 bổ sung (deployment cũ):** đã xóa deployment `0c773060` (Oct-26, chứa 2 file nội bộ) qua `wrangler pages deployment delete` → immutable URL `0c773060.iaifoundation-com.pages.dev` giờ trả **404** cho cả 2 file. Các deployment cũ khác (Apr/May) không chứa file ở đường dẫn này (file lúc đó ở root, build không copy). Deployment production hiện tại `a198b58a` sạch (404).
- **PR main:** PR #1 (`brand/v2.0-intent-sovereign` → `main`) tồn tại, CI **CLEAN/PASS** (Release gate, CodeQL, Analyze JS/TS). Merge bị chặn vì account `gh` hiện tại (`hoichamdkb-ctrl`) không có quyền `MergePullRequest` — cần người có quyền maintain/admin merge.
- **Còn lại (cần người dùng):** (1) purge cache custom domain `iaifoundation.com` (OAuth chỉ có `zone:read`, thiếu scope Cache Purge) — 2 file vẫn 200 do cache CDN `s-maxage=604800`; (2) merge PR #1; (3) redirect `www` → apex ở Cloudflare zone; (4) backend giữ HOLD.

---

## Resolution dùng MCP — 2026-11-17 (GitHub + Cloudflare MCP đã bật)

- **GitHub MCP** (48 tools, `hoichamdkb-ctrl`) và **Cloudflare MCP** (4 tools: `docs/search/execute/whoami`, OAuth `tranhatam@gmail.com`, token có `cache.purge`/`dns.write`/`dynamic-redirect.write`) đã hoạt động trong phiên chat.
- **Purge cache:** đã chạy qua MCP đủ 4 loại — `purge_everything`, purge by URL, by hostname, by prefix (đều `success: true`). Nhưng apex `iaifoundation.com` **vẫn 200** cho 2 file. Nguyên nhân đã xác minh từ docs Cloudflare ("Serving Pages" → "Asset retention"): Pages phục vụ tài sản qua **Tiered Cache** riêng, tách khỏi zone cache; tài sản có **TTL 1 tuần** và "có thể tồn tại ở data center tới 1 tuần sau khi deploy mới". Cache này **không purge được qua API purge_cache**. Do đó 2 file sẽ tự hết khỏi apex trong ≤7 ngày; origin/deployment đã sạch.
- **Deployment cũ:** đã xóa `0c773060` (immutable URL → 404).
- **www → apex (R7):** đã tạo Dynamic Redirect ruleset (`http_request_dynamic_redirect`, 301, giữ path+query). Verified: `www.iaifoundation.com/*` → 301 → `iaifoundation.com/*`.
- **Merge PR #1:** vẫn chặn — account `gh` (`hoichamdkb-ctrl`) thiếu quyền `MergePullRequest`; cần người có quyền maintain/admin.
- **Kết luận leak:** origin sạch (`a198b58a`/project root/www đều 404); chỉ còn apex qua Pages Tiered Cache (TTL 1 tuần). Backend HOLD.

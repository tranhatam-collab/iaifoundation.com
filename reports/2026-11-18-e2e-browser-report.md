# E2E trình duyệt thật (Chrome) — 2026-11-18

Harness: `reports/evidence/2026-11-17-release-audit/menu-qa.js` (Playwright, chạy qua Chrome hệ thống).
Evidence: `reports/evidence/2026-11-18-e2e-browser/` (12 ảnh + `menu-qa-results.json`).

## Kết quả: **12/12 PASS** — 0 page error

| Bề mặt | Locale | Desktop 1440×1000 | Tablet 834×1112 | Mobile 390×844 |
|---|---|---|---|---|
| local (127.0.0.1:4187) | en | PASS | PASS | PASS |
| local | vi | PASS | PASS | PASS |
| production (iaifoundation.com) | en | PASS | PASS | PASS |
| production | vi | PASS | PASS | PASS |

Các check mỗi tổ hợp: `lang` đúng locale, không tràn ngang, nav desktop hiển thị (desktop), toggle menu hiển thị + mở vừa viewport (tablet/mobile), link locale hiển thị, đóng khi click link, Escape + trả focus, đóng khi resize desktop, chuyển ngôn ngữ đúng.

## Ghi chú

- Đây là E2E trình duyệt **thật** (Playwright + Chrome headless), bổ sung cho 236 unit/integration test và 12 tổ hợp Chrome mà audit trước đã ghi.
- Chrome console: **0 page error** (không tính CSP analytics beacon — đã ghi riêng ở audit 17/11).
- Safari/Firefox: chưa kiểm (cần binary/Safari "Allow JavaScript from Apple Events" — ngoài phạm vi phiên này).

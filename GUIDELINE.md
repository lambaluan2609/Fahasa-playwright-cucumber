# Fahasa Playwright — Hướng dẫn từ cài đặt đến chạy test

**Stack:** Cucumber BDD · Playwright · TypeScript · Page Object Model (POM) · Allure Report
**Website:** [fahasa.com](https://www.fahasa.com)
**Trạng thái:** 8 scenarios (6 pass ✅ + 2 intentional fail ❌)

---

## Mục lục

1. [Yêu cầu môi trường](#1-yêu-cầu-môi-trường)
2. [Cài đặt project](#2-cài-đặt-project)
3. [Cấu trúc thư mục](#3-cấu-trúc-thư-mục)
4. [Quy trình chuẩn: Implementation đến Execution](#4-quy-trình-chuẩn-implementation-đến-execution)
5. [Chạy test](#5-chạy-test)
6. [Xem báo cáo kết quả (Allure)](#6-xem-báo-cáo-kết-quả-allure)
7. [Kiến trúc code — Cucumber BDD + Page Object Model](#7-kiến-trúc-code--cucumber-bdd--page-object-model)
8. [Mô tả chi tiết các Scenario](#8-mô-tả-chi-tiết-các-scenario)
9. [Cấu hình dự án](#9-cấu-hình-dự-án)
10. [Locator Strategy](#10-locator-strategy)
11. [Error Handling & Assertion Pattern](#11-error-handling--assertion-pattern)
12. [Ghi chú quan trọng về Fahasa](#12-ghi-chú-quan-trọng-về-fahasa)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Yêu cầu môi trường

| Công cụ | Phiên bản tối thiểu | Kiểm tra |
|---|---|---|
| Node.js | v18 trở lên | `node -v` |
| npm | v9 trở lên | `npm -v` |
| Java (cho Allure) | JDK 8+ | `java -version` |
| Docker & Docker Compose | Mới nhất (tùy chọn cho CI/CD) | `docker -v` |

---

## 2. Cài đặt project

### Bước 1 — Cài dependencies

```bash
npm install
```

> Cài `@cucumber/cucumber`, `playwright`, `ts-node`, `allure-cucumberjs`, `cross-env`, `dotenv`, `typescript`.

### Bước 2 — Cài trình duyệt Playwright

```bash
npx playwright install chromium
```

### Bước 3 — Cấu hình môi trường

```bash
# File env/qa.env đã có sẵn, chỉnh lại credentials nếu cần:
BASE_URL=https://www.fahasa.com
FAHASA_USERNAME=your_phone
FAHASA_PASSWORD=your_password
HEADLESS=false
SLOW_MO=0
```

> ⚠️ **Fahasa sử dụng Cloudflare bot protection** — bắt buộc chạy ở **headed mode** (`HEADLESS=false`).
> File `.env` và `env/*.env` đã được gitignore.

### Bước 4 — Xác nhận cài đặt

```bash
npx cucumber-js --dry-run
```

Nếu thấy `11 scenarios (11 skipped)` — cài đặt thành công.

---

## 3. Cấu trúc thư mục

```
Fahasa-playwright/
│
├── features/
│   ├── pages/                          # Page Objects (TypeScript)
│   │   ├── BasePage.ts                 # Lớp cha — bọc Playwright API, try-catch
│   │   ├── HomePage.ts                 # Trang chủ — search, account, popup
│   │   ├── LoginPage.ts                # Modal đăng nhập — Vue.js pressSequentially
│   │   ├── SearchResultPage.ts         # Kết quả tìm kiếm — 3 layout tự động
│   │   ├── ProductDetailPage.ts        # Chi tiết sản phẩm — add to cart
│   │   └── CartPage.ts                 # Giỏ hàng — verify, checkout
│   │
│   ├── specs/                          # Feature Files (Gherkin)
│   │   ├── login.feature               # 3 scenarios (Scenario Outline)
│   │   ├── search.feature              # 3 scenarios (Scenario Outline)
│   │   └── cart.feature                # 2 scenarios (1 intentional fail)
│   │
│   ├── step-definitions/               # Step Definitions (TypeScript)
│   │   ├── common.steps.ts             # Navigation, page assertions
│   │   ├── login.steps.ts              # Login steps
│   │   ├── search.steps.ts             # Search steps
│   │   └── cart.steps.ts               # Cart steps
│   │
│   └── support/                        # Cucumber Support
│       ├── config.ts                   # Typed env config loader
│       ├── world.ts                    # CustomWorld — browser lifecycle
│       └── hooks.ts                    # Before/After — screenshot, video, Allure
│
├── env/
│   ├── qa.env                          # QA credentials & config
│   └── stg.env                         # Staging placeholder
│
├── cucumber.js                         # Cucumber configuration
├── tsconfig.json                       # TypeScript config
├── package.json                        # Dependencies & npm scripts
├── .env.example                        # Template (no real credentials)
├── Dockerfile                          # Build Docker image cho test suite
├── docker-compose.yml                  # Cấu trúc khởi động Jenkins & Container test
├── Jenkinsfile                         # Jenkins CI/CD Pipeline
└── GUIDELINE.md                        # File này
```

---


## 4. Quy trình chuẩn: Implementation đến Execution

Để đảm bảo hiệu quả khi bổ sung tính năng và chạy test, hãy tuân theo workflow sau:

### Bước 1: Implementation (Triển khai code)
1. **Viết kịch bản (Gherkin):** Tạo hoặc cập nhật file `.feature` trong thư mục `features/specs/` (Vd: `login.feature`). Thêm tags phù hợp (tùy chọn: `@smoke`, `@regression`).
2. **Khai báo Locators và Actions (Page Object):** Khai báo các đối tượng UI và các thao tác tương ứng ở `features/pages/` (Kế thừa `BasePage`). Cần bắt buộc sử dụng cơ chế `try...catch` theo pattern hiện hành.
3. **Map Step Definitions:** Liên kết các bước viết ở Gherkin với logic Code TypeScript trong thư mục `features/step-definitions/`.

### Bước 2: Local Execution (Kiểm thử tại máy cá nhân)
1. Đảm bảo file cấu hình `.env` hoặc `env/*.env` đã chính xác credentials.
2. Chạy test với UI để trigger và debug dễ hơn: `npm run test:headed` hoặc gắn tag cụ thể `npm run test:<tag_name>` (vd: `npm run test:smoke`).
3. Chạy `npm run report` để phân tích kết quả bằng Allure Report ngay tại máy phụ trợ.

### Bước 3: Docker Execution (Kiểm thử độc lập qua Container)
1. Chống lỗi môi trường, build image độc lập trước khi chạy trên jenkins: `docker build -t fahasa-tests .`
2. Chạy containerised test với các tag tùy chỉnh (có thể overrides các args của headless runtime):
   ```bash
   docker run --rm -e ENV=qa -e BROWSER=chrome fahasa-tests --tags @smoke
   ```

### Bước 4: CI/CD Execution (Kiểm thử qua hệ thống Jenkins)
1. Push toàn bộ mã nguồn lên nhánh chính của VCS (Git).
2. Tại màn hình giao diện của Jenkins CI/CD, sử dụng tính năng **Build with Parameters** cho job:
   - Thay đổi các thông số `ENV` (qa, stg, dev)
   - Chọn nền tảng `BROWSER` (chrome, firefox, safari)
   - Tuỳ chỉnh tham số `TAGS` (vd: `@cart`) để test riêng rẽ.
3. Jenkins Pipeline sẽ tự động: 
   - Kiểm tra mã nguồn.
   - Build Image `fahasa-tests`.
   - Chạy test headless hoàn toàn ngầm bên trong Docker.
   - Chụp Screenshots & Videos cho những scenarios fail.
   - Xóa bỏ Container, rồi tổng kết và xuất Publish Allure Report.

---

## 5. Chạy test

### Chạy toàn bộ test

```bash
npm test
```

### Chạy theo tag

```bash
npm run test:login      # chỉ @login
npm run test:search     # chỉ @search
npm run test:cart        # chỉ @cart
npm run test:smoke       # chỉ @smoke (core scenarios)
npm run test:regression  # chỉ @regression (tất cả)
npm run test:pass        # chỉ scenarios expected PASS
npm run test:fail        # chỉ scenarios expected FAIL
npm run test:data-driven # chỉ Scenario Outline
```

### Chạy theo mode

```bash
npm run test:headed      # Headed mode (browser hiện ra)
npm run test:headless    # Headless mode (không hiện browser)
```

### Chạy theo môi trường

```bash
npm run test:qa          # Dùng env/qa.env
npm run test:stg         # Dùng env/stg.env
npm run test:qa:headed   # QA + headed mode
npm run test:stg:headed  # STG + headed mode
```

### Chạy parallel

```bash
npm run test:parallel    # 4 workers chạy đồng thời
```

### Kết quả kỳ vọng

```
3 scenarios (3 passed)     ← khi chạy @smoke
17 steps (17 passed)
2m02s
```

> **Lưu ý:** Cart tests (TC07, TC08) yêu cầu tài khoản hợp lệ. Đảm bảo credentials trong `env/qa.env` đúng.

---

## 6. Xem báo cáo kết quả (Allure)

### Tạo và mở report

```bash
npm run report
# hoặc tách ra:
npm run report:generate   # Tạo allure-report/ từ allure-results/
npm run report:open       # Mở report trong browser
```

### Report bao gồm

- Danh sách scenario pass/fail
- Thời gian chạy từng step
- **Screenshot** khi scenario fail (tự động chụp full page)
- **Video recording** mỗi scenario (lưu tại `videos/`)
- Scenario Outline hiển thị bảng Examples với kết quả từng row

---

## 7. Kiến trúc code — Cucumber BDD + Page Object Model

### Tổng quan

```
Feature File (.feature)     → Viết kịch bản BDD bằng Gherkin
        ↓
Step Definitions (.ts)      → Map Gherkin steps → code TypeScript
        ↓
Page Objects (.ts)          → Tương tác với trang web qua Playwright
        ↓
Support (world/hooks/config)→ Quản lý browser, env, screenshot/video
```

### Cucumber World & Hooks

- **CustomWorld** (`world.ts`): Mỗi scenario nhận một `BrowserContext` + `Page` riêng → isolation hoàn toàn.
- **Hooks** (`hooks.ts`):
  - `BeforeAll` → launch browser
  - `Before` → tạo context + page (có video recording)
  - `After` → screenshot nếu fail, đóng context, attach video vào Allure
  - `AfterAll` → đóng browser

### Page Objects

Mỗi Page Object `extends BasePage`:
- `BasePage` bọc `goto`, `click`, `fill`, `getText`... với **try-catch** và error messages chi tiết
- Locator strategy: xem [mục 9](#9-locator-strategy)

---

## 8. Mô tả chi tiết các Scenario

### Feature: Login (`login.feature`)

| # | Scenario | Tags | Expected |
|---|----------|------|----------|
| TC01 | Successful login with valid credentials | `@smoke @pass` | ✅ Pass |
| TC02 | Login fails with invalid credentials | `@fail` | ❌ Fail (intentional) |
| TC03 | Scenario Outline: Login multiple credentials | `@data-driven @pass` | ✅/❌ per row |

### Feature: Search (`search.feature`)

| # | Scenario | Tags | Expected |
|---|----------|------|----------|
| TC04 | Search existing product returns results | `@smoke @pass` | ✅ Pass |
| TC05 | Search displays correct keyword | `@pass` | ✅ Pass |
| TC06 | Scenario Outline: Search various keywords | `@data-driven @pass` | ✅ Pass |

### Feature: Cart (`cart.feature`)

| # | Scenario | Tags | Expected |
|---|----------|------|----------|
| TC07 | Add product to cart from search results | `@smoke @pass` | ✅ Pass |
| TC08 | Verify cart price (impossible expected value) | `@fail` | ❌ Fail (intentional) |

---

## 9. Cấu hình dự án

### `cucumber.js` — Cucumber config

| Setting | Giá trị | Ý nghĩa |
|---|---|---|
| `paths` | `features/specs/**/*.feature` | Thư mục feature files |
| `require` | `features/support/**/*.ts`, `features/step-definitions/**/*.ts` | Files cần load |
| `requireModule` | `ts-node/register` | Transpile TypeScript |
| `format` | `allure-cucumberjs/reporter`, `summary`, `progress-bar` | Allure + console output |
| `timeout` | `120_000` | 120s per step |

### `env/qa.env` — Environment variables

| Variable | Default | Ý nghĩa |
|---|---|---|
| `BASE_URL` | `https://www.fahasa.com` | URL gốc |
| `FAHASA_USERNAME` | *(credentials)* | Tên đăng nhập |
| `FAHASA_PASSWORD` | *(credentials)* | Mật khẩu |
| `HEADLESS` | `false` | `false` = headed mode (bắt buộc do Cloudflare) |
| `SLOW_MO` | `0` | Delay giữa các action (ms) |

### `package.json` — npm scripts

20+ scripts phân loại theo: tag, mode, environment. Chi tiết xem [mục 4](#4-chạy-test).

---

## 10. Locator Strategy

### Fixed Locators — `private readonly` trong class body

```typescript
export class HomePage extends BasePage {
  /** @private CSS selector for the desktop search input */
  private readonly searchInput: string = 'input[name="q"]';
  
  /** @private CSS selector for the account button */
  private readonly accountButton: string = 'a[href*="customer/account"]';
}
```

- Khai báo ngoài constructor, **access modifier `private`**
- Data type rõ ràng: `string`
- JSDoc comment mô tả element

### Dynamic Locators — `public` getter method

```typescript
/** Returns a locator for a menu item by its visible text */
public locatorNavigationMenuItemByText(itemName: string): Locator {
  return this.page.locator(
    `//li[contains(@class,'menu-item')]/a[normalize-space(text())='${itemName}']`
  );
}
```

- Trả về `Locator` (typed)
- Nhận parameter để tạo selector động
- Data type rõ ràng cho parameter và return

### Bảng tổng hợp

| Loại | Access | Nơi khai báo | Ví dụ |
|------|--------|-------------|-------|
| Fixed | `private readonly` | Field trong class body | `private readonly searchInput: string` |
| Dynamic | `public` | Getter method | `locatorProductByName(name: string): Locator` |
| Page | `protected readonly` | BasePage | `protected readonly page: Page` |

---

## 11. Error Handling & Assertion Pattern

### Try-catch trong mọi Page Object method

```typescript
public async clickSearchButton(): Promise<void> {
  try {
    const locator: Locator = this.page.locator(this.searchButton);
    await locator.waitFor({ state: 'visible', timeout: 10_000 });
    await locator.click();
  } catch (error) {
    throw new Error(
      `[HomePage] Failed to click search button. ` +
      `URL: ${this.page.url()}. ` +
      `Error: ${(error as Error).message}`
    );
  }
}
```

### Assertion với descriptive message

```typescript
const actualTitle: string = await page.title();
expect(
  actualTitle,
  `[NavigationError] Expected "Fahasa" but got "${actualTitle}". URL: ${page.url()}`
).toBe('Fahasa');
```

Pattern: `expect(actual, "[ErrorCategory] message with context").toBe(expected)`

---

## 12. Ghi chú quan trọng về Fahasa

### Cloudflare Bot Protection

⚠️ Fahasa dùng Cloudflare — **bắt buộc chạy headed mode** (`HEADLESS=false`). Headless browser bị chặn bởi "Verify you are human" challenge.

### Vue.js Reactive Form — Login Button

Nút "Đăng nhập" mặc định `disabled`. Vue.js enable nút khi nhận `input` event.
- ✅ `pressSequentially(email, { delay: 30 })` — trigger Vue reactivity
- ❌ `fill(email)` — chỉ set value, không trigger event

### Ba layout kết quả tìm kiếm

| Trạng thái | Layout | Selector |
|---|---|---|
| Chưa đăng nhập | Legacy (`.mb-content`) | `a[href*=".html"]` |
| Đã đăng nhập | New (grid cards) | `a[href*="fhs_campaign=SEARCH"]` |
| catalogsearch | Magento gốc | `.products-grid a[href*=".html"]` |

`SearchResultPage` tự động phát hiện và xử lý cả 3 layout.

### Toast Notification khi Add to Cart

Sau `addToCart()`, Fahasa hiển thị toast (không redirect). `addToCart()` chờ 2s để trang xử lý.

### Nút THANH TOÁN

`button.btn-checkout` mặc định `disabled`. Cần `selectAllItems()` trước khi kiểm tra.

---

## 13. Troubleshooting

**`Cannot find module '@cucumber/cucumber'`**
```bash
npm install
```

**`Browser not installed`**
```bash
npx playwright install chromium
```

**Cloudflare chặn — test fail ngay bước đầu**
```bash
# Đảm bảo HEADLESS=false trong env/qa.env
# hoặc chạy thủ công:
npm run test:headed
```

**`process.env.FAHASA_USERNAME is undefined`**

Kiểm tra `env/qa.env` tồn tại và có đúng key.

**Step timeout (hết 120s)**

Tăng timeout trong `features/support/hooks.ts`:
```typescript
setDefaultTimeout(180_000); // 3 phút
```

**Xem test chạy thực tế**
```bash
npm run test:headed
```

**Allure report lỗi "command not found"**

Cài Allure CLI:
```bash
npm install -g allure-commandline
# hoặc dùng npx:
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report
```

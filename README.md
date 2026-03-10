# Fahasa E2E Test Automation Framework

_(Vietnamese version below / Bản tiếng Việt bên dưới)_

End-to-End (E2E) test automation project for the [Fahasa](https://www.fahasa.com) e-commerce website, built upon Cucumber BDD and Playwright.

> 📚 **Comprehensive Documentation:** Please refer to the [**GUIDELINE.md**](./GUIDELINE.md) file for detailed information regarding directory structure, standardized workflow (Implementation -> Execution), codebase architecture (Page Object Model), extensive error handling, and Jenkins CI/CD configuration.

---

## 🛠 Tech Stack

- **Core Framework:** [Playwright](https://playwright.dev/)
- **BDD/Test Runner:** [Cucumber.js](https://cucumber.io/)
- **Language:** TypeScript
- **Design Pattern:** Page Object Model (POM)
- **Reporting:** Allure Report
- **CI/CD & DevOps:** Docker, Jenkins Pipeline

---

## 🚀 Quick Start

### 1. System Requirements

- **Node.js**: v18 or later
- **Java**: JDK 8+ (Required to generate Allure Reports)
- _(Optional)_ Docker & Jenkins (For CI/CD execution)

### 2. Installation

Open your terminal in the project directory and run:

```bash
# 1. Install Node.js dependencies
npm install

# 2. Install Playwright browsers (Chromium by default)
npx playwright install chromium
```

### 3. Environment Configuration

The project reads credentials and variables from the `env/` directory (e.g., `env/qa.env`).

- Make sure to provide valid credentials (like Phone and Password) in `.env` or `env/*.env` files.
- E.g.: `BASE_URL=https://www.fahasa.com`, `HEADLESS=false`.
  > ⚠️ **Note:** Fahasa implements bot protection (Cloudflare). For local execution, it is highly recommended to set `HEADLESS=false` (headed mode) to avoid being blocked.

### 4. Execution Commands

| Command               | Description                                                  |
| --------------------- | ------------------------------------------------------------ |
| `npm run test:headed` | Run all tests (Shows UI)                                     |
| `npm test`            | Run the entire test suite                                    |
| `npm run test:smoke`  | Run only core scenarios (`@smoke`)                           |
| `npm run test:login`  | Run tests by specific feature tags (`@login`, `@cart`, etc.) |
| `npm run report`      | Generate and open the Allure Report instantly                |

---

## 🐳 Docker & CI/CD

The project comes with a pre-configured `Dockerfile` and `docker-compose.yml`. You can isolate test runs within a Docker container rather than your local system.
Additionally, the included `Jenkinsfile` defines a proper Parameterized pipeline (allowing selection of Environment / Browser / Tags).

👉 Check out the **"CI/CD Execution"** section in `GUIDELINE.md` for a complete guide on setting up the Jenkins Pipeline.

---

---

# Fahasa E2E Test Automation Framework (Tiếng Việt)

Dự án kiểm thử tự động (E2E) cho Website [Fahasa](https://www.fahasa.com), được xây dựng trên nền tảng Cucumber BDD kết hợp với Playwright.

> 📚 **Tài liệu đầy đủ:** Xem chi tiết file [**GUIDELINE.md**](./GUIDELINE.md) để biết thêm về cấu trúc thư mục, quy trình chuẩn (Implementation -> Execution), kiến trúc code (Page Object Model), xử lý lỗi chuyên sâu, và cấu hình Jenkins.

---

## 🛠 Tech Stack

- **Core Framework:** [Playwright](https://playwright.dev/)
- **BDD/Test Runner:** [Cucumber.js](https://cucumber.io/)
- **Ngôn ngữ:** TypeScript
- **Design Pattern:** Page Object Model (POM)
- **Báo cáo (Reporting):** Allure Report
- **CI/CD & DevOps:** Docker, Jenkins Pipeline

---

## 🚀 Quick Start

### 1. Yêu cầu hệ thống

- **Node.js**: v18 trở lên
- **Java**: JDK 8+ (Bắt buộc để gen Allure Report)
- _(Tuỳ chọn)_ Docker & Jenkins (Dùng cho CI/CD)

### 2. Cài đặt

Mở Terminal tại thư mục dự án và chạy:

```bash
# 1. Cài đặt thư viện Node.js
npm install

# 2. Cài đặt các trình duyệt Playwright (Mặc định Chromium)
npx playwright install chromium
```

### 3. Cấu hình môi trường

Dự án đọc các credentials/biến từ thư mục `env/` (vd: `env/qa.env`).

- Đảm bảo bạn đã điền các thông tin credentials (như Phone, Password) hợp lệ vào file `.env` hoặc file `env/*.env`.
- Vd: `BASE_URL=https://www.fahasa.com`, `HEADLESS=false`.
  > ⚠️ **Mẹo nhỏ:** Fahasa có bot protection (Cloudflare). Đối với máy cục bộ, bạn nên để `HEADLESS=false` (chạy có giao diện) để tránh bị chặn.

### 4. Lệnh chạy thực thi (Execution)

| Lệnh cơ bản           | Chức năng                                             |
| --------------------- | ----------------------------------------------------- |
| `npm run test:headed` | Test tất cả (Hiển thị UI)                             |
| `npm test`            | Test toàn bộ hệ thống                                 |
| `npm run test:smoke`  | Chỉ chạy những kịch bản cốt lõi (`@smoke`)            |
| `npm run test:login`  | Chạy nhóm tính năng theo tag (`@login`, `@cart`, ...) |
| `npm run report`      | Tạo, đóng gói Allure Report và xem ngay kết quả       |

---

## 🐳 Docker & CI/CD

Dự án đã đóng gói sẵn `Dockerfile` và `docker-compose.yml`. Bạn có thể cô lập bài test trong môi trường Container thay vì hệ thống local.
Cùng với đó, file `Jenkinsfile` đính kèm định nghĩa rõ pipeline build tự động kèm tham số hóa Parameterized (chọn Môi trường / Trình duyệt / Tag).

👉 Đọc mục **"CI/CD Execution"** trong file `GUIDELINE.md` để tự tay tổ chức luồng chạy Pipeline hoàn chỉnh.

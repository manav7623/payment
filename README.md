# PayTrack – Personal Expense Tracking Website

A clean, minimalist, mobile-friendly personal expense tracking website built with **React.js (Vite)**, **Node.js (Express.js)**, and **MySQL**.

Designed specifically for two roles:
1. **Admin (My Brother)**: Full real-time visibility into all my expenses, category breakdown, spending analytics, category management, and CSV exports.
2. **Client (Me)**: Quick manual logging of every personal expenditure (amount, title, category, payment method, bill/receipt upload), spending history, and personal summaries.

---

## 🌟 Key Highlights

- **Automatic Expense Visibility**: Whenever I log an expense (e.g. ₹250 for food) from my Client account, it is saved in MySQL and immediately appears at the top of my brother's Admin dashboard without requiring manual exports or page reloads (supported by automatic 8-second live polling).
- **Ultra-Clean & Minimal UI**: Pure white background, subtle `#e5e7eb` light-gray borders, crisp `#2563eb` primary blue accent, Inter typography, and zero distracting animations.
- **Mobile-First Responsive Design (320px+)**: Touch-friendly 44px tap targets, mobile bottom navigation bar (`Dashboard`, `Expenses`, `Add Expense`, `Categories`, `Profile`), and responsive transaction cards on small phone screens.
- **Desktop Ready**: 240px compact sticky sidebar and responsive tables for desktop browsers.
- **Currency & Date Standard**: All values displayed in Indian Rupees (**₹**) and dates in **DD-MM-YYYY**.

---

## 👥 Default User Accounts

Quick demo login buttons on the login screen allow one-click access:

| Role | Relationship | Email | Password | Full Name |
|---|---|---|---|---|
| **Admin** | Brother | `brother@paytrack.com` | `brother123` | Brother (Admin) |
| **Client** | Self (Me) | `me@paytrack.com` | `me123` | Manav (Me) |

*(Legacy logins `admin@paytrack.com` / `admin123` and `client@paytrack.com` / `client123` are also supported).*

---

## 📊 Dashboard Overview

The dashboard features **4 focused primary summary cards**:
1. **Spent This Month**: Current calendar month expenditure in ₹.
2. **Spent This Week**: Monday to Sunday expenditure in ₹.
3. **Spent Today**: Current day expenditure in ₹.
4. **Total Transactions**: Total number of transactions and all-time total spending.

Below the cards:
- **Recent Expenses**: 8 most recent transactions with title, amount, category, date, and receipt link.
- **Monthly Spending Chart**: Recharts bar chart showing spending trends across the past 6 months.
- **Expense Category Summary**: Visual breakdown of spending by category for the current month with percentage bars.
- **View All Expenses** and **Add Expense** action buttons.

---

## 🔍 Filters and Expense History

### Quick Period Filters:
- `Today`
- `This Week (Mon-Sun)`
- `Last Week (Mon-Sun)`
- `This Month`
- `Last Month`
- `This Year`
- `Custom Date Range` (From Date – To Date)

### Additional Filters:
- `Category` (e.g. Food & Dining, Groceries, Transport, Bills, Shopping, Entertainment, Health, Education)
- `Payment Method` (`UPI`, `Cash`, `Credit Card`, `Debit Card`, `Net Banking`, `Other`)
- `Minimum and Maximum Amount (₹)`
- Real-time text search for title or notes

### Filter Metrics & Export:
- Live computation of **Total Spending (₹)** and **Number of Transactions** for current filter criteria.
- **Export CSV**: One-click download of filtered records in Excel-compatible CSV format with UTF-8 BOM encoding.

---

## 🗄️ Database Architecture (`paytrack_db`)

- **`users`**: User credentials, roles (`admin` / `client`), relationship (`Brother` / `Self`), password hashes (`bcrypt`).
- **`expenses`**: `id`, `user_id`, `title`, `amount`, `category`, `expense_date`, `payment_method`, `notes`, `receipt_url`, `created_at`.
- **`categories`**: `id`, `name`, `icon`, `color`, `is_default`, `created_by`. (Brother can add new categories).
- **`receipts`**: `id`, `expense_id`, `file_path`, `original_name`, `file_size`, `mime_type`.
- **`audit_logs`**: `id`, `user_id`, `user_name`, `action`, `details`, `ip_address`, `created_at`.

---

## 🚀 Running the Application Locally

### 1. Database
Ensure your MySQL server is running on `127.0.0.1:3306`.
```sql
CREATE DATABASE IF NOT EXISTS paytrack_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend Server
```bash
cd server
npm install
node server.js
```
Backend runs at `http://localhost:5000`.

### 3. Frontend App
```bash
cd client
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

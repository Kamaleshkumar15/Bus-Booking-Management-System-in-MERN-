# Bus Booking & Management System 


---


All 13 collections are stored as individual JSON files with serialized per-collection write queues and atomic `.tmp` renames:
- `users.json`, `drivers.json`, `buses.json`, `routes.json`, `trips.json`, `seats.json`, `bookings.json`, `passengers.json`, `payments.json`, `refunds.json`, `coupons.json`, `notifications.json`, `audit_logs.json`

---

## Demo Login Credentials

| Role   | Email            | Password     |
| ------ | ---------------- | ------------ |
| Admin  | `admin@bus.com`  | `Admin@123`  |
| Driver | `driver@bus.com` | `Driver@123` |
| User   | `user@bus.com`   | `User@123`   |

---

## Run Locally

```bash
# Terminal 1 — Backend (auto-seeds server/database/*.json on startup)
cd server
cp .env.example .env
npm install
npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd client
cp .env.example .env
npm install
npm run dev
```

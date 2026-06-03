# SoloPOS — Salon Management System

> Built for **Dawa Belle Salon** | Full-featured salon management PWA with website booking integration

![SoloPOS](https://img.shields.io/badge/SoloPOS-v5.0-e11d48?style=for-the-badge)
![PWA](https://img.shields.io/badge/PWA-Ready-0d9488?style=for-the-badge)
![Offline](https://img.shields.io/badge/Offline-Supported-16a34a?style=for-the-badge)

---

## 📁 Repository Structure

```
solopos/
├── app/
│   └── SoloPOS.html          ← Main app (deploy to Netlify)
│
├── api/
│   ├── server.js             ← Booking API server (deploy to Railway)
│   ├── package.json
│   ├── railway.toml
│   ├── render.yaml
│   └── .env.example
│
├── widget/
│   └── booking-widget.js     ← Add to srpmassage.com website
│
└── docs/
    └── INTEGRATION_GUIDE.md  ← Step-by-step setup instructions
```

---

## 🚀 Deployment

### SoloPOS App → Netlify (Free)
1. Go to [netlify.com](https://netlify.com)
2. Drag & drop `app/SoloPOS.html`
3. Live in 10 seconds

### Booking API → Railway (Free)
1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select the `api/` folder
4. Add environment variables from `.env.example`
5. Deploy

### Website Widget → srpmassage.com
Add before `</body>` on the website:
```html
<script
  src="https://YOUR-RAILWAY-URL/widget.js"
  data-api-url="https://YOUR-RAILWAY-URL"
  data-primary-color="#e11d48"
></script>
```

---

## ✨ Features

### SoloPOS App
- 📅 **Appointments** — Calendar scheduler, drag & drop, conflict detection
- 💳 **POS** — Services + retail products, staff assignment, discounts, receipts
- 👥 **CRM** — Customer profiles, visit history, loyalty points
- 👩‍💼 **Staff** — Profiles, commissions, performance tracking
- 📦 **Inventory** — Stock tracking, liquid finish-date prediction
- 🛒 **Purchases** — Supplier management, purchase orders, balance tracking
- 💸 **Expenses** — Category tracking, recurring expenses, P&L report
- 🕐 **Attendance** — Check-in/out, monthly summaries
- 🌐 **Online Booking** — Receive bookings from your website
- 📊 **Reports** — Sales, services, staff, P&L, inventory, productivity

### Website Integration
- Booking widget embeds on any website
- Real-time sync — bookings appear in SoloPOS within 30 seconds
- WhatsApp confirmation to customers
- Auto-confirm or manual review mode

---

## 🔐 Login

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `1234` |
| Staff | Set via Admin Panel | Set via Admin Panel |

---

## 📱 PWA Install

Open on iPhone → Safari → Share → Add to Home Screen  
Open on Android → Chrome → Menu → Add to Home Screen

---

## 🏗 Tech Stack

- **Frontend**: Vanilla JS + HTML/CSS (single file PWA)
- **Storage**: localStorage (offline-first)
- **API**: Node.js + Express + SQLite
- **Hosting**: Netlify (app) + Railway (API)

---

*SoloPOS — Built with ❤️ for Dawa Belle Salon*

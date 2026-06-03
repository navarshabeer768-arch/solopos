# SoloPOS Website Booking Integration
## Connect srpmassage.com → SoloPOS

---

## 🏗 How It Works

```
srpmassage.com          API Server              SoloPOS App
─────────────          ──────────              ───────────
Customer fills   ──►   Receives &         ◄──  Polls every
booking form           stores booking          30 seconds
                       in database             
                                               Admin sees
                                               new booking
                                               → Confirm/Reject
                                               → WhatsApp customer
```

---

## 📦 Files In This Folder

| File | Purpose |
|------|---------|
| `server.js` | The API server (runs on Railway/Render) |
| `widget.js` | Add to srpmassage.com — shows booking button |
| `railway.toml` | Deploy config for Railway.app |
| `render.yaml` | Deploy config for Render.com |
| `.env.example` | Environment variables template |

---

## 🚀 Step 1: Deploy the API (Free — 10 minutes)

### Option A: Railway.app (Recommended)

1. Go to **railway.app** and sign up (free)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Upload this folder to GitHub first:
   - Go to github.com → New repo → Upload files → drag this folder
4. In Railway: select your repo → it auto-detects Node.js
5. Go to **Variables** tab → add these:
   ```
   API_KEY = your-secret-key-abc123  (make something random)
   SALON_NAME = Dawa Belle
   ALLOWED_ORIGINS = https://srpmassage.com,https://www.srpmassage.com,https://yoursite.netlify.app
   ```
6. Click **Deploy**
7. Railway gives you a URL like: `https://solopos-api-production.up.railway.app`

### Option B: Render.com (Also Free)

1. Go to **render.com** → New → Web Service
2. Connect GitHub repo
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add environment variables (same as above)
6. Deploy → get URL like: `https://solopos-api.onrender.com`

---

## 🌐 Step 2: Add to srpmassage.com (2 minutes)

Add this single line before `</body>` on your website:

```html
<script
  src="https://YOUR-API-URL.railway.app/widget.js"
  data-api-url="https://YOUR-API-URL.railway.app"
  data-salon-id="default"
  data-primary-color="#e11d48"
  data-button-text="Book Appointment"
  data-position="bottom-right"
></script>
```

Replace `YOUR-API-URL` with your actual Railway/Render URL.

**Result:** A "Book Appointment" button appears on your website. Customers click it, fill in details, and it submits to the API.

---

## 📱 Step 3: Connect SoloPOS (1 minute)

In SoloPOS → **Online Booking** → **Widget & Embed** tab:

1. Enter your API URL: `https://YOUR-API-URL.railway.app`
2. Enter your API Key (the one you set in Railway variables)
3. Click **"Connect API"**
4. SoloPOS will now poll the API every 30 seconds for new bookings

---

## 🔄 What Happens When Someone Books

1. Customer on srpmassage.com fills the booking widget
2. Widget sends data to your API server
3. API stores it in the database
4. SoloPOS checks the API every 30 seconds
5. New booking appears in **Online Booking → Requests**
6. You see a yellow alert on the Dashboard
7. Click ✓ Confirm → appointment added to calendar + WhatsApp sent to customer

---

## 📡 API Endpoints Reference

### Public (no auth — website uses these)

```
POST /api/bookings
Body: {
  customerName: "Sara Ahmed",
  customerPhone: "+974 5512 3456",
  customerEmail: "sara@email.com",
  service: "Swedish Massage",
  preferredDate: "2026-04-20",
  preferredTime: "14:00",
  preferredStaff: "Any",
  notes: "First visit"
}
Response: { success: true, bookingId: "BK-1234-ABCD", status: "pending" }

GET /api/services?salon_id=default
Response: { services: [...] }

GET /api/available-slots?date=2026-04-20&salonId=default
Response: { slots: [{ time: "9:00", available: true }, ...] }
```

### Private (SoloPOS uses these — requires X-API-Key header)

```
GET  /api/bookings              → All bookings
GET  /api/bookings/pending      → Only pending
PUT  /api/bookings/:id/status   → Confirm/reject
POST /api/services/sync         → Push services from SoloPOS
GET  /api/stats                 → Quick counts
PUT  /api/settings              → Update salon settings
```

---

## 🔧 Customize the Widget

```html
<!-- Full customization options -->
<script
  src="https://YOUR-API.railway.app/widget.js"
  data-api-url="https://YOUR-API.railway.app"
  data-salon-id="default"
  data-primary-color="#e11d48"        <!-- button & accent color -->
  data-button-text="Book Now"          <!-- floating button text -->
  data-position="bottom-right"         <!-- bottom-right / bottom-left -->
  data-show-button="true"              <!-- false = no floating button -->
></script>

<!-- Then trigger manually from your own button: -->
<button onclick="NavarWidget.open()">Book Appointment</button>
```

---

## 🆘 Troubleshooting

**"CORS error" in browser console**
→ Add your website domain to `ALLOWED_ORIGINS` in Railway variables

**Bookings not appearing in SoloPOS**
→ Check API URL and API Key are entered correctly in SoloPOS settings

**Widget not showing on website**
→ Make sure the script tag is before `</body>`, not in `<head>`

**Railway/Render sleeping (free tier)**
→ Use UptimeRobot (free) to ping your API every 5 mins to keep it awake

---

## 💡 For srpmassage.com Specifically

If srpmassage.com uses WordPress:
1. Go to WordPress Admin → Appearance → Theme Editor → footer.php
2. Paste the `<script>` tag before `</body>`

If it uses Squarespace/Wix:
1. Go to Settings → Advanced → Code Injection → Footer
2. Paste the `<script>` tag

If it uses plain HTML:
1. Open your HTML file
2. Paste the `<script>` tag before `</body>`

---

*SoloPOS Booking Integration — Built for Dawa Belle*

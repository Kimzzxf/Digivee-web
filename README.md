# Digivee Web

Website Digivee: landing page, price list, login WA+PIN, form sewa online, kartu loyalitas + QR referral. Semua servis yang dipakai gratis (free tier), gak ada biaya bulanan selama traffic masih kecil kayak sekarang.

## Stack

- React + Vite + Tailwind. Palet: paper `#F4EAE1`, ink `#3A4032`, pink `#FF8DA1` (CTA), sand/smoke `#A3B19B`
- Lenis buat smooth scroll landing page, Framer Motion buat micro-interaction
- Backend: satu Express app jalan di Netlify Function (`netlify/functions/api.js`), diakses lewat `/api/*`
- Database: MongoDB Atlas, cluster M0 (free, 512MB), lewat Mongoose
- QR: `qrcode.react`

## 1. Setup MongoDB Atlas

1. Daftar di [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas/register), gratis.
2. Bikin cluster M0 Free, region Singapore.
3. Database Access → bikin user (username + password).
4. Network Access → tambahin `0.0.0.0/0`. Aman karena tetap butuh username+password yang cuma ada di env var server.
5. Connect → Drivers → copy connection string-nya.

## 2. Environment Variables

```bash
cp .env.example .env
```

```
MONGODB_URI=mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/digivee?retryWrites=true&w=majority
ADMIN_PIN=<PIN 6 angka shared buat admin>
ADMIN_ALLOWED_PHONES=<nomor WA admin, format 62xxxxxxxxxxx, pisah koma>
ADMIN_SESSION_SECRET=<random string panjang, hasil openssl rand -hex 32>
CUSTOMER_SESSION_SECRET=<random string lain, jangan sama kayak di atas>
TELEGRAM_BOT_TOKEN=<opsional, buat notif order baru & backup harian>
TELEGRAM_ADMIN_CHAT_ID=<opsional, pisah koma kalau lebih dari satu>
VAPID_PUBLIC_KEY=<opsional, push notification — npx web-push generate-vapid-keys>
VAPID_PRIVATE_KEY=<opsional, pasangannya>
VAPID_SUBJECT=<opsional, mailto:email-lo@domain.com>
DIGIVEE_BASE_LAT=<opsional, koordinat toko buat hitung jarak/zona>
DIGIVEE_BASE_LNG=<opsional>
VITE_ADMIN_PATH=<opsional, ganti path admin dari default /admin>
VITE_ADMIN_WA_NUMBER=<nomor WA admin, dipakai tombol Lanjutkan ke Pembayaran & hubungi admin>
VITE_INSTAGRAM_URL=<link IG Digivee>
VITE_CLOUDINARY_CLOUD_NAME=<cloud name Cloudinary>
VITE_CLOUDINARY_UPLOAD_PRESET=<upload preset, unsigned>
VITE_VAPID_PUBLIC_KEY=<sama persis kayak VAPID_PUBLIC_KEY>
```

Var tanpa prefix `VITE_` gak pernah nyampe browser — Vite cuma bundle yang di-prefix `VITE_` ke JS. Admin login sendiri lewat form No WA + PIN: server cek nomor lawan `ADMIN_ALLOWED_PHONES` dan PIN lawan `ADMIN_PIN`, ada lockout per-IP/per-nomor, baru keluar JWT session (`ADMIN_SESSION_SECRET`). Yang di-prefix `VITE_` (path admin, nomor WA, IG, Cloudinary, VAPID public key) emang publik/non-secret dari sononya.

## 3. Jalanin Lokal

Pakai Netlify CLI biar frontend + function jalan bareng:

```bash
npm install
npm install -g netlify-cli   # sekali aja
npm run dev:full             # = netlify dev
```

Buka `http://localhost:8888`. `npm run dev` biasa juga bisa buat ngerjain UI doang, tapi halaman yang butuh data (`/login`, `/profile`, admin) gak jalan karena `/api/*` gak ada yang serve.

## 4. Cara Kerja Fitur

**Login/Daftar** (`/login`) — customer isi no WA, sistem cek nomornya dan nunjukin salah satu dari 3 form:
- Nomor baru → Daftar (nama + PIN 6 angka + konfirmasi)
- Nomor ada tapi belum punya PIN (biasanya hasil import data lama, lihat bagian 8) → Bikin PIN Baru
- Nomor ada & udah punya PIN → Masuk (PIN aja)

PIN di-hash bcrypt (`pinHash` di `Customer`, bukan plain text). 5x salah PIN berturut-turut = akun kekunci 15 menit. Kalau customer lupa PIN, admin reset dari tab Pelanggan.

**Mulai Sewa** (`/sewa`, wajib login) — form: nama, meet point (dropdown, sumbernya sama kayak Price List di `src/lib/pricelist.js`), durasi (opsi berubah sesuai meet point), tanggal pickup/return, dan DP 50% yang kehitung otomatis (disabled, gak bisa diketik manual). Tombol "Lanjutkan ke Pembayaran" simpen transaksi status Pending, buka WA ke admin (`VITE_ADMIN_WA_NUMBER` — ganti ke nomor asli sebelum deploy) dengan recap udah keisi, terus customer diarahin ke `/profile`. Bukan payment gateway beneran, DP & konfirmasi tetap manual di WA. Titik mulai kalau nanti mau nyambungin Midtrans/Xendit: `handleConfirm()` di `src/pages/Sewa.jsx`.

Status transaksi: Pending → Booked (admin terima bukti DP) → Ongoing (kamera diambil) → Completed, dan Cancelled bisa dari status manapun. Badge warnanya di `src/lib/status.js`.

**Profile Saya** (`/profile`) — kartu loyalitas (progress poin, 4 stempel = reward), riwayat sewa, QR pribadi. QR encode `https://situs-lo.com/login?ref=<id-customer>`, kalau ada yang scan & daftar lewat link itu otomatis kecatet sebagai referral.

**Kontak support** — link IG (`VITE_INSTAGRAM_URL`) dan WA (`VITE_ADMIN_WA_NUMBER`, pesannya beda dari `/sewa`) di navbar dan footer, sumbernya satu di `src/lib/contact.js`.

**Admin** (path diatur `VITE_ADMIN_PATH`, default `/admin`, login No WA + PIN, cek lawan `ADMIN_ALLOWED_PHONES` & `ADMIN_PIN`) — 3 tab:
- **Catat Transaksi** — cari customer by WA, isi alamat/kota/zona/tanggal/biaya/denda/status. Preview HPP & margin langsung kelihatan.
- **Laporan** — rekap semua transaksi, HPP per zona/Margin/Margin % dihitung otomatis (fix cost kamera ~Rp35.700 + ongkos motor ~Rp925/km). Filter per zona & status, summary card, export CSV, edit/hapus per baris.
- **Pelanggan** — cari customer, lihat jumlah transaksi, edit nama/WA langsung. Kalau nomor udah kepake customer lain, sistem nawarin gabung akun. Bisa hapus customer kalau belum ada transaksi.

Formula HPP di `src/lib/hpp.js` kalau mau di-tweak. Session admin (JWT) disimpen di `sessionStorage`, jadi ilang begitu tab ditutup, expired otomatis 7 hari. Tombol Kunci di pojok kanan atas buat logout manual.

Reward loyalty/referral (potongan 15K, upgrade durasi, dll) belum otomatis motong harga karena checkout-nya masih manual lewat WA — pas customer klaim, admin cek kartu di web terus diterapin manual pas closing.

## 5. Struktur Backend

```
netlify/functions/
  api.js              # satu Express app, semua route /api/*
  models/
    Customer.js        # nama, telp (unique), pinHash, pinFailCount, pinLockedUntil, referredBy
    Transaction.js      # customerId, zona, biaya, denda, dst.
  routes/               # satu file per grup endpoint (adminLogin.js, customerAuthEntry.js, dst.)
  utils/
    db.js               # cached Mongoose connection
    serialize.js         # ubah dokumen Mongo jadi bentuk field lama
    adminAuth.js          # issueAdminSession + requireAdmin (JWT admin)
    customerAuth.js        # sama tapi buat customer
    telegram.js             # notif Telegram ke admin
    webpush.js               # push notification
```

Endpoint publik:
- `POST /customers/login` — WA+PIN, balikin `needsPin`/404 kalau harus daftar/bikin PIN dulu
- `POST /customers/register`, `POST /customers/set-pin`
- `GET /customers/:id`, `GET /customers/:id/transactions`, `GET /customers/:id/referrals`
- `PATCH /customers/:id`
- `POST /customers/:id/transactions/pending`
- `POST /customers/:id/testimonials`, `GET /testimonials`
- `POST/DELETE /customers/:id/push/subscribe|unsubscribe`
- `GET /availability/booked-dates`, `GET /geocode-distance`

Endpoint admin (butuh session token):
- `POST /admin/login`
- `GET /admin/customers`, `GET /admin/customers/:id`, `PATCH /admin/customers/:id`, `DELETE /admin/customers/:id`
- `POST /admin/customers/merge`, `POST /admin/customers/:id/reset-pin`
- `GET /admin/transactions`, `POST /admin/transactions`, `PATCH/DELETE /admin/transactions/:id`
- `GET /admin/testimonials`, `PATCH/DELETE /admin/testimonials/:id`
- `POST/DELETE /admin/push/subscribe|unsubscribe`, `GET /admin/geocode-distance`

## 6. Deploy ke Netlify

1. Push kode ini ke GitHub.
2. Login netlify.com pakai akun GitHub.
3. Add new site → Import an existing project, pilih repo ini. `netlify.toml` udah nyeting build command, publish dir, functions.
4. Site settings → Environment variables, tambahin semua var dari `.env.example` (isi sama kayak lokal).
5. Deploy — Netlify kasih domain gratis `namaproject.netlify.app`.

Netlify free tier: 300 kredit/bulan (~15GB bandwidth + compute), lebih dari cukup buat traffic toko rental kecil. Kalau abis, situs berhenti sampe bulan depan, bukan auto-charge.

## 7. Import Data Lama dari Google Sheets

2 langkah: pertama beresin format otomatis, kedua isi manual nomor WA & zona yang lo tau.

```bash
node scripts/parse-legacy-csv.js "path/ke/laporan-asli.csv" scripts/legacy-template.csv
```

Otomatis konversi tanggal/rupiah Indonesia, skip baris kosong & "Unavailable". Hasilnya `legacy-template.csv` dengan kolom `telp` dan `zona` kosong (sheet lama emang gak nyatet dua itu).

Buka file itu di Excel/Sheets, isi manual:
- `telp`: nomor WA asli kalau tau, format bebas (08xx atau 62xx, otomatis dirapihin). Format kolomnya sebagai Text dulu sebelum ngetik, biar Excel gak mangkas angka 0 di depan atau ubah ke notasi ilmiah — `import-csv.js` warning kalau kejadian, tapi lebih aman dicegah dari awal.
- `zona`: 1/2/3 (batas km di `src/lib/hpp.js`), kalau tau.

Baris yang dilewatin tetap ke-import, efeknya beda doang. Jalanin:

```bash
node --env-file=.env scripts/import-csv.js scripts/legacy-template.csv
```

Isi nomor WA asli → transaksi nempel ke akun itu (dibikin baru kalau belum ada), customer tinggal login pakai WA yang sama dan bikin PIN, histori & poin langsung muncul. Kosongin → transaksi nempel ke customer sementara `legacy-<nama>` (gak bisa login), nanti tinggal edit telp-nya dari Admin → Pelanggan; kalau nomor itu udah dipake akun lain, sistem nawarin gabung otomatis.

Zona kosong/salah default ke Zona 1, jadi HPP/margin baris itu di Laporan cuma perkiraan kasar. Biaya & denda tetap persis dari sheet. Baris import ditandain badge "legacy" di Laporan.

Script `import-csv.js` aman dijalanin berkali-kali — transaksi yang udah pernah masuk (dicek dari `legacy_order_id`) gak bakal dobel.

## 8. Batasan

- Login WA+PIN cukup buat loyalty tracking, tapi bukan level keamanan bank (gak ada OTP/2FA) — jangan simpen data sensitif kayak pembayaran langsung di akun.
- MongoDB network access dibuka `0.0.0.0/0` karena IP Netlify Function dinamis. Aman selama `MONGODB_URI` cuma ada di env var server.
- Form Sewa belum nyambung payment gateway — DP & konfirmasi tetap manual di WA.
- Reward promo diterapin manual, bukan otomatis motong harga saat checkout.

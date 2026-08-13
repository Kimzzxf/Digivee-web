# Digivee Web — Loyalty Card & Referral QR

Website editorial-magazine buat Digivee: landing page + price list + login WA & PIN 6 angka +
formulir sewa online + kartu loyalitas dengan QR referral. Semua servis yang dipakai **gratis**
(free tier), nggak ada biaya bulanan selama traffic-nya masih skala kecil kayak sekarang.

## Stack

- React + Vite + TailwindCSS (palet earthy 60-30-10: paper `#F4EAE1` Warm Sand, ink `#3A4032` Olive
  Night, pink `#FF8DA1` Rose Pink CTA accent, sand/smoke `#A3B19B` Sage Green)
- Lenis (smooth scroll di landing page) + Framer Motion (micro-interaction)
- **Backend**: Express di dalam satu Netlify Function (`netlify/functions/api.js`), diakses lewat
  `/api/*` dari frontend
- **Database**: MongoDB Atlas, cluster **M0 (free forever, 512MB)**, diakses lewat Mongoose
- QR code: `qrcode.react`

Kenapa butuh backend (bukan connect langsung dari browser kayak dulu di Supabase)? MongoDB nggak
punya cara aman buat diakses langsung dari client JS — connection string bakal ke-expose ke siapa
aja yang buka DevTools. Jadi semua query lewat function di `netlify/functions/api.js`, dan browser
cuma manggil endpoint `/api/...`.

## 1. Setup MongoDB Atlas (gratis)

1. Daftar di [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas/register) (gratis, gak perlu kartu kredit).
2. Bikin cluster baru, pilih tier **M0 Free**, region terdekat (Singapore).
3. Di **Database Access**, bikin database user (username + password, auto-generate juga boleh).
4. Di **Network Access**, tambahin IP `0.0.0.0/0` (allow dari mana aja) — buat project kecil kayak
   ini nggak masalah, karena akses tetap butuh username+password yang cuma ada di environment
   variable server, bukan di client.
5. Klik **Connect** → **Drivers** → copy connection string-nya (bentuknya
   `mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/...`).

## 2. Setup Environment Variables

```bash
cp .env.example .env
```

Isi `.env`:
```
MONGODB_URI=mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/digivee?retryWrites=true&w=majority
ADMIN_PIN=<PIN 6 angka shared buat semua admin>
ADMIN_ALLOWED_PHONES=<nomor WA admin yang boleh login, format 62xxxxxxxxxxx, pisah koma kalau lebih dari satu>
ADMIN_SESSION_SECRET=<string acak panjang, misal hasil `openssl rand -hex 32`>
CUSTOMER_SESSION_SECRET=<string acak panjang lain, jangan sama kayak ADMIN_SESSION_SECRET>
TELEGRAM_BOT_TOKEN=<opsional — token bot Telegram buat notif order baru & backup harian ke admin>
TELEGRAM_ADMIN_CHAT_ID=<opsional — chat id admin, pisah koma kalau lebih dari satu>
VAPID_PUBLIC_KEY=<opsional — push notification, hasil `npx web-push generate-vapid-keys`>
VAPID_PRIVATE_KEY=<opsional — pasangan private key dari command di atas>
VAPID_SUBJECT=<opsional — mailto:email-lu@domain.com>
DIGIVEE_BASE_LAT=<opsional — koordinat toko, buat hitung jarak/zona>
DIGIVEE_BASE_LNG=<opsional — koordinat toko, buat hitung jarak/zona>
VITE_ADMIN_PATH=<opsional — ganti path halaman admin dari default /admin, misal ke sesuatu yang gak gampang ditebak>
VITE_ADMIN_WA_NUMBER=<nomor WA admin, format 62xxxxxxxxxxx — dipakai tombol "Lanjutkan ke Pembayaran" DAN tombol WA "hubungi admin" di navbar/footer>
VITE_INSTAGRAM_URL=<link Instagram Digivee, dipakai tombol Instagram di navbar/footer, misal https://instagram.com/digivee_krw>
VITE_CLOUDINARY_CLOUD_NAME=<cloud name Cloudinary, buat upload foto>
VITE_CLOUDINARY_UPLOAD_PRESET=<upload preset Cloudinary (unsigned)>
VITE_VAPID_PUBLIC_KEY=<sama persis kayak VAPID_PUBLIC_KEY di atas — dipakai browser buat subscribe push>
```

Penting: `MONGODB_URI`, `ADMIN_PIN`, `ADMIN_ALLOWED_PHONES`, `ADMIN_SESSION_SECRET`,
`CUSTOMER_SESSION_SECRET`, `TELEGRAM_BOT_TOKEN`, dan `VAPID_PRIVATE_KEY`
**sengaja nggak diawalin `VITE_`**. Prefix `VITE_` bikin Vite nge-bundle nilainya ke JS yang
dikirim ke browser (ketauan siapa aja yang buka DevTools) — ini yang dulu jadi lubang keamanan
di versi Supabase (`VITE_ADMIN_PASSCODE` kebaca di source JS). Sekarang admin login lewat form
**No WA + PIN**, sama pola-nya kayak login customer: server yang ngecek nomor lawan
`ADMIN_ALLOWED_PHONES` dan PIN lawan `ADMIN_PIN`, ada lockout per-IP & per-nomor kalau salah
berkali-kali, baru keluar session token JWT (`ADMIN_SESSION_SECRET`). `VITE_ADMIN_PATH`,
`VITE_ADMIN_WA_NUMBER`, `VITE_INSTAGRAM_URL`, `VITE_CLOUDINARY_*`, dan `VITE_VAPID_PUBLIC_KEY`
beda cerita — semuanya emang didesain buat publik/client-side (path admin cuma nyamarin URL,
bukan gerbang keamanan sebenarnya; VAPID public key & Cloudinary preset emang non-secret by
design), jadi sengaja dikasih prefix `VITE_`.

## 3. Jalanin Lokal

Karena sekarang ada backend (Netlify Function), pakai **Netlify CLI** biar frontend + function
jalan bareng dan saling nyambung:

```bash
npm install
npm install -g netlify-cli   # sekali aja, kalau belum ada
npm run dev:full             # = netlify dev
```

Buka URL yang dikasih terminal (biasanya `http://localhost:8888`). Kalau cuma mau ngerjain UI
tanpa backend, `npm run dev` (vite biasa) tetap bisa, tapi halaman yang butuh data (`/login`,
`/profile`, halaman admin) nggak akan jalan karena `/api/*` belum ada yang serve.

## 4. Cara Kerja Fitur

**Login/Daftar** (`/login`) — 2 langkah. Langkah 1: customer isi no WA aja. Sistem cek nomornya
ke database, terus otomatis nunjukin salah satu dari 3 form ini:
- **Nomor baru** → form Daftar (nama + PIN 6 angka + konfirmasi PIN).
- **Nomor ada, tapi belum punya PIN** (misal hasil import data lama yang telp-nya udah diisi
  asli, lihat bagian 8) → form Bikin PIN Baru (PIN + konfirmasi, nama udah otomatis ke-detect).
- **Nomor ada & udah punya PIN** → form Masuk (PIN aja).

PIN di-hash pakai bcrypt sebelum disimpen (kolom `pinHash` di `Customer`, bukan plain text). Ada
proteksi brute-force: 5x salah PIN berturut-turut → akun dikunci 15 menit. Kalau customer lupa
PIN, admin bisa reset dari tab **Pelanggan** (tombol ikon kunci) — abis direset, customer disuruh bikin
PIN baru lagi pas login berikutnya.

**Mulai Sewa** (`/sewa`, wajib login — tombol "MULAI SEWA" di landing otomatis ngarahin ke
`/login?next=/sewa` dulu kalau belum masuk) — formulir: nama, meet point (dropdown, sinkron sama
`src/lib/pricelist.js` — sumber harga yang sama dipakai juga di Price List landing page), durasi
sewa (opsinya berubah sesuai meet point yang dipilih), tanggal pickup & return, dan Jumlah/DP
(50%) yang kehitung otomatis begitu durasi dipilih — dua field ini disabled, nggak bisa diketik
manual. Tombol **"Lanjutkan ke Pembayaran"** validasi form dulu, nyimpen transaksi berstatus
**Pending**, terus buka WhatsApp ke nomor admin (`VITE_ADMIN_WA_NUMBER` di `.env` — **ganti ke
nomor asli sebelum deploy**) di tab baru dengan recap pesanan udah keisi otomatis di kolom pesan
— dan begitu tab WA itu kebuka, formulirnya otomatis "ketutup" (customer diarahkan langsung ke
`/profile`) biar bisa langsung lihat pesanan barusan nongol di Riwayat Sewa. Ini bukan payment
gateway beneran — pembayaran DP & konfirmasi tetap manual lewat WA, cuma formulirnya yang
otomatis. Kalau nanti mau nyambungin ke payment gateway (Midtrans/Xendit dll), titik mulainya di
`handleConfirm()` dalam `src/pages/Sewa.jsx`.

Status transaksi jalan dari **Pending** (baru submit form, belum ada konfirmasi apa-apa) →
**Booked** (admin udah terima bukti bayar DP di WA, tapi belum tanggal ambil — diset manual dari
tab **Catat Transaksi**/**Laporan**) → **Ongoing** (kamera udah diambil) → **Completed** (udah
balik), dengan **Cancelled** bisa dipilih dari status manapun. Admin dan customer (di halaman
Profile) sama-sama lihat status yang sama, badge warnanya didefinisikan sekali di
`src/lib/status.js`.

**Profile Saya** (`/profile`) — nampilin kartu loyalitas (progress poin, 4 stempel = reward),
riwayat sewa lengkap sama status badge-nya (Pending/Booked/Ongoing/Completed/Cancelled), dan QR
code pribadi. QR itu encode link `https://situs-lu.com/login?ref=<id-customer>` — kalau
orang lain scan & daftar lewat link itu, otomatis kecatet sebagai referral dari customer itu.

**Kontak support** — link Instagram (`VITE_INSTAGRAM_URL`) dan WhatsApp (`VITE_ADMIN_WA_NUMBER`,
pesannya beda dari yang di `/sewa`) ada di navbar (bar atas + menu hamburger) dan footer landing
page, dikelola dari `src/lib/contact.js` biar nomor/link-nya satu sumber aja.

**Admin** (path-nya diatur `VITE_ADMIN_PATH` di `.env`, default `/admin` — dikunci form **No WA +
PIN admin**, cuma nomor yang ada di `ADMIN_ALLOWED_PHONES` & PIN yang cocok sama `ADMIN_PIN` yang
bisa masuk, ada lockout kalau salah berkali-kali) — ada 3 tab:
- **Catat Transaksi** — cari customer by no WA, isi alamat/kota/zona/tanggal sewa & kembali/biaya/
  denda/payment/status (Pending/Booked/Ongoing/Completed/Cancelled). Preview HPP & margin langsung
  kelihatan sebelum disimpan.
- **Laporan** — rekap semua transaksi kayak sheet lu tapi otomatis: kolom Lama Sewa, Total Biaya,
  **HPP per zona, Margin, dan Margin %** dihitung otomatis (pakai angka HPP riil hasil breakdown
  kita: fix cost kamera ~Rp35.700 + ongkos motor ~Rp925/km). Ada filter per zona & status (termasuk
  **Booked**), summary card (total revenue/HPP/margin/rata-rata margin), tombol **Export CSV**, dan
  tombol ikon pensil/tempat sampah per baris buat edit atau hapus transaksi (misal salah input
  biaya atau zona).
- **Pelanggan** — cari customer by nama/no WA, lihat jumlah transaksi tiap orang, dan **edit nama
  atau nomor WA langsung dari sini** (nggak perlu buka MongoDB Atlas). Kalau nomor yang diketik
  udah kepake sama customer lain, sistem nawarin gabungin dua akun jadi satu (transaksinya
  dipindah semua, akun lama kehapus). Bisa hapus customer juga, asal belum punya transaksi.

Formula HPP ada di `src/lib/hpp.js` kalau nanti mau di-tweak (misal harga bensin naik, motor
ganti, atau harga kamera update).

Sesi admin (token JWT setelah login WA+PIN sukses) disimpen di `sessionStorage` browser (bukan
localStorage) — jadi otomatis "lupa" kalau tab-nya ditutup, dan expired otomatis abis 7 hari
walau tab-nya tetep kebuka. Ada tombol **Kunci** di pojok kanan atas panel admin buat logout
manual.

**Reward loyalty/referral** (potongan 15K, upgrade durasi, dll) belum otomatis diterapin ke
harga — soalnya transaksinya tetap COD manual lewat WA, bukan checkout online. Cara pakainya:
pas customer bilang mau klaim reward, lu cek kartu mereka di web (atau minta mereka screenshot),
baru diterapin manual pas closing di WA. Otomatisasi penuh baru worth dibikin kalau nanti ada
sistem booking online beneran.

## 5. Struktur Backend

```
netlify/functions/
  api.js              # satu Express app, semua route /api/*
  models/
    Customer.js        # Mongoose schema: nama, telp (unique), pinHash, pinFailCount, pinLockedUntil, referredBy
    Transaction.js      # Mongoose schema: customerId, zona, biaya, denda, dst.
  utils/
    db.js               # cached Mongoose connection (biar hemat koneksi di serverless)
    serialize.js         # ubah dokumen Mongo jadi bentuk yang sama kayak field lama
    adminAuth.js          # verifikasi session JWT admin (issueAdminSession + requireAdmin)
```

Endpoint yang ada:
- `POST /api/customers/check-phone` — cek nomor WA, balikin flow mana yang harus ditampilin (publik)
- `POST /api/customers/register` — daftar akun baru, nama+telp+PIN (publik)
- `POST /api/customers/set-pin` — bikin PIN buat akun yang ada tapi belum punya PIN (publik)
- `POST /api/customers/login` — masuk pakai telp+PIN, ada lockout 5x salah (publik)
- `GET /api/customers/:id` — profil customer (publik)
- `GET /api/customers/:id/transactions` — riwayat sewa customer (publik)
- `POST /api/admin/google-verify` — verifikasi credential Google Sign-In, cek `ADMIN_ALLOWED_EMAILS`, balikin session token
- `GET /api/admin/customers/by-phone/:telp` — cari customer buat dicatetin transaksi (admin)
- `GET /api/admin/customers?q=` — cari/list customer buat tab Pelanggan (admin)
- `PATCH /api/admin/customers/:id` — edit nama/telp customer (admin)
- `POST /api/admin/customers/merge` — gabungin 2 customer jadi 1 (admin)
- `POST /api/admin/customers/:id/reset-pin` — reset PIN customer yang lupa (admin)
- `DELETE /api/admin/customers/:id` — hapus customer, cuma kalau 0 transaksi (admin)
- `POST /api/admin/transactions` — catat transaksi baru (admin)
- `GET /api/admin/transactions` — data buat halaman Laporan (admin)
- `PATCH /api/admin/transactions/:id` — edit transaksi (admin)
- `DELETE /api/admin/transactions/:id` — hapus transaksi (admin)

## 6. Deploy Gratis ke Netlify

1. Push kode ini ke GitHub (bikin repo baru, gratis).
2. Daftar/login di [netlify.com](https://netlify.com) pakai akun GitHub (gratis).
3. **Add new site → Import an existing project**, pilih repo ini. Netlify otomatis kebaca
   `netlify.toml` (build command, publish dir, folder functions udah keset).
4. Di **Site settings → Environment variables**, tambahin `MONGODB_URI`, `GOOGLE_CLIENT_ID`,
   `ADMIN_ALLOWED_EMAILS`, `ADMIN_SESSION_SECRET`, `VITE_GOOGLE_CLIENT_ID`, dan
   `VITE_ADMIN_WA_NUMBER` (isi yang sama kayak di `.env` lokal). Jangan lupa balik ke Google
   Cloud Console dan tambahin domain Netlify lu ke **Authorized JavaScript origins** (langkah 2b).
5. Deploy — Netlify kasih domain gratis `namaproject.netlify.app`. Custom domain bisa nanti kalau
   mau (domainnya berbayar, tapi hosting + function-nya tetap gratis di skala kecil kayak ini).

Netlify free tier: 300 kredit/bulan (kira-kira 15GB bandwidth + compute function), lebih dari
cukup buat traffic toko rental kecil. Kalau kepake abis, situsnya berhenti sampai bulan depan —
bukan otomatis nge-charge.

## 8. Import Data Lama dari Google Sheets (biar poin loyalitas customer lama kehitung)

Prosesnya 2 langkah — langkah 1 otomatis beresin format, langkah 2 lo isi manual nomor WA & zona
yang lo tau, baru masuk ke database:

**Langkah 1 — beresin format sheet lama jadi template CSV:**

```bash
node scripts/parse-legacy-csv.js "path/ke/laporan-asli.csv" scripts/legacy-template.csv
```

Ini otomatis konversi tanggal/rupiah Indonesia jadi format standar, skip baris kosong & baris
"Unavailable" (slot kalender kosong, bukan transaksi beneran). Hasilnya `legacy-template.csv`
dengan kolom `telp` dan `zona` **sengaja dikosongin** — sheet lama emang nggak nyatet dua itu.

**Langkah 2 — buka `legacy-template.csv` di Excel/Sheets, isi manual:**
- Kolom `telp`: nomor WA asli customer, **kalau lo tau**. `08xxxxxxxxxx` atau `62xxxxxxxxxxx`
  sama-sama boleh — otomatis dirapihin ke format `62` pas diimpor. **Penting**: format kolom
  `telp` sebagai **Text** dulu di Excel/Sheets sebelum mulai ngetik (klik kolom → klik kanan →
  Format Cells → Text), soalnya kalau nggak, Excel bisa mangkas angka `0` di depan atau ubah
  nomornya jadi notasi ilmiah pas disimpen. Script `import-csv.js` sekarang otomatis ngedeteksi &
  nge-warning dua kasus itu di ringkasan akhir kalau kejadian, tapi lebih aman dicegah dari awal.
- Kolom `zona`: `1`, `2`, atau `3` (batas km-nya ada di `src/lib/hpp.js`), **kalau lo tau**.

Nggak wajib isi semua baris — baris yang lo lewatin tetap ke-import, cuma efeknya beda (lihat di
bawah). Simpan filenya, terus jalanin:

```bash
node --env-file=.env scripts/import-csv.js scripts/legacy-template.csv
```

**Yang kejadian tergantung lo isi kolom `telp` atau nggak:**
- **Lo isi nomor WA asli** → transaksi itu langsung nempel ke akun dengan nomor itu (dibikin baru
  kalau belum ada). Begitu customer itu buka `/login` pakai WA yang sama, sistem otomatis nemuin
  akunnya (belum punya PIN) dan nyuruh dia bikin PIN baru — abis itu histori sewa & poin
  loyalitasnya langsung muncul di Profile Saya. **Nggak perlu merge manual sama sekali.**
- **Lo kosongin** → transaksi itu tetap ke-import, tapi nempel ke customer sementara dengan telp
  palsu `legacy-<nama>` (bukan akun yang bisa login). Kalau nanti lo tau nomor WA aslinya, tinggal
  buka **Admin → tab Pelanggan**, cari `legacy-<nama>` itu, klik ikon pensil (**Edit**), ganti telp-nya jadi
  nomor asli. Kalau nomor itu ternyata udah dipakai akun lain (misal orangnya udah sempet daftar
  sendiri lewat web), sistem otomatis nawarin tombol **"Gabungkan ke akun itu"** — riwayat sewa
  lama & baru langsung nyatu, poin loyalitasnya ikut kehitung juga.

Kolom `zona` yang dikosongin/salah default ke Zona 1 (paling murah) supaya nggak ngasal nebak —
HPP/margin baris ini di Laporan admin jadi cuma perkiraan kasar, bukan angka final. Biaya & denda
aslinya tetap kesimpen persis dari sheet, nggak kepengaruh. Baris hasil import ditandain badge
kecil "legacy" di tabel Laporan biar gampang dibedain.

Script `import-csv.js` aman dijalanin berkali-kali — transaksi yang udah pernah diimpor (dicek
dari `legacy_order_id`) nggak bakal dobel, jadi kalau lo nambah nomor WA buat beberapa baris lagi
belakangan, tinggal update `legacy-template.csv` dan jalanin ulang langkah 2, bukan mulai dari nol.

## 9. Batasan yang Perlu Disadari

- **Login WA + PIN** cukup buat loyalty tracking (PIN di-hash bcrypt, ada lockout brute-force) —
  tetap bukan level keamanan bank (nggak ada OTP/2FA), jadi jangan dipakai nyimpen data sensitif
  kayak pembayaran langsung di akun.
- **Network access MongoDB dibuka `0.0.0.0/0`** supaya Netlify Function (yang IP-nya dinamis) bisa
  connect. Aman selama `MONGODB_URI` (username+password) cuma ada di environment variable server,
  nggak pernah dikirim ke client.
- **Formulir Sewa (`/sewa`) belum nyambung ke payment gateway** — "Lanjutkan ke Pembayaran" nyimpen
  transaksi berstatus **Pending** (best-effort — kalau gagal kesimpen, tetap lanjut ke WA) terus
  buka WhatsApp admin dengan recap pesanan; pembayaran DP & konfirmasi tetap manual di WA. Admin
  tinggal cari baris **Pending** itu di tab **Laporan**/**Catat Transaksi** dan geser statusnya ke
  **Booked** (bukti bayar udah masuk) lalu **Ongoing**/**Completed**, nggak perlu input ulang dari
  nol.
- **Reward promo diterapin manual**, bukan otomatis motong harga saat checkout (karena nggak ada
  sistem pembayaran online).

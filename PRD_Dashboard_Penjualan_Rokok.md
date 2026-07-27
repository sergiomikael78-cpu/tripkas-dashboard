# PRD — Dashboard Pencatatan Penjualan Rokok (Jastip Trip-Based)
**Nama kerja produk:** TripKas
**Versi dokumen:** 1.0 (Final, siap eksekusi)
**Ditujukan untuk:** Tim coding / AI coding agent (Antigravity)
**Status:** Final — seluruh keputusan produk sudah diambil, tidak ada open question yang menunggu klarifikasi pemilik produk.

---

## 0. Asumsi yang Digunakan

Karena brief awal meminta agar tidak ada pertanyaan klarifikasi, seluruh area abu-abu diselesaikan dengan asumsi berikut. Asumsi ini adalah bagian resmi dari PRD dan mengikat untuk tim coding:

1. Mata uang transaksi adalah **IDR** sebagai mata uang utama pencatatan modal/harga beli (karena barang dan supplier ada di Indonesia), dengan opsi field tambahan untuk mencatat kurs/nilai AUD jika suatu saat pemilik ingin merekonsiliasi biaya trip dari Australia. MVP hanya menyimpan satu mata uang aktif per transaksi (default IDR), multi-currency penuh masuk *Future Enhancement*.
2. "Trip" didefinisikan sebagai satu siklus pengambilan barang dari Indonesia (window waktu dengan tanggal mulai dan tanggal selesai/kepulangan), bukan satu pengiriman per paket.
3. Owner adalah pemilik tunggal akun bisnis (single tenant per keluarga bisnis), dan Partner/Staff adalah user yang diundang ke dalam tenant yang sama — bukan model multi-tenant SaaS publik. Arsitektur tetap dirancang siap untuk multi-tenant di masa depan (lihat Non-Goals & Future Enhancements).
4. Piutang (belum lunas) adalah kondisi nyata dalam bisnis ini (jual ke warung sering bayar belakangan), sehingga status pembayaran per transaksi penjualan adalah kebutuhan MVP, bukan fitur lanjutan.
5. Approval workflow (misalnya partner harus approve sebelum data masuk laporan resmi) **tidak** masuk MVP — semua role yang diberi akses input dianggap tepercaya, dikontrol lewat audit log, bukan lewat approval berlapis.
6. Notifikasi push/WhatsApp/email **tidak** masuk MVP — cukup ditampilkan di dashboard (in-app alerts), karena kompleksitas infrastruktur notifikasi tidak sepadan dengan nilai di tahap awal.
7. Barcode/QR scanning untuk produk **tidak** masuk MVP karena rokok dijual per pak/slop dengan variasi harga manual, bukan retail SKU-scan volume tinggi.

---

## 1. Executive Summary

TripKas adalah dashboard pencatatan bisnis untuk operasi jastip rokok lintas Australia–Indonesia. Pemilik bisnis bekerja di Australia dan menjalankan bisnis sampingan: membeli rokok dari beberapa supplier di Indonesia setiap kali melakukan trip pulang, lalu menjual produk tersebut ke teman-teman dan warung.

Masalah inti yang diselesaikan bukan sekadar "mencatat penjualan", tapi **merekonsiliasi tiga dimensi sekaligus dalam satu alur kerja**: *trip* (kapan barang datang dan dari mana biayanya berasal), *supplier* (dari siapa barang dibeli dan berapa modalnya), dan *produk* (apa yang terjual, ke siapa, dengan harga berapa). Pencatatan manual (chat WhatsApp, Excel terpisah, atau ingatan) membuat pemilik kehilangan visibilitas atas profit per trip, stok yang tercecer, dan piutang yang menumpuk dari warung langganan.

Nilai utama TripKas:
- **Satu sumber kebenaran** untuk stok, modal, dan laba, terstruktur berdasarkan trip dan supplier — bukan sekadar buku kas datar.
- **Mobile-first**, karena input transaksi sebagian besar terjadi di lapangan (saat antar barang ke warung, saat closing dengan teman) menggunakan HP, sementara review laporan dan pengaturan dilakukan lebih nyaman di desktop.
- **Siap kolaborasi**, karena pemilik berencana melibatkan partner — sistem izin akses dirancang sejak awal, bukan ditambahkan belakangan sebagai tambalan.
- **Siap tumbuh**, dari satu orang dengan 2 supplier menjadi operasi dengan banyak supplier/grosir dan beberapa partner, tanpa migrasi ulang struktur data.

---

## 2. Problem Statement

Kondisi saat ini (pencatatan manual/tercecer) menimbulkan masalah nyata:

- **Modal dan stok tidak sinkron per trip.** Ketika barang dari trip 1 dan trip 2 bercampur di catatan yang sama, pemilik tidak bisa menjawab pertanyaan sederhana: "Trip terakhir untung berapa?"
- **Histori pembelian per supplier hilang.** Ketika supplier bertambah, tidak ada cara cepat melihat supplier mana yang harga belinya lebih kompetitif atau siapa yang paling sering dipakai.
- **Piutang warung tidak terlacak sistematis.** Warung sering bayar belakangan; tanpa status pembayaran yang jelas, uang yang "seharusnya sudah masuk" tidak kelihatan sebagai risiko cash flow.
- **Stok riil vs stok tercatat berbeda.** Tanpa riwayat pergerakan stok (masuk, keluar, penyesuaian), selisih stok tidak bisa ditelusuri penyebabnya.
- **Tidak siap kolaborasi.** Catatan pribadi di HP/Excel tidak bisa diakses aman oleh partner tanpa risiko data tercampur atau disalahgunakan.
- **Laporan laba/rugi manual rentan salah hitung**, terutama ketika harus memisahkan modal barang, ongkos trip, dan pengeluaran operasional lain.

TripKas mengubah pencatatan yang reaktif dan tercecer menjadi sistem yang terstruktur, auditable, dan bisa diakses tim.

---

## 3. Goals and Non-Goals

### Goals (Fase Awal / MVP + Phase 2)
- Mencatat seluruh siklus barang: trip → pembelian dari supplier → stok → penjualan → pengeluaran → laba/rugi.
- Memberikan visibilitas profit per trip, per produk, per supplier, dan per customer.
- Mendukung banyak user dengan peran akses berbeda dalam satu ruang kerja bisnis yang sama.
- Optimal digunakan dari HP untuk input cepat di lapangan, dan nyaman digunakan dari desktop untuk analisis.
- Menyediakan audit trail dasar (siapa mengubah apa, kapan) untuk menjaga kepercayaan antar partner.

### Non-Goals (Sengaja Tidak Dikerjakan di Fase Awal)
- **Bukan aplikasi akuntansi penuh** (tidak menghasilkan neraca, jurnal umum, atau laporan pajak formal).
- **Bukan sistem POS kasir fisik** (tidak ada integrasi mesin kasir, printer struk, atau barcode scanner).
- **Bukan multi-tenant SaaS publik** di fase awal — sistem dibangun untuk satu entitas bisnis dengan banyak user internal, bukan untuk dijual sebagai layanan ke bisnis lain (meski arsitektur data dirancang agar migrasi ke arah itu tidak menyakitkan).
- **Bukan sistem manajemen gudang fisik** (tidak ada penempatan rak, lokasi fisik detail per unit barang).
- **Tidak menangani multi-currency penuh** (AUD/IDR) di MVP.
- **Tidak ada notifikasi otomatis (WhatsApp/email/push)** di MVP.

---

## 4. User Personas

### Persona 1 — Owner ("Bagas", pemilik bisnis)
Bekerja penuh waktu di Australia, menjalankan bisnis jastip rokok di sela waktu. Butuh melihat kondisi bisnis kapan saja dari HP saat istirahat kerja, dan melakukan analisis lebih dalam dari laptop di akhir pekan. Prioritas: kontrol penuh atas data finansial, kepercayaan terhadap akurasi stok dan laba, kemampuan memantau semua partner tanpa harus menagih laporan manual.

### Persona 2 — Partner ("Rani", rekan kerja sama)
Membantu operasional di Indonesia — misalnya menerima barang dari supplier, mengantar ke warung, atau menagih piutang. Butuh akses cepat dari HP untuk mencatat transaksi harian tanpa dibebani kompleksitas laporan finansial penuh. Prioritas: input transaksi cepat, tahu bagian keuntungannya sendiri (jika ada skema bagi hasil), tidak perlu (atau tidak diberi) akses ke seluruh data finansial sensitif seperti margin/modal jika ownership belum penuh dipercaya.

### Persona 3 — Staff/Helper (opsional, kebutuhan lanjutan)
Membantu hal teknis seperti antar barang atau input transaksi sederhana, tanpa perlu melihat laporan laba/rugi atau data modal. Prioritas: interface sesederhana mungkin, hanya menu yang relevan dengan tugasnya (catat penjualan, cek stok).

---

## 5. Core Use Cases

1. Owner memulai trip baru sebelum berangkat ke Indonesia, menetapkan tanggal dan catatan trip.
2. Owner/Partner mencatat pembelian dari supplier selama trip berlangsung — barang otomatis menambah stok yang terhubung ke trip tersebut.
3. Partner di lapangan mencatat penjualan ke warung langganan dalam hitungan detik dari HP, termasuk status "lunas" atau "belum lunas (piutang)".
4. Owner mencatat penjualan ke teman dengan harga yang mungkin berbeda dari harga standar warung.
5. Owner mencatat pengeluaran operasional trip (ongkos angkut, packing, dsb.) terpisah dari modal barang.
6. Owner membuka dashboard ringkasan dan langsung melihat: stok tersisa, profit trip berjalan, dan piutang yang belum tertagih.
7. Owner menganalisis laporan per supplier untuk memutuskan supplier mana yang harganya paling kompetitif.
8. Owner mengundang Partner baru dan menetapkan role akses sebelum partner mulai bekerja.
9. Owner meninjau audit log ketika ada selisih stok yang mencurigakan untuk mengetahui siapa yang terakhir mengubah data.
10. Owner/Partner melakukan penyesuaian stok manual saat ditemukan selisih fisik vs sistem, dengan wajib mengisi alasan.

---

## 6. Feature Scope

| Kategori | MVP (Fase 1) | Phase 2 | Future Enhancement |
|---|---|---|---|
| Trip | Buat/lihat/tutup trip, ringkasan profit per trip | Perbandingan antar trip (grafik) | Perkiraan biaya trip otomatis dari histori |
| Supplier | CRUD supplier, histori pembelian per supplier | Perbandingan harga antar supplier | Rating/skema supplier preferensi otomatis |
| Produk | CRUD produk, harga beli/jual default, stok per produk | Varian produk (per slop/pak/karton) | Kategori & tagging produk lanjutan |
| Pembelian | Catat pembelian dari supplier per trip | Import pembelian massal (CSV) | Kontrak harga khusus per supplier |
| Penjualan | Catat penjualan ke teman/warung, status lunas/piutang | Harga khusus per customer, diskon | Invoice PDF otomatis |
| Stok | Stok masuk/keluar otomatis dari transaksi, penyesuaian manual | Riwayat stok visual (grafik pergerakan) | Peringatan stok minimum otomatis |
| Pengeluaran | Catat pengeluaran per kategori (trip/operasional/lain) | Anggaran vs realisasi pengeluaran | Rekonsiliasi kurs AUD/IDR |
| Customer | CRUD customer (teman & warung), riwayat piutang | Rekap piutang per customer dengan status jatuh tempo | Reminder otomatis piutang |
| Multi-user | Role Owner/Admin/Partner/Staff, invite user | Custom permission granular per modul | Log aktivitas real-time/live feed |
| Laporan | Laba/rugi per trip, per produk, per supplier, per customer | Export laporan ke Excel/PDF | Dashboard analitik prediktif |
| Audit Log | Log dasar create/update/delete transaksi penting | Filter & pencarian log lanjutan | Rollback perubahan dari log |
| UI/UX | Mobile-first responsive, dark-friendly premium theme | Mode offline-first (PWA cache) | Widget kustomisasi dashboard per user |

**Prioritas MVP ditentukan dengan logika:** fitur yang menyentuh alur inti (trip → beli → stok → jual → laba) wajib ada di MVP karena tanpa itu produk tidak bernilai. Fitur yang meningkatkan *kenyamanan* (export, grafik lanjutan, invoice PDF) masuk Phase 2. Fitur yang bergantung pada skala/kepercayaan tinggi (custom permission granular, prediksi, integrasi eksternal) masuk Future.

---

## 7. Information Architecture / Struktur Menu

Menu disusun mengikuti **alur kerja natural bisnis**, bukan urutan alfabet — pemilik dan partner membaca dashboard dari "kondisi saat ini" menuju "detail operasional" lalu "analisis":

```
1. Dashboard (Ringkasan)         → kondisi bisnis hari ini, dilihat pertama kali dibuka
2. Trip                           → konteks waktu/siklus, jadi menu kedua karena semua data lain
                                     ditautkan ke trip
3. Penjualan                     → aktivitas paling sering dilakukan harian → prioritas akses cepat
4. Pembelian (Stock In)          → aktivitas kedua tersering, biasanya terjadi saat trip
5. Stok                          → hasil turunan dari penjualan+pembelian, dicek untuk keputusan cepat
6. Pengeluaran                   → mencatat biaya di luar barang
7. Produk                        → master data, jarang diubah harian
8. Supplier                      → master data
9. Customer                      → master data
10. Laba Rugi                    → hasil analisis gabungan
11. Laporan                      → laporan mendalam per dimensi (trip/produk/supplier/customer)
12. Tim & Akses (Multi-user)     → pengaturan kolaborasi
13. Audit Log / Aktivitas        → transparansi & kontrol
14. Pengaturan (Settings)        → profil, preferensi, kategori pengeluaran custom, dsb.
```

**Alasan urutan:** Dashboard dan Trip ditaruh paling atas karena keduanya adalah titik orientasi ("di mana saya sekarang" dan "trip mana yang sedang berjalan"). Penjualan diletakkan sebelum Pembelian karena frekuensi harian penjualan (terutama ke warung) lebih tinggi daripada pembelian yang hanya terjadi saat trip. Master data (Produk/Supplier/Customer) ditaruh di tengah-bawah karena diakses lebih jarang dibanding transaksi harian. Laporan dan Tim/Akses diletakkan di bagian bawah karena sifatnya reflektif/administratif, bukan operasional harian.

Pada mobile, navigasi utama (Dashboard, Penjualan, Pembelian, Stok, Menu Lainnya) ditempatkan di **bottom navigation bar** — 4 item inti + 1 tombol "Lainnya" yang membuka daftar menu penuh, karena mobile tidak cukup ruang untuk 14 menu sekaligus. Di desktop, seluruh menu tampil sebagai sidebar kiri yang bisa di-collapse.

---

## 8. User Flows

### 8.1 Login
1. User membuka aplikasi → melihat form login (email + password) atau opsi magic link.
2. Sistem memvalidasi kredensial via Supabase Auth.
3. Setelah berhasil, sistem memuat role & permission user, lalu mengarahkan ke Dashboard.
4. Jika gagal, tampilkan pesan error spesifik (email tidak terdaftar / password salah) tanpa membocorkan info sensitif berlebihan (mis. tidak menyebutkan "email tidak terdaftar" secara eksplisit demi keamanan — cukup "email atau password salah").

### 8.2 Tambah Trip
1. Owner/Admin membuka menu Trip → tekan "Trip Baru".
2. Isi: nama/kode trip (auto-suggest "Trip #4" berikutnya), tanggal mulai, tanggal estimasi selesai, catatan opsional.
3. Simpan → trip berstatus "Berjalan" dan otomatis menjadi trip aktif default untuk transaksi baru.
4. Saat trip selesai, user menekan "Tutup Trip" → status berubah "Selesai" dan ringkasan profit trip terkunci (read-only, tapi masih bisa dilihat).

### 8.3 Tambah Supplier
1. Buka menu Supplier → "Tambah Supplier".
2. Isi: nama supplier, kontak (opsional), catatan.
3. Simpan → supplier langsung tersedia sebagai pilihan di form Pembelian.

### 8.4 Tambah Produk
1. Buka menu Produk → "Tambah Produk".
2. Isi: nama produk, merek, varian (mis. isi 12/16/20 batang), harga beli default, harga jual default, satuan (pak/slop), stok awal (opsional, default 0), catatan.
3. Simpan → produk tersedia di form Pembelian dan Penjualan.

### 8.5 Pembelian Stok
1. Buka menu Pembelian → "Pembelian Baru".
2. Pilih trip aktif (default terisi otomatis, bisa diganti jika mencatat mundur), pilih supplier, pilih produk (bisa multi-item dalam satu transaksi pembelian), isi jumlah dan harga beli aktual (bisa berbeda dari harga default).
3. Simpan → sistem otomatis: (a) menambah stok produk, (b) mencatat entri Stock Movement tipe "IN", (c) menambah ke modal trip berjalan.

### 8.6 Penjualan
1. Buka menu Penjualan → "Penjualan Baru".
2. Pilih customer (atau buat baru inline jika belum ada), pilih produk (multi-item), isi jumlah dan harga jual (default terisi dari harga produk, bisa diedit manual untuk kasus harga khusus).
3. Pilih status pembayaran: **Lunas** atau **Piutang** (jika piutang, opsional isi estimasi tanggal bayar).
4. Simpan → sistem otomatis: (a) mengurangi stok, (b) mencatat Stock Movement tipe "OUT", (c) menghitung profit transaksi (harga jual − harga modal saat itu), (d) jika piutang, transaksi masuk daftar "Belum Lunas" pada dashboard.

### 8.7 Catat Pengeluaran
1. Buka menu Pengeluaran → "Tambah Pengeluaran".
2. Pilih kategori (Trip / Operasional Harian / Lainnya), isi nominal, tanggal, catatan, opsional kaitkan ke trip tertentu.
3. Simpan → otomatis mengurangi profit bersih pada laporan laba/rugi trip terkait (jika dikaitkan) atau laba/rugi periode umum.

### 8.8 Cek Stok
1. Buka menu Stok → melihat daftar produk dengan kolom: stok saat ini, stok masuk (periode ini), stok keluar (periode ini), nilai stok (estimasi modal tersisa).
2. Tekan salah satu produk → melihat riwayat pergerakan stok (Stock Movement log) lengkap dengan referensi transaksi asal.
3. Jika ditemukan selisih, user menekan "Penyesuaian Stok" → wajib isi alasan → sistem mencatat Stock Movement tipe "ADJUSTMENT" dan log ke Audit Log.

### 8.9 Lihat Laporan
1. Buka menu Laporan → pilih dimensi (Per Trip / Per Produk / Per Supplier / Per Customer / Per Partner).
2. Pilih rentang tanggal (default: bulan berjalan).
3. Sistem menampilkan ringkasan angka + grafik sederhana (bar/line) sesuai dimensi yang dipilih.

### 8.10 Tambah Partner / Multi-user
1. Owner buka menu Tim & Akses → "Undang User".
2. Isi email calon partner, pilih role (Admin/Partner/Staff).
3. Sistem mengirim undangan (di MVP: menghasilkan link/kode undangan yang dibagikan manual oleh Owner via WhatsApp — pengiriman email otomatis masuk Phase 2 jika dibutuhkan skala lebih besar).
4. Partner membuka link → membuat password → otomatis tergabung ke ruang kerja Owner dengan role yang ditetapkan.

---

## 9. Data Model / Entity Design

Struktur relasional, dirancang untuk PostgreSQL (Supabase). Semua tabel transaksi menyimpan `created_by`, `created_at`, `updated_at` untuk mendukung audit log.

### 9.1 `users`
| Field | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | dari Supabase Auth |
| full_name | text | |
| email | text | |
| avatar_url | text | nullable |
| workspace_id | uuid (FK → workspaces) | menautkan user ke ruang kerja bisnis |
| created_at | timestamptz | |

### 9.2 `workspaces`
Entitas ini sengaja ditambahkan **di luar permintaan eksplisit** karena krusial untuk masa depan multi-tenant (lihat Non-Goals) — satu `workspace` merepresentasikan satu entitas bisnis (misalnya bisnis milik Owner ini), sehingga jika suatu saat sistem dijual ke pemilik bisnis jastip lain, isolasi data sudah tersedia sejak awal tanpa migrasi ulang.
| Field | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | |
| name | text | nama bisnis |
| owner_id | uuid (FK → users) | |
| created_at | timestamptz | |

### 9.3 `roles` (fixed enum, bukan tabel dinamis di MVP)
`owner`, `admin`, `partner`, `staff` — disimpan sebagai kolom `role` di tabel `workspace_members`, bukan tabel terpisah, karena di MVP peran bersifat tetap (belum granular custom).

### 9.4 `workspace_members`
| Field | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | |
| workspace_id | uuid (FK) | |
| user_id | uuid (FK) | |
| role | enum('owner','admin','partner','staff') | |
| invited_by | uuid (FK → users) | nullable |
| joined_at | timestamptz | |

### 9.5 `trips`
| Field | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | |
| workspace_id | uuid (FK) | |
| code | text | contoh: "Trip #4" |
| start_date | date | |
| end_date | date | nullable saat masih berjalan |
| status | enum('running','closed') | |
| notes | text | nullable |
| created_by | uuid (FK) | |
| created_at | timestamptz | |

### 9.6 `suppliers`
| Field | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | |
| workspace_id | uuid (FK) | |
| name | text | |
| contact | text | nullable |
| notes | text | nullable |
| created_at | timestamptz | |

### 9.7 `products`
| Field | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | |
| workspace_id | uuid (FK) | |
| name | text | |
| brand | text | nullable |
| variant | text | mis. "isi 20" |
| unit | enum('pak','slop','karton') | |
| default_buy_price | numeric | |
| default_sell_price | numeric | |
| current_stock | numeric | denormalized, disinkron via trigger dari stock_movements |
| notes | text | nullable |
| is_active | boolean | untuk soft-delete produk lama |
| created_at | timestamptz | |

### 9.8 `customers`
| Field | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | |
| workspace_id | uuid (FK) | |
| name | text | |
| type | enum('teman','warung') | menentukan default perilaku harga/piutang |
| contact | text | nullable |
| notes | text | nullable |
| created_at | timestamptz | |

### 9.9 `purchases` (header transaksi pembelian)
| Field | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | |
| workspace_id | uuid (FK) | |
| trip_id | uuid (FK → trips) | |
| supplier_id | uuid (FK → suppliers) | |
| purchase_date | date | |
| notes | text | nullable |
| created_by | uuid (FK) | |
| created_at | timestamptz | |

### 9.10 `purchase_items`
| Field | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | |
| purchase_id | uuid (FK) | |
| product_id | uuid (FK) | |
| quantity | numeric | |
| buy_price | numeric | harga aktual saat itu (bisa beda dari default) |
| subtotal | numeric | generated: quantity × buy_price |

### 9.11 `sales` (header transaksi penjualan)
| Field | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | |
| workspace_id | uuid (FK) | |
| trip_id | uuid (FK, nullable) | penjualan bisa terjadi di luar window trip aktif |
| customer_id | uuid (FK → customers) | |
| sale_date | date | |
| payment_status | enum('lunas','piutang') | |
| due_date | date | nullable, hanya relevan jika piutang |
| notes | text | nullable |
| created_by | uuid (FK) | |
| created_at | timestamptz | |

### 9.12 `sale_items`
| Field | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | |
| sale_id | uuid (FK) | |
| product_id | uuid (FK) | |
| quantity | numeric | |
| sell_price | numeric | harga aktual saat itu |
| cost_price_snapshot | numeric | harga modal produk saat transaksi, disimpan sebagai snapshot agar laporan profit historis tidak berubah jika harga modal produk diedit di kemudian hari |
| subtotal | numeric | generated |
| profit | numeric | generated: (sell_price − cost_price_snapshot) × quantity |

### 9.13 `payments`
Mendukung pelunasan piutang secara bertahap (warung sering bayar cicil).
| Field | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | |
| sale_id | uuid (FK → sales) | |
| amount | numeric | |
| paid_at | date | |
| notes | text | nullable |
| created_by | uuid (FK) | |

### 9.14 `expenses`
| Field | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | |
| workspace_id | uuid (FK) | |
| trip_id | uuid (FK, nullable) | |
| category | enum('trip','operasional_harian','lainnya') | |
| amount | numeric | |
| expense_date | date | |
| notes | text | nullable |
| created_by | uuid (FK) | |
| created_at | timestamptz | |

### 9.15 `stock_movements`
Log immutable seluruh pergerakan stok — sumber kebenaran untuk `products.current_stock`.
| Field | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | |
| workspace_id | uuid (FK) | |
| product_id | uuid (FK) | |
| type | enum('in','out','adjustment') | |
| quantity | numeric | positif untuk in/adjustment-tambah, negatif untuk out/adjustment-kurang |
| reference_type | enum('purchase','sale','manual') | |
| reference_id | uuid | nullable, menunjuk ke purchase_items/sale_items terkait |
| reason | text | wajib diisi jika type = 'adjustment' |
| created_by | uuid (FK) | |
| created_at | timestamptz | |

### 9.16 `activity_logs`
| Field | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | |
| workspace_id | uuid (FK) | |
| user_id | uuid (FK) | |
| action | text | mis. "create_sale", "update_product", "adjust_stock" |
| entity_type | text | |
| entity_id | uuid | |
| metadata | jsonb | snapshot ringkas perubahan (before/after bila relevan) |
| created_at | timestamptz | |

### 9.17 Relasi Antartabel (Ringkas)
```
workspaces (1) ── (N) workspace_members ── (N) users
workspaces (1) ── (N) trips
workspaces (1) ── (N) suppliers, products, customers
trips (1) ── (N) purchases ── (N) purchase_items ── (1) products
trips (1) ── (N) sales (opsional) ── (N) sale_items ── (1) products
sales (1) ── (N) payments
products (1) ── (N) stock_movements
purchase_items / sale_items → (1) stock_movements (sebagai referensi asal pergerakan)
workspaces (1) ── (N) activity_logs
```

**Keputusan desain penting:** `cost_price_snapshot` di `sale_items` sengaja disimpan sebagai snapshot, bukan hasil join real-time ke `products.default_buy_price`, karena harga beli produk bisa berubah dari waktu ke waktu (supplier berbeda, trip berbeda) — laporan laba/rugi historis harus tetap akurat terhadap kondisi saat transaksi terjadi, bukan berubah retroaktif ketika harga modal produk diperbarui.

---

## 10. Permission Model

| Modul / Aksi | Owner | Admin | Partner | Staff |
|---|---|---|---|---|
| Lihat Dashboard ringkasan bisnis penuh | ✅ | ✅ | ⚠️ scoped (lihat 10.1) | ❌ |
| Kelola Trip (buat/tutup) | ✅ | ✅ | ❌ | ❌ |
| Kelola Supplier/Produk (master data) | ✅ | ✅ | ❌ | ❌ |
| Input Pembelian | ✅ | ✅ | ✅ | ❌ |
| Input Penjualan | ✅ | ✅ | ✅ | ✅ |
| Lihat harga modal & margin | ✅ | ✅ | ❌ | ❌ |
| Catat Pengeluaran | ✅ | ✅ | ✅ (kategori terbatas) | ❌ |
| Penyesuaian Stok | ✅ | ✅ | ✅ (wajib alasan) | ❌ |
| Lihat Laporan Laba/Rugi penuh | ✅ | ✅ | ❌ | ❌ |
| Lihat ringkasan kontribusi diri sendiri | ✅ | ✅ | ✅ | ✅ |
| Undang/kelola User | ✅ | ❌ | ❌ | ❌ |
| Lihat Audit Log | ✅ | ✅ | ❌ | ❌ |
| Hapus data transaksi | ✅ | ✅ (soft-delete, tercatat log) | ❌ | ❌ |

**10.1 Alasan desain:** Partner diberi akses input penuh untuk transaksi operasional (karena mereka yang di lapangan), tetapi **tidak** diberi akses ke margin/modal dan laporan laba/rugi penuh — ini melindungi data sensitif finansial Owner sambil tetap memungkinkan Partner bekerja efisien. Partner tetap bisa melihat ringkasan kontribusinya sendiri (jumlah transaksi yang dia input, misalnya untuk keperluan bagi hasil) tanpa melihat keseluruhan margin bisnis. Staff dibatasi hanya pada input penjualan dasar — cocok untuk peran bantu antar barang tanpa akses ke keputusan bisnis. Model ini diimplementasikan dengan **Row Level Security (RLS) di level database** (bukan hanya di frontend), sehingga aturan akses tidak bisa dilewati meski API dipanggil langsung.

---

## 11. UI/UX Guidelines

### 11.1 Prinsip Visual
Gaya "premium tanpa berlebihan" dicapai lewat: **whitespace yang cukup lega, tipografi dengan hierarki jelas, dan aksen warna yang dipakai secara sengaja (bukan flat monokrom, tapi juga bukan warna-warni ramai)**. Kesan "tidak flat, tidak boring" datang dari penggunaan **depth halus** (soft shadow, subtle gradient pada card penting, border radius konsisten) — bukan dari efek dekoratif berlebihan yang justru terlihat murah di mobile.

### 11.2 Palet Warna
- **Base:** netral hangat (off-white `#FAFAF8` untuk light mode, charcoal `#12141A` untuk dark mode) — bukan putih/hitam pekat, agar terasa lebih premium dan tidak menyilaukan saat dipakai lama di HP.
- **Aksen utama:** deep amber/tembaga (`#B8722E` – terinspirasi warna tembakau/kemasan rokok premium, relevan secara tematik tanpa meniru merek tertentu) untuk CTA utama, angka profit positif, dan elemen penting.
- **Aksen sekunder:** deep teal (`#1C4E4A`) untuk elemen informasi netral (grafik, badge status).
- **Status warna:** hijau emerald untuk "Lunas"/profit positif, amber/oranye untuk "Piutang"/perhatian, merah bata (bukan merah terang) untuk stok minus/rugi — dipilih agar tetap elegan, bukan warna alert yang terasa murahan.

### 11.3 Tipografi
- Font sans-serif modern dengan karakter tegas untuk angka (mis. Inter atau Manrope) — angka finansial harus mudah dibaca cepat dalam sekali lihat.
- Hierarki: judul halaman (semi-bold, ukuran besar), label section (medium, uppercase tracking lebar, ukuran kecil, warna sekunder), angka utama pada card ringkasan (bold, ukuran besar, tabular-nums agar digit sejajar rapi).

### 11.4 Layout & Struktur
- **Mobile:** layout satu kolom, card ringkasan besar di atas (swipeable jika lebih dari 3 metrik), bottom navigation bar 4–5 item, floating action button (FAB) untuk aksi "Tambah Transaksi Cepat" yang selalu terjangkau ibu jari.
- **Desktop:** layout dua kolom — sidebar kiri (menu) + konten utama, dengan panel ringkasan/statistik di kanan atas konten pada halaman Dashboard dan Laporan (grid 12 kolom, card metrik mengambil 3–4 kolom masing-masing).
- **Transisi mobile→desktop:** komponen yang di mobile berupa bottom sheet (form input transaksi) berubah menjadi modal/dialog di tengah layar pada desktop — bukan sekadar melebar, karena interaksi bottom sheet secara natural hanya masuk akal di layar sempit.

### 11.5 Komponen Utama
- **Card ringkasan (metric card):** angka besar + label + indikator tren kecil (panah naik/turun dengan warna status) + shadow lembut `0 2px 12px rgba(0,0,0,0.06)`.
- **Table (desktop) / List card (mobile):** di desktop data transaksi ditampilkan sebagai tabel dengan sorting; di mobile data yang sama ditampilkan sebagai list of cards ringkas (nama, angka, badge status) karena tabel penuh tidak nyaman di layar sempit.
- **Chip/Badge:** dipakai untuk status (Lunas/Piutang, Berjalan/Selesai) — bentuk pill, warna solid lembut (bukan warna terang menyala), teks kontras cukup untuk aksesibilitas.
- **Modal (desktop) / Bottom Sheet (mobile):** dipakai konsisten untuk semua form "tambah/edit" — bottom sheet di mobile bisa di-drag, memudahkan input satu tangan.
- **Form:** input besar dan mudah disentuh (min. tinggi 44px), auto-focus ke field pertama, keypad numerik otomatis muncul untuk field angka (quantity, harga) di mobile.
- **Filter:** filter tanggal & dimensi laporan ditampilkan sebagai chip yang bisa ditekan (bukan dropdown panjang), memunculkan bottom sheet pilihan di mobile.

### 11.6 Prinsip Responsive & Mobile-First
Semua komponen dirancang mobile-first dari awal (breakpoint dasar didesain untuk layar ~375px), lalu di-*enhance* progresif untuk layar lebih besar (breakpoint tablet ~768px, desktop ~1024px+) — bukan sebaliknya (desktop dipersempit). Interaksi utama (input transaksi, cek stok cepat) harus bisa selesai maksimal dalam 3 tap dari halaman manapun di mobile.

---

## 12. Technical Recommendations

| Layer | Rekomendasi | Alasan |
|---|---|---|
| Frontend | **Next.js (App Router) + TypeScript + TailwindCSS + shadcn/ui** | Next.js mendukung rendering hybrid (SSR untuk data awal cepat, client-side untuk interaktivitas), ekosistem matang, deploy gratis mulus di Vercel. shadcn/ui memberi komponen dasar premium yang bisa dikustom penuh (bukan library visual generik yang terasa template). |
| State Management | **TanStack Query (React Query)** untuk server state (data dari Supabase) + **Zustand** untuk state UI lokal (mis. status modal terbuka, filter aktif) | Memisahkan "data dari server" dan "state UI" mencegah bug sinkronisasi data yang umum terjadi jika keduanya dicampur dalam satu global state. |
| Backend | **Supabase (Postgres + Auto-generated REST/RPC + Edge Functions bila perlu logika kompleks)** | Menghindari perlu membangun backend custom terpisah di awal; logika bisnis kompleks (mis. perhitungan snapshot profit) tetap bisa ditulis sebagai Postgres function/trigger atau Edge Function saat dibutuhkan. |
| Database | **PostgreSQL via Supabase** (detail perbandingan di Bagian 13) | |
| Autentikasi | **Supabase Auth** (email/password + magic link) | Terintegrasi langsung dengan RLS database, tidak perlu servis auth terpisah. |
| Audit Log | Kombinasi **Postgres trigger** (mencatat otomatis ke `activity_logs` pada event INSERT/UPDATE/DELETE tabel transaksi penting) + pencatatan manual dari aplikasi untuk aksi non-tabel (mis. login) | Trigger memastikan log tidak bisa "terlewat" meski developer lupa menambahkan log manual di satu endpoint. |
| File Handling | **Supabase Storage** untuk foto produk/bukti bayar (opsional, Phase 2) | Terintegrasi dengan auth & RLS yang sama, tidak perlu servis storage terpisah. |
| Deployment | **Vercel** (frontend) + **Supabase Cloud** (backend/db), keduanya free tier di awal | Kombinasi ini adalah standar industri untuk aplikasi Next.js + Supabase, minim konfigurasi DevOps, auto-scaling dasar tersedia gratis. |
| PWA/Mobile | Progressive Web App (manifest + service worker dasar) dibanding native app | Tim tidak perlu membangun dua codebase terpisah (iOS/Android), cukup satu web app yang bisa "Add to Home Screen" dan terasa seperti aplikasi native untuk kebutuhan saat ini. |

---

## 13. Database Recommendation — Supabase vs Neon

| Kriteria | **Supabase** | Neon |
|---|---|---|
| Harga | Free tier generous (500MB DB, 50k monthly active users auth) | Free tier bagus untuk compute Postgres, tapi lebih fokus murni database |
| Autentikasi bawaan | ✅ Built-in (Supabase Auth) | ❌ Tidak ada, perlu integrasi pihak ketiga (Clerk/Auth.js) |
| Row Level Security siap pakai | ✅ Terintegrasi penuh dengan auth, jadi kontrol akses per role bisa dilakukan di level DB | ✅ RLS tersedia (murni Postgres), tapi harus dihubungkan manual ke sistem auth eksternal |
| Realtime subscription | ✅ Built-in (berguna untuk update dashboard live antar user) | ❌ Tidak built-in |
| File Storage | ✅ Built-in Storage (untuk foto produk/bukti bayar) | ❌ Tidak ada, perlu servis terpisah (mis. S3) |
| Auto-generated API | ✅ REST & RPC otomatis dari schema | ❌ Murni database, API harus dibangun manual di layer aplikasi |
| Branching database (dev/staging) | ⚠️ Terbatas di free tier | ✅ Unggul di sini — Neon punya fitur branching database yang sangat kuat |
| Cocok untuk kebutuhan proyek ini | **Sangat cocok** | Lebih cocok untuk tim engineering besar yang butuh workflow database branching kompleks |

**Keputusan: Supabase dipilih sebagai database utama.** Alasan utamanya bukan sekadar "gratis", tapi karena kebutuhan proyek ini — multi-user dengan role berbeda, autentikasi, dan struktur relasional dengan kontrol akses ketat — semuanya tersedia dalam satu platform terintegrasi. Neon unggul di fitur branching database untuk tim engineering skala besar dengan banyak environment, tapi untuk proyek ini justru akan menambah kompleksitas karena harus menyambungkan auth, storage, dan API layer secara terpisah — pekerjaan ekstra yang tidak sepadan dengan manfaatnya di tahap MVP–Phase 2. Jika di masa depan kebutuhan berkembang menjadi sangat besar (jutaan baris transaksi, tim engineering multi-environment kompleks), migrasi ke Neon atau Postgres terkelola lain tetap dimungkinkan karena keduanya sama-sama PostgreSQL standar.

---

## 14. Analytics and Reports

Metrik dan laporan wajib (semua bisa difilter per rentang tanggal):

- **Ringkasan Pendapatan** — total nilai penjualan (lunas + piutang, ditampilkan terpisah).
- **Modal Masuk** — total nilai pembelian dari supplier pada periode/trip terpilih.
- **Barang Terjual** — jumlah unit terjual per produk.
- **Sisa Stok** — stok saat ini per produk beserta estimasi nilai modalnya.
- **Profit Kotor** — total pendapatan penjualan dikurangi total modal barang terjual (dihitung dari `sale_items.profit`).
- **Profit Bersih** — profit kotor dikurangi total pengeluaran (operasional + trip) pada periode terkait.
- **Ringkasan per Trip** — modal masuk, barang terjual, profit kotor/bersih, piutang tersisa, per trip.
- **Ringkasan per Produk** — unit terjual, revenue, profit kontribusi tiap produk (untuk tahu produk paling menguntungkan).
- **Ringkasan per Supplier** — total pembelian, rata-rata harga beli, frekuensi transaksi (untuk evaluasi supplier).
- **Ringkasan per Customer** — total pembelian customer, status piutang, riwayat transaksi (untuk identifikasi pelanggan terbaik & risiko piutang macet).
- **Ringkasan per Partner/User** — jumlah transaksi yang diinput tiap user (untuk transparansi kontribusi kerja, relevan jika ada skema bagi hasil).

---

## 15. Risks and Edge Cases

| Kasus | Penanganan |
|---|---|
| **Stok minus** | Sistem tetap mengizinkan transaksi tersimpan (agar tidak memblokir kerja lapangan), tapi menampilkan **warning visual tegas** dan mencatatnya sebagai flag di dashboard "Perlu Perhatian" — bukan silent error. Root cause biasanya input pembelian yang telat dicatat. |
| **Transaksi dibatalkan** | Tidak ada hard-delete untuk transaksi yang sudah tersimpan lebih dari beberapa menit — digunakan **soft-delete** (`is_cancelled` + alasan wajib), stok dikembalikan otomatis via stock_movement penyeimbang, dan tercatat di audit log. |
| **Harga beli berubah** | Karena `cost_price_snapshot` disimpan per transaksi penjualan (lihat Bagian 9), perubahan harga default produk **tidak memengaruhi** laporan profit historis — hanya berlaku untuk transaksi baru ke depannya. |
| **Transaksi dobel (duplikat tidak sengaja)** | Frontend menonaktifkan tombol submit setelah ditekan sekali (debounce) + backend memberi warning "transaksi serupa baru saja dibuat dalam 1 menit terakhir oleh Anda" sebagai konfirmasi tambahan sebelum submit final. |
| **User salah input** | Selama masih dalam window singkat (mis. 15 menit) dan belum ada transaksi lanjutan yang bergantung padanya, user pemilik input (atau Admin/Owner) bisa mengedit langsung; setelah lewat window atau melibatkan pihak lain, harus lewat proses "batalkan lalu buat ulang" agar jejak audit tetap jelas. |
| **Produk sama muncul di beberapa trip** | Ini adalah perilaku normal by design — stok bersifat global per produk (bukan per trip), sedangkan trip hanya menandai **dari mana asal modal masuknya**. Laporan "stok" selalu global, laporan "profit per trip" dihitung dari transaksi pembelian/penjualan yang ditandai ke trip tersebut. |
| **Satu customer punya banyak transaksi (termasuk campuran lunas & piutang)** | Halaman detail customer menampilkan riwayat lengkap dengan saldo piutang berjalan (running balance), bukan hanya daftar transaksi terpisah, agar Owner langsung tahu total utang customer tersebut saat ini. |
| **Partner menginput data yang salah secara sengaja/tidak jujur** | Ditangani lewat kombinasi: audit log lengkap (siapa-apa-kapan) + pemisahan akses margin/laporan finansial dari Partner (Bagian 10), sehingga potensi penyalahgunaan data sensitif diminimalkan meski approval berlapis belum diterapkan di MVP. |
| **Koneksi internet tidak stabil di lapangan** | MVP mengasumsikan koneksi tersedia (online-first); penanganan offline penuh (queue transaksi lokal lalu sync) masuk **Future Enhancement** karena kompleksitas conflict-resolution yang tidak sepadan untuk fase awal. |

---

## 16. Acceptance Criteria

Sistem dianggap **siap rilis MVP** jika seluruh kriteria berikut terpenuhi:

1. User dapat login, dan role akses (Owner/Admin/Partner/Staff) membatasi menu & aksi sesuai matriks Bagian 10 — diverifikasi lewat RLS di database, bukan hanya UI.
2. User dapat membuat trip baru, dan seluruh transaksi baru secara default tertaut ke trip aktif tersebut.
3. Pembelian dari supplier tercatat dan **otomatis menambah stok produk** secara real-time (terlihat langsung di menu Stok tanpa refresh manual berulang).
4. Penjualan ke customer tercatat, **otomatis mengurangi stok**, menghitung profit per item menggunakan snapshot harga modal saat transaksi, dan status lunas/piutang tersimpan benar.
5. Piutang customer terlihat jelas di halaman customer dan di dashboard ringkasan sebagai satu angka agregat.
6. Penyesuaian stok manual wajib mengisi alasan dan tercatat di `stock_movements` + `activity_logs`.
7. Laporan Laba/Rugi menghasilkan angka yang konsisten secara matematis: Profit Bersih = Total Profit Kotor Penjualan − Total Pengeluaran, terverifikasi dengan minimal satu skenario uji manual end-to-end (buat trip → beli → jual → keluarkan biaya → cek laporan cocok).
8. Semua laporan (per trip/produk/supplier/customer/partner) dapat difilter berdasarkan rentang tanggal dan menampilkan data yang benar sesuai filter tersebut.
9. Tampilan mobile (viewport ≤ 400px) tidak memiliki elemen terpotong/overflow horizontal pada seluruh halaman utama, dan seluruh form input transaksi bisa diselesaikan dengan nyaman satu tangan.
10. Owner dapat mengundang user baru dengan role tertentu, dan user tersebut, setelah bergabung, hanya melihat menu/aksi sesuai role-nya sejak login pertama.
11. Audit log mencatat minimal aksi create/update/delete untuk seluruh entitas transaksi utama (purchases, sales, expenses, stock adjustments) dan dapat dilihat oleh Owner/Admin.

---

## 17. Implementation Notes for Antigravity

### 17.1 Struktur Pengerjaan yang Disarankan
Kerjakan secara **vertical slice per alur bisnis**, bukan horizontal per layer — artinya setiap tahap menghasilkan satu alur kerja yang *berfungsi penuh dari database sampai UI*, bukan "selesaikan semua database dulu baru semua UI". Ini penting agar setiap milestone bisa langsung dites sebagai fitur nyata, bukan potongan kode yang belum terhubung.

### 17.2 Urutan Implementasi
1. **Fondasi:** setup project Next.js + Supabase, schema database inti (workspaces, users, workspace_members, trips, suppliers, products, customers), autentikasi dasar + RLS policy awal.
2. **Alur Trip & Master Data:** CRUD Trip, CRUD Supplier, CRUD Produk, CRUD Customer — lengkap dengan UI mobile-first dasar (list + form bottom sheet/modal).
3. **Alur Pembelian:** form pembelian multi-item, trigger otomatis update stok via `stock_movements`, halaman histori pembelian per supplier & per trip.
4. **Alur Penjualan:** form penjualan multi-item dengan snapshot harga modal, status lunas/piutang, trigger otomatis update stok, halaman histori penjualan.
5. **Alur Pengeluaran & Stok:** form pengeluaran per kategori, halaman Stok dengan riwayat pergerakan, fitur penyesuaian stok manual.
6. **Dashboard Ringkasan:** agregasi seluruh data di atas menjadi card metrik utama (profit trip berjalan, piutang, stok kritikal).
7. **Laporan Mendalam:** halaman laporan per dimensi (trip/produk/supplier/customer/partner) dengan filter tanggal.
8. **Multi-user & Permission:** implementasi lengkap role Admin/Partner/Staff, alur undang user, audit log UI.
9. **Polish UI/UX Premium:** finalisasi styling sesuai Bagian 11, animasi transisi halus, dark mode.
10. **Phase 2 features** (sesuai Bagian 6) dikerjakan setelah seluruh MVP di atas lulus Acceptance Criteria (Bagian 16).

### 17.3 Prioritas Halaman
Dashboard Ringkasan (skeleton dulu, data lengkap belakangan) → Trip → Produk/Supplier/Customer → Pembelian → Penjualan → Stok → Pengeluaran → Laporan → Tim & Akses → Audit Log → Settings.

### 17.4 Prioritas Komponen
Bottom navigation + shell layout responsif → Form input generik (dipakai ulang untuk pembelian/penjualan/pengeluaran) → Metric card → List/Table adaptif (table di desktop, card list di mobile) → Badge/Chip status → Modal/Bottom sheet wrapper → Filter tanggal & dimensi.

### 17.5 Prioritas Database Schema
Schema inti (workspaces, users, workspace_members, trips, suppliers, products, customers) dibangun **penuh di awal dan tidak boleh berubah struktur besar setelahnya** karena seluruh tabel transaksi bergantung padanya — lalu baru schema transaksi (purchases, purchase_items, sales, sale_items, payments, expenses, stock_movements, activity_logs).

### 17.6 Prioritas Fitur Auth & Role
Auth dasar (login/register) → RLS dasar per workspace (isolasi data antar workspace, meski MVP hanya 1 workspace aktif) → Role check di level RLS untuk membedakan Owner/Admin vs Partner/Staff (terutama menyembunyikan kolom harga modal/margin) → UI conditional rendering berdasarkan role → Alur undang user.

### 17.7 Prioritas Mobile UI
Karena mobile-first adalah kebutuhan inti (bukan tambahan), setiap komponen di Bagian 17.4 **wajib didesain dan diuji di viewport mobile terlebih dahulu** sebelum versi desktop dikerjakan — bukan sebaliknya. Form input transaksi (pembelian/penjualan/pengeluaran) adalah komponen dengan prioritas mobile tertinggi karena merupakan aksi paling sering dilakukan dari lapangan.

---

*Dokumen ini adalah PRD final dan siap digunakan sebagai dasar eksekusi coding. Seluruh keputusan produk telah diambil berdasarkan best practice untuk skala usaha kecil-menengah yang sedang bertumbuh menuju operasi multi-user.*

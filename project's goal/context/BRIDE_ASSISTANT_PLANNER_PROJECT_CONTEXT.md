# Project Context — Bride Assistant Planner & Ranur Bridal Care

**Context ID:** `BAP-PROJECT-CONTEXT`  
**Revision:** 2.0 — production vision  
**Tanggal:** 18 November 2026  
**Readiness:** `needs-review`  
**Model klaim:** `user-intent` · `observed` · `documented` · `inferred` · `unknown` · `conflicted`  
**Cakupan:** definisi produk dan batas bisnis; bukan Stack Context, rancangan arsitektur, atau delivery plan.

## 1. Mandat dan visi

**Bride Assistant Planner** ditujukan menjadi sistem operasional layanan **personal Bride Assistant (BA)** yang terhubung dengan pengalaman digital customer. **Ranur Bridal Care** adalah identitas customer-facing yang telah ditampilkan dalam referensi desain produk. Sistem production yang dituju harus menyediakan perjalanan yang utuh: customer mengenal layanan, memilih paket, mengajukan booking, berkomunikasi dengan admin, dan memantau perkembangannya; BA mengelola layanan, jadwal, permintaan, keputusan konfirmasi, serta konten website dalam satu sumber informasi yang konsisten. **[user-intent: D1, D2; observed: S1, S2]**

**Janji nilai produk:** mengurangi ketidakjelasan proses reservasi bagi calon pengantin dan mengurangi pekerjaan pencatatan/koordinasi yang terpisah bagi BA, tanpa mengubah fokus bisnis menjadi Wedding Organizer (WO). Ranur memberikan layanan pendampingan personal pengantin, bukan pengelolaan keseluruhan acara atau semua vendor pernikahan. **[user-intent: D1]**

HTML terakhir adalah **sumber evidence kebutuhan, pengalaman pengguna, dan aturan domain yang telah dieksplorasi**, bukan kontrak teknologi ataupun batas maksimum kemampuan sistem production. Referensi tersebut harus dipakai untuk memahami *apa* yang perlu dibangun dan *mengapa*, bukan disalin mentah sebagai desain backend atau disertifikasi siap operasi. **[documented: S1, S2; user-intent: D3]**

**Batas identitas produk yang belum disahkan:** referensi admin memakai nama generik `bride. / Assistant Planner`, sedangkan website customer memakai `Ranur Bridal Care`. Belum diputuskan apakah production khusus Ranur/satu bisnis BA atau kelak menjadi produk untuk banyak BA independen. Dokumen ini menetapkan **operasional Ranur sebagai skenario referensi**, tanpa menyatakan dukungan multi-tenant sebagai scope yang telah disetujui. **[observed: S1, S2; unknown: U1]**

## 2. Masalah dan perubahan yang ingin dicapai

**Situasi bisnis yang ingin diperbaiki** (rumusan tujuan, bukan klaim telah terukur):

- Customer membutuhkan cara mudah memahami layanan/paket, mengecek tanggal yang dapat diajukan, mengirim detail wedding secara lengkap, serta memperoleh kepastian status tanpa harus mengulang informasi yang sama. **[inferred dari D2, S1]**
- BA membutuhkan pandangan terpusat terhadap permintaan, booking terkonfirmasi, jadwal yang ditutup, durasi layanan, kebutuhan customer, dan keputusan atas booking untuk menghindari koordinasi terfragmentasi. **[inferred dari S2]**
- Perubahan layanan/paket dan materi pemasaran memerlukan pengelolaan resmi agar informasi yang dibaca customer tidak bertentangan dengan keputusan operasional BA. **[inferred dari S1, S2]**

**Target outcome production:**

1. **Perjalanan customer dapat diselesaikan secara mandiri sampai pengajuan**: membaca layanan, login, memilih paket/tanggal, mengisi detail, memperoleh nomor booking dan melihat status awal yang benar.
2. **BA memiliki satu antrean kerja**: permintaan customer dan booking manual dapat dikelola dalam agenda yang sama; keputusan operator tercermin pada akun customer terkait.
3. **Ketersediaan dapat dipercaya**: kalender customer tidak menunjukkan data pribadi pemesan lain dan tidak menjanjikan slot tanpa mempertimbangkan aturan kapasitas/operasional yang berlaku.
4. **Komposisi layanan historis terjaga**: isi, durasi, dan harga paket pada booking sebelumnya tetap dapat dipertanggungjawabkan ketika master data berubah.
5. **Website dikelola dari admin**: informasi layanan, portfolio, testimoni, event, dan promo yang dipublikasikan adalah konten sah yang konsisten dengan data bisnis.

Outcome ini adalah **basis penerimaan yang diusulkan dari keputusan dan artefak**, bukan angka pertumbuhan/pendapatan yang dibuat-buat. Target bisnis kuantitatif, bila diperlukan, menunggu pemilik keputusan. **[user-intent: D1, D2; inferred; unknown: U2]**

## 3. Domain, pengguna, dan otoritas

| Aktor/role produk | Tanggung jawab dan hak yang dituju | Basis |
|---|---|---|
| **Pengunjung publik** | Menjelajahi About, paket, portfolio/testimoni, event, promo, FAQ; dapat memulai niat booking tetapi belum mengajukannya tanpa login. | `user-intent`, `observed` |
| **Customer terautentikasi** | Membuat pengajuan atas identitasnya, melihat beranda personal, riwayat/detail/status booking miliknya, dan menghubungi admin. | `user-intent` |
| **BA / operator admin** | Memasukkan booking manual, mengelola permintaan dan keputusan status, kalender, blocked dates, layanan, bundle, paket, customer. | `observed`, `user-intent` |
| **Pengelola konten website** | Menyiapkan, mengedit, menerbitkan, dan menarik konten portfolio, testimoni, event, promo; dapat dirangkap admin pada tahap awal. | `observed`, `inferred` |

**Tata kelola yang belum ditetapkan:** sponsor/penanggung jawab bisnis, *accountable decision owner*, approver untuk aturan layanan/pricing, dan pembagian hak antara admin operasional dengan editor/publisher konten masih **`to-confirm`**. Jangan menganggap pembuat HTML atau pengguna GitHub otomatis menjadi pemegang otoritas formal. **[unknown: U3]**

## 4. Ruang lingkup produk yang dituju

### 4.1 Website publik — Ranur Bridal Care

Website publik berperan sebagai pintu penemuan layanan dan kepercayaan brand. Rangkaian pengalaman yang hendak dipertahankan dari referensi `index.html`: **Hero/Home, About Us, Portfolio & Testimonials, Events, Products/Packages, How It Works, Booking CTA, FAQ**, dengan navigasi **Masuk/Daftar** dan footer. Produk serta penawaran ditampilkan sebagai informasi customer-facing, bukan informasi internal operator. **[observed: S1]**

Konten yang belum disetujui/published tidak boleh disajikan seolah sebagai informasi resmi. Testimoni dan foto customer harus memiliki dasar izin penggunaan yang sesuai. Event hanya ditampilkan dengan informasi yang dapat dipertanggungjawabkan; promo harus menyatakan periode dan cakupannya secara benar. **[user-intent: D3; inferred dari S1, S2]**

### 4.2 Customer Portal — Ranur Bridal Care

- **Daftar / Masuk:** identitas customer yang sah; pengunjung boleh mengeksplorasi layanan tanpa login, tetapi **pengajuan booking wajib login pada production**. Customer kembali ke konteks paket atau tujuan booking setelah autentikasi. **[user-intent: D2]**
- **Beranda customer:** ringkasan booking aktif, jadwal terdekat, status/tindakan relevan, akses Booking Baru, Booking Saya, dan Bantuan. **[observed: S1]**
- **Booking Baru (halaman sendiri):** paket terpilih, kalender bulanan, pilihan tanggal yang dapat diajukan, form detail, review dan pengajuan. **[user-intent: D2]**
- **Booking Saya:** daftar, filter/pencarian, nomor booking, rincian acara, snapshot paket, status terkini, dan konteks tindak lanjut. Data hanya boleh terlihat oleh customer pemiliknya atau pihak berwenang. **[user-intent: D2; observed: S1]**
- **Bantuan:** satu tindakan utama menghubungi admin melalui WhatsApp resmi. **[user-intent: D2]**

UI portal menggunakan header konsisten **Beranda · Booking Baru · Booking Saya · Bantuan**, dilengkapi identitas akun dan notifikasi jika relevan. Desain mengikuti tema **Soft Rose Atelier**: dusty/blush rose, muted terracotta, feminin yang tetap clean, modern, dan profesional; responsif untuk desktop dan mobile. **[user-intent: D2; observed: S1]**

### 4.3 Admin / BA Workspace

| Area operasional | Kewenangan bisnis yang dituju |
|---|---|
| **Overview** | Melihat kondisi permintaan dan agenda mendatang untuk menentukan tindakan berikutnya. |
| **Bookings** | Mengelola kalender dan daftar booking, permintaan customer, input booking manual, detail acara dan keputusan status. |
| **Services & Actions** | Mendefinisikan komponen layanan individual dan tindakan pendampingan. |
| **Bundles** | Mengelompokkan Services/Actions yang dapat dipakai ulang dalam paket. |
| **Master Packages** | Mengatur nama, komposisi, durasi, harga, deskripsi dan status aktif paket yang ditawarkan. |
| **Customers** | Mengakses customer dan histori booking yang diotorisasi untuk kebutuhan operasional. |
| **Availability** | Menetapkan tanggal tidak tersedia dan kebijakan operasional yang memengaruhi kemungkinan menerima booking. |
| **Portfolio & Testimonials** | Mengelola cerita/foto dan kutipan customer dengan status Draft/Published. |
| **Events** | Mengelola agenda kegiatan, waktu, lokasi, dan publikasinya. |
| **Promotions** | Mengelola penawaran, masa berlaku, jenis/nilai promo, serta paket yang terkait. |

Area di atas adalah kapabilitas produk, **bukan janji bahwa setiap tombol atau field HTML harus menjadi modul/service teknis terpisah**. Tampilan `Public Booking Page` di admin v3 diperlakukan sebagai referensi alur customer, bukan kewajiban mempertahankan dua mekanisme booking publik yang bersaing. **[observed: S2; inferred]**

### 4.4 Non-goals saat ini

Produk **tidak didefinisikan** sebagai sistem Wedding Organizer lengkap, marketplace vendor, pengelola budget/undangan pernikahan, editor website bebas, sistem penjadwalan seluruh vendor, atau platform wedding planning umum. Payment gateway, invoice/DP otomatis, live chat internal, otomasi WhatsApp pengiriman pesan, dan sistem multi-BA/multi-tenant **belum menjadi komitmen lingkup** dan membutuhkan keputusan terpisah bila nantinya diperlukan. **[user-intent: D1; unknown: U1, U4]**

## 5. Customer journey dan hasil setiap tahap

### 5.1 Penemuan layanan hingga pemilihan paket

Pengunjung masuk ke website publik, memahami fungsi BA dan manfaat paket, membaca informasi yang dipublikasikan, lalu memilih paket. Pemilihan paket dari landing/customer home membawa konteks paket tersebut ke halaman booking. **Akun tidak diwajibkan untuk browsing.** **[user-intent: D2]**

### 5.2 Login dan pengajuan booking

Bila customer belum login, sistem meminta masuk/daftar **sebelum submission booking**, dengan tetap mempertahankan niat dan paket yang dipilih. Customer membuka kalender, memilih tanggal yang boleh diajukan, lalu melengkapi informasi berikut:

**Nama**, **WhatsApp**, **Email**, **Tanggal Wedding**, **Waktu Mulai**, **Lokasi Wedding**, dan **Catatan** (opsional). Paket yang dipilih menjadi bagian dari pengajuan; estimasi waktu selesai mengikuti durasi paket. **[user-intent: D2]**

Setelah validasi, sistem menyimpan permintaan dengan nomor/identitas booking dan status awal **Menunggu Konfirmasi**. Pengajuan ini **bukan konfirmasi ketersediaan**. Customer mendapat bukti bahwa permintaan tercatat, dapat melihatnya dalam **Booking Saya**, dan diarahkan/ditawari membuka chat WhatsApp admin menggunakan nomor resmi serta ringkasan booking. **Membuka chat tidak berarti pesan telah dikirim atau admin telah menyetujui booking.** **[user-intent: D2]**

### 5.3 Peninjauan BA dan perubahan status

Admin melihat pengajuan dalam kalender/daftar operasional yang sama dengan reservasi manual, memeriksa kemampuan melayani pada tanggal dan jam terkait, lalu menentukan tindak lanjut sesuai aturan bisnis. Status yang tampil pada customer harus mengikuti satu status booking yang sah dan perubahan yang dilakukan admin harus terlihat oleh pemilik booking. **[user-intent: D2; inferred dari S1, S2]**

**Istilah status yang perlu disatukan sebelum menjadi kontrak production:** customer memakai *Menunggu Konfirmasi, Dikonfirmasi, Dalam Pelaksanaan, Selesai, Ditunda/On Hold, Dibatalkan, Ditolak*; admin referensi memakai *Requested, On Hold, Confirmed, Completed, Cancelled*. Pemetaan final, transisi, kewenangan, alasan penolakan/pembatalan, dan riwayat keputusan **belum disahkan**. **[observed: S1, S2; unknown: U5]**

### 5.4 Bantuan dan komunikasi

Customer dapat menghubungi admin melalui tombol WhatsApp di Bantuan maupun setelah booking. WhatsApp berfungsi sebagai **handoff komunikasi**, bukan sumber kebenaran status dan bukan pengganti penyimpanan booking. Semua perubahan status resmi tetap harus konsisten dengan catatan booking sistem. Nomor kontak resmi dan pola pembagian percakapan admin perlu dipastikan. **[user-intent: D2; inferred; unknown: U6]**

## 6. Aturan domain yang tidak boleh hilang

1. **Master berbeda dari transaksi.** Service/Action adalah item individual; Bundle mengelompokkan sejumlah item; Master Package menyertakan item individual dan/atau Bundle. **[user-intent: D1; observed: S2]**
2. **Komposisi tidak boleh dihitung ganda.** Bila item muncul melalui dua referensi, hasil ekspansi paket menghindari duplikasi layanan. **[user-intent: D1; observed: S2]**
3. **Referensi master tetap dinamis sampai booking dibuat.** Perubahan Bundle dapat memperbarui komposisi Master Package yang mereferensikannya. **[user-intent: D1]**
4. **Booking memiliki snapshot yang tidak ikut berubah.** Paket yang telah dipesan menyimpan fakta relevan pada saat pengajuan—nama, harga, durasi, komposisi dan deskripsi layanan—terlepas dari perubahan master berikutnya. **[user-intent: D1]**
5. **Requested ≠ Confirmed.** Memilih tanggal dan menyimpan permintaan tidak sama dengan memastikan slot. Persetujuan BA/otoritas operasional tetap diperlukan. **[user-intent: D2]**
6. **Kalender customer bukan kalender internal.** Customer melihat tanggal/kemungkinan ketersediaan yang aman dipublikasikan; tidak melihat nama, identitas, atau detail booking customer lain. **[user-intent: D2]**
7. **Ketersediaan bergantung pada kebijakan operasional yang nyata.** Tanggal blokir, durasi, waktu layanan, buffer, konflik jadwal, dan kapasitas pendamping memengaruhi keputusan; model kapasitas final belum ditentukan. **[observed: S2; unknown: U7]**
8. **Satu identitas booking dapat ditelusuri lintas permukaan.** Permintaan yang sama tidak boleh menjadi dua transaksi terpisah hanya karena dilihat dari customer, admin, atau WhatsApp. **[inferred dari target integrasi]**
9. **Konten terbit berbeda dengan draft.** Admin dapat menyimpan, meninjau, mempublikasikan dan menarik konten; hanya konten layak terbit yang tampil kepada publik. **[observed: S2; inferred untuk target]**
10. **Promo tidak boleh menyesatkan.** Masa berlaku, paket relevan dan harga yang dikomunikasikan harus konsisten. Referensi saat ini menampilkan promo informatif, tetapi keputusan apakah promo mengubah harga transaksi masih terbuka. **[observed: S2; unknown: U8]**
11. **Hak akses mengikuti identitas.** Customer hanya dapat melihat/mengubah data yang menjadi haknya; admin hanya dapat mengakses data dan tindakan sesuai peran. **[inferred: kewajiban sistem production]**

## 7. Current state, target state, dan sikap transisi

### Referensi yang telah tersedia

**[observed: S1]** Customer Website/Portal **v12** berisi tujuh HTML: `index.html`, `masuk.html`, `daftar.html`, `home.html`, `booking.html`, `booking_saya.html`, `bantuan.html`. Desain, alur navigasi, kalender, form, status, dan pengalaman bantuan dapat dinilai dari sumber ini. Pada referensi tersebut, pemeriksaan login untuk booking sengaja dilewati agar desain bisa ditinjau langsung.

**[observed: S2]** Admin **v3** menyediakan antarmuka operasional booking/katalog/availability dan modul pengelolaan Portfolio & Testimonials, Events, dan Promotions. Penyimpanan dan interaksi referensinya dilakukan di browser, dengan ekspor JSON untuk konten website. **[observed: S2]**

### Hasil production yang menjadi sasaran

Sistem yang dituju **bukan dua halaman terpisah yang masing-masing menyimpan kebenarannya sendiri**. Customer Portal, Website Publik, dan Admin Workspace harus berbagi fakta bisnis yang konsisten mengenai identitas customer, paket aktif, ketersediaan, booking, keputusan status, serta konten yang dipublikasikan. Mekanisme teknis pemenuhan kebutuhan itu **bukan keputusan Project Context ini**. **[user-intent: D3; inferred dari masalah]**

Pergeseran dari HTML ke production **mempertahankan aturan domain dan pengalaman yang disepakati**, tetapi tidak mewajibkan pemindahan mentah `localStorage`, contoh booking, ID seed, form dummy, atau penyimpanan foto inline sebagai data/kontrak production. Data contoh tidak otomatis menjadi data customer resmi. **[observed: S1, S2; inferred]**

Khusus pengelolaan website, tindakan **Publish** dalam admin harus memengaruhi apa yang layak ditampilkan publik menurut aturan publikasi yang disepakati; keterlambatan publikasi, approval editorial, dan media/consent masih harus diputuskan. **[inferred; unknown: U9]**

## 8. Batas operasional dan kewajiban produk

- **Kepercayaan customer:** jangan tampilkan klaim testimoni palsu, event fiktif, penawaran tidak berlaku, atau kepastian slot yang belum diverifikasi. **[user-intent: D3]**
- **Data pribadi:** identitas, kontak, jadwal dan lokasi pernikahan tidak boleh tersebar antar akun atau bocor melalui kalender publik; kebijakan privasi, persetujuan, dan retensi perlu ditetapkan sebelum go-live. **[inferred; unknown: U10]**
- **Publikasi media:** izin customer untuk foto dan testimoni harus dapat dipertanggungjawabkan; mekanisme persetujuan/penarikan konten masih terbuka. **[observed: S2; inferred]**
- **Kebenaran operasional:** perubahan status/availability harus konsisten antar aktor; transaksi bersamaan tidak boleh menghasilkan konfirmasi yang melanggar kapasitas. **[inferred dari tujuan]**
- **Kejelasan komunikasi:** WhatsApp dapat dipakai sebagai kanal tindak lanjut, namun bukti permintaan dan status resmi tetap ada di sistem. **[user-intent: D2; inferred]**
- **Keseragaman pengalaman:** website publik lebih editorial; customer portal berorientasi progres personal; admin berorientasi eksekusi. Tema brand tetap selaras, tanpa mencampur konten internal ke UI customer. **[observed: S1, S2; user-intent: D3]**

## 9. Basis keberhasilan dan penerimaan tingkat proyek

Project Context ini mendefinisikan **bukti outcome**, bukan prosedur pengujian atau daftar tugas implementasi.

| Hasil yang harus dapat diperlihatkan | Indikator penerimaan bisnis |
|---|---|
| **Penemuan layanan** | Pengunjung dapat memahami BA, paket, event/promo yang berlaku, lalu memilih layanan tanpa membuat akun terlebih dahulu. |
| **Identitas dan pengajuan** | Customer yang terautentikasi dapat mengajukan permintaan lengkap; yang belum login tidak dapat mengajukan booking atas identitas tak dikenal. |
| **Ketersediaan dan integritas pengajuan** | Customer mendapat informasi tanggal yang dapat diajukan tanpa melihat reservasi orang lain; request tercatat sekali dengan snapshot paket dan status awal yang benar. |
| **Koordinasi BA** | Permintaan customer terlihat oleh admin pada operasional booking yang sama dengan input manual; keputusan admin mengikuti batas kapasitas yang disahkan. |
| **Transparansi status** | Customer pemilik booking melihat status dan detail yang sesuai dengan keputusan terbaru admin, bukan status lokal yang berbeda. |
| **Ketahanan histori** | Perubahan harga/isi master paket tidak mengubah fakta booking yang sudah terjadi. |
| **Publikasi sah** | Draft tidak tampil publik; publish/unpublish mengubah konten yang ditampilkan; foto/testimoni memiliki dasar penggunaan. |
| **Komunikasi bantuan** | Akses WhatsApp mengarah ke kontak resmi dan memudahkan tindak lanjut tanpa mengklaim pesan/konfirmasi otomatis. |
| **Keamanan kepercayaan** | Customer tidak bisa membaca booking customer lain dan konten sensitif hanya dapat diakses oleh role berwenang. |

**Kondisi project-level “cukup untuk dipakai”** adalah ketika alur *public → login → booking request → admin decision → customer status* serta pengelolaan *master + content publishing* menunjukkan satu kebenaran bersama dan tidak melanggar aturan di §6–8. Target SLA, volume pengguna, metrik bisnis, dan standar layanan yang terukur secara numerik belum dipilih. **[user-intent: D2; inferred; unknown: U2]**

## 10. Keputusan yang dapat dipakai dan keputusan yang masih terbuka

### Sudah menjadi arahan produk

- Fokus **personal Bride Assistant**, bukan WO. **[D1]**
- Customer boleh menjelajahi paket secara publik, tetapi **login wajib sebelum pengajuan booking production**. Bypass login pada HTML adalah keputusan untuk meninjau desain, bukan perubahan aturan bisnis. **[D2]**
- Booking ditempatkan pada **halaman sendiri dengan kalender**, bukan modal di landing. **[D2]**
- Field booking: **Nama, WhatsApp, Email, Tanggal Wedding, Waktu Mulai, Lokasi Wedding, Catatan**; paket dibawa dari langkah sebelumnya. **[D2]**
- Pengajuan baru **Menunggu Konfirmasi**, dilanjutkan ke kontak WhatsApp admin. **[D2]**
- Customer dapat membaca detail dan status permintaan pada **Booking Saya**. **[D2]**
- Admin mengelola Service/Action, Bundle, Master Package dengan booking snapshot historis, serta Portfolio & Testimonials, Events, Promotions. **[D1, D3; S2]**
- Website/portal mengikuti visual **Soft Rose Atelier** dan konten customer-facing yang bersih dari narasi internal. **[D3]**

### Keputusan penting yang perlu konfirmasi (`needs-review`)

| ID | Pertanyaan bisnis, bukan pertanyaan stack | Dampak jika dibiarkan ambigu |
|---|---|---|
| **U1** | Ranur sebagai satu bisnis/brand production pertama, atau produk untuk banyak BA independen? | Batas produk, kepemilikan data, dan model operasional berbeda. |
| **U2** | Hasil komersial/layanan apa yang menjadi ukuran keberhasilan setelah go-live? | Belum ada target kuantitatif yang disahkan. |
| **U3** | Siapa *accountable decision owner* dan approver untuk paket, kebijakan booking, serta publikasi? | Tata kelola belum eksplisit. |
| **U4** | Pembayaran/DP dan invoice termasuk fase awal atau di luar scope? | Bisa mengubah titik komitmen booking dan proses refund. |
| **U5** | Status resmi, transisi yang sah, dan alasan pembatalan/penolakan apa saja? | Admin dan customer dapat memiliki interpretasi status berbeda. |
| **U6** | Nomor WhatsApp resmi dan siapa yang menangani percakapan? | Handoff bantuan tidak dapat dioperasikan secara pasti. |
| **U7** | Kapasitas BA per tanggal/jam, overlap, jam kerja, buffer, dan kriteria “penuh” bagaimana? | Kalender belum dapat memberi sinyal ketersediaan yang terpercaya. |
| **U8** | Promo hanya publikasi penawaran atau harus langsung memengaruhi harga yang disepakati pada booking? | Risiko harga promosi tidak sama dengan harga transaksi. |
| **U9** | Bagaimana otorisasi publish dan persetujuan materi customer? | Tidak jelas siapa yang dapat menerbitkan konten resmi. |
| **U10** | Kebijakan perlindungan data, izin foto/testimoni, retensi dan penghapusan? | Risiko privasi serta kewajiban operasional sebelum layanan berjalan. |

U1, U3, U5, dan U7 paling memengaruhi **batas produk dan operasi inti**. Belum dipastikan melalui sumber yang diperiksa, sehingga **readiness `needs-review`** lebih tepat daripada `ready`. Pilihan stack, skema database, framework, deployment, tiket, dan desain API **sengaja tidak ditentukan** oleh dokumen ini.

## 11. Dasar bukti dan asal klaim

| ID | Sumber diperiksa | Informasi yang didukung |
|---|---|---|
| **S1** | `Ranur-v12.zip` / `ranur_customer_v12/{index,masuk,daftar,home,booking,booking_saya,bantuan}.html` | Struktur public website dan customer portal, bentuk form, kalender, katalog paket, status dan bantuan; batas current state. |
| **S2** | `Bride_Assistant_Planner_Standalone_v3_Content_Management.html` | Modul admin booking/availability/master package, Service/Action/Bundle, Website Content, status admin, export konten; batas current state. |
| **S3** | `project_context/BRIDE_ASSISTANT_PLANNER_PROJECT_CONTEXT.md` revisi 1.0 (sebelum penulisan ulang) | Kompilasi lama fakta prototype dan keputusan; dipakai sebagai petunjuk, lalu klaim penting ditautkan kembali ke S1/S2/D1–D3. |
| **D1** | Keputusan produk dalam percakapan proyek sampai 18 Nov 2026 | Domain personal BA, katalog Service/Action/Bundle/Package, snapshot, ruang lingkup non-WO. |
| **D2** | Keputusan alur customer dalam percakapan proyek | Login production wajib; booking terpisah berkalender; field booking, pending confirmation, WhatsApp, Booking Saya. |
| **D3** | Keputusan desain dan konten dalam percakapan proyek | Soft Rose Atelier, struktur header dan landing, customer-facing copy, modul content management. |
| **M1** | `adityaa11/atlas-skills/skills/create-project-context/SKILL.md` serta `references/interactive.md` dan `references/contract.md` pada branch `main` (diakses 18 Nov 2026) | Metode fasilitasi, project-level boundary, status klaim, kesiapan dan indeks. |

### Watchlist perubahan konteks

Project Context perlu ditinjau kembali jika ada keputusan tentang **model satu-brand vs multi-BA**, perubahan titik booking dianggap confirmed, model kapasitas BA, otoritas konten/pricing, pembayaran, atau perubahan domain dari personal BA menjadi layanan WO yang lebih luas. Perubahan UI minor tidak otomatis mengubah Project Context kecuali mengubah janji nilai atau batas bisnis.

**Handoff yang sah:** Konteks ini dapat dipakai untuk membahas Stack Context atau memperjelas scope bisnis setelah pertanyaan material dijawab. Jangan menggunakan HTML standalone sebagai otorisasi diam-diam untuk menetapkan teknologi, status bisnis, atau kebijakan operasional yang belum dipilih.

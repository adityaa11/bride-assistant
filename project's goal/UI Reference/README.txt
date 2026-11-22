RANUR BRIDAL CARE — CUSTOMER PORTAL V11

Buka home.html untuk melihat Customer Home dan navigasi portal.
Halaman:
- home.html — Customer Home
- booking.html — Booking Baru
- booking_saya.html — daftar dan detail pengajuan
- bantuan.html — kontak tim Ranur via WhatsApp
- index.html — website publik
- masuk.html / daftar.html — desain halaman autentikasi

PENTING — KONFIGURASI NOMOR ADMIN:
Di bantuan.html cari: const ADMIN_WHATSAPP = '';
Isi dengan nomor resmi dalam format internasional, misal 628xxxxxxxxxx (JANGAN gunakan contoh sebagai nomor aktif).
Tombol WhatsApp akan membuka wa.me untuk nomor tersebut dan pesan pengantar.
Booking dan Booking Saya v10 juga punya konstanta nomor admin tersendiri untuk langkah WhatsApp di halaman-halaman itu.

Semua HTML adalah standalone tanpa CSS/JS eksternal. Booking masih disimpan lokal di browser; tidak ada backend atau autentikasi produksi.

# ifs24019-pabwe-p3

Tugas Praktikum 3 — Pemrograman Aplikasi Berbasis Web (PABWE)

- **Nama:** Leona Saragih
- **NIM:** ifs24019
- **Repo:** ifs24019-pabwe-p3

## Deskripsi

**DompetKu** adalah aplikasi web satu halaman dengan tiga tab: Expense Tracker,
Bookmark Manager, dan Quiz App. Dibangun dengan HTML5, JavaScript murni,
Tailwind CSS (CDN), dan Google Fonts. Tanpa backend dan tanpa `fetch`.

## Fitur

### Expense Tracker
- Tambah, ubah, dan hapus transaksi (ubah/hapus lewat modal)
- Ringkasan total pemasukan, pengeluaran, dan saldo
- Cari judul, filter tipe/kategori, dan urutkan (tanggal/jumlah)
- Validasi: jumlah harus angka lebih dari 0
- Data disimpan di localStorage

### Bookmark Manager
- Tambah, ubah, dan hapus bookmark (ubah/hapus lewat modal)
- Validasi URL: wajib diawali `http://` atau `https://`
- Klik bookmark membuka tab baru
- Cari (nama/URL/kategori) dan urutkan (terbaru/A-Z/Z-A)
- Data disimpan di localStorage dengan key terpisah

### Quiz App
- 6 soal pilihan ganda (array of object di `assets/quiz-data.js`)
- Skor dihitung otomatis dan feedback jawaban benar/salah
- High score disimpan di localStorage
- Kuis dapat diulang

## Navigasi Tab via Query URL

State tab aktif disimpan di URL, **bukan** di localStorage:

| URL | Tab aktif |
|---|---|
| `index.html?tab=expense` | Expense Tracker (default) |
| `index.html?tab=bookmark` | Bookmark Manager |
| `index.html?tab=quiz` | Quiz App |

Nilai `tab` yang tidak valid akan kembali ke `expense`. Tombol back/forward
browser ikut berfungsi (`popstate`).

## Struktur Proyek

```
ifs24019-pabwe-p3/
├── index.html            # Aplikasi: markup tab, panel, dan modal
├── panduan.html          # Halaman statis: panduan pemakaian
├── tentang.html          # Halaman statis: info proyek
├── 404.html              # Halaman tidak ditemukan
├── README.md
└── assets/
    ├── config.js         # Konstanta: daftar tab & key localStorage
    ├── quiz-data.js      # Data soal kuis
    └── script.js         # Seluruh logika (DOM, event, validasi, state, storage, query URL)
```

## Pemisahan Tanggung Jawab

| File | Tanggung jawab |
|---|---|
| `index.html` | Struktur dan UI saja, tanpa `onclick` inline |
| `assets/config.js` | Konstanta, tanpa logika |
| `assets/quiz-data.js` | Data soal, tanpa logika |
| `assets/script.js` | Logika, dikelompokkan per fitur dengan komentar |

Urutan pemuatan script di `index.html` wajib:
`config.js` → `quiz-data.js` → `script.js`.

## Penyimpanan Data (localStorage)

Setiap fitur memakai key berbeda agar data tidak saling menimpa:

| Fitur | Key |
|---|---|
| Expense Tracker | `pabwe_p3_expense_transactions` |
| Bookmark Manager | `pabwe_p3_bookmark_items` |
| Quiz App (high score) | `pabwe_p3_quiz_high_score` |

## Cara Menjalankan

1. Clone repo:
```bash
   git clone https://github.com/leonasrgh/ifs24019-pabwe-p3.git
   cd ifs24019-pabwe-p3
```
2. Buka `index.html` di browser, atau di VS Code klik kanan `index.html` →
   **Open with Live Server**.

Tidak perlu instalasi dependensi. Tailwind dan Google Fonts dimuat lewat CDN,
jadi butuh koneksi internet saat pertama membuka.

## Keputusan Desain

- **Header/footer diduplikasi** di halaman statis karena proyek tanpa build
  tool dan tanpa `fetch`.
- **Ikon memakai simbol Unicode/emoji** agar tidak bergantung pada CDN ikon.
- **Tab via query URL**, sesuai ketentuan penilaian, bukan localStorage.
- **Tidak ada aset gambar berhak cipta**; tema visual memakai emoji dan palet warna.

## Teknologi

HTML5 · JavaScript (ES6+) · Tailwind CSS (CDN) · Google Fonts (Baloo 2) · localStorage
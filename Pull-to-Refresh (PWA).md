\# Prompt untuk Antigravity — Tambah Fitur Pull-to-Refresh (PWA)

&#x20;

\## Konteks

Ini adalah project dashboard berbasis PWA (Progressive Web App) yang sudah berjalan di production. Saat ini tidak ada fitur pull-to-refresh (tarik layar ke bawah untuk refresh data), padahal ini fitur umum di aplikasi mobile.

&#x20;

\## Tugas

Tambahkan HANYA fitur gesture pull-to-refresh pada halaman dashboard, dengan perilaku:

\- User menarik layar ke bawah dari posisi scroll paling atas

\- Muncul indikator visual (misal spinner/panah) saat ditarik

\- Jika tarikan melewati ambang batas tertentu (misal ±70px), trigger proses refresh data

\- Setelah data selesai dimuat ulang, indikator hilang dan UI kembali normal

\## ATURAN KETAT — WAJIB DIPATUHI

1\. \*\*JANGAN mengubah, menghapus, atau merapikan (refactor) kode, fungsi, komponen, styling, atau logika apa pun yang sudah ada\*\*, di luar yang benar-benar diperlukan untuk fitur ini.

2\. \*\*JANGAN mengganti struktur file, penamaan variabel/fungsi, format, atau gaya penulisan kode yang sudah ada\*\* — walaupun menurutmu ada yang bisa "diperbaiki". Itu di luar scope tugas ini.

3\. Jika project sudah punya fungsi untuk mengambil/refresh data (misalnya `fetchDashboardData()`, `loadData()`, atau sejenisnya), \*\*gunakan kembali (reuse) fungsi tersebut\*\* untuk memicu refresh. Jangan membuat logika fetch data baru yang terpisah/duplikat.

4\. Implementasi gesture, indikator visual, dan event listener sebaiknya diletakkan di file/komponen yang \*\*terpisah atau seminimal mungkin menyentuh file inti\*\* (misal buat 1 komponen/hook/utility baru khusus untuk pull-to-refresh), agar mudah di-review dan di-rollback jika diperlukan.

5\. Pastikan fitur ini \*\*tidak mengganggu scroll normal\*\* dan tidak memicu refresh saat user sedang scroll biasa di tengah/bawah halaman (hanya aktif saat posisi scroll di paling atas).

6\. Tambahkan `overscroll-behavior-y: contain` (atau setara) hanya pada container yang relevan, jangan diterapkan secara global jika tidak diperlukan.

7\. Sebelum melakukan perubahan apa pun, \*\*telusuri dulu struktur project\*\* (framework yang dipakai, cara data di-fetch, komponen dashboard yang aktif) agar implementasi konsisten dengan pola kode yang sudah ada — bukan menambahkan pattern/library baru yang asing dari codebase.

\## Setelah selesai

Tolong berikan ringkasan:

\- File apa saja yang diubah/ditambahkan (list lengkap)

\- Konfirmasi eksplisit bahwa tidak ada logika, fungsi, atau fitur lain yang tersentuh selain yang berkaitan langsung dengan pull-to-refresh

\- Cara saya bisa menguji fitur ini secara manual (langkah testing)

\## Catatan tambahan

Jika untuk mengimplementasikan fitur ini ternyata kamu merasa perlu mengubah bagian lain di luar scope (misalnya struktur komponen utama), \*\*berhenti dan tanyakan dulu ke saya sebelum melakukannya\*\* — jangan langsung dieksekusi.




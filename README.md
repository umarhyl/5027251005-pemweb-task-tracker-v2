# Week 6 — Task Tracker Kuliah v2

Versi lanjutan Task Tracker Kuliah yang menggunakan REST API sebagai sumber data.
Data tugas tidak disimpan di `localStorage`, tetapi dimuat dan diubah melalui request
ke server.

## Fitur

- Mengambil tugas dari `GET /api/tugas`.
- Mengambil daftar mata kuliah dari `GET /api/matkul`.
- Memuat tugas dan mata kuliah secara paralel menggunakan `Promise.all()`.
- Menampilkan state loading, error, kosong, dan berhasil.
- Menambahkan tugas melalui `POST /api/tugas`.
- Mengubah status tugas melalui `PATCH /api/tugas/:id`.
- Menghapus tugas melalui `DELETE /api/tugas/:id`.
- Menonaktifkan tombol saat request sedang diproses.
- Menampilkan pesan error jika request gagal.
- Memfilter tugas berdasarkan status:
  - Semua
  - Aktif
  - Selesai
- Mencari tugas berdasarkan judul atau mata kuliah.
- Menggunakan debounce pada input pencarian.
- Menampilkan jumlah tugas yang masih aktif.
- Menggunakan event delegation untuk checkbox dan tombol hapus.
- Menggunakan `render()` untuk membangun ulang daftar dari state aplikasi.
- Menggunakan `textContent` untuk menampilkan data dari server dengan aman.

## Struktur File

```text
week6/
├── index.html
├── style.css
├── app.js
└── README.md
```

- `index.html` berisi form, input pencarian, filter, state loading/error/empty,
  dan daftar tugas.
- `style.css` mengatur tampilan aplikasi, tombol, daftar tugas, dan state halaman.
- `app.js` menangani request API, state aplikasi, validasi, render, filter,
  pencarian, dan event delegation.

## Endpoint API

| Method | Endpoint | Kegunaan |
| --- | --- | --- |
| `GET` | `/api/tugas` | Mengambil semua tugas |
| `GET` | `/api/matkul` | Mengambil daftar mata kuliah |
| `POST` | `/api/tugas` | Menambahkan tugas |
| `PATCH` | `/api/tugas/:id` | Mengubah status tugas |
| `DELETE` | `/api/tugas/:id` | Menghapus tugas |

Format data tugas yang digunakan:

```json
{
  "id": 1,
  "judul": "Lab event delegation",
  "matkul": "Pemrograman Web",
  "deadline": "2026-10-08",
  "selesai": false
}
```

## Alur Request

1. Halaman menjalankan `fetchAllData()`.
2. `Promise.all()` meminta data tugas dan mata kuliah secara bersamaan.
3. Data berhasil disimpan ke state `tasks` dan `courses`.
4. `render()` menampilkan daftar tugas.
5. Form mengirim tugas baru melalui `POST`.
6. Checkbox mengirim perubahan melalui `PATCH`.
7. Tombol hapus mengirim request `DELETE`.
8. State lokal diperbarui setelah server memberikan response berhasil.

Helper `api()` memeriksa `response.ok`, membaca response JSON, dan melempar error
jika server memberikan status gagal.

Link chat AI:
https://share.gemini.google/q8hjCckO2IC9

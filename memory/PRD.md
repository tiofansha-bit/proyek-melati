# PRD — Manajemen Izin & Kegiatan Pegawai

## Problem Statement
Mobile app (Bahasa Indonesia) untuk mengatur izin pegawai dan kegiatan luar gedung. Admin dapat menambah/menghapus pegawai dan kegiatan. Menyajikan jumlah tidak hadir masuk kerja per nama dan jumlah kegiatan luar per nama.

## User Choices
- Login sederhana (role gate): Pegawai pilih nama, Admin pakai PIN.
- Pegawai mengajukan sendiri; admin menyetujui. Keduanya bisa mencatat.
- Izin: tanggal, jenis (sakit/cuti/izin), keterangan.
- Kegiatan luar: nama kegiatan, tanggal, lokasi, keterangan.
- Laporan: daftar/tabel angka per pegawai.

## Architecture
- Frontend: Expo Router (React Native), @tanstack/react-query, expo-image, expo-linear-gradient, @react-native-vector-icons/feather, @react-native-community/datetimepicker.
- Backend: FastAPI + MongoDB (motor). Semua route prefix `/api`. UUID string id, soft delete via `deleted_at`.
- Theme: sage green (light + dark) di `src/theme.ts`.

## User Personas
- Pegawai: mengajukan izin & mencatat kegiatan luar, melihat riwayat & status.
- Admin: menyetujui/menolak pengajuan, kelola pegawai & kegiatan, lihat laporan rekap.

## Core Requirements (static)
- Role gate login (Pegawai by name / Admin PIN).
- Izin CRUD + approval workflow.
- Kegiatan luar CRUD + approval workflow.
- Kelola pegawai (tambah/hapus) & kegiatan (tambah/hapus).
- Laporan: jumlah hari tidak hadir per pegawai; jumlah kegiatan luar per pegawai.

## Implemented (2026-06)
- [x] Backend: employees, activities, leaves, activity-logs, pending, reports, admin login. (15/15 backend tests pass)
- [x] Login role gate: employee search-select, admin PIN (default 1234).
- [x] Employee: Beranda (hero + stats + quick actions + riwayat), tab Izin, tab Kegiatan, form modal izin & kegiatan, hapus pengajuan pending.
- [x] Admin: Persetujuan (approve/reject), Laporan (segmented Tidak Hadir/Kegiatan Luar per pegawai), Kelola (tambah/hapus pegawai & kegiatan), catat izin/kegiatan atas nama pegawai.
- [x] Light + dark theme, toasts, haptics, pull-to-refresh.
- [x] Seed data: 4 pegawai, 4 kegiatan.

## Backlog
### P1
- Validasi rentang tanggal izin (end >= start) di backend.
- Filter laporan berdasarkan periode (bulan/tahun).
- Ekspor laporan (CSV/PDF).
### P2
- Foto/lampiran bukti pada izin (Object Storage).
- Riwayat lengkap per pegawai untuk admin.
- Ganti `@app.on_event` deprecated ke lifespan handler.

## Next Tasks
- Sesuai permintaan user berikutnya.

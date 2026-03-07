# 🅿️ ParkOne — Instalasi Backend (Laravel 12)

## 🏷️ Nama Aplikasi

**ParkOne**
*Smart School Parking System*

---

## 📖 Deskripsi

ParkOne adalah sistem parkir sekolah berbasis **RFID** dan **kamera** yang dibangun menggunakan **Laravel 12** sebagai backend dan web dashboard.

Aplikasi ini berfungsi untuk:

* Mengelola data parkir siswa dan tamu
* Monitoring kendaraan masuk dan keluar
* Menghitung durasi dan biaya parkir
* Menyediakan API untuk aplikasi mobile

ParkOne dirancang dengan arsitektur **single gate system** yang sederhana, stabil, dan mudah dikembangkan.

---

## ⚙️ Step Setup (Satu Perintah Bash)

> Pastikan **PHP 8.2+**, **Composer**, **Node.js**, dan **Database** sudah terpasang.

```bash
git clone https://github.com/StarVinn/parkone-system.git
cd parkone-backend
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan storage:link
php artisan serve
npm run build
npm run dev
```

Aplikasi dapat diakses di:

```
http://127.0.0.1:8000
```

---

## ✅ Kesimpulan

* ParkOne menggunakan **Laravel 12** sebagai backend utama
* Sistem siap digunakan untuk pengembangan **web dan mobile**
* Setup cepat dan cocok untuk lingkungan **sekolah** maupun **project akademik**
* Arsitektur fleksibel dan dapat dikembangkan bertahap

🚀 Backend **ParkOne** siap digunakan

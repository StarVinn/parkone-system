<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>PARKONE - Aplikasi Parkir Digital</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>

<body class="bg-slate-50 text-slate-800">

<!-- NAVBAR -->
<nav class="px-8 py-6 flex justify-between items-center">
  <h1 class="text-2xl font-bold text-blue-600">PARKONE</h1>
  <a href="#demo" class="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition">
    Demo
  </a>
</nav>

<!-- HERO -->
<section class="px-8 md:px-20 py-20 grid md:grid-cols-2 gap-12 items-center">
  <div>
    <h2 class="text-4xl md:text-5xl font-bold leading-tight mb-6">
      Solusi Parkir Digital<br>
      <span class="text-blue-600">Cepat & Realtime</span>
    </h2>
    <p class="text-slate-600 mb-8">
      PARKONE adalah sistem parkir digital yang mencatat kendaraan masuk & keluar
      secara otomatis dengan perhitungan tarif realtime.
    </p>

    <div class="flex gap-4">
      <a href="#features" class="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">
        Lihat Fitur
      </a>
      <a href="#demo" class="px-6 py-3 border border-slate-300 rounded-xl hover:bg-slate-100 transition">
        Coba Demo
      </a>
    </div>
  </div>

  <div class="bg-white rounded-2xl shadow-xl p-6">
    <div class="h-64 bg-slate-200 rounded-xl flex items-center justify-center text-slate-500">
      Preview Dashboard
    </div>
  </div>
</section>

<!-- FEATURES -->
<section id="features" class="px-8 md:px-20 py-20 bg-white">
  <h3 class="text-3xl font-bold text-center mb-12">Fitur Unggulan</h3>

  <div class="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
    <div class="p-6 rounded-xl shadow hover:shadow-lg transition">
      <div class="text-3xl mb-4">🚗</div>
      <h4 class="font-semibold mb-2">Scan Plat Nomor</h4>
      <p class="text-sm text-slate-600">Pencatatan kendaraan otomatis.</p>
    </div>

    <div class="p-6 rounded-xl shadow hover:shadow-lg transition">
      <div class="text-3xl mb-4">⏱️</div>
      <h4 class="font-semibold mb-2">Tarif Otomatis</h4>
      <p class="text-sm text-slate-600">Flat atau per jam.</p>
    </div>

    <div class="p-6 rounded-xl shadow hover:shadow-lg transition">
      <div class="text-3xl mb-4">📊</div>
      <h4 class="font-semibold mb-2">Realtime Dashboard</h4>
      <p class="text-sm text-slate-600">Pantau data langsung.</p>
    </div>

    <div class="p-6 rounded-xl shadow hover:shadow-lg transition">
      <div class="text-3xl mb-4">🔐</div>
      <h4 class="font-semibold mb-2">Multi Role</h4>
      <p class="text-sm text-slate-600">Admin & Officer.</p>
    </div>
  </div>
</section>

<!-- HOW IT WORKS -->
<section class="px-8 md:px-20 py-20 bg-slate-100">
  <h3 class="text-3xl font-bold text-center mb-12">Cara Kerja PARKONE</h3>

  <div class="grid md:grid-cols-4 gap-6 text-center">
    <div class="bg-white p-6 rounded-xl shadow">1️⃣ Kendaraan Masuk</div>
    <div class="bg-white p-6 rounded-xl shadow">2️⃣ Plat Dicatat</div>
    <div class="bg-white p-6 rounded-xl shadow">3️⃣ Kendaraan Keluar</div>
    <div class="bg-white p-6 rounded-xl shadow">4️⃣ Tarif Otomatis</div>
  </div>
</section>

<!-- CTA -->
<section id="demo" class="px-8 md:px-20 py-20 bg-blue-600 text-white text-center">
  <h3 class="text-3xl font-bold mb-4">Siap Mencoba PARKONE?</h3>
  <p class="mb-8 opacity-90">Solusi parkir modern untuk masa depan.</p>
  <a href="/login" class="inline-block px-8 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-slate-100 transition">
    Mulai Demo
  </a>
</section>

<!-- FOOTER -->
<footer class="py-6 text-center text-sm text-slate-500 bg-slate-900 text-slate-300">
  © 2026 PARKONE • Sistem Parkir Digital
</footer>

</body>
</html>

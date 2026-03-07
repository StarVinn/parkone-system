<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PARKONE | Smart School Parking System</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-[#060A1A] text-slate-100 antialiased">
    <div class="relative min-h-screen overflow-hidden flex flex-col">
        <div class="pointer-events-none absolute inset-0">
            <div class="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(30,94,255,0.36),transparent_45%),radial-gradient(circle_at_85%_18%,rgba(31,209,165,0.20),transparent_42%),linear-gradient(145deg,#070C1F_0%,#0B1432_52%,#111C42_100%)]"></div>
            <svg class="absolute -bottom-28 left-0 h-[440px] w-full text-[#1E5EFF]/45" viewBox="0 0 1440 320" preserveAspectRatio="none" fill="none" aria-hidden="true">
                <path d="M0,224L80,202.7C160,181,320,139,480,144C640,149,800,203,960,218.7C1120,235,1280,213,1360,202.7L1440,192L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z" fill="currentColor" />
            </svg>
            <svg class="absolute bottom-0 left-0 h-[280px] w-full text-[#1FD1A5]/25" viewBox="0 0 1440 320" preserveAspectRatio="none" fill="none" aria-hidden="true">
                <path d="M0,160L80,149.3C160,139,320,117,480,133.3C640,149,800,203,960,208C1120,213,1280,171,1360,149.3L1440,128L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z" fill="currentColor" />
            </svg>
            <div class="absolute inset-0 opacity-20">
                <svg class="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="parkone-topo" width="220" height="220" patternUnits="userSpaceOnUse">
                            <path d="M10 30C35 10 85 10 115 30C145 50 195 50 215 30" stroke="#5AA8FF" stroke-opacity="0.22" fill="none" />
                            <path d="M0 90C35 60 85 60 120 90C155 120 205 120 220 90" stroke="#69E7C7" stroke-opacity="0.18" fill="none" />
                            <path d="M15 150C45 125 95 125 125 150C155 175 205 175 220 150" stroke="#8AC3FF" stroke-opacity="0.15" fill="none" />
                            <circle cx="38" cy="44" r="2.2" fill="#1FD1A5" fill-opacity="0.32" />
                            <circle cx="162" cy="102" r="2.2" fill="#1E5EFF" fill-opacity="0.34" />
                            <circle cx="90" cy="168" r="2.2" fill="#1FD1A5" fill-opacity="0.28" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#parkone-topo)" />
                </svg>
            </div>
        </div>

        <header class="relative z-10">
            <nav class="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8">
                <div>
                    <p class="text-xs uppercase tracking-[0.24em] text-slate-300">Smart Parking</p>
                    <h1 class="text-2xl font-bold tracking-wide text-white">PARKONE</h1>
                </div>
                <a href="/login" class="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#1E5EFF] shadow-lg shadow-blue-500/20 transition hover:bg-slate-100">
                    Login
                </a>
            </nav>
        </header>

        <main class="relative z-10 flex-1">
            <section class="mx-auto grid w-full max-w-6xl gap-10 px-6 pb-16 pt-12 lg:min-h-[62vh] lg:grid-cols-2 lg:items-center">
                <div>
                    <p class="mb-3 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                        School Parking Management
                    </p>
                    <h2 class="text-4xl font-bold leading-tight text-white md:text-5xl">
                        Smart School Parking
                        <span class="block bg-gradient-to-r from-[#1E5EFF] to-[#1FD1A5] bg-clip-text text-transparent">
                            Cepat, Aman, Realtime
                        </span>
                    </h2>
                    <p class="mt-5 max-w-xl text-sm leading-6 text-slate-200/90 md:text-base">
                        PARKONE membantu sekolah mengelola kendaraan masuk dan keluar dengan dukungan RFID, kamera,
                        monitoring realtime, dan perhitungan tarif otomatis.
                    </p>
                    <div class="mt-8 flex flex-wrap gap-3">
                        <a href="/login" class="rounded-xl bg-[#1E5EFF] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#194FD8]">
                            Masuk ke Sistem
                        </a>
                        <a href="#fitur" class="rounded-xl border border-white/30 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                            Lihat Fitur
                        </a>
                    </div>
                </div>

                <div class="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl">
                    <div class="grid gap-4 sm:grid-cols-2">
                        <div class="rounded-2xl border border-white/15 bg-[#0B1432]/70 p-4">
                            <div class="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-200">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 2l8 4v6c0 5-3.5 9.7-8 10-4.5-.3-8-5-8-10V6l8-4z"></path>
                                </svg>
                            </div>
                            <p class="text-xs uppercase tracking-wide text-slate-300">Admin</p>
                            <p class="mt-2 text-sm font-semibold text-white">Master Data & Monitoring</p>
                            <p class="mt-2 text-xs text-slate-300">Kelola lokasi, area, tarif, akun, dan audit log.</p>
                        </div>
                        <div class="rounded-2xl border border-white/15 bg-[#0B1432]/70 p-4">
                            <div class="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-200">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 12h18M12 3v18"></path>
                                </svg>
                            </div>
                            <p class="text-xs uppercase tracking-wide text-slate-300">Officer</p>
                            <p class="mt-2 text-sm font-semibold text-white">Operasional Gerbang</p>
                            <p class="mt-2 text-xs text-slate-300">Standby IN/OUT, proses transaksi, dan cetak receipt.</p>
                        </div>
                        <div class="rounded-2xl border border-white/15 bg-[#0B1432]/70 p-4 sm:col-span-2">
                            <div class="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-200">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="8" r="4"></circle>
                                    <path d="M4 21c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5"></path>
                                </svg>
                            </div>
                            <p class="text-xs uppercase tracking-wide text-slate-300">Owner</p>
                            <p class="mt-2 text-sm font-semibold text-white">Akses Ringkasan Bisnis</p>
                            <p class="mt-2 text-xs text-slate-300">Pantau status operasional dan performa parkir.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section id="fitur" class="relative z-10 border-y border-white/10 bg-white/5">
                <div class="mx-auto w-full max-w-6xl px-6 py-14">
                    <div class="mb-8">
                        <h3 class="text-2xl font-bold text-white md:text-3xl">Fitur Utama</h3>
                        <p class="mt-2 text-sm text-slate-300">Dirancang untuk operasional sekolah yang cepat dan stabil.</p>
                    </div>
                    <div class="grid gap-4 md:grid-cols-3">
                        <article class="rounded-2xl border border-white/15 bg-[#0B1432]/70 p-5">
                            <div class="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 text-blue-200">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="6" width="18" height="12" rx="2"></rect>
                                    <path d="M8 10h.01M12 10h.01M16 10h.01M12 14h.01"></path>
                                </svg>
                            </div>
                            <h4 class="text-base font-semibold text-white">RFID & Plate Lookup</h4>
                            <p class="mt-2 text-sm text-slate-300">Identifikasi kendaraan lebih cepat dengan validasi owner dan tipe kendaraan.</p>
                        </article>
                        <article class="rounded-2xl border border-white/15 bg-[#0B1432]/70 p-5">
                            <div class="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-200">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 3v18h18"></path>
                                    <path d="M7 14l3-3 3 2 4-5"></path>
                                </svg>
                            </div>
                            <h4 class="text-base font-semibold text-white">Realtime Dashboard</h4>
                            <p class="mt-2 text-sm text-slate-300">Lihat okupansi area, transaksi aktif, dan pendapatan harian secara langsung.</p>
                        </article>
                        <article class="rounded-2xl border border-white/15 bg-[#0B1432]/70 p-5">
                            <div class="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-200">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 1v22"></path>
                                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14.5a3.5 3.5 0 0 1 0 7H6"></path>
                                </svg>
                            </div>
                            <h4 class="text-base font-semibold text-white">Tarif Otomatis & Receipt</h4>
                            <p class="mt-2 text-sm text-slate-300">Perhitungan durasi dan biaya parkir otomatis sesuai konfigurasi lokasi.</p>
                        </article>
                    </div>
                </div>
            </section>
        </main>

        <footer class="relative z-10 mt-auto border-t border-white/10">
            <div class="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-6 text-xs text-slate-300 sm:flex-row sm:items-center sm:justify-between">
                <p>© 2026 PARKONE. Smart School Parking System.</p>
                <p>Built for secure and realtime parking operations.</p>
            </div>
        </footer>
    </div>
</body>
</html>

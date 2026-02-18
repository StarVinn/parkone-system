<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Login | PARKONE</title>
  <script src="https://cdn.tailwindcss.com"></script>
  @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>

<body class="min-h-screen bg-slate-100 flex items-center justify-center">

  <div class="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
    
    <!-- LOGO / TITLE -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-blue-600">PARKONE</h1>
      <p class="text-sm text-slate-500 mt-2">
        Login ke sistem parkir digital
      </p>
    </div>

    <!-- FORM -->
    <form method="POST" action="{{ route('login') }}" class="space-y-5">
      @csrf
      <!-- EMAIL -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">
          Email
        </label>
        <input
          type="email"
          name="email"
          placeholder="Email"
          class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          required
        />
      </div>

      <!-- PASSWORD -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">
          Password
        </label>
        <input
          type="password"
          name="password"
          placeholder="Password"
          class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          required
        />
      </div>

      @error('email')
        <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
      @enderror
      @error('password')
        <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
      @enderror
      <!-- BUTTON -->
      <button
        type="submit"
        class="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition"
      >
        Login
      </button>
    </form>

    <p class="text-center text-xs text-slate-400 mt-6">
      Belum memiliki akun?
      <a href="{{ route('register') }}" class="text-blue-600 hover:underline">Register</a>
    </p>
    
    <!-- FOOTER TEXT -->
    <p class="text-center text-xs text-slate-400 mt-6">
      © 2026 PARKONE • Sistem Parkir Digital
    </p>

  </div>

</body>
</html>

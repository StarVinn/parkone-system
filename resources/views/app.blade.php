<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])

    @routes
    @inertiaHead
</head>
<body class="min-h-screen bg-slate-100">
    @inertia
</body>
</html>

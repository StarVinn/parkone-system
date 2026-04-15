import { Head, Link, usePage, useForm } from "@inertiajs/react";
import logo from "../../Assets/Images/logo-parkone.png";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function Register() {
    const { flash } = usePage().props;
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] =
        useState(false);

    const { data, setData, post, processing, errors } = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("register.store"));
    };

    return (
        <>
            <Head title="Register | PARKONE" />

            <div className="relative min-h-screen overflow-hidden bg-[#060A1A] flex items-center justify-center px-4 py-10">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(30,94,255,0.35),transparent_45%),radial-gradient(circle_at_85%_18%,rgba(31,209,165,0.18),transparent_40%),linear-gradient(145deg,#070C1F_0%,#0B1432_55%,#111C42_100%)]" />

                    <svg
                        className="absolute -bottom-28 left-0 h-[440px] w-full text-[#1E5EFF]/45"
                        viewBox="0 0 1440 320"
                        preserveAspectRatio="none"
                        fill="none"
                        aria-hidden="true"
                    >
                        <path
                            d="M0,224L80,202.7C160,181,320,139,480,144C640,149,800,203,960,218.7C1120,235,1280,213,1360,202.7L1440,192L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"
                            fill="currentColor"
                        />
                    </svg>

                    <svg
                        className="absolute bottom-0 left-0 h-[300px] w-full text-[#1FD1A5]/25"
                        viewBox="0 0 1440 320"
                        preserveAspectRatio="none"
                        fill="none"
                        aria-hidden="true"
                    >
                        <path
                            d="M0,160L80,149.3C160,139,320,117,480,133.3C640,149,800,203,960,208C1120,213,1280,171,1360,149.3L1440,128L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"
                            fill="currentColor"
                        />
                    </svg>

                    <div className="absolute inset-0 opacity-20">
                        <svg
                            className="h-full w-full"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <defs>
                                <pattern
                                    id="parkone-topo-register"
                                    width="220"
                                    height="220"
                                    patternUnits="userSpaceOnUse"
                                >
                                    <path
                                        d="M10 30C35 10 85 10 115 30C145 50 195 50 215 30"
                                        stroke="#5AA8FF"
                                        strokeOpacity="0.22"
                                        fill="none"
                                    />
                                    <path
                                        d="M0 90C35 60 85 60 120 90C155 120 205 120 220 90"
                                        stroke="#69E7C7"
                                        strokeOpacity="0.18"
                                        fill="none"
                                    />
                                    <path
                                        d="M15 150C45 125 95 125 125 150C155 175 205 175 220 150"
                                        stroke="#8AC3FF"
                                        strokeOpacity="0.15"
                                        fill="none"
                                    />
                                    <circle
                                        cx="38"
                                        cy="44"
                                        r="2.2"
                                        fill="#1FD1A5"
                                        fillOpacity="0.32"
                                    />
                                    <circle
                                        cx="162"
                                        cy="102"
                                        r="2.2"
                                        fill="#1E5EFF"
                                        fillOpacity="0.34"
                                    />
                                    <circle
                                        cx="90"
                                        cy="168"
                                        r="2.2"
                                        fill="#1FD1A5"
                                        fillOpacity="0.28"
                                    />
                                </pattern>
                            </defs>
                            <rect
                                width="100%"
                                height="100%"
                                fill="url(#parkone-topo-register)"
                            />
                        </svg>
                    </div>

                    <div className="absolute inset-x-0 top-8 mx-auto h-36 w-36 rounded-full bg-[#1FD1A5]/20 blur-3xl" />
                </div>

                <div className="relative w-full max-w-md rounded-3xl border border-white/15 bg-white/92 backdrop-blur-xl shadow-[0_30px_90px_rgba(2,8,23,0.45)] p-8">
                    <div className="text-center mb-8">
                        <img
                            src={logo}
                            alt="PARKONE Logo"
                            className="mx-auto w-16 h-16 mb-4"
                        />
                        <h1 className="text-3xl font-extrabold tracking-wider font-['Poppins'] bg-gradient-to-r from-[#1E5EFF] to-[#1FD1A5] bg-clip-text text-transparent">
                            PARKONE
                        </h1>
                        <p className="text-sm text-slate-500 mt-2">
                            Daftar akun baru
                        </p>
                    </div>

                    {flash?.success && (
                        <div className="mb-4 rounded-lg bg-green-100 p-3 text-sm text-green-700">
                            {flash.success}
                        </div>
                    )}

                    {flash?.error && (
                        <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">
                            {flash.error}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-5">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                Nama Lengkap
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                placeholder="Nama Lengkap"
                                autoComplete="name"
                                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                Email
                            </label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData("email", e.target.value)
                                }
                                placeholder="email@gmail.com"
                                autoComplete="email"
                                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={data.password}
                                    onChange={(e) =>
                                        setData("password", e.target.value)
                                    }
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    className="w-full rounded-lg border border-slate-300 px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword((current) => !current)
                                    }
                                    disabled={processing}
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 hover:text-slate-700 disabled:cursor-not-allowed"
                                >
                                    {showPassword ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                Konfirmasi Password
                            </label>
                            <div className="relative">
                                <input
                                    type={
                                        showPasswordConfirmation
                                            ? "text"
                                            : "password"
                                    }
                                    value={data.password_confirmation}
                                    onChange={(e) =>
                                        setData(
                                            "password_confirmation",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    className="w-full rounded-lg border border-slate-300 px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPasswordConfirmation(
                                            (current) => !current,
                                        )
                                    }
                                    disabled={processing}
                                    aria-label={
                                        showPasswordConfirmation
                                            ? "Hide password confirmation"
                                            : "Show password confirmation"
                                    }
                                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 hover:text-slate-700 disabled:cursor-not-allowed"
                                >
                                    {showPasswordConfirmation ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full cursor-pointer rounded-lg bg-blue-600 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                        >
                            {processing ? "Processing..." : "Daftar"}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-xs text-slate-400">
                        Sudah punya akun?{" "}
                        <Link
                            href={route("login")}
                            className="font-semibold text-blue-600 hover:underline"
                        >
                            Login
                        </Link>
                    </p>

                    <p className="mt-6 text-center text-xs text-slate-400">
                        © 2026 PARKONE • Sistem Parkir Digital
                    </p>
                </div>
            </div>
        </>
    );
}

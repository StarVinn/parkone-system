import { Head, useForm, Link, usePage } from "@inertiajs/react";
import logo from "../../Assets/Images/logo-parkone.png";

export default function SetPassword({ token, email }) {
    const { flash } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        token: token,
        email: email || "",
        password: "",
        password_confirmation: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("password.set.store"));
    };

    return (
        <>
            <Head title="Set Password Awal | PARKONE" />

            <div className="relative min-h-screen overflow-hidden bg-[#060A1A] flex items-center justify-center px-4 py-10">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(30,94,255,0.35),transparent_45%),radial-gradient(circle_at_85%_18%,rgba(31,209,165,0.18),transparent_40%),linear-gradient(145deg,#070C1F_0%,#0B1432_55%,#111C42_100%)]" />
                    <svg className="absolute -bottom-28 left-0 h-[440px] w-full text-[#1E5EFF]/45" viewBox="0 0 1440 320" preserveAspectRatio="none" fill="none" aria-hidden="true">
                        <path d="M0,224L80,202.7C160,181,320,139,480,144C640,149,800,203,960,218.7C1120,235,1280,213,1360,202.7L1440,192L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z" fill="currentColor" />
                    </svg>
                    <svg className="absolute bottom-0 left-0 h-[300px] w-full text-[#1FD1A5]/25" viewBox="0 0 1440 320" preserveAspectRatio="none" fill="none" aria-hidden="true">
                        <path d="M0,160L80,149.3C160,139,320,117,480,133.3C640,149,800,203,960,208C1120,213,1280,171,1360,149.3L1440,128L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z" fill="currentColor" />
                    </svg>
                    <div className="absolute inset-0 opacity-20">
                        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <pattern id="parkone-topo-set" width="220" height="220" patternUnits="userSpaceOnUse">
                                    <path d="M10 30C35 10 85 10 115 30C145 50 195 50 215 30" stroke="#5AA8FF" strokeOpacity="0.22" fill="none" />
                                    <path d="M0 90C35 60 85 60 120 90C155 120 205 120 220 90" stroke="#69E7C7" strokeOpacity="0.18" fill="none" />
                                    <path d="M15 150C45 125 95 125 125 150C155 175 205 175 220 150" stroke="#8AC3FF" strokeOpacity="0.15" fill="none" />
                                    <circle cx="38" cy="44" r="2.2" fill="#1FD1A5" fillOpacity="0.32" />
                                    <circle cx="162" cy="102" r="2.2" fill="#1E5EFF" fillOpacity="0.34" />
                                    <circle cx="90" cy="168" r="2.2" fill="#1FD1A5" fillOpacity="0.28" />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#parkone-topo-set)" />
                        </svg>
                    </div>
                    <div className="absolute inset-x-0 top-8 mx-auto h-36 w-36 rounded-full bg-[#1FD1A5]/20 blur-3xl" />
                </div>

                <div className="relative w-full max-w-md rounded-3xl border border-white/15 bg-white/92 backdrop-blur-xl shadow-[0_30px_90px_rgba(2,8,23,0.45)] p-8">
                    <div className="text-center mb-8">
                        <img src={logo} alt="PARKONE Logo" className="mx-auto w-16 h-16 mb-4" />
                        <h1 className="text-3xl font-extrabold tracking-wider font-['Poppins'] bg-gradient-to-r from-[#1E5EFF] to-[#1FD1A5] bg-clip-text text-transparent">
                            PARKONE
                        </h1>
                        <p className="text-sm text-slate-500 mt-2">
                            Buat password pertama untuk aktivasi akun baru
                        </p>
                    </div>

                    {flash?.error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                            {flash.error}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-4">
                        <input type="hidden" value={data.token} />
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={data.email}
                                readOnly
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-600 cursor-not-allowed"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Password Baru
                            </label>
                            <input
                                type="password"
                                value={data.password}
                                onChange={(e) => setData("password", e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                required
                            />
                            {errors.password && (
                                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Konfirmasi Password
                            </label>
                            <input
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) => setData("password_confirmation", e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
                        >
                            {processing ? "Processing..." : "Set Password Awal"}
                        </button>
                    </form>

                    <p className="text-center text-sm mt-6">
                        <Link href={route("login")} className="text-blue-600 hover:underline">
                            Kembali ke Login
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
}

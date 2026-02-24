import { Head, useForm, Link } from "@inertiajs/react";
import logo from "../../Assets/Images/logo-parkone.png";

export default function Register() {
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

            <div className="min-h-screen bg-slate-100 flex items-center justify-center">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
                    {/* TITLE */}
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

                    {/* FORM */}
                    <form onSubmit={submit} className="space-y-5">
                        {/* NAME */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Nama Lengkap
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                placeholder="Nama Lengkap"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                required
                            />
                            {errors.name && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        {/* EMAIL */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData("email", e.target.value)
                                }
                                placeholder="email@parkone.com"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                required
                            />
                            {errors.email && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        {/* PASSWORD */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                value={data.password}
                                onChange={(e) =>
                                    setData("password", e.target.value)
                                }
                                placeholder="••••••••"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                required
                            />
                            {errors.password && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        {/* PASSWORD CONFIRMATION */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Konfirmasi Password
                            </label>
                            <input
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) =>
                                    setData(
                                        "password_confirmation",
                                        e.target.value,
                                    )
                                }
                                placeholder="••••••••"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                required
                            />
                        </div>

                        {/* BUTTON */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
                        >
                            {processing ? "Processing..." : "Daftar"}
                        </button>
                    </form>

                    {/* LOGIN LINK */}
                    <p className="text-center text-xs text-slate-400 mt-6">
                        Sudah punya akun?{" "}
                        <Link
                            href={route("login")}
                            className="text-blue-600 hover:underline"
                        >
                            Login
                        </Link>
                    </p>

                    {/* FOOTER */}
                    <p className="text-center text-xs text-slate-400 mt-6">
                        © 2026 PARKONE • Sistem Parkir Digital
                    </p>
                </div>
            </div>
        </>
    );
}

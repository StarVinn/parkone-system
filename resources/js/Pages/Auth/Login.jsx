import { Head, useForm, Link, usePage } from "@inertiajs/react";
import logo from "../../Assets/Images/logo-parkone.png";

export default function Login() {
    const { flash } = usePage().props;

    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
    });

    const submit = (e) => {
        e.preventDefault();

        post(route("login"), {
            onError: () => {
                reset("password"); // kosongkan password kalau gagal
            },
        });
    };

    return (
        <>
            <Head title="Login | PARKONE" />

            <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
                    {/* HEADER */}
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
                            Login ke sistem parkir digital
                        </p>
                    </div>

                    {/* FLASH SUCCESS */}
                    {flash?.success && (
                        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
                            {flash.success}
                        </div>
                    )}

                    {/* FLASH ERROR */}
                    {flash?.error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                            {flash.error}
                        </div>
                    )}

                    {/* FORM */}
                    <form onSubmit={submit} className="space-y-5">
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
                                placeholder="Email"
                                autoComplete="email"
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
                                placeholder="Password"
                                autoComplete="current-password"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                required
                            />
                            {errors.password && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.password}
                                </p>
                            )}

                            {/* FORGOT PASSWORD */}
                            <div className="text-right mt-2">
                                <Link
                                    href={route("password.request")}
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    Lupa password?
                                </Link>
                            </div>
                        </div>

                        {/* BUTTON */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
                        >
                            {processing ? "Processing..." : "Login"}
                        </button>
                    </form>

                    {/* REGISTER LINK */}
                    <p className="text-center text-xs text-slate-500 mt-6">
                        Belum memiliki akun?{" "}
                        <Link
                            href={route("register")}
                            className="text-blue-600 hover:underline"
                        >
                            Register
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

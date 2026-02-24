import { Head, useForm, Link, usePage } from "@inertiajs/react";
import logo from "../../Assets/Images/logo-parkone.png";

export default function ForgotPassword() {
    const { flash } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        email: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("password.email"));
    };

    return (
        <>
            <Head title="Forgot Password | PARKONE" />

            <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
                <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
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
                            Masukkan email untuk mendapatkan link reset password.
                        </p>
                    </div>

                    {flash?.success && (
                        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
                            {flash.success}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData("email", e.target.value)
                                }
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            />
                            {errors.email && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                        >
                            {processing ? "Processing..." : "Kirim Link Reset"}
                        </button>
                    </form>

                    <p className="text-center text-sm mt-6">
                        <Link
                            href={route("login")}
                            className="text-blue-600 hover:underline"
                        >
                            Kembali ke Login
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
}

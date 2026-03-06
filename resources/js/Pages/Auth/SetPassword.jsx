import { Head, useForm } from "@inertiajs/react";
import logo from "../../Assets/Images/logo-parkone.png";

export default function SetPassword({ token, email }) {
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
                            Buat password pertama untuk aktivasi akun baru
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-4">
                        <input type="hidden" value={data.token} />

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={data.email}
                                readOnly
                                className="w-full px-4 py-2 border rounded-lg bg-slate-100 text-slate-600 cursor-not-allowed"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Password Baru
                            </label>
                            <input
                                type="password"
                                value={data.password}
                                onChange={(e) =>
                                    setData("password", e.target.value)
                                }
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            />
                            {errors.password && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
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
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                        >
                            {processing ? "Processing..." : "Set Password Awal"}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}

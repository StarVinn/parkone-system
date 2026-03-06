import { ArrowLeft, Save } from "lucide-react";
import { Link, useForm } from "@inertiajs/react";
import AdminLayout from "../../Layouts/AdminLayout";

export default function Create() {
    const { data, setData, post, errors, processing } = useForm({
        name: "",
        email: "",
        role: "officer",
        rfid_uid: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("admin.accounts.store"));
    };

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href={route("admin.accounts.index")}
                    className="group p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111633] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-sm"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-['Poppins']">
                        Create Account
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Input hanya email, nama, role, dan RFID opsional. User set password lewat email aktivasi.
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-[#111633] border border-slate-200 dark:border-white/5 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                <form onSubmit={submit} className="p-6 sm:p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                            Name
                        </label>
                        <input
                            type="text"
                            placeholder="Nama user"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border transition-all outline-none bg-slate-50 dark:bg-[#0B1026] text-slate-900 dark:text-white ${
                                errors.name
                                    ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                                    : "border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5]"
                            }`}
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1 ml-1">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                            Email
                        </label>
                        <input
                            type="email"
                            placeholder="email@domain.com"
                            value={data.email}
                            onChange={(e) => setData("email", e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border transition-all outline-none bg-slate-50 dark:bg-[#0B1026] text-slate-900 dark:text-white ${
                                errors.email
                                    ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                                    : "border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5]"
                            }`}
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                            Role
                        </label>
                        <select
                            value={data.role}
                            onChange={(e) => setData("role", e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border transition-all outline-none bg-slate-50 dark:bg-[#0B1026] text-slate-900 dark:text-white ${
                                errors.role
                                    ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                                    : "border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5]"
                            }`}
                        >
                            <option value="officer">Officer</option>
                            <option value="owner">Owner</option>
                            <option value="admin">Admin</option>
                        </select>
                        {errors.role && <p className="text-red-500 text-xs mt-1 ml-1">{errors.role}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                            RFID UID (Optional)
                        </label>
                        <input
                            type="text"
                            placeholder="Boleh kosong"
                            value={data.rfid_uid}
                            onChange={(e) => setData("rfid_uid", e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border transition-all outline-none bg-slate-50 dark:bg-[#0B1026] text-slate-900 dark:text-white ${
                                errors.rfid_uid
                                    ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                                    : "border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5]"
                            }`}
                        />
                        {errors.rfid_uid && <p className="text-red-500 text-xs mt-1 ml-1">{errors.rfid_uid}</p>}
                    </div>

                    <div className="rounded-xl border border-blue-100 dark:border-blue-500/20 bg-blue-50/70 dark:bg-blue-500/10 p-4 text-sm text-blue-700 dark:text-blue-300">
                        Setelah create, sistem akan kirim email aktivasi agar user mengisi password + konfirmasi password sendiri.
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-white/5">
                        <Link
                            href={route("admin.accounts.index")}
                            className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-white transition-all bg-gradient-to-r from-[#1E5EFF] to-[#1FD1A5] hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 cursor-pointer"
                        >
                            {processing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
                            {processing ? "Menyimpan..." : "Create Account"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

Create.layout = (page) => <AdminLayout children={page} />;

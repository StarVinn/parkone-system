import { Link } from "@inertiajs/react";
import { Car, Layers } from "lucide-react";
import AdminLayout from "../../Layouts/AdminLayout";

export default function VehicleCategory({ stats = {} }) {
    return (
        <div className="p-4 sm:p-6 transition-colors duration-300">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-['Poppins']">
                    Vehicle Category
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Halaman ringkasan untuk semua modul kendaraan.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <section className="bg-white dark:bg-[#111633] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white font-['Poppins']">
                                Vehicles
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Kelola data kendaraan pengguna.
                            </p>
                        </div>
                        <Car className="w-5 h-5 text-blue-500" />
                    </div>

                    <p className="text-3xl font-bold text-slate-900 dark:text-white font-['Poppins'] mb-4">
                        {stats.vehicleTotal ?? 0}
                    </p>

                    <div className="flex flex-wrap gap-2">
                        <Link
                            href="/admin/vehicles?from=overview"
                            className="px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition"
                        >
                            Lihat Data
                        </Link>
                    </div>
                </section>

                <section className="bg-white dark:bg-[#111633] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white font-['Poppins']">
                                Vehicle Types
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Kelola jenis/kategori kendaraan.
                            </p>
                        </div>
                        <Layers className="w-5 h-5 text-emerald-500" />
                    </div>

                    <p className="text-3xl font-bold text-slate-900 dark:text-white font-['Poppins'] mb-4">
                        {stats.vehicleTypeTotal ?? 0}
                    </p>

                    <div className="flex flex-wrap gap-2">
                        <Link
                            href="/admin/vehicle-types?from=overview"
                            className="px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition"
                        >
                            Lihat Data
                        </Link>
                    </div>
                </section>
            </div>

            <div className="mt-6 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-2 font-['Poppins']">
                    Notes Prasyarat Data
                </h3>
                <ul className="text-sm text-amber-700/90 dark:text-amber-200/90 space-y-1">
                    <li>
                        Tambah <strong>Vehicle Type</strong> dulu.
                    </li>
                    <li>
                        Tambah <strong>Vehicle</strong> setelah type dan owner aktif tersedia.
                    </li>
                </ul>
            </div>
        </div>
    );
}

VehicleCategory.layout = (page) => <AdminLayout children={page} />;

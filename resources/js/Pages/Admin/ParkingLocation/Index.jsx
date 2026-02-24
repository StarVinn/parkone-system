import { Link, usePage, router } from "@inertiajs/react";
import AdminLayout from "../../Layouts/AdminLayout";
import { Plus, Edit3, Trash2, Info } from "lucide-react";

export default function Index({ parkingLocations = [] }) {
    const { flash } = usePage().props;

    const handleDelete = (id) => {
        if (confirm("Yakin ingin menghapus lokasi parkir ini?")) {
            router.delete(route("admin.parking-locations.destroy", id));
        }
    };

    return (
        <div className="p-4 sm:p-6 transition-colors duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-['Poppins']">
                        Parking Locations
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Kelola lokasi parkir untuk sistem parkir Anda.
                    </p>
                </div>

                <Link
                    href={route("admin.parking-locations.create")}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white transition-all
                        bg-gradient-to-r from-[#1E5EFF] to-[#1FD1A5]
                        hover:opacity-90 active:scale-95 shadow-lg shadow-blue-500/20 text-sm"
                >
                    <Plus size={18} />
                    Tambah Lokasi
                </Link>
            </div>

            {flash.success && (
                <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-4 mb-6 rounded-2xl text-sm animate-in fade-in slide-in-from-top-4">
                    <Info size={18} />
                    {flash.success}
                </div>
            )}

            <div className="bg-white dark:bg-[#111633] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/5">
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Name
                                </th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Latitude
                                </th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Longitude
                                </th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Description
                                </th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-center text-slate-500 dark:text-slate-400">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {parkingLocations.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="5"
                                        className="px-6 py-10 text-center text-slate-400 dark:text-slate-500 italic"
                                    >
                                        Belum ada data lokasi parkir...
                                    </td>
                                </tr>
                            ) : (
                                parkingLocations.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-slate-900 dark:text-slate-200">
                                                {item.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                            {item.latitude}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                            {item.longitude}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                            {item.description || "-"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-3">
                                                <Link
                                                    href={route(
                                                        "admin.parking-locations.edit",
                                                        item.id,
                                                    )}
                                                    className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit3 size={18} />
                                                </Link>
                                                <button
                                                    onClick={() =>
                                                        handleDelete(item.id)
                                                    }
                                                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                                                    title="Hapus"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

Index.layout = (page) => <AdminLayout children={page} />;

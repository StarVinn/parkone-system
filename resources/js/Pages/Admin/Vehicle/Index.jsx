import { Link, usePage, router, useForm } from "@inertiajs/react";
import AdminLayout from "../../Layouts/AdminLayout";
import { Plus, Edit3, Trash2, Info, RotateCcw, ArrowLeft } from "lucide-react";

export default function Index({ vehicles = [], filters = {}, users = [], vehicleTypes = [] }) {
    const page = usePage();
    const { flash } = page.props;
    const showBackToOverview = (page.url || "").includes("from=overview");
    const rows = Array.isArray(vehicles?.data)
        ? vehicles.data
        : Array.isArray(vehicles)
          ? vehicles
          : [];
    const paginationLinks = Array.isArray(vehicles?.links) ? vehicles.links : [];
    const from = vehicles?.from ?? 0;
    const to = vehicles?.to ?? rows.length;
    const total = vehicles?.total ?? rows.length;
    const { data, setData } = useForm({
        search: filters.search ?? "",
        user_id: filters.user_id ?? "",
        vehicle_type_id: filters.vehicle_type_id ?? "",
    });

    const applyFilters = (event) => {
        event.preventDefault();
        router.get(route("admin.vehicles.index"), data, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ["vehicles", "filters", "flash", "errors"],
        });
    };

    const handleDelete = (id) => {
        if (confirm("Yakin ingin menghapus kendaraan ini?")) {
            router.delete(route("admin.vehicles.destroy", id));
        }
    };

    const resetFilters = () => {
        const emptyFilters = {
            search: "",
            user_id: "",
            vehicle_type_id: "",
        };

        setData(emptyFilters);
        router.get(route("admin.vehicles.index"), emptyFilters, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ["vehicles", "filters", "flash", "errors"],
        });
    };

    const goToPage = (url) => {
        if (!url) return;

        router.get(url, {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ["vehicles", "filters", "flash", "errors"],
        });
    };

    const paginationLabel = (label) =>
        String(label || "")
            .replace(/&laquo;/g, "«")
            .replace(/&raquo;/g, "»")
            .replace(/<[^>]*>/g, "");

    return (
        <div className="p-4 sm:p-6 transition-colors duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    {showBackToOverview && (
                        <Link
                            href="/admin/vehicle"
                            className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition mb-2"
                        >
                            <ArrowLeft size={14} />
                            Back to Overview
                        </Link>
                    )}
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-['Poppins']">
                        Vehicles
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Kelola data kendaraan, pemilik, dan tipe kendaraan.
                    </p>
                </div>

                <Link
                    href={route("admin.vehicles.create")}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white transition-all
                        bg-gradient-to-r from-[#1E5EFF] to-[#1FD1A5]
                        hover:opacity-90 active:scale-95 shadow-lg shadow-blue-500/20 text-sm"
                >
                    <Plus size={18} />
                    Tambah Kendaraan
                </Link>
            </div>

            {flash.success && (
                <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-4 mb-6 rounded-2xl text-sm animate-in fade-in slide-in-from-top-4">
                    <Info size={18} />
                    {flash.success}
                </div>
            )}

            <form
                onSubmit={applyFilters}
                className="bg-white dark:bg-[#111633] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm p-4 sm:p-5 mb-6"
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="lg:col-span-2">
                        <input
                            type="text"
                            value={data.search}
                            onChange={(e) => setData("search", e.target.value)}
                            placeholder="Cari plat, nama owner, email, atau tipe..."
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B1026] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5]"
                        />
                    </div>

                    <div>
                        <select
                            value={data.user_id}
                            onChange={(e) => setData("user_id", e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B1026] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5]"
                        >
                            <option value="">Semua owner</option>
                            {users.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <select
                            value={data.vehicle_type_id}
                            onChange={(e) => setData("vehicle_type_id", e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B1026] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5]"
                        >
                            <option value="">Semua tipe</option>
                            {vehicleTypes.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-between gap-2 pt-1">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Filter dijalankan saat klik Apply.
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                <RotateCcw size={16} />
                                Reset
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#1E5EFF] hover:bg-[#194FD8] transition cursor-pointer"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            <div className="bg-white dark:bg-[#111633] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/5">
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    License Plate
                                </th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Owner
                                </th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Vehicle Type
                                </th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-center text-slate-500 dark:text-slate-400">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {rows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="4"
                                        className="px-6 py-10 text-center text-slate-400 dark:text-slate-500 italic"
                                    >
                                        Tidak ada data kendaraan yang cocok dengan filter.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-slate-900 dark:text-slate-200 uppercase">
                                                {item.license_plate}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-600 dark:text-slate-400 text-sm">
                                                {item.user?.name || "-"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-600 dark:text-slate-400 text-sm">
                                                {item.vehicle_type?.name || "-"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-3">
                                                <Link
                                                    href={route("admin.vehicles.edit", item.id)}
                                                    className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit3 size={18} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
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

                {paginationLinks.length > 3 && (
                    <div className="border-t border-slate-200 dark:border-white/5 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Menampilkan {from} - {to} dari {total} data
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                            {paginationLinks.map((link, index) => (
                                <button
                                    key={`${link.label}-${index}`}
                                    type="button"
                                    onClick={() => goToPage(link.url)}
                                    disabled={!link.url}
                                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                                        link.active
                                            ? "bg-[#1E5EFF] text-white border-[#1E5EFF]"
                                            : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                                >
                                    {paginationLabel(link.label)}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

Index.layout = (page) => <AdminLayout children={page} />;

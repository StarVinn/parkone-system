import { usePage, router, useForm } from "@inertiajs/react";
import { useEffect, useRef } from "react";
import AdminLayout from "../../Layouts/AdminLayout";
import { Trash2, Info, RotateCcw } from "lucide-react";

const formatDateTime = (value) => {
    if (!value) return "-";

    return new Date(value).toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    });
};

export default function Index({ activityLogs = [], filters = {}, users = [] }) {
    const { flash } = usePage().props;
    const rows = Array.isArray(activityLogs?.data)
        ? activityLogs.data
        : Array.isArray(activityLogs)
          ? activityLogs
          : [];
    const paginationLinks = Array.isArray(activityLogs?.links)
        ? activityLogs.links
        : [];
    const from = activityLogs?.from ?? 0;
    const to = activityLogs?.to ?? 0;
    const total = activityLogs?.total ?? rows.length;
    const { data, setData } = useForm({
        search: filters.search ?? "",
        user_id: filters.user_id ?? "",
    });
    const initialized = useRef(false);

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;
            return;
        }

        const timer = setTimeout(() => {
            router.get(route("admin.activity-logs.index"), data, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 350);

        return () => clearTimeout(timer);
    }, [data.search, data.user_id, data.date_from, data.date_to]);

    const handleDelete = (id) => {
        if (confirm("Yakin ingin menghapus activity log ini?")) {
            router.delete(route("admin.activity-logs.destroy", id));
        }
    };

    const resetFilters = () => {
        const emptyFilters = {
            search: "",
            user_id: "",
        };

        setData(emptyFilters);
        router.get(route("admin.activity-logs.index"), emptyFilters, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const goToPage = (url) => {
        if (!url) return;

        router.get(url, {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <div className="p-4 sm:p-6 transition-colors duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-['Poppins']">
                        Activity Logs
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Riwayat aktivitas user pada sistem.
                    </p>
                </div>
            </div>

            {flash.success && (
                <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-4 mb-6 rounded-2xl text-sm animate-in fade-in slide-in-from-top-4">
                    <Info size={18} />
                    {flash.success}
                </div>
            )}

            <div className="bg-white dark:bg-[#111633] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm p-4 sm:p-5 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="lg:col-span-2">
                        <input
                            type="text"
                            value={data.search}
                            onChange={(e) => setData("search", e.target.value)}
                            placeholder="Cari aktivitas, nama user, atau email..."
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B1026] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5]"
                        />
                    </div>

                    <div>
                        <select
                            value={data.user_id}
                            onChange={(e) => setData("user_id", e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B1026] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5]"
                        >
                            <option value="">Semua user</option>
                            {users.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-between gap-2 pt-1">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Filter realtime aktif.
                        </p>
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                        >
                            <RotateCcw size={16} />
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#111633] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/5">
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    User
                                </th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Activity
                                </th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Time
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
                                        Tidak ada activity log yang cocok dengan filter.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors"
                                    >
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                            {item.user?.name || "-"}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                            {item.activity}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                            {formatDateTime(item.activity_time)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center">
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
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

Index.layout = (page) => <AdminLayout children={page} />;

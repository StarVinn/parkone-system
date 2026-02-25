import { usePage, router } from "@inertiajs/react";
import AdminLayout from "../../Layouts/AdminLayout";
import { Trash2, Info } from "lucide-react";

const formatDateTime = (value) => {
    if (!value) return "-";

    return new Date(value).toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    });
};

export default function Index({ activityLogs = [] }) {
    const { flash } = usePage().props;

    const handleDelete = (id) => {
        if (confirm("Yakin ingin menghapus activity log ini?")) {
            router.delete(route("admin.activity-logs.destroy", id));
        }
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
                            {activityLogs.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="4"
                                        className="px-6 py-10 text-center text-slate-400 dark:text-slate-500 italic"
                                    >
                                        Belum ada activity log...
                                    </td>
                                </tr>
                            ) : (
                                activityLogs.map((item) => (
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

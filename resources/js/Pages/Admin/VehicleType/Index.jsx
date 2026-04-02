import { Link, usePage, router } from "@inertiajs/react";
import AdminLayout from "../../Layouts/AdminLayout";
import { Plus, Edit3, Trash2, Info, X } from "lucide-react";
import { useState } from "react";
import useI18n from "../../../hooks/useI18n";

export default function Index({ vehicleTypes = [] }) {
    const page = usePage();
    const { flash } = page.props;
    const showBackToOverview = (page.url || "").includes("from=overview");
    const { t } = useI18n();

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        description: "",
    });
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
        });
        setErrors({});
        setEditingItem(null);
    };

    const openCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setFormData({
            name: item.name || "",
            description: item.description || "",
        });
        setEditingItem(item);
        setErrors({});
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        if (editingItem) {
            router.put(
                route("admin.vehicle-types.update", editingItem.id),
                formData,
                {
                    onSuccess: () => {
                        setProcessing(false);
                        closeModal();
                    },
                    onError: (err) => {
                        setProcessing(false);
                        setErrors(err);
                    },
                },
            );
        } else {
            router.post(route("admin.vehicle-types.store"), formData, {
                onSuccess: () => {
                    setProcessing(false);
                    closeModal();
                },
                onError: (err) => {
                    setProcessing(false);
                    setErrors(err);
                },
            });
        }
    };

    const handleDelete = (id) => {
        if (
            confirm(
                t(
                    "admin.vehicle_types.confirm_delete",
                    "Yakin ingin menghapus jenis kendaraan ini?",
                ),
            )
        ) {
            router.delete(route("admin.vehicle-types.destroy", id));
        }
    };

    return (
        <div className="p-4 sm:p-6 transition-colors duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    {showBackToOverview && (
                        <Link
                            href="/admin/vehicle"
                            className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition mb-2"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                            {t("actions.back_to_overview", "Back to Overview")}
                        </Link>
                    )}
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-['Poppins']">
                        {t("admin.vehicle_types.title", "Vehicle Types")}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {t(
                            "admin.vehicle_types.description",
                            "Kelola kategori kendaraan untuk sistem parkir Anda.",
                        )}
                    </p>
                </div>

                <button
                    onClick={openCreateModal}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white transition-all
                        bg-gradient-to-r from-[#1E5EFF] to-[#1FD1A5]
                        hover:opacity-90 active:scale-95 shadow-lg shadow-blue-500/20 text-sm cursor-pointer"
                >
                    <Plus size={18} />
                    {t("admin.vehicle_types.add", "Tambah Tipe")}
                </button>
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
                                    {t("fields.name", "Name")}
                                </th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    {t("fields.description", "Description")}
                                </th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-center text-slate-500 dark:text-slate-400">
                                    {t("fields.action", "Action")}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {vehicleTypes.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="3"
                                        className="px-6 py-10 text-center text-slate-400 dark:text-slate-500 italic"
                                    >
                                        {t(
                                            "admin.vehicle_types.empty",
                                            "Belum ada data kendaraan...",
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                vehicleTypes.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-slate-900 dark:text-slate-200">
                                                {item.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-600 dark:text-slate-400 text-sm">
                                                {item.description || "-"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-3">
                                                <button
                                                    onClick={() =>
                                                        openEditModal(item)
                                                    }
                                                    className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors cursor-pointer"
                                                    title={t("actions.edit", "Edit")}
                                                >
                                                    <Edit3 size={18} />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDelete(item.id)
                                                    }
                                                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                                                    title={t("actions.delete", "Hapus")}
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

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
                        onClick={closeModal}
                    />

                    {/* Modal Content */}
                    <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-[#111633] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-[#111633] rounded-t-2xl">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-['Poppins']">
                                {editingItem
                                    ? t(
                                          "admin.vehicle_types.edit_title",
                                          "Edit Vehicle Type",
                                      )
                                    : t(
                                          "admin.vehicle_types.create_title",
                                          "Create Vehicle Type",
                                      )}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                                    {t(
                                        "admin.vehicle_types.fields.name",
                                        "Vehicle Type Name",
                                    )}
                                </label>
                                <input
                                    type="text"
                                    placeholder={t(
                                        "admin.vehicle_types.fields.name_placeholder",
                                        "Contoh: Mobil Sedan, Motor Sport...",
                                    )}
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            name: e.target.value,
                                        }))
                                    }
                                    className={`w-full px-4 py-3 rounded-xl border transition-all outline-none
                                        bg-slate-50 dark:bg-[#0B1026]
                                        text-slate-900 dark:text-white
                                        ${
                                            errors.name
                                                ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                                                : "border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5]"
                                        }`}
                                />
                                {errors.name && (
                                    <p className="text-red-500 text-xs mt-1 ml-1 animate-pulse">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                                    {t(
                                        "admin.vehicle_types.fields.description",
                                        "Description",
                                    )}
                                </label>
                                <textarea
                                    placeholder={t(
                                        "admin.vehicle_types.fields.description_placeholder",
                                        "Berikan keterangan singkat mengenai tipe ini...",
                                    )}
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            description: e.target.value,
                                        }))
                                    }
                                    rows="3"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 outline-none transition-all
                                        bg-slate-50 dark:bg-[#0B1026]
                                        text-slate-900 dark:text-white
                                        focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5] resize-none"
                                />
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-white/5">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                >
                                    {t("actions.cancel", "Batal")}
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-white transition-all
                                        bg-gradient-to-r from-[#1E5EFF] to-[#1FD1A5]
                                        hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 cursor-pointer"
                                >
                                    {processing ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="18"
                                            height="18"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                            <polyline points="17 21 17 13 7 13 7 21" />
                                            <polyline points="7 3 7 8 15 8" />
                                        </svg>
                                    )}
                                    {processing
                                        ? t("states.saving", "Menyimpan...")
                                        : editingItem
                                          ? t(
                                                "admin.vehicle_types.update",
                                                "Update Data",
                                            )
                                          : t("actions.save", "Simpan Data")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

Index.layout = (page) => <AdminLayout children={page} />;

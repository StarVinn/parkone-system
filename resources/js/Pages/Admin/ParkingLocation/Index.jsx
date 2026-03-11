import { Link, usePage, router } from "@inertiajs/react";
import AdminLayout from "../../Layouts/AdminLayout";
import { Plus, Edit3, Trash2, Info, MapPinned, X } from "lucide-react";
import { useState } from "react";
import MapPicker from "./MapPicker";

export default function Index({ parkingLocations = [] }) {
    const page = usePage();
    const { flash } = page.props;
    const showBackToOverview = (page.url || "").includes("from=overview");

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        latitude: "",
        longitude: "",
        description: "",
    });
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    const resetForm = () => {
        setFormData({
            name: "",
            latitude: "",
            longitude: "",
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
            latitude: item.latitude || "",
            longitude: item.longitude || "",
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
                route("admin.parking-locations.update", editingItem.id),
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
            router.post(route("admin.parking-locations.store"), formData, {
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
        if (confirm("Yakin ingin menghapus lokasi parkir ini?")) {
            router.delete(route("admin.parking-locations.destroy", id));
        }
    };

    const getGoogleMapsUrl = (latitude, longitude) => {
        if (!latitude || !longitude) return "#";
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${latitude},${longitude}`,
        )}`;
    };

    return (
        <div className="p-4 sm:p-6 transition-colors duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    {showBackToOverview && (
                        <Link
                            href="/admin/parking"
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
                            Back to Overview
                        </Link>
                    )}
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-['Poppins']">
                        Parking Locations
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Kelola lokasi parkir untuk sistem parkir Anda.
                    </p>
                </div>

                <button
                    onClick={openCreateModal}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white transition-all
                        bg-gradient-to-r from-[#1E5EFF] to-[#1FD1A5]
                        hover:opacity-90 active:scale-95 shadow-lg shadow-blue-500/20 text-sm cursor-pointer"
                >
                    <Plus size={18} />
                    Tambah Lokasi
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
                                                <button
                                                    onClick={() =>
                                                        openEditModal(item)
                                                    }
                                                    className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors cursor-pointer"
                                                    title="Edit"
                                                >
                                                    <Edit3 size={18} />
                                                </button>
                                                {item.latitude &&
                                                item.longitude ? (
                                                    <a
                                                        href={getGoogleMapsUrl(
                                                            item.latitude,
                                                            item.longitude,
                                                        )}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-2 rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                                                        title="Go to GMaps"
                                                    >
                                                        <MapPinned size={18} />
                                                    </a>
                                                ) : (
                                                    <span
                                                        className="p-2 rounded-lg text-slate-300 dark:text-slate-600 cursor-not-allowed"
                                                        title="Koordinat belum tersedia"
                                                    >
                                                        <MapPinned size={18} />
                                                    </span>
                                                )}
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

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
                        onClick={closeModal}
                    />

                    {/* Modal Content */}
                    <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#111633] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-[#111633] rounded-t-2xl">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-['Poppins']">
                                {editingItem
                                    ? "Edit Parking Location"
                                    : "Create Parking Location"}
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
                                    Location Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Mall A Lantai 2"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setData("name", e.target.value)
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

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                                        Latitude
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="-6.200000"
                                        value={formData.latitude}
                                        readOnly
                                        className={`w-full px-4 py-3 rounded-xl border transition-all outline-none
                                            bg-slate-100 dark:bg-[#0B1026]
                                            text-slate-900 dark:text-white cursor-not-allowed
                                            ${
                                                errors.latitude
                                                    ? "border-red-500"
                                                    : "border-slate-200 dark:border-white/10"
                                            }`}
                                    />
                                    {errors.latitude && (
                                        <p className="text-red-500 text-xs mt-1 ml-1 animate-pulse">
                                            {errors.latitude}
                                        </p>
                                    )}
                                    {!errors.latitude && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                                            Otomatis dari peta.
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                                        Longitude
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="106.816666"
                                        value={formData.longitude}
                                        readOnly
                                        className={`w-full px-4 py-3 rounded-xl border transition-all outline-none
                                            bg-slate-100 dark:bg-[#0B1026]
                                            text-slate-900 dark:text-white cursor-not-allowed
                                            ${
                                                errors.longitude
                                                    ? "border-red-500"
                                                    : "border-slate-200 dark:border-white/10"
                                            }`}
                                    />
                                    {errors.longitude && (
                                        <p className="text-red-500 text-xs mt-1 ml-1 animate-pulse">
                                            {errors.longitude}
                                        </p>
                                    )}
                                    {!errors.longitude && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                                            Otomatis dari peta.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <MapPicker
                                latitude={formData.latitude}
                                longitude={formData.longitude}
                                onChange={(lat, lng) => {
                                    setFormData((prev) => ({
                                        ...prev,
                                        latitude: lat,
                                        longitude: lng,
                                    }));
                                }}
                            />

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                                    Description
                                </label>
                                <textarea
                                    placeholder="Berikan keterangan singkat lokasi ini..."
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
                                    Batal
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
                                        ? "Menyimpan..."
                                        : editingItem
                                          ? "Update Data"
                                          : "Simpan Data"}
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

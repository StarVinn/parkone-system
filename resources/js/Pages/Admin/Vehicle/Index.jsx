import { Link, usePage, router, useForm } from "@inertiajs/react";
import AdminLayout from "../../Layouts/AdminLayout";
import { Plus, Edit3, Trash2, Info, RotateCcw, X } from "lucide-react";
import { useState } from "react";

function formatLicensePlate(value) {
    const cleaned = String(value || "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");

    if (!cleaned) {
        return "";
    }

    const match = cleaned.match(/^([A-Z]{1,2})([0-9]{0,4})([A-Z]{0,3})/);
    if (!match) {
        return cleaned;
    }

    return [match[1], match[2], match[3]].filter(Boolean).join(" ");
}

const emptyRow = () => ({
    license_plate: "",
    vehicle_type_id: "",
});

export default function Index({
    vehicles = [],
    filters = {},
    vehicleTypes = [],
}) {
    const page = usePage();
    const { flash } = page.props;
    const showBackToOverview = (page.url || "").includes("from=overview");

    // Pagination helpers
    const rows = Array.isArray(vehicles?.data)
        ? vehicles.data
        : Array.isArray(vehicles)
          ? vehicles
          : [];
    const paginationLinks = Array.isArray(vehicles?.links)
        ? vehicles.links
        : [];
    const from = vehicles?.from ?? 0;
    const to = vehicles?.to ?? rows.length;
    const total = vehicles?.total ?? rows.length;

    // Filter form
    const { data: filterData, setData: setFilterData } = useForm({
        search: filters.search ?? "",
        vehicle_type_id: filters.vehicle_type_id ?? "",
    });

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Form state for create/edit
    const [formData, setFormData] = useState({
        vehicles: [emptyRow()],
    });
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    // Filter functions
    const applyFilters = (event) => {
        event.preventDefault();
        router.get(route("admin.vehicles.index"), filterData, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ["vehicles", "filters", "flash", "errors"],
        });
    };

    const resetFilters = () => {
        const emptyFilters = {
            search: "",
            vehicle_type_id: "",
        };
        setFilterData(emptyFilters);
        router.get(route("admin.vehicles.index"), emptyFilters, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ["vehicles", "filters", "flash", "errors"],
        });
    };

    const goToPage = (url) => {
        if (!url) return;
        router.get(
            url,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ["vehicles", "filters", "flash", "errors"],
            },
        );
    };

    const paginationLabel = (label) =>
        String(label || "")
            .replace(/&laquo;/g, "«")
            .replace(/&raquo;/g, "»")
            .replace(/<[^>]*>/g, "");

    // Modal functions
    const resetForm = () => {
        setFormData({ vehicles: [emptyRow()] });
        setErrors({});
        setEditingItem(null);
    };

    const openCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setFormData({
            vehicles: [
                {
                    license_plate: formatLicensePlate(item.license_plate || ""),
                    vehicle_type_id: item.vehicle_type_id || "",
                },
            ],
        });
        setEditingItem(item);
        setErrors({});
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    // Form row functions
    const updateRow = (index, field, value) => {
        const nextRows = [...formData.vehicles];
        nextRows[index] = {
            ...nextRows[index],
            [field]: field === "license_plate" ? formatLicensePlate(value) : value,
        };
        setFormData({ vehicles: nextRows });
    };

    const addRow = () => {
        setFormData({ vehicles: [...formData.vehicles, emptyRow()] });
    };

    const removeRow = (index) => {
        if (formData.vehicles.length <= 1) return;
        setFormData({
            vehicles: formData.vehicles.filter((_, i) => i !== index),
        });
    };

    const rowError = (index, field) => errors[`vehicles.${index}.${field}`];

    const handleSubmit = (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        if (editingItem) {
            // Single vehicle update
            router.put(
                route("admin.vehicles.update", editingItem.id),
                formData.vehicles[0],
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
            // Batch create
            router.post(route("admin.vehicles.store"), formData, {
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
        if (confirm("Yakin ingin menghapus kendaraan ini?")) {
            router.delete(route("admin.vehicles.destroy", id));
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
                            Back to Overview
                        </Link>
                    )}
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-['Poppins']">
                        Vehicles
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Kelola data kendaraan dan tipe kendaraan.
                    </p>
                </div>

                <button
                    onClick={openCreateModal}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white transition-all
                        bg-gradient-to-r from-[#1E5EFF] to-[#1FD1A5]
                        hover:opacity-90 active:scale-95 shadow-lg shadow-blue-500/20 text-sm cursor-pointer"
                >
                    <Plus size={18} />
                    Tambah Kendaraan
                </button>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="lg:col-span-2">
                        <input
                            type="text"
                            value={filterData.search}
                            onChange={(e) =>
                                setFilterData("search", e.target.value)
                            }
                            placeholder="Cari plat atau tipe kendaraan..."
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B1026] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5]"
                        />
                    </div>

                    <div>
                        <select
                            value={filterData.vehicle_type_id}
                            onChange={(e) =>
                                setFilterData("vehicle_type_id", e.target.value)
                            }
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

                    <div className="sm:col-span-2 lg:col-span-3 flex items-center justify-between gap-2 pt-1">
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
                                        colSpan="3"
                                        className="px-6 py-10 text-center text-slate-400 dark:text-slate-500 italic"
                                    >
                                        Tidak ada data kendaraan yang cocok
                                        dengan filter.
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
                                                {formatLicensePlate(item.license_plate)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-600 dark:text-slate-400 text-sm">
                                                {item.vehicle_type?.name || "-"}
                                            </span>
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

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
                        onClick={closeModal}
                    />

                    {/* Modal Content */}
                    <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#111633] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-[#111633] rounded-t-2xl">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-['Poppins']">
                                {editingItem
                                    ? "Edit Vehicle"
                                    : "Create Vehicles"}
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
                            {errors.vehicles && !editingItem && (
                                <p className="text-red-500 text-sm">
                                    {errors.vehicles}
                                </p>
                            )}

                            {editingItem ? (
                                // Single edit form
                                <div className="border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                                                License Plate
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Contoh: B 1234 CD"
                                                maxLength={20}
                                                value={
                                                    formData.vehicles[0]
                                                        .license_plate
                                                }
                                                onChange={(e) =>
                                                    updateRow(
                                                        0,
                                                        "license_plate",
                                                        e.target.value,
                                                    )
                                                }
                                                className={`w-full px-4 py-3 rounded-xl border transition-all outline-none
                                                    bg-slate-50 dark:bg-[#0B1026]
                                                    text-slate-900 dark:text-white
                                                    ${
                                                        errors.license_plate
                                                            ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                                                            : "border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5]"
                                                    }`}
                                            />
                                            {errors.license_plate && (
                                                <p className="text-red-500 text-xs mt-1 ml-1 animate-pulse">
                                                    {errors.license_plate}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                                                Vehicle Type
                                            </label>
                                            <select
                                                value={
                                                    formData.vehicles[0]
                                                        .vehicle_type_id
                                                }
                                                onChange={(e) =>
                                                    updateRow(
                                                        0,
                                                        "vehicle_type_id",
                                                        e.target.value,
                                                    )
                                                }
                                                className={`w-full px-4 py-3 rounded-xl border transition-all outline-none
                                                    bg-slate-50 dark:bg-[#0B1026]
                                                    text-slate-900 dark:text-white
                                                    ${
                                                        errors.vehicle_type_id
                                                            ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                                                            : "border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5]"
                                                    }`}
                                            >
                                                <option value="">
                                                    Pilih tipe kendaraan
                                                </option>
                                                {vehicleTypes.map((item) => (
                                                    <option
                                                        key={item.id}
                                                        value={item.id}
                                                    >
                                                        {item.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.vehicle_type_id && (
                                                <p className="text-red-500 text-xs mt-1 ml-1 animate-pulse">
                                                    {errors.vehicle_type_id}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // Batch create form
                                formData.vehicles.map((vehicle, index) => (
                                    <div
                                        key={`vehicle-row-${index}`}
                                        className="border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 space-y-4"
                                    >
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                Vehicle #{index + 1}
                                            </p>
                                            {formData.vehicles.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeRow(index)
                                                    }
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
                                                >
                                                    <Trash2 size={14} />
                                                    Hapus
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                                                    License Plate
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Contoh: B 1234 CD"
                                                    maxLength={20}
                                                    value={
                                                        vehicle.license_plate
                                                    }
                                                    onChange={(e) =>
                                                        updateRow(
                                                            index,
                                                            "license_plate",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className={`w-full px-4 py-3 rounded-xl border transition-all outline-none
                                                        bg-slate-50 dark:bg-[#0B1026]
                                                        text-slate-900 dark:text-white
                                                        ${
                                                            rowError(
                                                                index,
                                                                "license_plate",
                                                            )
                                                                ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                                                                : "border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5]"
                                                        }`}
                                                />
                                                {rowError(
                                                    index,
                                                    "license_plate",
                                                ) && (
                                                    <p className="text-red-500 text-xs mt-1 ml-1 animate-pulse">
                                                        {rowError(
                                                            index,
                                                            "license_plate",
                                                        )}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                                                    Vehicle Type
                                                </label>
                                                <select
                                                    value={
                                                        vehicle.vehicle_type_id
                                                    }
                                                    onChange={(e) =>
                                                        updateRow(
                                                            index,
                                                            "vehicle_type_id",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className={`w-full px-4 py-3 cursor-pointer rounded-xl border transition-all outline-none
                                                        bg-slate-50 dark:bg-[#0B1026]
                                                        text-slate-900 dark:text-white
                                                        ${
                                                            rowError(
                                                                index,
                                                                "vehicle_type_id",
                                                            )
                                                                ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                                                                : "border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5]"
                                                        }`}
                                                >
                                                    <option value="">
                                                        Pilih tipe kendaraan
                                                    </option>
                                                    {vehicleTypes.map(
                                                        (item) => (
                                                            <option
                                                                key={item.id}
                                                                value={item.id}
                                                            >
                                                                {item.name}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                                {rowError(
                                                    index,
                                                    "vehicle_type_id",
                                                ) && (
                                                    <p className="text-red-500 text-xs mt-1 ml-1 animate-pulse">
                                                        {rowError(
                                                            index,
                                                            "vehicle_type_id",
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}

                            {!editingItem && (
                                <button
                                    type="button"
                                    onClick={addRow}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#1E5EFF] bg-blue-50 dark:bg-blue-500/10 hover:opacity-90 transition-opacity cursor-pointer"
                                >
                                    <Plus size={16} />
                                    Tambah Baris Vehicle
                                </button>
                            )}

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
                                          : "Simpan Semua"}
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

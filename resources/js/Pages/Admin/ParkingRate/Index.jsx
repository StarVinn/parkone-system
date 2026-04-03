import { Link, usePage, router } from "@inertiajs/react";
import AdminLayout from "../../Layouts/AdminLayout";
import { Plus, Edit3, Trash2, Info, X } from "lucide-react";
import { useState } from "react";
import useI18n from "../../../hooks/useI18n";

const formatCurrency = (value) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));

const getNumericValue = (value) => String(value ?? "").replace(/\D/g, "");

const formatRupiahInput = (value) => {
    const numeric = getNumericValue(value);
    if (!numeric) return "";
    return `Rp ${Number(numeric).toLocaleString("id-ID")}`;
};

export default function Index({
    parkingRates = [],
    parkingLocations = [],
    vehicleTypes = [],
}) {
    const page = usePage();
    const { flash } = page.props;
    const { t } = useI18n();
    const showBackToOverview = (page.url || "").includes("from=overview");

    const rows = Array.isArray(parkingRates?.data)
        ? parkingRates.data
        : Array.isArray(parkingRates)
          ? parkingRates
          : [];
    const paginationLinks = Array.isArray(parkingRates?.links)
        ? parkingRates.links
        : [];
    const from = parkingRates?.from ?? 0;
    const to = parkingRates?.to ?? rows.length;
    const total = parkingRates?.total ?? rows.length;

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        vehicle_type_id: "",
        location_id: "",
        rate_type: "hourly",
        rate_per_hour: "",
        flat_rate: "",
    });
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    const isHourly = formData.rate_type === "hourly";
    const currentRateValue = isHourly
        ? formData.rate_per_hour
        : formData.flat_rate;

    const resetForm = () => {
        setFormData({
            vehicle_type_id: "",
            location_id: "",
            rate_type: "hourly",
            rate_per_hour: "",
            flat_rate: "",
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
            vehicle_type_id: item.vehicle_type_id || "",
            location_id: item.location_id || "",
            rate_type: item.rate_type || "hourly",
            rate_per_hour: item.rate_per_hour?.toString() || "",
            flat_rate: item.flat_rate?.toString() || "",
        });
        setEditingItem(item);
        setErrors({});
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const handleRateChange = (e) => {
        const numericValue = getNumericValue(e.target.value);

        if (isHourly) {
            setFormData((prev) => ({ ...prev, rate_per_hour: numericValue }));
            return;
        }

        setFormData((prev) => ({ ...prev, flat_rate: numericValue }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        // Submit with numeric values
        const submitData = {
            ...formData,
            rate_per_hour: formData.rate_per_hour || null,
            flat_rate: formData.flat_rate || null,
        };

        if (editingItem) {
            router.put(
                route("admin.parking-rates.update", editingItem.id),
                submitData,
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
            router.post(route("admin.parking-rates.store"), submitData, {
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
                    "admin.parking_rates.confirm_delete",
                    "Yakin ingin menghapus tarif parkir ini?",
                ),
            )
        ) {
            router.delete(route("admin.parking-rates.destroy", id));
        }
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
                only: [
                    "parkingRates",
                    "parkingLocations",
                    "vehicleTypes",
                    "flash",
                    "errors",
                ],
            },
        );
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
                            {t(
                                "actions.back_to_overview",
                                "Back to Overview",
                            )}
                        </Link>
                    )}
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-['Poppins']">
                        {t("admin.parking_rates.title", "Parking Rates")}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {t(
                            "admin.parking_rates.description",
                            "Kelola tarif parkir berdasarkan tipe kendaraan dan area parkir.",
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
                    {t("admin.parking_rates.add", "Tambah Tarif")}
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
                                    {t("fields.vehicle_type", "Vehicle Type")}
                                </th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    {t(
                                        "fields.parking_location",
                                        "Parking Location",
                                    )}
                                </th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    {t("fields.rate_type", "Rate Type")}
                                </th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    {t("fields.amount", "Amount")}
                                </th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-center text-slate-500 dark:text-slate-400">
                                    {t("fields.action", "Action")}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {rows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="5"
                                        className="px-6 py-10 text-center text-slate-400 dark:text-slate-500 italic"
                                    >
                                        {t(
                                            "admin.parking_rates.empty",
                                            "Belum ada data tarif kendaraan...",
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                rows.map((item) => {
                                    const isRateHourly =
                                        item.rate_type === "hourly";
                                    const amount = isRateHourly
                                        ? `${formatCurrency(item.rate_per_hour)} ${t(
                                              "admin.parking_rates.per_hour_suffix",
                                              "/ jam",
                                          )}`
                                        : formatCurrency(item.flat_rate);
                                    const rateTypeLabel =
                                        item.rate_type === "hourly"
                                            ? t("rate_types.hourly", "Hourly")
                                            : item.rate_type === "flat"
                                              ? t("rate_types.flat", "Flat")
                                              : item.rate_type;

                                    return (
                                        <tr
                                            key={item.id}
                                            className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <span className="font-medium text-slate-900 dark:text-slate-200">
                                                    {item.vehicle_type?.name ||
                                                        "-"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                                {item.parking_area?.name ||
                                                    item.location?.name ||
                                                    "-"}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 capitalize">
                                                {rateTypeLabel}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                                {amount}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-3">
                                                    <button
                                                        onClick={() =>
                                                            openEditModal(item)
                                                        }
                                                        className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors cursor-pointer"
                                                        title={t(
                                                            "actions.edit",
                                                            "Edit",
                                                        )}
                                                    >
                                                        <Edit3 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                item.id,
                                                            )
                                                        }
                                                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                                                        title={t(
                                                            "actions.delete",
                                                            "Delete",
                                                        )}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {paginationLinks.length > 3 && (
                    <div className="border-t border-slate-200 dark:border-white/5 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {t(
                                "pagination.showing",
                                "Menampilkan {from} - {to} dari {total} data",
                                { from, to, total },
                            )}
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
                    <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-[#111633] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-[#111633] rounded-t-2xl">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-['Poppins']">
                                {editingItem
                                    ? t(
                                          "admin.parking_rates.modal.edit_title",
                                          "Edit Parking Rate",
                                      )
                                    : t(
                                          "admin.parking_rates.modal.create_title",
                                          "Create Parking Rate",
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                                        {t("fields.vehicle_type", "Vehicle Type")}
                                    </label>
                                    <select
                                        value={formData.vehicle_type_id}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                vehicle_type_id: e.target.value,
                                            }))
                                        }
                                        className={`w-full px-4 py-3 rounded-xl border transition-all outline-none cursor-pointer
                                            bg-slate-50 dark:bg-[#0B1026]
                                            text-slate-900 dark:text-white
                                            ${
                                                errors.vehicle_type_id
                                                    ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                                                    : "border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5]"
                                            }`}
                                    >
                                        <option value="">
                                            {t(
                                                "admin.parking_rates.fields.vehicle_type_placeholder",
                                                "Pilih tipe kendaraan",
                                            )}
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

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                                        {t(
                                            "fields.parking_location",
                                            "Parking Location",
                                        )}
                                    </label>
                                    <select
                                        value={formData.location_id}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                location_id: e.target.value,
                                            }))
                                        }
                                        className={`w-full px-4 py-3 rounded-xl border transition-all outline-none cursor-pointer
                                            bg-slate-50 dark:bg-[#0B1026]
                                            text-slate-900 dark:text-white
                                            ${
                                                errors.location_id
                                                    ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                                                    : "border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5]"
                                            }`}
                                    >
                                        <option value="">
                                            {t(
                                                "admin.parking_rates.fields.location_placeholder",
                                                "Pilih lokasi parkir",
                                            )}
                                        </option>
                                        {parkingLocations.map((item) => (
                                            <option
                                                key={item.id}
                                                value={item.id}
                                            >
                                                {item.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.location_id && (
                                        <p className="text-red-500 text-xs mt-1 ml-1 animate-pulse">
                                            {errors.location_id}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                                        {t("fields.rate_type", "Rate Type")}
                                    </label>
                                    <select
                                        value={formData.rate_type}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                rate_type: e.target.value,
                                            }))
                                        }
                                        className={`w-full px-4 py-3 rounded-xl border transition-all outline-none cursor-pointer
                                            bg-slate-50 dark:bg-[#0B1026]
                                            text-slate-900 dark:text-white
                                            ${
                                                errors.rate_type
                                                    ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                                                    : "border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5]"
                                            }`}
                                    >
                                        <option value="hourly">
                                            {t("rate_types.hourly", "Hourly")}
                                        </option>
                                        <option value="flat">
                                            {t("rate_types.flat", "Flat")}
                                        </option>
                                    </select>
                                    {errors.rate_type && (
                                        <p className="text-red-500 text-xs mt-1 ml-1 animate-pulse">
                                            {errors.rate_type}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                                        {isHourly
                                            ? t(
                                                  "admin.parking_rates.fields.rate_per_hour",
                                                  "Rate Per Hour",
                                              )
                                            : t(
                                                  "admin.parking_rates.fields.flat_rate",
                                                  "Flat Rate",
                                              )}
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder={
                                            isHourly
                                                ? t(
                                                      "admin.parking_rates.fields.rate_per_hour_placeholder",
                                                      "Contoh: Rp 5.000",
                                                  )
                                                : t(
                                                      "admin.parking_rates.fields.flat_rate_placeholder",
                                                      "Contoh: Rp 20.000",
                                                  )
                                        }
                                        value={formatRupiahInput(
                                            currentRateValue,
                                        )}
                                        onChange={handleRateChange}
                                        className={`w-full px-4 py-3 rounded-xl border transition-all outline-none cursor-xterm
                                            bg-slate-50 dark:bg-[#0B1026]
                                            text-slate-900 dark:text-white
                                            ${
                                                errors.rate_per_hour ||
                                                errors.flat_rate
                                                    ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                                                    : "border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5]"
                                            }`}
                                    />
                                    {(errors.rate_per_hour ||
                                        errors.flat_rate) && (
                                        <p className="text-red-500 text-xs mt-1 ml-1 animate-pulse">
                                            {errors.rate_per_hour ||
                                                errors.flat_rate}
                                        </p>
                                    )}
                                </div>
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
                                                "admin.parking_rates.update",
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

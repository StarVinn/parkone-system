import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { useForm, Link, usePage } from "@inertiajs/react";
import AdminLayout from "../../Layouts/AdminLayout";

const emptyRow = () => ({
    license_plate: "",
    user_id: "",
    vehicle_type_id: "",
});

export default function Create({ users = [], vehicleTypes = [] }) {
    const page = usePage();
    const fromOverview = (page.url || "").includes("from=overview");
    const indexUrl = fromOverview
        ? `${route("admin.vehicles.index")}?from=overview`
        : route("admin.vehicles.index");
    const storeUrl = fromOverview
        ? `${route("admin.vehicles.store")}?from=overview`
        : route("admin.vehicles.store");

    const { data, setData, post, errors, processing } = useForm({
        vehicles: [emptyRow()],
    });

    const updateRow = (index, field, value) => {
        const nextRows = [...data.vehicles];
        nextRows[index] = {
            ...nextRows[index],
            [field]: field === "license_plate" ? value.toUpperCase() : value,
        };
        setData("vehicles", nextRows);
    };

    const addRow = () => {
        setData("vehicles", [...data.vehicles, emptyRow()]);
    };

    const removeRow = (index) => {
        if (data.vehicles.length <= 1) return;
        setData(
            "vehicles",
            data.vehicles.filter((_, i) => i !== index),
        );
    };

    const rowError = (index, field) => errors[`vehicles.${index}.${field}`];

    const submit = (e) => {
        e.preventDefault();
        post(storeUrl);
    };

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href={indexUrl}
                    className="group p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111633] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-sm"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-['Poppins']">
                        Create Vehicles
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Tambahkan beberapa kendaraan sekaligus dalam satu submit.
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-[#111633] border border-slate-200 dark:border-white/5 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                <form onSubmit={submit} className="p-6 sm:p-8 space-y-5">
                    {errors.vehicles && (
                        <p className="text-red-500 text-sm">{errors.vehicles}</p>
                    )}

                    {data.vehicles.map((vehicle, index) => (
                        <div
                            key={`vehicle-row-${index}`}
                            className="border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Vehicle #{index + 1}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => removeRow(index)}
                                    disabled={data.vehicles.length === 1}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    <Trash2 size={14} />
                                    Hapus
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                                        License Plate
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: B 1234 CD"
                                        value={vehicle.license_plate}
                                        onChange={(e) =>
                                            updateRow(index, "license_plate", e.target.value)
                                        }
                                        className={`w-full px-4 py-3 rounded-xl border transition-all outline-none
                                            bg-slate-50 dark:bg-[#0B1026]
                                            text-slate-900 dark:text-white
                                            ${
                                                rowError(index, "license_plate")
                                                    ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                                                    : "border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5]"
                                            }`}
                                    />
                                    {rowError(index, "license_plate") && (
                                        <p className="text-red-500 text-xs mt-1 ml-1 animate-pulse">
                                            {rowError(index, "license_plate")}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                                        Vehicle Type
                                    </label>
                                    <select
                                        value={vehicle.vehicle_type_id}
                                        onChange={(e) =>
                                            updateRow(index, "vehicle_type_id", e.target.value)
                                        }
                                        className={`w-full px-4 py-3 rounded-xl border transition-all outline-none
                                            bg-slate-50 dark:bg-[#0B1026]
                                            text-slate-900 dark:text-white
                                            ${
                                                rowError(index, "vehicle_type_id")
                                                    ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                                                    : "border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5]"
                                            }`}
                                    >
                                        <option value="">Pilih tipe kendaraan</option>
                                        {vehicleTypes.map((item) => (
                                            <option key={item.id} value={item.id}>
                                                {item.name}
                                            </option>
                                        ))}
                                    </select>
                                    {rowError(index, "vehicle_type_id") && (
                                        <p className="text-red-500 text-xs mt-1 ml-1 animate-pulse">
                                            {rowError(index, "vehicle_type_id")}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                                    Owner
                                </label>
                                <select
                                    value={vehicle.user_id}
                                    onChange={(e) => updateRow(index, "user_id", e.target.value)}
                                    className={`w-full px-4 py-3 rounded-xl border transition-all outline-none
                                        bg-slate-50 dark:bg-[#0B1026]
                                        text-slate-900 dark:text-white
                                        ${
                                            rowError(index, "user_id")
                                                ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                                                : "border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5]"
                                        }`}
                                >
                                    <option value="">Pilih pemilik kendaraan</option>
                                    {users.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name} ({item.email})
                                        </option>
                                    ))}
                                </select>
                                {rowError(index, "user_id") && (
                                    <p className="text-red-500 text-xs mt-1 ml-1 animate-pulse">
                                        {rowError(index, "user_id")}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={addRow}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#1E5EFF] bg-blue-50 dark:bg-blue-500/10 hover:opacity-90 transition-opacity cursor-pointer"
                    >
                        <Plus size={16} />
                        Tambah Baris Vehicle
                    </button>

                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-white/5">
                        <Link
                            href={indexUrl}
                            className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                        >
                            Batal
                        </Link>
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
                                <Save size={18} />
                            )}
                            {processing ? "Menyimpan..." : "Simpan Semua"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

Create.layout = (page) => <AdminLayout children={page} />;

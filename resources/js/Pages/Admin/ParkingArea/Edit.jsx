import { ArrowLeft, Save } from "lucide-react";
import { useForm, Link } from "@inertiajs/react";
import AdminLayout from "../../Layouts/AdminLayout";

export default function Edit({ parkingArea, parkingLocations = [] }) {
    const { data, setData, put, errors, processing } = useForm({
        name: parkingArea.name ?? "",
        parking_location_id:
            parkingArea.parking_location_id?.toString() ??
            "",
        capacity: parkingArea.capacity ?? "",
    });

    const submit = (e) => {
        e.preventDefault();
        put(route("admin.parking-areas.update", parkingArea.id));
    };

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href={route("admin.parking-areas.index")}
                    className="group p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111633] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-sm"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-['Poppins']">
                        Edit Parking Area
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Perbarui area parkir yang sudah ada.
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-[#111633] border border-slate-200 dark:border-white/5 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                <form onSubmit={submit} className="p-6 sm:p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                            Area Name
                        </label>
                        <input
                            type="text"
                            placeholder="Contoh: Basement A, Lantai 3 Zona B"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                                Parking Location
                            </label>
                            <select
                                value={data.parking_location_id}
                                onChange={(e) =>
                                    setData("parking_location_id", e.target.value)
                                }
                                className={`w-full px-4 py-3 rounded-xl border transition-all outline-none
                                    bg-slate-50 dark:bg-[#0B1026]
                                    text-slate-900 dark:text-white
                                    ${
                                        errors.parking_location_id
                                            ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                                            : "border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5]"
                                    }`}
                            >
                                <option value="">Pilih lokasi parkir</option>
                                {parkingLocations.map((location) => (
                                    <option
                                        key={location.id}
                                        value={location.id}
                                    >
                                        {location.name}
                                    </option>
                                ))}
                            </select>
                            {errors.parking_location_id && (
                                <p className="text-red-500 text-xs mt-1 ml-1 animate-pulse">
                                    {errors.parking_location_id}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                                Capacity
                            </label>
                            <input
                                type="number"
                                min="1"
                                placeholder="Contoh: 120"
                                value={data.capacity}
                                onChange={(e) =>
                                    setData("capacity", e.target.value)
                                }
                                className={`w-full px-4 py-3 rounded-xl border transition-all outline-none
                                    bg-slate-50 dark:bg-[#0B1026]
                                    text-slate-900 dark:text-white
                                    ${
                                        errors.capacity
                                            ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                                            : "border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5]"
                                    }`}
                            />
                            {errors.capacity && (
                                <p className="text-red-500 text-xs mt-1 ml-1 animate-pulse">
                                    {errors.capacity}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-white/5">
                        <Link
                            href={route("admin.parking-areas.index")}
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
                            {processing ? "Menyimpan..." : "Update Data"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

Edit.layout = (page) => <AdminLayout children={page} />;

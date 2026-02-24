import { ArrowLeft, Save } from "lucide-react";
import { useForm, Link } from "@inertiajs/react";
import AdminLayout from "../../Layouts/AdminLayout";
import MapPicker from "./MapPicker";

export default function Edit({ parkingLocation }) {
    const { data, setData, put, errors, processing } = useForm({
        name: parkingLocation.name,
        latitude: parkingLocation.latitude ?? "",
        longitude: parkingLocation.longitude ?? "",
        description: parkingLocation.description ?? "",
    });

    const submit = (e) => {
        e.preventDefault();
        put(route("admin.parking-locations.update", parkingLocation.id));
    };

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href={route("admin.parking-locations.index")}
                    className="group p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111633] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-sm"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-['Poppins']">
                        Edit Parking Location
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Perbarui lokasi parkir yang sudah ada.
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-[#111633] border border-slate-200 dark:border-white/5 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                <form onSubmit={submit} className="p-6 sm:p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                            Location Name
                        </label>
                        <input
                            type="text"
                            placeholder="Contoh: Mall A Lantai 2"
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
                                Latitude
                            </label>
                            <input
                                type="text"
                                placeholder="-6.200000"
                                value={data.latitude}
                                readOnly
                                className={`w-full px-4 py-3 rounded-xl border transition-all outline-none
                                    bg-slate-100 dark:bg-[#0B1026]
                                    text-slate-900 dark:text-white
                                    ${
                                        errors.latitude
                                            ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                                            : "border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5]"
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
                                value={data.longitude}
                                readOnly
                                className={`w-full px-4 py-3 rounded-xl border transition-all outline-none
                                    bg-slate-100 dark:bg-[#0B1026]
                                    text-slate-900 dark:text-white
                                    ${
                                        errors.longitude
                                            ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                                            : "border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5]"
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
                        latitude={data.latitude}
                        longitude={data.longitude}
                        onChange={(lat, lng) => {
                            setData("latitude", lat);
                            setData("longitude", lng);
                        }}
                    />

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                            Description
                        </label>
                        <textarea
                            placeholder="Berikan keterangan singkat lokasi ini..."
                            value={data.description}
                            onChange={(e) =>
                                setData("description", e.target.value)
                            }
                            rows="4"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 outline-none transition-all
                                bg-slate-50 dark:bg-[#0B1026]
                                text-slate-900 dark:text-white
                                focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5] resize-none"
                        />
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-white/5">
                        <Link
                            href={route("admin.parking-locations.index")}
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

import { Head, Link, useForm, usePage } from "@inertiajs/react";
import OfficerLayout from "../Layouts/OfficerLayout";

const formatLicensePlate = (value) => {
    const cleaned = String(value || "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");

    const match = cleaned.match(/^([A-Z]{1,2})([0-9]{0,4})([A-Z]{0,3})/);
    if (!match) {
        return cleaned;
    }

    return [match[1], match[2], match[3]].filter(Boolean).join(" ");
};

export default function VisitorVehicleCreate({
    licensePlate = "",
    nextAction = "entry",
    parkingAreaId = "",
    parkingArea = null,
    availableRates = [],
    vehicleTypes = [],
}) {
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        license_plate: licensePlate,
        vehicle_type_id: "",
        next_action: nextAction,
        parking_area_id: parkingAreaId,
    });

    const submit = (event) => {
        event.preventDefault();
        post(route("officer.visitor-vehicles.store"));
    };

    return (
        <>
            <Head title="Pendatang Baru | PARKONE" />

            <div className="max-w-3xl mx-auto">
                <div className="mb-6">
                    <Link href="/officer" className="text-sm text-[#1E5EFF] hover:underline">
                        Kembali ke Dashboard
                    </Link>
                    <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Tambah Kendaraan Pendatang Baru</h1>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                        Kendaraan belum terdaftar. Lengkapi data ini untuk lanjut transaksi.
                    </p>
                </div>

                {flash?.error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {flash.error}
                    </div>
                )}

                <form onSubmit={submit} className="rounded-2xl border border-[#1E5EFF]/20 dark:border-white/10 bg-white dark:bg-[#111633] p-6 space-y-5">
                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B1026] p-4 text-sm text-slate-700 dark:text-slate-300">
                        <p>
                            <span className="font-semibold">Area Parkir:</span>{" "}
                            {parkingArea?.name || "-"}
                        </p>
                        <p>
                            <span className="font-semibold">Lokasi:</span>{" "}
                            {parkingArea?.location_name || "-"}
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white mb-2">
                            Tarif tersedia di area ini
                        </p>
                        {availableRates.length === 0 ? (
                            <p className="text-sm text-red-600">
                                Belum ada tarif untuk lokasi ini. Tambahkan parking rate dulu dari admin.
                            </p>
                        ) : (
                            <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                                {availableRates.map((rate) => (
                                    <li key={rate.id}>
                                        {rate.vehicle_type_name} -{" "}
                                        {rate.rate_type === "flat"
                                            ? `Flat Rp ${Number(rate.flat_rate || 0).toLocaleString("id-ID")}`
                                            : `Per Jam Rp ${Number(rate.rate_per_hour || 0).toLocaleString("id-ID")}`}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Plat Nomor</label>
                        <input
                            value={data.license_plate}
                            onChange={(event) =>
                                setData("license_plate", formatLicensePlate(event.target.value))
                            }
                            className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0B1026] text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#1E5EFF]/30"
                            placeholder="Contoh: AD 45 ID"
                            required
                        />
                        {errors.license_plate && (
                            <p className="mt-1 text-sm text-red-600">{errors.license_plate}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Tipe Kendaraan</label>
                        <select
                            value={data.vehicle_type_id}
                            onChange={(event) => setData("vehicle_type_id", event.target.value)}
                            className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0B1026] text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#1E5EFF]/30"
                            required
                        >
                            <option value="">Pilih tipe kendaraan</option>
                            {vehicleTypes.map((type) => (
                                <option key={type.id} value={type.id}>
                                    {type.name}
                                </option>
                            ))}
                        </select>
                        {errors.vehicle_type_id && (
                            <p className="mt-1 text-sm text-red-600">{errors.vehicle_type_id}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Owner</label>
                        <input
                            value="Pendatang Baru"
                            disabled
                            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/10 px-3 py-2.5 text-slate-600 dark:text-slate-300"
                        />
                    </div>

                    <input type="hidden" name="next_action" value={data.next_action} />
                    <input type="hidden" name="parking_area_id" value={data.parking_area_id} />

                    <button
                        type="submit"
                        disabled={processing || availableRates.length === 0}
                        className="w-full rounded-xl bg-[#1E5EFF] px-4 py-2.5 font-semibold text-white hover:bg-[#194FD8] transition disabled:opacity-60 cursor-pointer"
                    >
                        {processing ? "Menyimpan..." : "Simpan & Lanjutkan"}
                    </button>
                </form>
            </div>
        </>
    );
}

VisitorVehicleCreate.layout = (page) => <OfficerLayout children={page} />;

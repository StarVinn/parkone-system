import { Head, useForm, usePage } from "@inertiajs/react";
import logo from "../../Assets/Images/logo-parkone.png";

const formatLicensePlate = (value) => {
    const cleaned = String(value || "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");

    if (!cleaned) {
        return "";
    }

    const match = cleaned.match(/^([A-Z]{0,2})([0-9]{0,4})([A-Z]{0,3})(.*)$/);
    if (!match) {
        return cleaned;
    }

    const [, prefix, number, suffix, rest] = match;
    const formatted = [prefix, number, suffix].filter(Boolean).join(" ");

    return rest ? `${formatted} ${rest}`.trim() : formatted;
};

export default function RfidSetup({
    profile,
    initialVehicle = null,
    vehicleTypes = [],
}) {
    const { flash } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        rfid_uid: "",
        license_plate: formatLicensePlate(initialVehicle?.license_plate || ""),
        vehicle_type_id: initialVehicle?.vehicle_type_id
            ? String(initialVehicle.vehicle_type_id)
            : "",
    });

    const submit = (event) => {
        event.preventDefault();
        post(route("user.rfid.setup.store"));
    };

    return (
        <>
            <Head title="Aktivasi RFID | PARKONE" />

            <div className="relative min-h-screen overflow-hidden bg-[#060A1A] flex items-center justify-center px-4 py-10">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(30,94,255,0.35),transparent_45%),radial-gradient(circle_at_85%_18%,rgba(31,209,165,0.18),transparent_40%),linear-gradient(145deg,#070C1F_0%,#0B1432_55%,#111C42_100%)]" />
                    <svg
                        className="absolute -bottom-28 left-0 h-[440px] w-full text-[#1E5EFF]/45"
                        viewBox="0 0 1440 320"
                        preserveAspectRatio="none"
                        fill="none"
                        aria-hidden="true"
                    >
                        <path
                            d="M0,224L80,202.7C160,181,320,139,480,144C640,149,800,203,960,218.7C1120,235,1280,213,1360,202.7L1440,192L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"
                            fill="currentColor"
                        />
                    </svg>
                    <svg
                        className="absolute bottom-0 left-0 h-[300px] w-full text-[#1FD1A5]/25"
                        viewBox="0 0 1440 320"
                        preserveAspectRatio="none"
                        fill="none"
                        aria-hidden="true"
                    >
                        <path
                            d="M0,160L80,149.3C160,139,320,117,480,133.3C640,149,800,203,960,208C1120,213,1280,171,1360,149.3L1440,128L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"
                            fill="currentColor"
                        />
                    </svg>
                    <div className="absolute inset-0 opacity-20">
                        <svg
                            className="h-full w-full"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <defs>
                                <pattern
                                    id="parkone-topo-rfid-setup"
                                    width="220"
                                    height="220"
                                    patternUnits="userSpaceOnUse"
                                >
                                    <path
                                        d="M10 30C35 10 85 10 115 30C145 50 195 50 215 30"
                                        stroke="#5AA8FF"
                                        strokeOpacity="0.22"
                                        fill="none"
                                    />
                                    <path
                                        d="M0 90C35 60 85 60 120 90C155 120 205 120 220 90"
                                        stroke="#69E7C7"
                                        strokeOpacity="0.18"
                                        fill="none"
                                    />
                                    <path
                                        d="M15 150C45 125 95 125 125 150C155 175 205 175 220 150"
                                        stroke="#8AC3FF"
                                        strokeOpacity="0.15"
                                        fill="none"
                                    />
                                    <circle
                                        cx="38"
                                        cy="44"
                                        r="2.2"
                                        fill="#1FD1A5"
                                        fillOpacity="0.32"
                                    />
                                    <circle
                                        cx="162"
                                        cy="102"
                                        r="2.2"
                                        fill="#1E5EFF"
                                        fillOpacity="0.34"
                                    />
                                    <circle
                                        cx="90"
                                        cy="168"
                                        r="2.2"
                                        fill="#1FD1A5"
                                        fillOpacity="0.28"
                                    />
                                </pattern>
                            </defs>
                            <rect
                                width="100%"
                                height="100%"
                                fill="url(#parkone-topo-rfid-setup)"
                            />
                        </svg>
                    </div>
                </div>

                <div className="relative w-full max-w-xl rounded-3xl border border-white/15 bg-white/92 backdrop-blur-xl shadow-[0_30px_90px_rgba(2,8,23,0.45)] p-8 md:p-10">
                    <div className="text-center mb-8">
                        <img
                            src={logo}
                            alt="PARKONE Logo"
                            className="mx-auto w-16 h-16 mb-4"
                        />
                        <h1 className="text-3xl font-extrabold tracking-wider font-['Poppins'] bg-gradient-to-r from-[#1E5EFF] to-[#1FD1A5] bg-clip-text text-transparent">
                            Aktivasi RFID
                        </h1>
                        <p className="text-sm text-slate-500 mt-2">
                            Hubungkan nomor kartu RFID Anda sebelum mengakses
                            dashboard.
                        </p>
                    </div>

                    {flash?.success && (
                        <div className="mb-4 rounded-lg bg-green-100 p-3 text-sm text-green-700">
                            {flash.success}
                        </div>
                    )}

                    {flash?.error && (
                        <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">
                            {flash.error}
                        </div>
                    )}

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 mb-6">
                        <p className="font-semibold text-slate-900">
                            {profile?.name || "User"}
                        </p>
                        <p>{profile?.email || "-"}</p>
                    </div>

                    <form onSubmit={submit} className="space-y-5">
                        {vehicleTypes.length === 0 && (
                            <div className="rounded-lg bg-amber-100 p-3 text-sm text-amber-800">
                                Tipe kendaraan belum tersedia. Silakan hubungi
                                admin untuk menambahkan tipe kendaraan terlebih
                                dahulu.
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Nomor RFID
                            </label>
                            <input
                                type="text"
                                value={data.rfid_uid}
                                onChange={(event) =>
                                    setData("rfid_uid", event.target.value)
                                }
                                placeholder="Scan atau input nomor kartu RFID"
                                autoComplete="off"
                                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                            {errors.rfid_uid && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.rfid_uid}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Plat Nomor
                            </label>
                            <input
                                type="text"
                                value={data.license_plate}
                                onChange={(event) =>
                                    setData(
                                        "license_plate",
                                        formatLicensePlate(event.target.value),
                                    )
                                }
                                placeholder="Contoh: AD 45 ID"
                                autoComplete="off"
                                pattern="[A-Za-z]{1,2}\s?[0-9]{1,4}\s?[A-Za-z]{0,3}"
                                title="Format plat: 1-2 huruf depan, 1-4 angka, opsional 0-3 huruf belakang. Contoh: AD 45 ID"
                                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                            <p className="mt-1 text-xs text-slate-500">
                                Format: 1-2 huruf depan, 1-4 angka, opsional 0-3
                                huruf belakang. Contoh: AD 45 ID.
                            </p>
                            {errors.license_plate && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.license_plate}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Tipe Kendaraan
                            </label>
                            <select
                                value={data.vehicle_type_id}
                                onChange={(event) =>
                                    setData(
                                        "vehicle_type_id",
                                        event.target.value,
                                    )
                                }
                                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.vehicle_type_id}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing || vehicleTypes.length === 0}
                            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing ? "Processing..." : "Hubungkan RFID"}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}

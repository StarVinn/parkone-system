import {
    AlertTriangle,
    CheckCircle2,
    ClipboardCheck,
    Map,
    MapPinned,
    ShieldCheck,
    Tags,
    Users,
} from "lucide-react";
import AdminLayout from "../Layouts/AdminLayout";

export default function Dashboard({
    loginChart = { web: 0, mobile: 0, total: 0 },
    creationChart = { vehicle: 0, parking: 0 },
    adminCards = {
        setupReadiness: {
            rate_coverage_percent: 0,
            configured_rate_combinations: 0,
            expected_rate_combinations: 0,
            areas_without_complete_rates: 0,
            officer_active: 0,
            officer_total: 0,
            data_alert_total: 0,
        },
        masterDataHealth: {
            location_total: 0,
            area_total: 0,
            vehicle_type_total: 0,
            rate_completeness_percent: 0,
        },
    },
}) {
    const setupReadiness = adminCards.setupReadiness || {};
    const masterDataHealth = adminCards.masterDataHealth || {};

    const setupReadinessCards = [
        {
            key: "rate-coverage",
            title: "Cakupan Tarif",
            value: `${Number(setupReadiness.rate_coverage_percent || 0)}%`,
            subtitle: `${Number(setupReadiness.configured_rate_combinations || 0)} dari ${Number(setupReadiness.expected_rate_combinations || 0)} kombinasi`,
            icon: ShieldCheck,
            iconBoxClass: "text-blue-500",
            progress: Number(setupReadiness.rate_coverage_percent || 0),
            progressClass: "bg-blue-500",
        },
        {
            key: "area-incomplete-rate",
            title: "Area Tanpa Tarif Lengkap",
            value: Number(setupReadiness.areas_without_complete_rates || 0),
            subtitle: "Perlu lengkapi tarif per lokasi",
            icon: ClipboardCheck,
            iconBoxClass: "text-amber-500",
        },
        {
            key: "officer-active",
            title: "Officer Aktif",
            value: Number(setupReadiness.officer_active || 0),
            subtitle: `${Number(setupReadiness.officer_total || 0)} total officer`,
            icon: Users,
            iconBoxClass: "text-emerald-500",
        },
        {
            key: "data-alert",
            title: "Data Alert",
            value: Number(setupReadiness.data_alert_total || 0),
            subtitle: "Cek plate duplikat/owner/area invalid",
            icon: AlertTriangle,
            iconBoxClass: "text-rose-500",
        },
    ];

    const masterDataCards = [
        {
            key: "location-total",
            title: "Parking Location",
            value: Number(masterDataHealth.location_total || 0),
            subtitle: "Total lokasi aktif",
            icon: MapPinned,
            iconBoxClass: "text-indigo-500",
        },
        {
            key: "area-total",
            title: "Parking Area",
            value: Number(masterDataHealth.area_total || 0),
            subtitle: "Total area terdaftar",
            icon: Map,
            iconBoxClass: "text-cyan-500",
        },
        {
            key: "vehicle-type-total",
            title: "Vehicle Type",
            value: Number(masterDataHealth.vehicle_type_total || 0),
            subtitle: "Tipe kendaraan aktif",
            icon: Tags,
            iconBoxClass: "text-fuchsia-500",
        },
        {
            key: "rate-completeness",
            title: "Rate Completeness",
            value: `${Number(masterDataHealth.rate_completeness_percent || 0)}%`,
            subtitle: "Kelengkapan tarif lintas lokasi",
            icon: CheckCircle2,
            iconBoxClass: "text-green-500",
            progress: Number(masterDataHealth.rate_completeness_percent || 0),
            progressClass: "bg-green-500",
        },
    ];

    const webCount = Number(loginChart.web || 0);
    const mobileCount = Number(loginChart.mobile || 0);
    const totalCount = Number(loginChart.total || 0);
    const safeTotal = totalCount > 0 ? totalCount : 1;
    const webPercent = Math.round((webCount / safeTotal) * 100);
    const mobilePercent = Math.round((mobileCount / safeTotal) * 100);
    const vehicleCreated = Number(creationChart.vehicle || 0);
    const parkingCreated = Number(creationChart.parking || 0);
    const maxCreated = Math.max(vehicleCreated, parkingCreated, 1);
    const vehicleBarHeight = Math.max((vehicleCreated / maxCreated) * 100, vehicleCreated > 0 ? 8 : 0);
    const parkingBarHeight = Math.max((parkingCreated / maxCreated) * 100, parkingCreated > 0 ? 8 : 0);

    const pieSize = 220;
    const center = pieSize / 2;
    const radius = 72;
    const circumference = 2 * Math.PI * radius;
    const webArc = (webCount / safeTotal) * circumference;
    const mobileArc = (mobileCount / safeTotal) * circumference;

    return (
        <div className="p-4 sm:p-6 transition-colors duration-300">
            <div className="mb-5">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-['Poppins']">
                    Admin Dashboard
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Ringkasan readiness sistem dan kesehatan master data admin.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                {setupReadinessCards.map((card) => (
                    <div
                        key={card.key}
                        className="bg-white dark:bg-[#111633] border border-slate-200 dark:border-white/5 rounded-2xl px-4 py-3 shadow-sm"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {card.title}
                            </p>
                            <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.iconBoxClass}`}
                            >
                                <card.icon size={20} />
                            </div>
                        </div>

                        <p className="text-4xl leading-none font-bold text-slate-900 dark:text-white font-['Poppins'] mb-2">
                            {card.value}
                        </p>

                        {typeof card.progress === "number" ? (
                            <div className="pt-1">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                                        <div
                                            className={`h-full ${card.progressClass}`}
                                            style={{ width: `${card.progress}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                        {card.subtitle}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                {card.subtitle}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                {masterDataCards.map((card) => (
                    <div
                        key={card.key}
                        className="bg-white dark:bg-[#111633] border border-slate-200 dark:border-white/5 rounded-2xl px-4 py-3 shadow-sm"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {card.title}
                            </p>
                            <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.iconBoxClass}`}
                            >
                                <card.icon size={20} />
                            </div>
                        </div>

                        <p className="text-4xl leading-none font-bold text-slate-900 dark:text-white font-['Poppins'] mb-2">
                            {card.value}
                        </p>

                        {typeof card.progress === "number" ? (
                            <div className="pt-1">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                                        <div
                                            className={`h-full ${card.progressClass}`}
                                            style={{ width: `${card.progress}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                        {card.subtitle}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                {card.subtitle}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-[#111633] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white font-['Poppins']">
                            User Activity
                        </h2>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            Total login: {totalCount}
                        </span>
                    </div>

                    <div className="flex items-center justify-center py-2">
                        <svg
                            viewBox={`0 0 ${pieSize} ${pieSize}`}
                            className="w-56 h-56"
                            role="img"
                            aria-label="Pie chart login source web dan mobile"
                        >
                            <g transform={`rotate(-90 ${center} ${center})`}>
                                <circle
                                    cx={center}
                                    cy={center}
                                    r={radius}
                                    fill="none"
                                    stroke="#E2E8F0"
                                    strokeWidth="22"
                                />
                                <circle
                                    cx={center}
                                    cy={center}
                                    r={radius}
                                    fill="none"
                                    stroke="#3B82F6"
                                    strokeWidth="22"
                                    strokeDasharray={`${webArc} ${circumference - webArc}`}
                                    strokeLinecap="butt"
                                />
                                <circle
                                    cx={center}
                                    cy={center}
                                    r={radius}
                                    fill="none"
                                    stroke="#10B981"
                                    strokeWidth="22"
                                    strokeDasharray={`${mobileArc} ${circumference - mobileArc}`}
                                    strokeDashoffset={-webArc}
                                    strokeLinecap="butt"
                                />
                            </g>
                            <text
                                x={center}
                                y={center - 6}
                                textAnchor="middle"
                                className="fill-slate-900 dark:fill-white text-[11px]"
                            >
                                Total
                            </text>
                            <text
                                x={center}
                                y={center + 16}
                                textAnchor="middle"
                                className="fill-slate-900 dark:fill-white text-xl font-semibold"
                            >
                                {totalCount}
                            </text>
                        </svg>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-300">
                        <span className="inline-flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                            Web: {webCount} ({webPercent}%)
                        </span>
                        <span className="inline-flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            Mobile: {mobileCount} ({mobilePercent}%)
                        </span>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#111633] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white font-['Poppins']">
                            Statistik Pembuatan
                        </h2>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            Bulan ini
                        </span>
                    </div>

                    <div className="h-56 flex items-end justify-center gap-12 border-b border-slate-200 dark:border-white/10 pb-3">
                        <div className="w-24 text-center">
                            <div className="h-44 flex items-end justify-center">
                                <div
                                    className="w-12 rounded-t-lg bg-blue-500 transition-all duration-500"
                                    style={{ height: `${vehicleBarHeight}%` }}
                                />
                            </div>
                            <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                Vehicle
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {vehicleCreated}
                            </p>
                        </div>

                        <div className="w-24 text-center">
                            <div className="h-44 flex items-end justify-center">
                                <div
                                    className="w-12 rounded-t-lg bg-emerald-500 transition-all duration-500"
                                    style={{ height: `${parkingBarHeight}%` }}
                                />
                            </div>
                            <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                Parking
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {parkingCreated}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

Dashboard.layout = (page) => <AdminLayout children={page} />;

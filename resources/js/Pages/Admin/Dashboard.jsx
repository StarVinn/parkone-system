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
import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    Tooltip,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import AdminLayout from "../Layouts/AdminLayout";
import useI18n from "../../hooks/useI18n";

ChartJS.register(
    ArcElement,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
);

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
    const { t } = useI18n();
    const setupReadiness = adminCards.setupReadiness || {};
    const masterDataHealth = adminCards.masterDataHealth || {};

    const setupReadinessCards = [
        {
            key: "rate-coverage",
            title: t("admin.dashboard.setup.rate_coverage", "Cakupan Tarif"),
            value: `${Number(setupReadiness.rate_coverage_percent || 0)}%`,
            subtitle: t(
                "admin.dashboard.setup.rate_coverage_subtitle",
                `${Number(setupReadiness.configured_rate_combinations || 0)} dari ${Number(setupReadiness.expected_rate_combinations || 0)} kombinasi`,
            ),
            icon: ShieldCheck,
            iconBoxClass: "text-blue-500",
            progress: Number(setupReadiness.rate_coverage_percent || 0),
            progressClass: "bg-blue-500",
        },
        {
            key: "area-incomplete-rate",
            title: t(
                "admin.dashboard.setup.area_incomplete_rate",
                "Area Tanpa Tarif Lengkap",
            ),
            value: Number(setupReadiness.areas_without_complete_rates || 0),
            subtitle: t(
                "admin.dashboard.setup.area_incomplete_rate_subtitle",
                "Perlu lengkapi tarif per lokasi",
            ),
            icon: ClipboardCheck,
            iconBoxClass: "text-amber-500",
        },
        {
            key: "officer-active",
            title: t("admin.dashboard.setup.officer_active", "Officer Aktif"),
            value: Number(setupReadiness.officer_active || 0),
            subtitle: t(
                "admin.dashboard.setup.officer_active_subtitle",
                `${Number(setupReadiness.officer_total || 0)} total officer`,
            ),
            icon: Users,
            iconBoxClass: "text-emerald-500",
        },
        {
            key: "data-alert",
            title: t("admin.dashboard.setup.data_alert", "Data Alert"),
            value: Number(setupReadiness.data_alert_total || 0),
            subtitle: t(
                "admin.dashboard.setup.data_alert_subtitle",
                "Cek plate duplikat/owner/area invalid",
            ),
            icon: AlertTriangle,
            iconBoxClass: "text-rose-500",
        },
    ];

    const masterDataCards = [
        {
            key: "location-total",
            title: t("admin.dashboard.master.location_total", "Parking Location"),
            value: Number(masterDataHealth.location_total || 0),
            subtitle: t(
                "admin.dashboard.master.location_total_subtitle",
                "Total lokasi aktif",
            ),
            icon: MapPinned,
            iconBoxClass: "text-indigo-500",
        },
        {
            key: "area-total",
            title: t("admin.dashboard.master.area_total", "Parking Area"),
            value: Number(masterDataHealth.area_total || 0),
            subtitle: t(
                "admin.dashboard.master.area_total_subtitle",
                "Total area terdaftar",
            ),
            icon: Map,
            iconBoxClass: "text-cyan-500",
        },
        {
            key: "vehicle-type-total",
            title: t("admin.dashboard.master.vehicle_type_total", "Vehicle Type"),
            value: Number(masterDataHealth.vehicle_type_total || 0),
            subtitle: t(
                "admin.dashboard.master.vehicle_type_total_subtitle",
                "Tipe kendaraan aktif",
            ),
            icon: Tags,
            iconBoxClass: "text-fuchsia-500",
        },
        {
            key: "rate-completeness",
            title: t(
                "admin.dashboard.master.rate_completeness",
                "Rate Completeness",
            ),
            value: `${Number(masterDataHealth.rate_completeness_percent || 0)}%`,
            subtitle: t(
                "admin.dashboard.master.rate_completeness_subtitle",
                "Kelengkapan tarif lintas lokasi",
            ),
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

    const loginChartData = {
        labels: ["Web", "Mobile"],
        datasets: [
            {
                data: [webCount, mobileCount],
                backgroundColor: ["#3B82F6", "#10B981"],
                borderColor: ["#3B82F6", "#10B981"],
                borderWidth: 0,
            },
        ],
    };

    const loginChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "68%",
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const value = Number(context.raw || 0);
                        const percent = Math.round((value / safeTotal) * 100);
                        return `${context.label}: ${value} (${percent}%)`;
                    },
                },
            },
        },
    };

    const creationChartData = {
        labels: [
            t("admin.dashboard.chart.vehicle", "Vehicle"),
            t("admin.dashboard.chart.parking", "Parking"),
        ],
        datasets: [
            {
                label: t("admin.dashboard.chart.total_data", "Jumlah Data"),
                data: [vehicleCreated, parkingCreated],
                backgroundColor: ["#3B82F6", "#10B981"],
                borderRadius: 10,
                borderSkipped: false,
                maxBarThickness: 54,
            },
        ],
    };

    const creationChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: (context) =>
                        `${context.label}: ${Number(context.raw || 0)}`,
                },
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: "#64748B",
                    font: {
                        size: 12,
                    },
                },
                border: {
                    display: false,
                },
            },
            y: {
                beginAtZero: true,
                ticks: {
                    precision: 0,
                    color: "#94A3B8",
                    font: {
                        size: 11,
                    },
                },
                grid: {
                    color: "rgba(148, 163, 184, 0.2)",
                },
                border: {
                    display: false,
                },
            },
        },
    };

    return (
        <div className="p-4 sm:p-6 transition-colors duration-300">
            <div className="mb-5">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-['Poppins']">
                    {t("admin.dashboard.title", "Admin Dashboard")}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {t(
                        "admin.dashboard.description",
                        "Ringkasan readiness sistem dan kesehatan master data admin.",
                    )}
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
                            Aktivitas Login Pengguna
                        </h2>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            Total login: {totalCount}
                        </span>
                    </div>

                    <div className="flex items-center justify-center py-2">
                        <div className="relative h-56 w-56" aria-label="Pie chart login source web dan mobile">
                            <Doughnut
                                data={loginChartData}
                                options={loginChartOptions}
                            />
                            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-[11px] text-slate-500 dark:text-slate-300">
                                    Total
                                </span>
                                <span className="text-xl font-semibold text-slate-900 dark:text-white">
                                    {totalCount}
                                </span>
                            </div>
                        </div>
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

                    <div className="h-56 border-b border-slate-200 dark:border-white/10 pb-3">
                        <Bar data={creationChartData} options={creationChartOptions} />
                    </div>
                </div>
            </div>
        </div>
    );
}

Dashboard.layout = (page) => <AdminLayout children={page} />;

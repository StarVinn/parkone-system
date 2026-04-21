import { useEffect, useMemo, useState } from "react";
import { WhenVisible } from "@inertiajs/react";
import {
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Tooltip,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import {
    AlertTriangle,
    Building2,
    CarFront,
    Coins,
    Download,
    MapPinned,
    ReceiptText,
    Search,
} from "lucide-react";
import OwnerLayout from "../Layouts/OwnerLayout";
import useI18n from "../../hooks/useI18n";

ChartJS.register(
    BarElement,
    CategoryScale,
    LinearScale,
    LineElement,
    PointElement,
    Tooltip,
    Legend,
);

function formatCurrencyIDR(amount, localeTag = "id-ID") {
    const value = Number(amount || 0);
    return new Intl.NumberFormat(localeTag, {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value);
}

function formatDateTime(value, localeTag = "id-ID") {
    if (!value) return "-";

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return String(value);
    }

    return new Intl.DateTimeFormat(localeTag, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(parsed);
}

function toFiniteNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function buildOsmEmbedSrc(latitude, longitude) {
    const lat = toFiniteNumber(latitude);
    const lng = toFiniteNumber(longitude);

    if (lat === null || lng === null) return null;

    const delta = 0.01;
    const params = new URLSearchParams({
        bbox: `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`,
        layer: "mapnik",
        marker: `${lat},${lng}`,
    });

    return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
}

function buildGoogleMapsUrl(latitude, longitude) {
    const lat = toFiniteNumber(latitude);
    const lng = toFiniteNumber(longitude);

    if (lat === null || lng === null) return null;

    return `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}`;
}

function SectionHeader({ id, title, subtitle, icon: Icon }) {
    return (
        <div id={id} className="scroll-mt-28">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-xl md:text-2xl font-['Poppins'] font-semibold tracking-tight">
                        {title}
                    </h2>
                    {subtitle ? (
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            {subtitle}
                        </p>
                    ) : null}
                </div>
                {Icon ? (
                    <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0">
                        <Icon size={20} />
                    </div>
                ) : null}
            </div>
        </div>
    );
}

function StatCard({ title, value, hint, icon: Icon, accentClass }) {
    return (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-darkbg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                        {title}
                    </p>
                    <p className="mt-2 text-2xl font-semibold font-['Poppins']">
                        {value}
                    </p>
                    {hint ? (
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            {hint}
                        </p>
                    ) : null}
                </div>
                {Icon ? (
                    <div
                        className={`w-11 h-11 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center ${accentClass || ""}`}
                    >
                        <Icon size={20} />
                    </div>
                ) : null}
            </div>
        </div>
    );
}

export default function Dashboard({
    todaySummary,
    charts,
    topLocations,
    alerts,
    recentTransactions,
    locationDetail,
} = {}) {
    const { t, locale } = useI18n();
    const localeTag = locale === "en" ? "en-US" : "id-ID";

    const [rangeDays, setRangeDays] = useState(7);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [txFilters, setTxFilters] = useState({
        query: "",
        payment: "",
        from: "",
        to: "",
    });

    const summary = todaySummary || {};

    const alertsLoaded = alerts !== undefined;
    const alertRows = Array.isArray(alerts) ? alerts : [];

    const topLocationsLoaded = topLocations !== undefined;
    const topLocationRows = Array.isArray(topLocations) ? topLocations : [];

    const transactionsLoaded = recentTransactions !== undefined;
    const transactions = Array.isArray(recentTransactions)
        ? recentTransactions
        : [];

    const mapLocation = locationDetail || null;
    const mapLat = mapLocation?.latitude ?? null;
    const mapLng = mapLocation?.longitude ?? null;
    const hasMapSelection = Boolean(locationDetail?.id);

    const mapEmbedSrc = useMemo(
        () => buildOsmEmbedSrc(mapLat, mapLng),
        [mapLat, mapLng],
    );

    const googleMapsUrl = useMemo(
        () => buildGoogleMapsUrl(mapLat, mapLng),
        [mapLat, mapLng],
    );

    const vehicleBreakdown = useMemo(() => {
        if (!Array.isArray(transactions) || transactions.length === 0) {
            return { total: 0, rows: [] };
        }

        const counts = new Map();

        for (const tx of transactions) {
            const label =
                String(tx?.vehicle || "").trim() ||
                t("owner.dashboard.general.unknown", "Unknown");
            if (label === "-") continue;

            counts.set(label, (counts.get(label) || 0) + 1);
        }

        const entries = Array.from(counts.entries())
            .map(([label, count]) => ({ label, count }))
            .sort((a, b) => b.count - a.count);

        const total = entries.reduce((acc, row) => acc + row.count, 0);
        const top = entries.slice(0, 5);
        const restCount = entries
            .slice(5)
            .reduce((acc, row) => acc + row.count, 0);

        const rows =
            restCount > 0
                ? [
                      ...top,
                      {
                          label: t("owner.dashboard.general.others", "Others"),
                          count: restCount,
                      },
                  ]
                : top;

        return { total, rows };
    }, [transactions, t]);

    const chartLabelsAll = Array.isArray(charts?.labels) ? charts.labels : [];
    const chartRevenueAll = Array.isArray(charts?.revenue)
        ? charts.revenue
        : [];
    const chartOccupancyAll = Array.isArray(charts?.occupancy)
        ? charts.occupancy
        : [];

    const sliceCount = rangeDays === 7 ? 7 : 30;
    const revenueLabels = useMemo(
        () => chartLabelsAll.slice(-sliceCount),
        [chartLabelsAll, sliceCount],
    );
    const revenueSeries = useMemo(
        () =>
            chartRevenueAll
                .slice(-sliceCount)
                .map((value) => Number(value || 0)),
        [chartRevenueAll, sliceCount],
    );
    const occupancySeries = useMemo(
        () =>
            chartOccupancyAll
                .slice(-sliceCount)
                .map((value) => Number(value || 0)),
        [chartOccupancyAll, sliceCount],
    );

    const revenueTotalLast30 = useMemo(
        () =>
            chartRevenueAll.reduce((acc, value) => acc + Number(value || 0), 0),
        [chartRevenueAll],
    );

    const revenueTotalLast7 = useMemo(
        () =>
            chartRevenueAll
                .slice(-7)
                .reduce((acc, value) => acc + Number(value || 0), 0),
        [chartRevenueAll],
    );

    const revenueChartData = useMemo(
        () => ({
            labels: revenueLabels,
            datasets: [
                {
                    label: t("owner.dashboard.charts.revenue", "Revenue"),
                    data: revenueSeries,
                    backgroundColor: "rgba(31, 209, 165, 0.35)",
                    borderColor: "#1FD1A5",
                    borderWidth: 1,
                    borderRadius: 12,
                    borderSkipped: false,
                    maxBarThickness: rangeDays === 7 ? 44 : 18,
                },
            ],
        }),
        [revenueLabels, revenueSeries, rangeDays, t],
    );

    const revenueChartOptions = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) =>
                            `${context.label}: ${formatCurrencyIDR(context.raw, localeTag)}`,
                    },
                },
            },
            scales: {
                x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                        color: "#94A3B8",
                        maxRotation: 0,
                        autoSkip: true,
                        font: { size: 11 },
                    },
                },
                y: {
                    beginAtZero: true,
                    grid: { color: "rgba(148,163,184,0.15)" },
                    border: { display: false },
                    ticks: {
                        color: "#94A3B8",
                        font: { size: 11 },
                        callback: (value) =>
                            `Rp ${Number(value || 0).toLocaleString(localeTag)}`,
                    },
                },
            },
        }),
        [localeTag],
    );

    const occupancyChartData = useMemo(
        () => ({
            labels: revenueLabels,
            datasets: [
                {
                    label: t(
                        "owner.dashboard.charts.occupancy",
                        "Occupancy (%)",
                    ),
                    data: occupancySeries,
                    tension: 0.35,
                    borderColor: "#1E5EFF",
                    backgroundColor: "rgba(30, 94, 255, 0.12)",
                    fill: true,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                },
            ],
        }),
        [revenueLabels, occupancySeries, t],
    );

    const occupancyChartOptions = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: { color: "#94A3B8", font: { size: 11 } },
                },
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: "rgba(148,163,184,0.15)" },
                    border: { display: false },
                    ticks: { color: "#94A3B8", font: { size: 11 } },
                },
            },
        }),
        [],
    );

    const filteredTransactions = useMemo(() => {
        const q = (txFilters.query || "").trim().toLowerCase();
        return transactions.filter((tx) => {
            const matchesQuery =
                !q ||
                String(tx.id || "")
                    .toLowerCase()
                    .includes(q) ||
                String(tx.plate || "")
                    .toLowerCase()
                    .includes(q);
            const matchesPayment =
                !txFilters.payment ||
                String(tx.payment || "") === String(txFilters.payment);

            const txDate = String(tx.time || "").slice(0, 10);
            const matchesFrom =
                !txFilters.from || txDate >= String(txFilters.from);
            const matchesTo = !txFilters.to || txDate <= String(txFilters.to);
            return matchesQuery && matchesPayment && matchesFrom && matchesTo;
        });
    }, [transactions, txFilters]);

    const handleExportExcel = async () => {
        if (!transactionsLoaded) return;

        const headers = [
            t("owner.transactions.csv.id", "id"),
            t("owner.transactions.csv.location", "location"),
            t("owner.transactions.csv.parking_area", "parking area"),
            t("owner.transactions.csv.entry_time", "entry time"),
            t("owner.transactions.csv.exit_time", "exit time"),
            t("owner.transactions.csv.plate", "plate"),
            t("owner.transactions.csv.vehicle", "vehicle"),
            t("owner.transactions.csv.total", "total"),
            t("owner.transactions.csv.status", "status"),
        ];

        const { utils, writeFile } = await import("xlsx");
        const exportAt = new Date();
        const exportLabel = formatDateTime(exportAt.toISOString(), localeTag);
        const systemName = "PARKONE";
        const emptyRow = new Array(headers.length).fill("");

        const sheetRows = [
            [systemName, ...emptyRow.slice(1)],
            [
                t("owner.transactions.excel.exported_at", "Diekspor pada"),
                exportLabel,
                ...emptyRow.slice(2),
            ],
            [...emptyRow],
            headers,
            ...filteredTransactions.map((tx) => [
                String(tx.id ?? ""),
                String(tx.location ?? ""),
                String(tx.parking_area ?? tx.area ?? ""),
                String(tx.entry_time ?? tx.time ?? ""),
                String(tx.exit_time ?? ""),
                String(tx.plate ?? ""),
                String(tx.vehicle ?? ""),
                Number(tx.total ?? 0),
                String(tx.status ?? ""),
            ]),
        ];

        const worksheet = utils.aoa_to_sheet(sheetRows);

        // Layout: merge system name over 3 columns; leave one blank row before table.
        worksheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];

        // Basic styling (may be ignored depending on the xlsx build, but safe to set).
        if (worksheet.A1) {
            worksheet.A1.s = {
                font: { bold: true, sz: 16 },
                alignment: { vertical: "center", horizontal: "left" },
            };
        }

        const headerRowIndex = 3; // 0-based (row 4 in Excel)
        headers.forEach((_, colIndex) => {
            const cellAddress = utils.encode_cell({
                r: headerRowIndex,
                c: colIndex,
            });
            const cell = worksheet[cellAddress];
            if (!cell) return;
            cell.s = {
                ...(cell.s || {}),
                font: { ...(cell.s?.font || {}), bold: true },
            };
        });

        worksheet["!rows"] = [{ hpt: 24 }];

        const columnWidths = headers.map((_, colIndex) => {
            const maxLength = sheetRows.slice(3).reduce((acc, row) => {
                const raw = row[colIndex] ?? "";
                return Math.max(acc, String(raw).length);
            }, 10);

            return { wch: Math.min(Math.max(maxLength + 2, 12), 48) };
        });
        worksheet["!cols"] = columnWidths;

        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, "Transactions");
        writeFile(
            workbook,
            `${t("owner.transactions.csv.filename_prefix", "transactions")}-${exportAt.toISOString().slice(0, 10)}.xlsx`,
        );
    };

    useEffect(() => {
        if (!selectedTransaction) return;

        const onKeyDown = (event) => {
            if (event.key === "Escape") {
                setSelectedTransaction(null);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [selectedTransaction]);

    return (
        <OwnerLayout>
            <div className="space-y-14">
                <section className="space-y-6">
                    <SectionHeader
                        id="dashboard"
                        title={t("owner.dashboard.title", "Owner Dashboard")}
                        subtitle={t(
                            "owner.dashboard.subtitle",
                            "Today's performance summary, 7/30 day trends, top locations, and operational alerts.",
                        )}
                        icon={Building2}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title={t(
                                "owner.dashboard.stats.occupancy",
                                "Occupancy",
                            )}
                            value={`${Number(summary.occupancy_percent || 0)}%`}
                            hint={t(
                                "owner.dashboard.stats.occupancy_hint",
                                "Today's average occupancy",
                            )}
                            icon={MapPinned}
                            accentClass="text-brand.blue"
                        />
                        <StatCard
                            title={t(
                                "owner.dashboard.stats.vehicle_in",
                                "Vehicles In",
                            )}
                            value={Number(
                                summary.vehicle_in || 0,
                            ).toLocaleString(localeTag)}
                            hint={t(
                                "owner.dashboard.stats.vehicle_in_hint",
                                "Total check-ins today",
                            )}
                            icon={CarFront}
                            accentClass="text-emerald-600 dark:text-emerald-400"
                        />
                        <StatCard
                            title={t(
                                "owner.dashboard.stats.revenue",
                                "Revenue",
                            )}
                            value={formatCurrencyIDR(
                                summary.revenue || 0,
                                localeTag,
                            )}
                            hint={t(
                                "owner.dashboard.stats.revenue_hint",
                                "Total revenue today",
                            )}
                            icon={Coins}
                            accentClass="text-brand.teal"
                        />
                        <StatCard
                            title={t(
                                "owner.dashboard.stats.failed_transactions",
                                "Failed Transactions",
                            )}
                            value={Number(
                                summary.failed_transactions || 0,
                            ).toLocaleString(localeTag)}
                            hint={t(
                                "owner.dashboard.stats.failed_transactions_hint",
                                "Need investigation (payment/device)",
                            )}
                            icon={AlertTriangle}
                            accentClass="text-amber-600 dark:text-amber-400"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-darkbg-card p-5 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold font-['Poppins']">
                                        {t(
                                            "owner.dashboard.revenue_chart.title",
                                            "Revenue",
                                        )}{" "}
                                        ({rangeDays}{" "}
                                        {t(
                                            "owner.dashboard.general.days",
                                            "days",
                                        )}
                                        )
                                    </p>
                                    <p className="text-xs text-slate-600 dark:text-slate-300">
                                        {t(
                                            "owner.dashboard.revenue_chart.subtitle",
                                            "Revenue trend for the last {days} days",
                                            { days: rangeDays },
                                        )}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setRangeDays(7)}
                                        className={`px-3 py-1.5 rounded-xl text-xs border transition ${
                                            rangeDays === 7
                                                ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
                                                : "border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5"
                                        }`}
                                    >
                                        7{" "}
                                        {t(
                                            "owner.dashboard.general.days",
                                            "days",
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRangeDays(30)}
                                        className={`px-3 py-1.5 rounded-xl text-xs border transition ${
                                            rangeDays === 30
                                                ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
                                                : "border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5"
                                        }`}
                                    >
                                        30{" "}
                                        {t(
                                            "owner.dashboard.general.days",
                                            "days",
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 h-64">
                                <Bar
                                    data={revenueChartData}
                                    options={revenueChartOptions}
                                />
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-darkbg-card p-5 shadow-sm">
                            <p className="text-sm font-semibold font-['Poppins']">
                                {t(
                                    "owner.dashboard.alerts.title",
                                    "Operational Alerts",
                                )}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                                {t(
                                    "owner.dashboard.alerts.subtitle",
                                    "Full slots, offline devices, and other warnings",
                                )}
                            </p>

                            <WhenVisible
                                data="alerts"
                                fallback={
                                    <div className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                                        {t(
                                            "owner.dashboard.states.loading_alerts",
                                            "Loading alerts...",
                                        )}
                                    </div>
                                }
                            >
                                {() => (
                                    <div className="mt-4 space-y-3">
                                        {!alertsLoaded ? null : alertRows.length ===
                                          0 ? (
                                            <div className="text-sm text-slate-600 dark:text-slate-300">
                                                {t(
                                                    "owner.dashboard.states.no_alerts",
                                                    "No alerts.",
                                                )}
                                            </div>
                                        ) : (
                                            alertRows.map((item, index) => {
                                                const severity =
                                                    item.severity || "low";
                                                const severityClass =
                                                    severity === "high"
                                                        ? "border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-200"
                                                        : severity === "medium"
                                                          ? "border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-200"
                                                          : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-200";

                                                return (
                                                    <div
                                                        key={`${item.title}-${index}`}
                                                        className={`rounded-2xl border p-3 ${severityClass}`}
                                                    >
                                                        <div className="flex items-start gap-2">
                                                            <AlertTriangle
                                                                size={16}
                                                            />
                                                            <div>
                                                                <p className="text-sm font-medium">
                                                                    {item.title}
                                                                </p>
                                                                <p className="text-xs opacity-90">
                                                                    {
                                                                        item.detail
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}
                            </WhenVisible>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-darkbg-card p-5 shadow-sm">
                            <p className="text-sm font-semibold font-['Poppins']">
                                {t(
                                    "owner.dashboard.occupancy_chart.title",
                                    "Occupancy",
                                )}{" "}
                                ({rangeDays}{" "}
                                {t("owner.dashboard.general.days", "days")})
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                                {t(
                                    "owner.dashboard.occupancy_chart.subtitle",
                                    "Estimated average occupancy trend",
                                )}
                            </p>
                            <div className="mt-4 h-56">
                                <Line
                                    data={occupancyChartData}
                                    options={occupancyChartOptions}
                                />
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-darkbg-card p-5 shadow-sm">
                            <p className="text-sm font-semibold font-['Poppins']">
                                {t(
                                    "owner.dashboard.top_locations.title",
                                    "Top Areas",
                                )}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                                {t(
                                    "owner.dashboard.top_locations.subtitle",
                                    "Based on visits and revenue",
                                )}
                            </p>

                            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300">
                                        <tr>
                                            <th className="text-left px-3 py-2 font-medium">
                                                {t("fields.area", "Area")}
                                            </th>
                                            <th className="text-right px-3 py-2 font-medium">
                                                {t(
                                                    "owner.dashboard.top_locations.visits",
                                                    "Visits",
                                                )}
                                            </th>
                                            <th className="text-right px-3 py-2 font-medium">
                                                {t(
                                                    "owner.dashboard.stats.revenue",
                                                    "Revenue",
                                                )}
                                            </th>
                                        </tr>
                                    </thead>
                                    <WhenVisible
                                        data="topLocations"
                                        as="tbody"
                                        always
                                        fallback={
                                            <tr className="border-t border-slate-200 dark:border-white/10">
                                                <td
                                                    colSpan={3}
                                                    className="px-3 py-6 text-center text-sm text-slate-600 dark:text-slate-300"
                                                >
                                                    {t(
                                                        "owner.dashboard.states.loading_data",
                                                        "Loading data...",
                                                    )}
                                                </td>
                                            </tr>
                                        }
                                    >
                                        {!topLocationsLoaded ? null : topLocationRows.length ===
                                          0 ? (
                                            <tr className="border-t border-slate-200 dark:border-white/10">
                                                <td
                                                    colSpan={3}
                                                    className="px-3 py-6 text-center text-sm text-slate-600 dark:text-slate-300"
                                                >
                                                    {t(
                                                        "owner.dashboard.states.no_data",
                                                        "No data yet.",
                                                    )}
                                                </td>
                                            </tr>
                                        ) : (
                                            topLocationRows.map((row) => (
                                                <tr
                                                    key={row.id || row.name}
                                                    className="border-t border-slate-200 dark:border-white/10"
                                                >
                                                    <td className="px-3 py-2">
                                                        <div className="font-medium">
                                                            {row.name}
                                                        </div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-300">
                                                            {row.location_name ||
                                                                "-"}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2 text-right tabular-nums">
                                                        {Number(
                                                            row.visits_count ||
                                                                0,
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 text-right tabular-nums">
                                                        {formatCurrencyIDR(
                                                            row.revenue || 0,
                                                            localeTag,
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </WhenVisible>
                                </table>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="space-y-6">
                    <SectionHeader
                        id="lokasi"
                        title={t("owner.locations.title", "Parking Locations")}
                        subtitle={t(
                            "owner.locations.subtitle",
                            "Area/rate details for your assigned location.",
                        )}
                        icon={MapPinned}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-darkbg-card p-5 shadow-sm">
                            <p className="text-sm font-semibold font-['Poppins']">
                                {t(
                                    "owner.locations.detail.title",
                                    "Location Details",
                                )}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                                {t(
                                    "owner.locations.detail.subtitle",
                                    "Areas (capacity/occupied) and rates per vehicle type.",
                                )}
                            </p>

                            <div className="mt-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-darkbg-secondary px-3 py-2 text-sm text-slate-700 dark:text-slate-200">
                                {locationDetail?.name ||
                                    t(
                                        "owner.locations.states.unassigned",
                                        "No location is assigned to this owner yet.",
                                    )}
                            </div>

                            {locationDetail ? (
                                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-4 bg-slate-50 dark:bg-white/5">
                                        <p className="text-sm font-medium">
                                            {t(
                                                "owner.locations.detail.areas.title",
                                                "Area / Zone",
                                            )}
                                        </p>
                                        <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300">
                                                    <tr>
                                                        <th className="text-left px-3 py-2 font-medium">
                                                            {t(
                                                                "owner.locations.detail.areas.area",
                                                                "Area",
                                                            )}
                                                        </th>
                                                        <th className="text-right px-3 py-2 font-medium">
                                                            {t(
                                                                "fields.capacity",
                                                                "Capacity",
                                                            )}
                                                        </th>
                                                        <th className="text-right px-3 py-2 font-medium">
                                                            {t(
                                                                "fields.occupied",
                                                                "Occupied",
                                                            )}
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(
                                                        locationDetail.areas ||
                                                        []
                                                    ).map((area) => (
                                                        <tr
                                                            key={area.id}
                                                            className="border-t border-slate-200 dark:border-white/10"
                                                        >
                                                            <td className="px-3 py-2 font-medium">
                                                                {area.name}
                                                            </td>
                                                            <td className="px-3 py-2 text-right tabular-nums">
                                                                {Number(
                                                                    area.capacity ||
                                                                        0,
                                                                ).toLocaleString(
                                                                    localeTag,
                                                                )}
                                                            </td>
                                                            <td className="px-3 py-2 text-right tabular-nums">
                                                                {Number(
                                                                    area.occupied ||
                                                                        0,
                                                                ).toLocaleString(
                                                                    localeTag,
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="mt-3 text-xs text-slate-600 dark:text-slate-300">
                                            {t(
                                                "owner.locations.detail.areas.total_occupancy",
                                                "Total occupancy",
                                            )}
                                            :{" "}
                                            <span className="font-medium">
                                                {Number(
                                                    locationDetail.occupancy_percent ||
                                                        0,
                                                )}
                                                %
                                            </span>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-4 bg-slate-50 dark:bg-white/5">
                                        <p className="text-sm font-medium">
                                            {t(
                                                "owner.locations.detail.rates.title",
                                                "Rates",
                                            )}
                                        </p>
                                        <div className="mt-2 overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10">
                                            <table className="min-w-[760px] w-full text-sm">
                                                <thead className="bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300">
                                                    <tr>
                                                        <th className="text-left px-3 py-2 font-medium">
                                                            {t(
                                                                "fields.vehicle_type",
                                                                "Vehicle Type",
                                                            )}
                                                        </th>
                                                        <th className="text-left px-3 py-2 font-medium">
                                                            {t(
                                                                "fields.rate_type",
                                                                "Rate Type",
                                                            )}
                                                        </th>
                                                        <th className="text-right px-3 py-2 font-medium">
                                                            {t(
                                                                "owner.locations.detail.rates.first_hour",
                                                                "Jam Pertama",
                                                            )}
                                                        </th>
                                                        <th className="text-right px-3 py-2 font-medium">
                                                            {t(
                                                                "owner.locations.detail.rates.next_hour",
                                                                "Jam Berikutnya",
                                                            )}
                                                        </th>
                                                        <th className="text-right px-3 py-2 font-medium">
                                                            {t(
                                                                "owner.locations.detail.rates.grace",
                                                                "Periode Tidak Bayar",
                                                            )}
                                                        </th>
                                                        <th className="text-right px-3 py-2 font-medium">
                                                            {t(
                                                                "owner.locations.detail.rates.cost",
                                                                "Cost",
                                                            )}
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(
                                                        locationDetail.rates ||
                                                        []
                                                    ).map((rate) => (
                                                        <tr
                                                            key={rate.id}
                                                            className="border-t border-slate-200 dark:border-white/10"
                                                        >
                                                            <td className="px-3 py-2 font-medium">
                                                                {
                                                                    rate.vehicle_type
                                                                }
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                {rate.rate_type}
                                                            </td>
                                                            <td className="px-3 py-2 text-right tabular-nums">
                                                                {rate.rate_type ===
                                                                "hourly"
                                                                    ? formatCurrencyIDR(
                                                                          rate.first_hour_rate,
                                                                      )
                                                                    : "-"}
                                                            </td>
                                                            <td className="px-3 py-2 text-right tabular-nums">
                                                                {rate.rate_type ===
                                                                "hourly"
                                                                    ? formatCurrencyIDR(
                                                                          rate.next_hour_rate,
                                                                      )
                                                                    : "-"}
                                                            </td>
                                                            <td className="px-3 py-2 text-right tabular-nums">
                                                                {Number(
                                                                    rate.grace_minutes ||
                                                                        0,
                                                                )}
                                                            </td>
                                                            <td className="px-3 py-2 text-right tabular-nums">
                                                                {rate.rate_type ===
                                                                "flat"
                                                                    ? formatCurrencyIDR(
                                                                          rate.flat_rate,
                                                                      )
                                                                    : "-"}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-5 text-sm text-slate-600 dark:text-slate-300">
                                    {t(
                                        "owner.locations.states.unassigned",
                                        "No location is assigned to this owner yet.",
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-darkbg-card p-5 shadow-sm">
                            <p className="text-sm font-semibold font-['Poppins']">
                                {t("owner.map.title", "Map / Address")}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                                {t(
                                    "owner.map.subtitle",
                                    "Location preview based on saved coordinates.",
                                )}
                            </p>

                            {!hasMapSelection ? (
                                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-white/5 h-56 flex items-center justify-center text-slate-500 dark:text-slate-300 text-sm">
                                    {t(
                                        "owner.locations.states.unassigned",
                                        "No location is assigned to this owner yet.",
                                    )}
                                </div>
                            ) : !mapLocation ? (
                                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-white/5 h-56 flex items-center justify-center text-slate-500 dark:text-slate-300 text-sm">
                                    {t(
                                        "owner.map.states.loading",
                                        "Loading location data...",
                                    )}
                                </div>
                            ) : (
                                <div className="mt-4 space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-medium">
                                                {mapLocation?.name ||
                                                    t(
                                                        "fields.location",
                                                        "Location",
                                                    )}
                                            </p>
                                            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                                                {mapLocation?.description ||
                                                    t(
                                                        "owner.map.states.address_empty",
                                                        "Address is not filled yet.",
                                                    )}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                                                {toFiniteNumber(mapLat) ===
                                                    null ||
                                                toFiniteNumber(mapLng) === null
                                                    ? t(
                                                          "owner.map.states.coordinates_empty",
                                                          "Coordinates are not filled yet.",
                                                      )
                                                    : `${Number(mapLat).toFixed(6)}, ${Number(mapLng).toFixed(6)}`}
                                            </p>
                                        </div>

                                        {googleMapsUrl ? (
                                            <a
                                                href={googleMapsUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition"
                                            >
                                                <MapPinned size={16} />
                                                {t(
                                                    "actions.open_maps",
                                                    "Open Maps",
                                                )}
                                            </a>
                                        ) : null}
                                    </div>

                                    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 h-56">
                                        {mapEmbedSrc ? (
                                            <iframe
                                                title="Map preview"
                                                src={mapEmbedSrc}
                                                className="w-full h-full"
                                                loading="lazy"
                                                referrerPolicy="no-referrer-when-downgrade"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-500 dark:text-slate-300 text-sm">
                                                {t(
                                                    "owner.map.states.preview_unavailable",
                                                    "Coordinates are unavailable for map preview.",
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <section className="space-y-6">
                    <SectionHeader
                        id="transaksi"
                        title={t(
                            "owner.transactions.title",
                            "Transactions & History",
                        )}
                        subtitle={t(
                            "owner.transactions.subtitle",
                            "Filter by date/location/payment method, view ticket details, and export CSV.",
                        )}
                        icon={ReceiptText}
                    />

                    <WhenVisible data="recentTransactions" fallback={null}>
                        {null}
                    </WhenVisible>

                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-darkbg-card p-5 shadow-sm">
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
                                <div className="lg:col-span-2">
                                    <label className="text-xs text-slate-600 dark:text-slate-300">
                                        {t(
                                            "owner.transactions.filters.search",
                                            "Search (ID / Plate)",
                                        )}
                                    </label>
                                    <div className="mt-1 flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-darkbg-secondary">
                                        <Search
                                            size={16}
                                            className="opacity-70"
                                        />
                                        <input
                                            value={txFilters.query}
                                            onChange={(event) =>
                                                setTxFilters((prev) => ({
                                                    ...prev,
                                                    query: event.target.value,
                                                }))
                                            }
                                            placeholder={t(
                                                "owner.transactions.filters.search_placeholder",
                                                "TX-xxxx / B 1234 ABC",
                                            )}
                                            className="w-full bg-transparent outline-none text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="w-full text-xs text-slate-600 dark:text-slate-300">
                                        {t(
                                            "owner.transactions.filters.from",
                                            "From",
                                        )}
                                    </label>
                                    <input
                                        type="date"
                                        value={txFilters.from}
                                        onChange={(event) =>
                                            setTxFilters((prev) => ({
                                                ...prev,
                                                from: event.target.value,
                                            }))
                                        }
                                        className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-darkbg-secondary outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-600 dark:text-slate-300">
                                        {t(
                                            "owner.transactions.filters.to",
                                            "To",
                                        )}
                                    </label>
                                    <input
                                        type="date"
                                        value={txFilters.to}
                                        onChange={(event) =>
                                            setTxFilters((prev) => ({
                                                ...prev,
                                                to: event.target.value,
                                            }))
                                        }
                                        className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-darkbg-secondary outline-none text-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between lg:justify-end gap-3">
                                <div className="text-xs text-slate-500 dark:text-slate-300">
                                    {t("owner.transactions.result", "Result")}:{" "}
                                    <span className="font-medium text-slate-800 dark:text-white">
                                        {transactionsLoaded
                                            ? filteredTransactions.length
                                            : "-"}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleExportExcel}
                                    disabled={
                                        !transactionsLoaded ||
                                        filteredTransactions.length === 0
                                    }
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    <Download size={16} />
                                    {t(
                                        "owner.transactions.actions.export_excel",
                                        "Export Excel",
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10">
                            <table className="min-w-[980px] w-full text-sm">
                                <thead className="bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-medium">
                                            {t("fields.time", "Time")}
                                        </th>
                                        <th className="text-left px-4 py-3 font-medium">
                                            {t("fields.location", "Location")}
                                        </th>
                                        <th className="text-left px-4 py-3 font-medium">
                                            {t(
                                                "fields.license_plate",
                                                "License Plate",
                                            )}
                                        </th>
                                        <th className="text-left px-4 py-3 font-medium">
                                            {t(
                                                "fields.vehicle_type",
                                                "Vehicle Type",
                                            )}
                                        </th>
                                        <th className="text-right px-4 py-3 font-medium">
                                            {t("fields.amount", "Amount")}
                                        </th>
                                        <th className="text-left px-4 py-3 font-medium">
                                            {t("fields.status", "Status")}
                                        </th>
                                        <th className="text-right px-4 py-3 font-medium">
                                            {t("fields.action", "Action")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!transactionsLoaded ? (
                                        <tr className="border-t border-slate-200 dark:border-white/10">
                                            <td
                                                colSpan={8}
                                                className="px-4 py-8 text-center text-sm text-slate-600 dark:text-slate-300"
                                            >
                                                {t(
                                                    "owner.transactions.states.loading",
                                                    "Loading transactions...",
                                                )}
                                            </td>
                                        </tr>
                                    ) : filteredTransactions.length === 0 ? (
                                        <tr className="border-t border-slate-200 dark:border-white/10">
                                            <td
                                                colSpan={8}
                                                className="px-4 py-8 text-center text-sm text-slate-600 dark:text-slate-300"
                                            >
                                                {t(
                                                    "owner.dashboard.states.no_data",
                                                    "No data yet.",
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTransactions.map((tx) => {
                                            const status = String(
                                                tx.status || "",
                                            );
                                            const isCompleted =
                                                status === "completed";
                                            const badgeClass = isCompleted
                                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-200 border-emerald-200 dark:border-emerald-500/30"
                                                : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-200 border-amber-200 dark:border-amber-500/30";

                                            return (
                                                <tr
                                                    key={tx.id}
                                                    className="border-t border-slate-200 dark:border-white/10"
                                                >
                                                    <td className="px-4 py-3 tabular-nums">
                                                        {tx.time}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {tx.location}
                                                    </td>
                                                    <td className="px-4 py-3 font-medium">
                                                        {tx.plate}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {tx.vehicle}
                                                    </td>
                                                    <td className="px-4 py-3 text-right tabular-nums">
                                                        {formatCurrencyIDR(
                                                            tx.total,
                                                            localeTag,
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span
                                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border ${badgeClass}`}
                                                        >
                                                            {isCompleted
                                                                ? t(
                                                                      "statuses.completed",
                                                                      "Completed",
                                                                  )
                                                                : t(
                                                                      "statuses.active",
                                                                      "Active",
                                                                  )}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setSelectedTransaction(
                                                                        tx,
                                                                    )
                                                                }
                                                                className="px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition"
                                                            >
                                                                {t(
                                                                    "owner.transactions.actions.detail",
                                                                    "Detail",
                                                                )}
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
                    </div>

                    {selectedTransaction ? (
                        <div
                            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
                            onClick={() => setSelectedTransaction(null)}
                        >
                            <div
                                className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-darkbg-card shadow-2xl"
                                onClick={(event) => event.stopPropagation()}
                            >
                                <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 bg-white/95 px-6 py-4 dark:bg-darkbg-card/95 backdrop-blur">
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            {t(
                                                "owner.transactions.detail.title",
                                                "Transaction Detail",
                                            )}
                                        </p>
                                        <p className="text-lg font-semibold font-['Poppins'] text-slate-900 dark:text-slate-100">
                                            TX-
                                            {String(
                                                selectedTransaction.id,
                                            ).padStart(6, "0")}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSelectedTransaction(null)
                                        }
                                        className="px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition"
                                    >
                                        {t("actions.close", "Close")}
                                    </button>
                                </div>

                                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                    <div className="rounded-xl border border-slate-200 dark:border-white/10 p-3">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {t("owner.general.id", "ID")}
                                        </p>
                                        <p className="mt-1 font-medium tabular-nums">
                                            {selectedTransaction.id || "-"}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 dark:border-white/10 p-3">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {t("fields.status", "Status")}
                                        </p>
                                        <p className="mt-1 font-medium">
                                            {selectedTransaction.status || "-"}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 dark:border-white/10 p-3">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {t("fields.time", "Time")}
                                        </p>
                                        <p className="mt-1 font-medium tabular-nums">
                                            {formatDateTime(
                                                selectedTransaction.time,
                                                localeTag,
                                            )}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 dark:border-white/10 p-3">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {t(
                                                "owner.transactions.detail.entry_time",
                                                "Entry Time",
                                            )}
                                        </p>
                                        <p className="mt-1 font-medium tabular-nums">
                                            {formatDateTime(
                                                selectedTransaction.entry_time,
                                                localeTag,
                                            )}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 dark:border-white/10 p-3">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {t(
                                                "owner.transactions.detail.exit_time",
                                                "Exit Time",
                                            )}
                                        </p>
                                        <p className="mt-1 font-medium tabular-nums">
                                            {formatDateTime(
                                                selectedTransaction.exit_time,
                                                localeTag,
                                            )}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 dark:border-white/10 p-3">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {t("fields.amount", "Amount")}
                                        </p>
                                        <p className="mt-1 font-medium tabular-nums">
                                            {formatCurrencyIDR(
                                                selectedTransaction.total,
                                                localeTag,
                                            )}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 dark:border-white/10 p-3">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {t("fields.location", "Location")}
                                        </p>
                                        <p className="mt-1 font-medium">
                                            {selectedTransaction.location ||
                                                "-"}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 dark:border-white/10 p-3">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {t(
                                                "owner.transactions.detail.parking_area",
                                                "Parking Area",
                                            )}
                                        </p>
                                        <p className="mt-1 font-medium">
                                            {selectedTransaction.parking_area ||
                                                "-"}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 dark:border-white/10 p-3">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {t(
                                                "fields.license_plate",
                                                "License Plate",
                                            )}
                                        </p>
                                        <p className="mt-1 font-medium tabular-nums">
                                            {selectedTransaction.plate || "-"}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 dark:border-white/10 p-3">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {t(
                                                "fields.vehicle_type",
                                                "Vehicle Type",
                                            )}
                                        </p>
                                        <p className="mt-1 font-medium">
                                            {selectedTransaction.vehicle || "-"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </section>

                <section className="space-y-6">
                    <SectionHeader
                        id="laporan"
                        title={t("owner.reports.title", "Revenue & Reports")}
                        subtitle={t(
                            "owner.reports.subtitle",
                            "Daily/monthly revenue, payment breakdown, and report downloads.",
                        )}
                        icon={Coins}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-darkbg-card p-5 shadow-sm">
                            <p className="text-sm font-semibold font-['Poppins']">
                                {t(
                                    "owner.reports.summary.title",
                                    "Revenue Summary",
                                )}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                                {t(
                                    "owner.reports.summary.subtitle",
                                    "Summary based on completed transactions.",
                                )}
                            </p>

                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <StatCard
                                    title={t(
                                        "owner.reports.summary.revenue_7d",
                                        "Revenue 7 Days",
                                    )}
                                    value={formatCurrencyIDR(
                                        revenueTotalLast7,
                                        localeTag,
                                    )}
                                    hint={t(
                                        "owner.reports.summary.revenue_7d_hint",
                                        "Total last 7 days",
                                    )}
                                    icon={Coins}
                                    accentClass="text-brand.teal"
                                />
                                <StatCard
                                    title={t(
                                        "owner.reports.summary.revenue_30d",
                                        "Revenue 30 Days",
                                    )}
                                    value={formatCurrencyIDR(
                                        revenueTotalLast30,
                                        localeTag,
                                    )}
                                    hint={t(
                                        "owner.reports.summary.revenue_30d_hint",
                                        "Total active range",
                                    )}
                                    icon={ReceiptText}
                                    accentClass="text-brand.blue"
                                />
                                <StatCard
                                    title={t(
                                        "owner.reports.summary.vehicle_out",
                                        "Vehicles Out",
                                    )}
                                    value={Number(
                                        summary.vehicle_out || 0,
                                    ).toLocaleString(localeTag)}
                                    hint={t(
                                        "owner.reports.summary.vehicle_out_hint",
                                        "Total check-outs today",
                                    )}
                                    icon={CarFront}
                                    accentClass="text-emerald-600 dark:text-emerald-400"
                                />
                            </div>

                            {/* <div className="mt-4 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    disabled
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm border border-slate-200 dark:border-white/10 opacity-60 cursor-not-allowed"
                                >
                                    <Download size={16} />
                                    {t(
                                        "owner.reports.actions.download_pdf",
                                        "Download PDF",
                                    )}
                                </button>
                                <button
                                    type="button"
                                    disabled
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm border border-slate-200 dark:border-white/10 opacity-60 cursor-not-allowed"
                                >
                                    <Download size={16} />
                                    {t(
                                        "owner.reports.actions.download_csv",
                                        "Download CSV",
                                    )}
                                </button>
                            </div> */}
                        </div>

                        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-darkbg-card p-5 shadow-sm">
                            <p className="text-sm font-semibold font-['Poppins']">
                                {t(
                                    "owner.reports.breakdown.title",
                                    "Vehicle Type Breakdown",
                                )}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                                {t(
                                    "owner.reports.breakdown.subtitle",
                                    "Summary from the latest 25 transactions.",
                                )}
                            </p>

                            {!transactionsLoaded ? (
                                <div className="mt-4 h-64 rounded-2xl border border-dashed border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-white/5 flex items-center justify-center text-sm text-slate-600 dark:text-slate-300">
                                    {t(
                                        "owner.transactions.states.loading",
                                        "Loading transactions...",
                                    )}
                                </div>
                            ) : vehicleBreakdown.total <= 0 ? (
                                <div className="mt-4 h-64 rounded-2xl border border-dashed border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-white/5 flex items-center justify-center text-sm text-slate-600 dark:text-slate-300">
                                    {t(
                                        "owner.reports.breakdown.empty",
                                        "No transactions available for breakdown.",
                                    )}
                                </div>
                            ) : (
                                <div className="mt-4 space-y-3">
                                    {vehicleBreakdown.rows.map((row) => {
                                        const pct = vehicleBreakdown.total
                                            ? Math.round(
                                                  (row.count /
                                                      vehicleBreakdown.total) *
                                                      100,
                                              )
                                            : 0;

                                        return (
                                            <div
                                                key={row.label}
                                                className="space-y-1"
                                            >
                                                <div className="flex items-center justify-between gap-3 text-sm">
                                                    <div className="font-medium text-slate-700 dark:text-slate-200 truncate">
                                                        {row.label}
                                                    </div>
                                                    <div className="text-xs text-slate-600 dark:text-slate-300 tabular-nums shrink-0">
                                                        {row.count} ({pct}%)
                                                    </div>
                                                </div>
                                                <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-emerald-500/80"
                                                        style={{
                                                            width: `${Math.min(
                                                                100,
                                                                Math.max(
                                                                    0,
                                                                    pct,
                                                                ),
                                                            )}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </OwnerLayout>
    );
}

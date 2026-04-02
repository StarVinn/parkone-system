import { useEffect, useMemo, useState } from "react";
import { WhenVisible, router } from "@inertiajs/react";
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

ChartJS.register(
    BarElement,
    CategoryScale,
    LinearScale,
    LineElement,
    PointElement,
    Tooltip,
    Legend,
);

function formatCurrencyIDR(amount) {
    const value = Number(amount || 0);
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value);
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
    parkingLocations,
    topLocations,
    alerts,
    recentTransactions,
    locationDetail,
} = {}) {
    const [rangeDays, setRangeDays] = useState(7);
    const [selectedLocationId, setSelectedLocationId] = useState("");
    const [hasUserInteractedLocation, setHasUserInteractedLocation] =
        useState(false);
    const [txFilters, setTxFilters] = useState({
        query: "",
        locationId: "",
        payment: "",
        from: "",
        to: "",
    });

    const summary = todaySummary || {};

    const locationsLoaded = parkingLocations !== undefined;
    const locations = Array.isArray(parkingLocations) ? parkingLocations : [];

    const alertsLoaded = alerts !== undefined;
    const alertRows = Array.isArray(alerts) ? alerts : [];

    const topLocationsLoaded = topLocations !== undefined;
    const topLocationRows = Array.isArray(topLocations) ? topLocations : [];

    const transactionsLoaded = recentTransactions !== undefined;
    const transactions = Array.isArray(recentTransactions)
        ? recentTransactions
        : [];

    const selectedLocationFromList = useMemo(() => {
        if (!selectedLocationId) return null;

        return (
            locations.find(
                (location) =>
                    String(location.id) === String(selectedLocationId),
            ) || null
        );
    }, [locations, selectedLocationId]);

    const mapLocation = locationDetail || selectedLocationFromList;
    const mapLat = mapLocation?.latitude ?? null;
    const mapLng = mapLocation?.longitude ?? null;
    const hasMapSelection =
        Boolean(selectedLocationId) || Boolean(locationDetail?.id);

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
            const label = String(tx?.vehicle || "").trim() || "Unknown";
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
                ? [...top, { label: "Lainnya", count: restCount }]
                : top;

        return { total, rows };
    }, [transactions]);

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

    const loadLocationDetail = (locationId) => {
        const value = String(locationId || "");
        setHasUserInteractedLocation(true);
        setSelectedLocationId(value);

        if (!value) {
            router.get(
                "/owner",
                {},
                {
                    only: ["locationDetail"],
                    preserveScroll: true,
                    preserveState: true,
                    replace: true,
                },
            );
            return;
        }

        router.get(
            "/owner",
            { location_id: value },
            {
                only: ["locationDetail"],
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    useEffect(() => {
        if (hasUserInteractedLocation) return;
        if (!locationDetail?.id) return;

        const nextId = String(locationDetail.id);
        if (String(selectedLocationId || "") === nextId) return;

        setSelectedLocationId(nextId);
    }, [hasUserInteractedLocation, locationDetail?.id, selectedLocationId]);

    const effectiveSelectedLocationId = useMemo(() => {
        if (selectedLocationId) return String(selectedLocationId);
        if (!hasUserInteractedLocation && locationDetail?.id) {
            return String(locationDetail.id);
        }

        return "";
    }, [hasUserInteractedLocation, locationDetail?.id, selectedLocationId]);

    const revenueChartData = useMemo(
        () => ({
            labels: revenueLabels,
            datasets: [
                {
                    label: "Pendapatan",
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
        [revenueLabels, revenueSeries, rangeDays],
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
                            `${context.label}: ${formatCurrencyIDR(context.raw)}`,
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
                            `Rp ${Number(value || 0).toLocaleString("id-ID")}`,
                    },
                },
            },
        }),
        [],
    );

    const occupancyChartData = useMemo(
        () => ({
            labels: revenueLabels,
            datasets: [
                {
                    label: "Okupansi (%)",
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
        [revenueLabels, occupancySeries],
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
            const matchesLocation =
                !txFilters.locationId ||
                String(tx.location || "") === String(txFilters.locationId);
            const matchesPayment =
                !txFilters.payment ||
                String(tx.payment || "") === String(txFilters.payment);

            const txDate = String(tx.time || "").slice(0, 10);
            const matchesFrom =
                !txFilters.from || txDate >= String(txFilters.from);
            const matchesTo = !txFilters.to || txDate <= String(txFilters.to);
            return (
                matchesQuery &&
                matchesLocation &&
                matchesPayment &&
                matchesFrom &&
                matchesTo
            );
        });
    }, [transactions, txFilters]);

    const handleExportCsv = () => {
        if (!transactionsLoaded) return;

        const headers = [
            "id",
            "time",
            "location",
            "plate",
            "vehicle",
            "payment",
            "total",
            "status",
        ];
        const lines = [
            headers.join(","),
            ...filteredTransactions.map((tx) =>
                headers
                    .map(
                        (key) =>
                            `"${String(tx[key] ?? "").replaceAll('"', '""')}"`,
                    )
                    .join(","),
            ),
        ];

        const blob = new Blob([lines.join("\n")], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
    };

    return (
        <OwnerLayout>
            <div className="space-y-14">
                <section className="space-y-6">
                    <SectionHeader
                        id="dashboard"
                        title="Dashboard Owner"
                        subtitle="Ringkasan performa hari ini, tren 7/30 hari, lokasi teratas, dan alert operasional."
                        icon={Building2}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="Okupansi"
                            value={`${Number(summary.occupancy_percent || 0)}%`}
                            hint="Rata-rata okupansi hari ini"
                            icon={MapPinned}
                            accentClass="text-brand.blue"
                        />
                        <StatCard
                            title="Kendaraan Masuk"
                            value={Number(
                                summary.vehicle_in || 0,
                            ).toLocaleString("id-ID")}
                            hint="Total check-in hari ini"
                            icon={CarFront}
                            accentClass="text-emerald-600 dark:text-emerald-400"
                        />
                        <StatCard
                            title="Pendapatan"
                            value={formatCurrencyIDR(summary.revenue || 0)}
                            hint="Total pendapatan hari ini"
                            icon={Coins}
                            accentClass="text-brand.teal"
                        />
                        <StatCard
                            title="Transaksi Gagal"
                            value={Number(
                                summary.failed_transactions || 0,
                            ).toLocaleString("id-ID")}
                            hint="Butuh investigasi (payment/device)"
                            icon={AlertTriangle}
                            accentClass="text-amber-600 dark:text-amber-400"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-darkbg-card p-5 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold font-['Poppins']">
                                        Pendapatan ({rangeDays} hari)
                                    </p>
                                    <p className="text-xs text-slate-600 dark:text-slate-300">
                                        Tren pendapatan terakhir {rangeDays}{" "}
                                        hari
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
                                        7 hari
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
                                        30 hari
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
                                Alert Operasional
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                                Slot penuh, device offline, dan warning lainnya
                            </p>

                            <WhenVisible
                                data="alerts"
                                fallback={
                                    <div className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                                        Memuat alert...
                                    </div>
                                }
                            >
                                {() => (
                                    <div className="mt-4 space-y-3">
                                        {!alertsLoaded ? null : alertRows.length ===
                                          0 ? (
                                            <div className="text-sm text-slate-600 dark:text-slate-300">
                                                Tidak ada alert.
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
                                Okupansi ({rangeDays} hari)
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                                Perkiraan tren okupansi rata-rata
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
                                Lokasi Teratas
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                                Berdasarkan okupansi & pendapatan
                            </p>

                            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300">
                                        <tr>
                                            <th className="text-left px-3 py-2 font-medium">
                                                Lokasi
                                            </th>
                                            <th className="text-right px-3 py-2 font-medium">
                                                Okupansi
                                            </th>
                                            <th className="text-right px-3 py-2 font-medium">
                                                Revenue
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
                                                    Memuat data...
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
                                                    Belum ada data.
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
                                                    </td>
                                                    <td className="px-3 py-2 text-right tabular-nums">
                                                        {Number(
                                                            row.occupancy_percent ||
                                                                0,
                                                        )}
                                                        %
                                                    </td>
                                                    <td className="px-3 py-2 text-right tabular-nums">
                                                        {formatCurrencyIDR(
                                                            row.revenue || 0,
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
                        title="Lokasi Parkir"
                        subtitle="Daftar lokasi, kapasitas, okupansi saat ini, dan detail area/tarif."
                        icon={MapPinned}
                    />

                    <WhenVisible data="parkingLocations" fallback={null}>
                        {null}
                    </WhenVisible>

                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-darkbg-card shadow-sm overflow-hidden">
                        <div className="px-5 py-4 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold font-['Poppins']">
                                    Daftar Lokasi
                                </p>
                                <p className="text-xs text-slate-600 dark:text-slate-300">
                                    Quick action: lihat detail & edit
                                    (placeholder)
                                </p>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-300">
                                Total:{" "}
                                <span className="font-medium text-slate-800 dark:text-white">
                                    {locationsLoaded ? locations.length : "-"}
                                </span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-[900px] w-full text-sm">
                                <thead className="bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300">
                                    <tr>
                                        <th className="text-left px-5 py-3 font-medium">
                                            Lokasi
                                        </th>
                                        <th className="text-right px-5 py-3 font-medium">
                                            Kapasitas
                                        </th>
                                        <th className="text-right px-5 py-3 font-medium">
                                            Terisi
                                        </th>
                                        <th className="text-right px-5 py-3 font-medium">
                                            Okupansi
                                        </th>
                                        <th className="text-left px-5 py-3 font-medium">
                                            Koordinat
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!locationsLoaded ? (
                                        <tr className="border-t border-slate-200 dark:border-white/10">
                                            <td
                                                colSpan={6}
                                                className="px-5 py-8 text-center text-sm text-slate-600 dark:text-slate-300"
                                            >
                                                Memuat lokasi...
                                            </td>
                                        </tr>
                                    ) : locations.length === 0 ? (
                                        <tr className="border-t border-slate-200 dark:border-white/10">
                                            <td
                                                colSpan={6}
                                                className="px-5 py-8 text-center text-sm text-slate-600 dark:text-slate-300"
                                            >
                                                Belum ada lokasi.
                                            </td>
                                        </tr>
                                    ) : (
                                        locations.map((location) => {
                                            const capacity = Number(
                                                location.capacity || 0,
                                            );
                                            const occupied = Number(
                                                location.occupied || 0,
                                            );
                                            const occupancy =
                                                capacity > 0
                                                    ? Math.round(
                                                          (occupied /
                                                              capacity) *
                                                              100,
                                                      )
                                                    : 0;

                                            return (
                                                <tr
                                                    key={location.id}
                                                    className="border-t border-slate-200 dark:border-white/10"
                                                >
                                                    <td className="px-5 py-3">
                                                        <div className="font-medium">
                                                            {location.name}
                                                        </div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-300">
                                                            ID: {location.id}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3 text-right tabular-nums">
                                                        {capacity.toLocaleString(
                                                            "id-ID",
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3 text-right tabular-nums">
                                                        {occupied.toLocaleString(
                                                            "id-ID",
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3 text-right tabular-nums">
                                                        {occupancy}%
                                                    </td>
                                                    <td className="px-5 py-3 text-slate-700 dark:text-slate-200">
                                                        <div className="text-xs tabular-nums">
                                                            {location.latitude},{" "}
                                                            {location.longitude}
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

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-darkbg-card p-5 shadow-sm">
                            <p className="text-sm font-semibold font-['Poppins']">
                                Detail Lokasi
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                                Area (kapasitas/occupied) dan tarif per vehicle
                                type.
                            </p>

                            <div className="mt-4 flex flex-col md:flex-row md:items-center gap-3">
                                <label className="text-xs text-slate-600 dark:text-slate-300">
                                    Pilih lokasi
                                </label>
                                <select
                                    value={effectiveSelectedLocationId}
                                    onChange={(event) =>
                                        loadLocationDetail(event.target.value)
                                    }
                                    className="w-full md:w-96 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-darkbg-secondary outline-none"
                                    disabled={
                                        !locationsLoaded ||
                                        locations.length === 0
                                    }
                                >
                                    <option value="">Pilih lokasi...</option>
                                    {locations.map((location) => (
                                        <option
                                            key={location.id}
                                            value={location.id}
                                        >
                                            {location.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {locationDetail ? (
                                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-4 bg-slate-50 dark:bg-white/5">
                                        <p className="text-sm font-medium">
                                            Area / Zone
                                        </p>
                                        <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300">
                                                    <tr>
                                                        <th className="text-left px-3 py-2 font-medium">
                                                            Area
                                                        </th>
                                                        <th className="text-right px-3 py-2 font-medium">
                                                            Kapasitas
                                                        </th>
                                                        <th className="text-right px-3 py-2 font-medium">
                                                            Terisi
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
                                                                    "id-ID",
                                                                )}
                                                            </td>
                                                            <td className="px-3 py-2 text-right tabular-nums">
                                                                {Number(
                                                                    area.occupied ||
                                                                        0,
                                                                ).toLocaleString(
                                                                    "id-ID",
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="mt-3 text-xs text-slate-600 dark:text-slate-300">
                                            Total okupansi:{" "}
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
                                            Tarif
                                        </p>
                                        <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300">
                                                    <tr>
                                                        <th className="text-left px-3 py-2 font-medium">
                                                            Vehicle Type
                                                        </th>
                                                        <th className="text-left px-3 py-2 font-medium">
                                                            Tipe
                                                        </th>
                                                        <th className="text-right px-3 py-2 font-medium">
                                                            Per jam
                                                        </th>
                                                        <th className="text-right px-3 py-2 font-medium">
                                                            Flat
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
                                                                {formatCurrencyIDR(
                                                                    rate.rate_per_hour,
                                                                )}
                                                            </td>
                                                            <td className="px-3 py-2 text-right tabular-nums">
                                                                {formatCurrencyIDR(
                                                                    rate.flat_rate,
                                                                )}
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
                                    Pilih lokasi lalu klik “Detail” untuk memuat
                                    area & tarif.
                                </div>
                            )}
                        </div>

                        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-darkbg-card p-5 shadow-sm">
                            <p className="text-sm font-semibold font-['Poppins']">
                                Peta / Alamat
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                                Preview lokasi berdasarkan koordinat yang
                                tersimpan.
                            </p>

                            {!hasMapSelection ? (
                                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-white/5 h-56 flex items-center justify-center text-slate-500 dark:text-slate-300 text-sm">
                                    Pilih lokasi untuk melihat peta.
                                </div>
                            ) : !mapLocation ? (
                                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-white/5 h-56 flex items-center justify-center text-slate-500 dark:text-slate-300 text-sm">
                                    Memuat data lokasi...
                                </div>
                            ) : (
                                <div className="mt-4 space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-medium">
                                                {mapLocation?.name || "Lokasi"}
                                            </p>
                                            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                                                {mapLocation?.description ||
                                                    "Alamat belum diisi."}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                                                {toFiniteNumber(mapLat) ===
                                                    null ||
                                                toFiniteNumber(mapLng) === null
                                                    ? "Koordinat belum diisi."
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
                                                Buka Maps
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
                                                Koordinat belum tersedia untuk
                                                preview peta.
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
                        title="Transaksi & Riwayat"
                        subtitle="Filter per tanggal/lokasi/metode bayar, lihat detail tiket, dan export CSV."
                        icon={ReceiptText}
                    />

                    <WhenVisible data="recentTransactions" fallback={null}>
                        {null}
                    </WhenVisible>

                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-darkbg-card p-5 shadow-sm">
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 flex-1">
                                <div className="lg:col-span-2">
                                    <label className="text-xs text-slate-600 dark:text-slate-300">
                                        Cari (ID / Plat)
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
                                            placeholder="TX-xxxx / B 1234 ABC"
                                            className="w-full bg-transparent outline-none text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-slate-600 dark:text-slate-300">
                                        Lokasi
                                    </label>
                                    <select
                                        value={txFilters.locationId}
                                        onChange={(event) =>
                                            setTxFilters((prev) => ({
                                                ...prev,
                                                locationId: event.target.value,
                                            }))
                                        }
                                        className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-darkbg-secondary outline-none text-sm"
                                    >
                                        <option value="">Semua</option>
                                        {!locationsLoaded
                                            ? null
                                            : locations.map((location) => (
                                                  <option
                                                      key={location.id}
                                                      value={location.name}
                                                  >
                                                      {location.name}
                                                  </option>
                                              ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="w-full text-xs text-slate-600 dark:text-slate-300">
                                        Dari
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
                                        Sampai
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
                                    Result:{" "}
                                    <span className="font-medium text-slate-800 dark:text-white">
                                        {transactionsLoaded
                                            ? filteredTransactions.length
                                            : "-"}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleExportCsv}
                                    disabled={
                                        !transactionsLoaded ||
                                        filteredTransactions.length === 0
                                    }
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    <Download size={16} />
                                    Export CSV
                                </button>
                            </div>
                        </div>

                        <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10">
                            <table className="min-w-[980px] w-full text-sm">
                                <thead className="bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-medium">
                                            Waktu
                                        </th>
                                        <th className="text-left px-4 py-3 font-medium">
                                            Lokasi
                                        </th>
                                        <th className="text-left px-4 py-3 font-medium">
                                            Plat
                                        </th>
                                        <th className="text-left px-4 py-3 font-medium">
                                            Jenis
                                        </th>
                                        <th className="text-left px-4 py-3 font-medium">
                                            Metode Bayar
                                        </th>
                                        <th className="text-right px-4 py-3 font-medium">
                                            Total
                                        </th>
                                        <th className="text-left px-4 py-3 font-medium">
                                            Status
                                        </th>
                                        <th className="text-right px-4 py-3 font-medium">
                                            Aksi
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
                                                Memuat transaksi...
                                            </td>
                                        </tr>
                                    ) : filteredTransactions.length === 0 ? (
                                        <tr className="border-t border-slate-200 dark:border-white/10">
                                            <td
                                                colSpan={8}
                                                className="px-4 py-8 text-center text-sm text-slate-600 dark:text-slate-300"
                                            >
                                                Belum ada data.
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
                                                    <td className="px-4 py-3">
                                                        {tx.payment}
                                                    </td>
                                                    <td className="px-4 py-3 text-right tabular-nums">
                                                        {formatCurrencyIDR(
                                                            tx.total,
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span
                                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border ${badgeClass}`}
                                                        >
                                                            {isCompleted
                                                                ? "Completed"
                                                                : "Active"}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                disabled
                                                                className="px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-white/10 opacity-60 cursor-not-allowed"
                                                            >
                                                                Detail
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
                </section>

                <section className="space-y-6">
                    <SectionHeader
                        id="laporan"
                        title="Pendapatan & Laporan"
                        subtitle="Revenue per hari/bulan, breakdown per metode bayar, dan download laporan."
                        icon={Coins}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-darkbg-card p-5 shadow-sm">
                            <p className="text-sm font-semibold font-['Poppins']">
                                Ringkasan Pendapatan
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                                Ringkasan berdasarkan transaksi completed.
                            </p>

                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <StatCard
                                    title="Revenue 7 hari"
                                    value={formatCurrencyIDR(revenueTotalLast7)}
                                    hint="Total 7 hari terakhir"
                                    icon={Coins}
                                    accentClass="text-brand.teal"
                                />
                                <StatCard
                                    title="Revenue 30 hari"
                                    value={formatCurrencyIDR(
                                        revenueTotalLast30,
                                    )}
                                    hint="Total range aktif"
                                    icon={ReceiptText}
                                    accentClass="text-brand.blue"
                                />
                                <StatCard
                                    title="Kendaraan Keluar"
                                    value={Number(
                                        summary.vehicle_out || 0,
                                    ).toLocaleString("id-ID")}
                                    hint="Total check-out hari ini"
                                    icon={CarFront}
                                    accentClass="text-emerald-600 dark:text-emerald-400"
                                />
                            </div>

                            <div className="mt-4 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    disabled
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm border border-slate-200 dark:border-white/10 opacity-60 cursor-not-allowed"
                                >
                                    <Download size={16} />
                                    Download PDF
                                </button>
                                <button
                                    type="button"
                                    disabled
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm border border-slate-200 dark:border-white/10 opacity-60 cursor-not-allowed"
                                >
                                    <Download size={16} />
                                    Download CSV
                                </button>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-darkbg-card p-5 shadow-sm">
                            <p className="text-sm font-semibold font-['Poppins']">
                                Breakdown Jenis Kendaraan
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                                Ringkasan dari 25 transaksi terakhir.
                            </p>

                            {!transactionsLoaded ? (
                                <div className="mt-4 h-64 rounded-2xl border border-dashed border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-white/5 flex items-center justify-center text-sm text-slate-600 dark:text-slate-300">
                                    Memuat transaksi...
                                </div>
                            ) : vehicleBreakdown.total <= 0 ? (
                                <div className="mt-4 h-64 rounded-2xl border border-dashed border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-white/5 flex items-center justify-center text-sm text-slate-600 dark:text-slate-300">
                                    Belum ada transaksi untuk dihitung.
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

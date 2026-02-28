import { Link } from "@inertiajs/react";
import { Activity, Bike, Car, Warehouse } from "lucide-react";
import AdminLayout from "../Layouts/AdminLayout";

export default function Dashboard({ loginChart = { web: 0, mobile: 0, total: 0 } }) {
    const stats = {
        active: {
            title: "Kendaraan Aktif",
            value: 2,
            percent: 2,
            icon: Activity,
        },
        car: {
            title: "Mobil",
            value: 1,
            percent: 50,
            icon: Car,
        },
        bike: {
            title: "Motor",
            value: 1,
            percent: 50,
            icon: Bike,
        },
        capacity: {
            title: "Kapasitas Tersedia",
            value: 98,
            total: 100,
            icon: Warehouse,
        },
    };

    const cards = [
        {
            key: "active",
            title: stats.active.title,
            value: stats.active.value,
            subtitle: `${stats.active.percent}% terisi`,
            icon: stats.active.icon,
            iconBoxClass: "text-amber-500",
            progress: stats.active.percent,
            progressClass: "bg-amber-400",
        },
        {
            key: "car",
            title: stats.car.title,
            value: stats.car.value,
            subtitle: `${stats.car.percent}% dari total`,
            icon: stats.car.icon,
            iconBoxClass: "text-blue-500",
        },
        {
            key: "bike",
            title: stats.bike.title,
            value: stats.bike.value,
            subtitle: `${stats.bike.percent}% dari total`,
            icon: stats.bike.icon,
            iconBoxClass: "text-emerald-500",
        },
        {
            key: "capacity",
            title: stats.capacity.title,
            value: stats.capacity.value,
            subtitle: `Dari ${stats.capacity.total} slot total`,
            icon: stats.capacity.icon,
            iconBoxClass: "text-violet-500",
        },
    ];

    const webCount = Number(loginChart.web || 0);
    const mobileCount = Number(loginChart.mobile || 0);
    const totalCount = Number(loginChart.total || 0);
    const safeTotal = totalCount > 0 ? totalCount : 1;
    const webPercent = Math.round((webCount / safeTotal) * 100);
    const mobilePercent = Math.round((mobileCount / safeTotal) * 100);

    const chartWidth = 640;
    const chartHeight = 220;
    const paddingX = 56;
    const paddingY = 28;
    const maxValue = Math.max(webCount, mobileCount, 1);
    const axisBottomY = chartHeight - paddingY;
    const leftX = paddingX;
    const rightX = chartWidth - paddingX;

    const toY = (value) => axisBottomY - (value / maxValue) * (axisBottomY - paddingY);

    const linePoints = [
        { label: "Web", value: webCount, x: leftX, y: toY(webCount), color: "#3B82F6" },
        { label: "Mobile", value: mobileCount, x: rightX, y: toY(mobileCount), color: "#10B981" },
    ];

    const linePath = `M ${linePoints[0].x} ${linePoints[0].y} L ${linePoints[1].x} ${linePoints[1].y}`;

    return (
        <div className="p-4 sm:p-6 transition-colors duration-300">
            <div className="mb-5">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-['Poppins']">
                    Admin Dashboard
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Ringkasan data parkir dan aktivitas login pengguna.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                {cards.map((card) => (
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

                    <div className="w-full overflow-x-auto">
                        <svg
                            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                            className="w-full min-w-[520px] h-52"
                            role="img"
                            aria-label="Line chart login source web dan mobile"
                        >
                            <line
                                x1={leftX}
                                y1={axisBottomY}
                                x2={rightX}
                                y2={axisBottomY}
                                stroke="#CBD5E1"
                                strokeWidth="1"
                            />
                            <line
                                x1={leftX}
                                y1={paddingY}
                                x2={leftX}
                                y2={axisBottomY}
                                stroke="#CBD5E1"
                                strokeWidth="1"
                            />

                            <path
                                d={linePath}
                                fill="none"
                                stroke="#2563EB"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />

                            {linePoints.map((point) => (
                                <g key={point.label}>
                                    <circle cx={point.x} cy={point.y} r="6" fill={point.color} />
                                    <text
                                        x={point.x}
                                        y={point.y - 10}
                                        textAnchor="middle"
                                        className="fill-slate-500 text-xs"
                                    >
                                        {point.value}
                                    </text>
                                    <text
                                        x={point.x}
                                        y={axisBottomY + 20}
                                        textAnchor="middle"
                                        className="fill-slate-500 text-xs"
                                    >
                                        {point.label}
                                    </text>
                                </g>
                            ))}
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
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white font-['Poppins'] mb-4">
                        Aksi Cepat
                    </h2>

                    <div className="space-y-4">
                        <div className="border border-slate-200 dark:border-white/10 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                    Vehicle
                                </p>
                                <Link
                                    href="/admin/vehicle"
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    Buka halaman
                                </Link>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <Link
                                    href="/admin/vehicle-types"
                                    className="px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition"
                                >
                                    Manage Vehicle Types
                                </Link>
                                <Link
                                    href="/admin/vehicles"
                                    className="px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition"
                                >
                                    Manage Vehicles
                                </Link>
                            </div>
                        </div>

                        <div className="border border-slate-200 dark:border-white/10 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                    Parking
                                </p>
                                <Link
                                    href="/admin/parking"
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    Buka halaman
                                </Link>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <Link
                                    href="/admin/parking-locations"
                                    className="px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition"
                                >
                                    Parking Locations
                                </Link>
                                <Link
                                    href="/admin/parking-areas"
                                    className="px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition"
                                >
                                    Parking Areas
                                </Link>
                                <Link
                                    href="/admin/parking-rates"
                                    className="sm:col-span-2 px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition"
                                >
                                    Parking Rates
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

Dashboard.layout = (page) => <AdminLayout children={page} />;

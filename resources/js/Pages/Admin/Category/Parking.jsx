import { Link } from "@inertiajs/react";
import { BadgeDollarSign, Grid3X3, MapPin } from "lucide-react";
import AdminLayout from "../../Layouts/AdminLayout";
import useI18n from "../../../hooks/useI18n";

export default function ParkingCategory({ stats = {} }) {
    const { t } = useI18n();
    return (
        <div className="p-4 sm:p-6 transition-colors duration-300">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-['Poppins']">
                    {t("admin.category.parking.title", "Parking Category")}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {t(
                        "admin.category.parking.description",
                        "Halaman ringkasan untuk semua modul parkir.",
                    )}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <section className="bg-white dark:bg-[#111633] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white font-['Poppins']">
                                {t(
                                    "admin.category.parking.locations_title",
                                    "Parking Locations",
                                )}
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                {t(
                                    "admin.category.parking.locations_desc",
                                    "Kelola lokasi utama parkir.",
                                )}
                            </p>
                        </div>
                        <MapPin className="w-5 h-5 text-blue-500" />
                    </div>

                    <p className="text-3xl font-bold text-slate-900 dark:text-white font-['Poppins'] mb-4">
                        {stats.locationTotal ?? 0}
                    </p>

                    <div className="flex flex-wrap gap-2">
                        <Link
                            href="/admin/parking-locations?from=overview"
                            className="px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition"
                        >
                            {t("actions.view_data", "Lihat Data")}
                        </Link>
                    </div>
                </section>

                <section className="bg-white dark:bg-[#111633] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white font-['Poppins']">
                                {t(
                                    "admin.category.parking.areas_title",
                                    "Parking Areas",
                                )}
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                {t(
                                    "admin.category.parking.areas_desc",
                                    "Kelola area/slot parkir.",
                                )}
                            </p>
                        </div>
                        <Grid3X3 className="w-5 h-5 text-emerald-500" />
                    </div>

                    <p className="text-3xl font-bold text-slate-900 dark:text-white font-['Poppins'] mb-4">
                        {stats.areaTotal ?? 0}
                    </p>

                    <div className="flex flex-wrap gap-2">
                        <Link
                            href="/admin/parking-areas?from=overview"
                            className="px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition"
                        >
                            {t("actions.view_data", "Lihat Data")}
                        </Link>
                    </div>
                </section>

                <section className="bg-white dark:bg-[#111633] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white font-['Poppins']">
                                {t(
                                    "admin.category.parking.rates_title",
                                    "Parking Rates",
                                )}
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                {t(
                                    "admin.category.parking.rates_desc",
                                    "Kelola tarif parkir.",
                                )}
                            </p>
                        </div>
                        <BadgeDollarSign className="w-5 h-5 text-violet-500" />
                    </div>

                    <p className="text-3xl font-bold text-slate-900 dark:text-white font-['Poppins'] mb-4">
                        {stats.rateTotal ?? 0}
                    </p>

                    <div className="flex flex-wrap gap-2">
                        <Link
                            href="/admin/parking-rates?from=overview"
                            className="px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition"
                        >
                            {t("actions.view_data", "Lihat Data")}
                        </Link>
                    </div>
                </section>
            </div>

            <div className="mt-6 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-2 font-['Poppins']">
                    {t(
                        "admin.category.parking.prereq_title",
                        "Notes Prasyarat Data",
                    )}
                </h3>
                <ul className="text-sm text-amber-700/90 dark:text-amber-200/90 space-y-1">
                    <li>
                        {t(
                            "admin.category.parking.prereq_1",
                            "Tambah Parking Location dulu.",
                        )}
                    </li>
                    <li>
                        {t(
                            "admin.category.parking.prereq_2",
                            "Tambah Parking Area setelah location ada.",
                        )}
                    </li>
                    <li>
                        {t(
                            "admin.category.parking.prereq_3",
                            "Tambah Parking Rate setelah vehicle type + location ada.",
                        )}
                    </li>
                </ul>
            </div>
        </div>
    );
}

ParkingCategory.layout = (page) => <AdminLayout children={page} />;

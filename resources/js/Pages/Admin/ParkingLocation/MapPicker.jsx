import { useEffect, useRef, useState } from "react";

const LEAFLET_SCRIPT_ID = "leaflet-js";
const LEAFLET_STYLE_ID = "leaflet-css";
let leafletPromise;

function loadLeaflet() {
    if (window.L) {
        return Promise.resolve(window.L);
    }

    if (leafletPromise) {
        return leafletPromise;
    }

    leafletPromise = new Promise((resolve, reject) => {
        const existingStyle = document.getElementById(LEAFLET_STYLE_ID);
        if (!existingStyle) {
            const style = document.createElement("link");
            style.id = LEAFLET_STYLE_ID;
            style.rel = "stylesheet";
            style.href =
                "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
            style.integrity =
                "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
            style.crossOrigin = "";
            document.head.appendChild(style);
        }

        const existingScript = document.getElementById(LEAFLET_SCRIPT_ID);
        if (existingScript) {
            existingScript.addEventListener("load", () => resolve(window.L));
            existingScript.addEventListener("error", () =>
                reject(new Error("Gagal memuat Leaflet.")),
            );
            return;
        }

        const script = document.createElement("script");
        script.id = LEAFLET_SCRIPT_ID;
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.async = true;
        script.defer = true;
        script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
        script.crossOrigin = "";
        script.onload = () => resolve(window.L);
        script.onerror = () => reject(new Error("Gagal memuat Leaflet."));
        document.head.appendChild(script);
    });

    return leafletPromise;
}

function parseCoordinate(value) {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? null : parsed;
}

export default function MapPicker({ latitude, longitude, onChange }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const initialLat = parseCoordinate(latitude) ?? -6.2;
        const initialLng = parseCoordinate(longitude) ?? 106.816666;

        loadLeaflet()
            .then((L) => {
                if (!mounted || !mapRef.current) return;

                const center = [initialLat, initialLng];
                const map = L.map(mapRef.current, {
                    center,
                    zoom: 14,
                });

                L.tileLayer(
                    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                    {
                        maxZoom: 19,
                        attribution: "&copy; OpenStreetMap contributors",
                    },
                ).addTo(map);

                const marker = L.marker(center, {
                    draggable: true,
                }).addTo(map);

                map.on("click", (event) => {
                    const { lat, lng } = event.latlng;
                    marker.setLatLng([lat, lng]);
                    onChange(lat.toFixed(6), lng.toFixed(6));
                });

                marker.on("dragend", (event) => {
                    const { lat, lng } = event.target.getLatLng();
                    onChange(lat.toFixed(6), lng.toFixed(6));
                });

                mapInstanceRef.current = map;
                markerRef.current = marker;
                setLoading(false);
            })
            .catch((err) => {
                if (!mounted) return;
                setError(err.message || "Map gagal dimuat.");
                setLoading(false);
            });

        return () => {
            mounted = false;
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        const map = mapInstanceRef.current;
        const marker = markerRef.current;
        if (!map || !marker) return;

        const lat = parseCoordinate(latitude);
        const lng = parseCoordinate(longitude);
        if (lat === null || lng === null) return;

        const position = [lat, lng];
        marker.setLatLng(position);
        map.panTo(position);
    }, [latitude, longitude]);

    if (error) {
        return (
            <div className="p-4 rounded-xl border border-red-200 text-red-600 text-sm bg-red-50 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-300">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div
                ref={mapRef}
                className="w-full h-[320px] rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden"
            />
            {loading && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Memuat peta...
                </p>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">
                Klik map atau geser marker untuk memilih lokasi.
            </p>
        </div>
    );
}

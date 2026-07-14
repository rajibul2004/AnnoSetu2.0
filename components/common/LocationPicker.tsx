"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";

// Dynamically import Leaflet components with no SSR
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false },
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false },
);
const ZoomControl = dynamic(
  () => import("react-leaflet").then((mod) => mod.ZoomControl),
  { ssr: false },
);
import { useMap, useMapEvents } from "react-leaflet";

import "leaflet/dist/leaflet.css";

// Types
interface Position {
  lat: number;
  lng: number;
}

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
  };
}

interface LocationPickerProps {
  isDark?: boolean;
  setFormData?: React.Dispatch<React.SetStateAction<any>>;
  useLocationAsAddress?: boolean;
  onLocationSelect?: (lat: number, lng: number, address: string) => void;
}

// Theme definitions
const THEMES = {
  light: {
    wrap: "#ffffff",
    surface: "#f9fafb",
    surface2: "#f3f4f6",
    hover: "#f3f4f6",
    textPrimary: "#111827",
    textMuted: "#6b7280",
    textSub: "#4b5563",
    border: "#e5e7eb",
    borderFocus: "#6366f1",
    accent: "#f97316",
    accentPale: "rgba(249,115,22,0.10)",
    shadowSm: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05)",
    shadowMd: "0 4px 16px rgba(0,0,0,0.08)",
    tileUrl:
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  },
  dark: {
    wrap: "#111827",
    surface: "#1f2937",
    surface2: "#374151",
    hover: "#374151",
    textPrimary: "#f9fafb",
    textMuted: "#9ca3af",
    textSub: "#d1d5db",
    border: "#374151",
    borderFocus: "#818cf8",
    accent: "#fb923c",
    accentPale: "rgba(251,146,60,0.15)",
    shadowSm: "0 1px 3px rgba(0,0,0,0.40)",
    shadowMd: "0 4px 16px rgba(0,0,0,0.45)",
    tileUrl: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  },
};

// Helper: build CSS from theme
function buildCSS(t: typeof THEMES.light) {
  return `
  @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');

  .lp-root { font-family: inherit; display: flex; flex-direction: column; gap: 0; }

  /* Search */
  .lp-search-wrap { position: relative; z-index: 10000; }
  .lp-search-icon {
    position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
    color: ${t.textMuted}; pointer-events: none; font-size: 14px; line-height: 1;
  }
  .lp-input {
    width: 100%; padding: 10px 36px 10px 36px;
    background: ${t.surface}; border: 1.5px solid ${t.border};
    border-radius: 10px; font-size: 13.5px; color: ${t.textPrimary};
    outline: none; font-family: inherit;
    transition: border-color 0.18s, box-shadow 0.18s, background 0.25s;
    box-shadow: ${t.shadowSm};
  }
  .lp-input:focus { border-color: ${t.borderFocus}; box-shadow: 0 0 0 3px ${t.accentPale}; }
  .lp-input::placeholder { color: ${t.textMuted}; }
  .lp-clear {
    position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    color: ${t.textMuted}; font-size: 14px; padding: 3px 5px;
    border-radius: 5px; transition: color 0.15s, background 0.15s; line-height: 1;
  }
  .lp-clear:hover { color: ${t.textPrimary}; background: ${t.surface2}; }

  /* Spinner */
  .lp-spinner {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    width: 15px; height: 15px;
    border: 2px solid ${t.border}; border-top-color: ${t.accent};
    border-radius: 50%; animation: lpSpin 0.65s linear infinite;
  }
  @keyframes lpSpin { to { transform: translateY(-50%) rotate(360deg); } }

  /* Dropdown */
  .lp-dropdown {
    position: absolute; top: calc(100% + 5px); left: 0; right: 0;
    background: ${t.surface}; border: 1px solid ${t.border};
    border-radius: 12px; overflow: hidden;
    box-shadow: ${t.shadowMd}; z-index: 10001;
    animation: lpFadeDown 0.13s ease;
  }
  @keyframes lpFadeDown {
    from { opacity: 0; transform: translateY(-5px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .lp-result {
    display: flex; align-items: flex-start; gap: 9px;
    padding: 10px 13px; cursor: pointer;
    border-bottom: 1px solid ${t.border}; transition: background 0.1s;
  }
  .lp-result:last-child { border-bottom: none; }
  .lp-result:hover { background: ${t.hover}; }
  .lp-result-pin {
    width: 26px; height: 26px; flex-shrink: 0; margin-top: 1px;
    border-radius: 7px; background: ${t.accentPale};
    display: flex; align-items: center; justify-content: center; font-size: 12px;
  }
  .lp-result-name { font-size: 13px; font-weight: 600; color: ${t.textPrimary}; line-height: 1.35; }
  .lp-result-sub  { font-size: 11px; color: ${t.textMuted}; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 420px; }
  .lp-empty { padding: 16px 13px; font-size: 13px; color: ${t.textMuted}; text-align: center; }

  /* Map */
  .lp-map-shell {
    position: relative; border-radius: 12px; overflow: hidden;
    border: 1.5px solid ${t.border}; margin-top: 10px; box-shadow: ${t.shadowSm};
  }
  .leaflet-container { height: 300px; width: 100%; cursor: crosshair !important; }

  .leaflet-grab { cursor: crosshair !important; }
  .leaflet-dragging .leaflet-grab { cursor: grabbing !important; }

  .lp-badge {
    position: absolute; top: 10px; left: 10px; z-index: 800;
    background: ${t.surface}; border: 1px solid ${t.border}; border-radius: 20px;
    padding: 4px 11px 4px 8px; display: flex; align-items: center; gap: 6px;
    font-size: 11.5px; font-weight: 600; color: ${t.textPrimary};
    box-shadow: ${t.shadowSm}; max-width: 200px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .lp-dot {
    width: 7px; height: 7px; flex-shrink: 0;
    background: ${t.accent}; border-radius: 50%;
    animation: lpPulse 2s ease-in-out infinite;
  }
  @keyframes lpPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.45; transform: scale(0.75); }
  }

  .lp-recenter {
    position: absolute; bottom: 50px; right: 9px; z-index: 800;
    width: 32px; height: 32px;
    background: ${t.surface}; border: 1px solid ${t.border};
    border-radius: 8px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; color: ${t.textPrimary}; box-shadow: ${t.shadowSm};
    transition: background 0.15s, transform 0.15s;
  }
  .lp-recenter:hover { background: ${t.surface2}; transform: scale(1.07); }

  .leaflet-control-zoom {
    border: 1px solid ${t.border} !important; border-radius: 8px !important;
    overflow: hidden; box-shadow: ${t.shadowSm} !important;
  }
  .leaflet-control-zoom a {
    font-weight: 700 !important; color: ${t.textPrimary} !important;
    background: ${t.surface} !important; border-color: ${t.border} !important;
  }
  .leaflet-control-zoom a:hover { background: ${t.surface2} !important; }

  /* Coords */
  .lp-coords {
    display: flex; align-items: center; gap: 8px; margin-top: 8px;
    padding: 8px 12px; background: ${t.surface};
    border: 1px solid ${t.border}; border-radius: 9px;
  }
  .lp-coords-label {
    font-size: 10px; font-weight: 700; letter-spacing: 0.8px;
    text-transform: uppercase; color: ${t.textMuted}; flex-shrink: 0;
  }
  .lp-coords-val {
    font-size: 12px; color: ${t.textSub}; flex: 1;
    font-variant-numeric: tabular-nums;
  }
  .lp-copy {
    background: none; border: none; cursor: pointer; font-size: 11px;
    color: ${t.textMuted}; padding: 3px 7px; border-radius: 5px;
    transition: color 0.15s, background 0.15s; flex-shrink: 0;
  }
  .lp-copy:hover { color: ${t.textPrimary}; background: ${t.surface2}; }
  .lp-copy-ok { color: #16a34a !important; }

  /* Address */
  .lp-addr {
    display: flex; align-items: flex-start; gap: 8px; margin-top: 6px;
    padding: 9px 12px; background: ${t.surface};
    border: 1px solid ${t.border}; border-radius: 9px; min-height: 40px;
  }
  .lp-addr-icon  { font-size: 13px; flex-shrink: 0; margin-top: 2px; }
  .lp-addr-text  { font-size: 12.5px; color: ${t.textSub}; line-height: 1.5; }
  .lp-addr-muted { color: ${t.textMuted}; font-size: 12px; }

  /* Shimmer */
  .lp-shimmer {
    height: 13px; border-radius: 5px; width: 75%;
    background: linear-gradient(90deg, ${t.surface2} 25%, ${t.surface} 50%, ${t.surface2} 75%);
    background-size: 200% 100%; animation: lpShimmer 1.2s infinite;
  }

  @keyframes lpShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  `;
}

// Inner components that rely on Leaflet (must be wrapped and used only after dynamic import)
// These are defined as regular components, but since they are inside the parent, they will only be used client-side.
function ClickHandler({
  onSelect,
}: {
  onSelect: (lat: number, lng: number) => void;
}) {
  const mapEvents = useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyToLocation({ position }: { position: Position }) {
  const map = useMap();
  const prev = useRef(position);
  useEffect(() => {
    if (
      prev.current.lat !== position.lat ||
      prev.current.lng !== position.lng
    ) {
      map.flyTo(position, Math.max(map.getZoom(), 14), { duration: 1.1 });
      prev.current = position;
    }
  }, [position, map]);
  return null;
}

function DraggableMarker({
  position,
  onDragEnd,
}: {
  position: Position;
  onDragEnd: (lat: number, lng: number) => void;
}) {
  const ref = useRef<any>(null);
  return (
    <Marker
      draggable
      position={position}
      ref={ref}
      eventHandlers={{
        dragend: () => {
          const { lat, lng } = ref.current.getLatLng();
          onDragEnd(lat, lng);
        },
      }}
    />
  );
}

// Debounce hook
function useDebounce<T>(value: T, delay = 380): T {
  const [deb, setDeb] = useState<T>(value);
  useEffect(() => {
    const id = setTimeout(() => setDeb(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return deb;
}

// Main component
export default function LocationPicker({
  isDark = false,
  setFormData,
  useLocationAsAddress = false,
  onLocationSelect,
}: LocationPickerProps) {

   useEffect(() => {
    import("leaflet").then((L) => {
      delete (L.default.Icon.Default.prototype as any)._getIconUrl;

      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl: "/leaflet/marker-icon-2x.png",
        iconUrl: "/leaflet/marker-icon.png",
        shadowUrl: "/leaflet/marker-shadow.png",
      });
    });
  }, []);

  const t = isDark ? THEMES.dark : THEMES.light;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [address, setAddress] = useState("");
  const [showDrop, setShowDrop] = useState(false);
  const [position, setPosition] = useState<Position>({
    lat: 22.56263,
    lng: 88.36304,
  });

  const markerPos = useMemo(() => position, [position]);
  const debQuery = useDebounce(query);
  const cache = useRef<Record<string, NominatimResult[]>>({});
  const dropRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setShowDrop(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Search suggestions
  useEffect(() => {
    if (debQuery.length < 3) {
      setResults([]);
      setShowDrop(false);
      return;
    }
    if (cache.current[debQuery]) {
      setResults(cache.current[debQuery]);
      setShowDrop(true);
      return;
    }


    const controller = new AbortController();
    const { lat, lng } = position;
    const url =
      `https://nominatim.openstreetmap.org/search?format=json` +
      `&q=${encodeURIComponent(debQuery)}` +
      `&limit=6` +
      `&addressdetails=1` +
      `&viewbox=${lng - 1},${lat + 1},${lng + 1},${lat - 1}` +
      `&bounded=1`;

    setSearching(true);
    fetch(url, {
      signal: controller.signal,
      headers: { "Accept-Language": "en", "User-Agent": "annosetu" },
    })
      .then((res) => res.json())
      .then((data: NominatimResult[]) => {
        cache.current[debQuery] = data;
        setResults(data);
        setShowDrop(true);
      })
      .catch(() => {})
      .finally(() => setSearching(false));
    return () => controller.abort();
  }, [debQuery, position]);

  // Reverse geocode
  const getAddress = useCallback(
    async (lat: number, lng: number): Promise<string> => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
          { headers: { "Accept-Language": "en" } },
        );
        const data = await res.json();
        return data.display_name || "";
      } catch {
        return "";
      }
    },
    [],
  );

  // Update location (called on map click / drag / search)
  const updateLocation = useCallback(
    async (lat: number, lng: number) => {
      setPosition({ lat, lng });
      setLoading(true);
      setAddress("");
      const addr = await getAddress(lat, lng);
      setAddress(addr);
      if (onLocationSelect) {
        onLocationSelect(lat, lng, addr);
      } else if (setFormData) {
        setFormData((prev: any) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          address: useLocationAsAddress ? addr : (prev?.address ?? ""),
        }));
      }
      setLoading(false);
    },
    [getAddress, setFormData, useLocationAsAddress, onLocationSelect],
  );

  // Select from search result
  const handleSelect = (place: NominatimResult) => {
    updateLocation(parseFloat(place.lat), parseFloat(place.lon));
    setQuery(place.display_name.split(",")[0]);
    setResults([]);
    setShowDrop(false);
  };

  // Copy coordinates
  const handleCopy = () => {
    navigator.clipboard?.writeText(
      `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const placeName = address ? address.split(",")[0] : null;

  return (
    <>
      <style>{buildCSS(t)}</style>
      <div className="lp-root">
        {/* Search */}
        <div className="lp-search-wrap" ref={dropRef}>
          <span className="lp-search-icon">🔍</span>
          <input
            className="lp-input"
            placeholder="Search for a place or address…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setShowDrop(true)}
          />
          {searching && <span className="lp-spinner" />}
          {query && !searching && (
            <button
              className="lp-clear"
              onClick={() => {
                setQuery("");
                setResults([]);
                setShowDrop(false);
              }}
            >
              ✕
            </button>
          )}
          {showDrop && (
            <div className="lp-dropdown">
              {results.length === 0 ? (
                <div className="lp-empty">No results found</div>
              ) : (
                results.map((place) => (
                  <div
                    key={place.place_id}
                    className="lp-result"
                    onClick={() => handleSelect(place)}
                  >
                    <div className="lp-result-pin">📍</div>
                    <div style={{ minWidth: 0 }}>
                      <div className="lp-result-name">
                        {place.address?.city ||
                          place.address?.town ||
                          place.address?.village ||
                          place.display_name.split(",")[0]}
                      </div>
                      <div className="lp-result-sub">{place.display_name}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="lp-map-shell">
          <MapContainer
            center={position}
            zoom={13}
            zoomControl={false}
            style={{ height: 300, width: "100%" }}
          >
            <TileLayer
              url={t.tileUrl}
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />
            <ClickHandler onSelect={updateLocation} />
            <FlyToLocation position={position} />
            <DraggableMarker position={markerPos} onDragEnd={updateLocation} />
            <ZoomControl position="bottomright" />
          </MapContainer>
          <div className="lp-badge">
            <span className="lp-dot" />
            {placeName || "Selected"}
          </div>
          <button
            className="lp-recenter"
            title="Re-center"
            onClick={() => updateLocation(position.lat, position.lng)}
          >
            ⊕
          </button>
        </div>

        {/* Coordinates */}
        <div className="lp-coords">
          <span className="lp-coords-label">Coords</span>
          <span className="lp-coords-val">
            {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
          </span>
          <button
            className={`lp-copy${copied ? " lp-copy-ok" : ""}`}
            onClick={handleCopy}
          >
            {copied ? "✓ copied" : "⎘ copy"}
          </button>
        </div>

        {/* Address */}
        <div className="lp-addr">
          <span className="lp-addr-icon">🏠</span>
          {loading ? (
            <div className="lp-shimmer" />
          ) : address ? (
            <span className="lp-addr-text">{address}</span>
          ) : (
            <span className="lp-addr-muted">
              Click the map or search to select a location
            </span>
          )}
        </div>
      </div>
    </>
  );
}

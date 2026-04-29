import { useState, useEffect, useRef } from "react";
import "../../css/health/FindHospital.css";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Hospital {
  id: number;
  lat: number;
  lon: number;
  name: string;
  type: string;
  address: string;
  phone?: string;
  distanceKm?: number;
}

interface FindHospitalProps {
  onBack: () => void;
  onLogout: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getTypeBadgeClass(type: string) {
  if (type === "hospital") return "fh-type-hospital";
  if (type === "clinic") return "fh-type-clinic";
  if (type === "pharmacy") return "fh-type-pharmacy";
  return "fh-type-default";
}

function getTypeLabel(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const HospitalBuildingIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
    <path d="M3 21h18" />
    <path d="M12 9v6m-3-3h6" />
  </svg>
);

const SearchIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const MapPinIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const PhoneIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: 11, height: 11 }}
  >
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012.18 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.16a16 16 0 006.93 6.93l1.52-1.52a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const SparkleIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ width: 12, height: 12 }}
  >
    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────
export default function FindHospital({ onBack, onLogout }: FindHospitalProps) {
  const [query, setQuery] = useState("");
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [gpsTracking, setGpsTracking] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [mapCenter, setMapCenter] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // ── Overpass API helper (with fallback servers) ────────────────────────────
  const OVERPASS_SERVERS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ];

  const queryOverpass = async (overpassQuery: string): Promise<any> => {
    for (const server of OVERPASS_SERVERS) {
      try {
        const res = await fetch(server, {
          method: "POST",
          body: overpassQuery,
        });
        if (!res.ok) continue; // try next server
        const data = await res.json();
        if (data && Array.isArray(data.elements)) return data;
      } catch {
        continue; // try next server
      }
    }
    return null; // all servers failed
  };

  const parseOverpassResults = (
    overpassData: any,
    cLat: number,
    cLon: number,
  ): Hospital[] => {
    if (!overpassData || !Array.isArray(overpassData.elements)) return [];

    return overpassData.elements
      .filter((el: any) => el.tags?.name)
      .map((el: any) => {
        const elLat = el.lat ?? el.center?.lat ?? cLat;
        const elLon = el.lon ?? el.center?.lon ?? cLon;
        const tags = el.tags || {};

        const addrParts = [
          tags["addr:housenumber"],
          tags["addr:street"],
          tags["addr:suburb"],
          tags["addr:city"] || tags["addr:town"] || tags["addr:village"],
          tags["addr:state"],
        ].filter(Boolean);

        return {
          id: el.id,
          lat: elLat,
          lon: elLon,
          name: tags.name || "Unnamed facility",
          type: tags.amenity || tags.healthcare || "healthcare",
          address: addrParts.length
            ? addrParts.join(", ")
            : "Address not available",
          phone: tags.phone || tags["contact:phone"],
          distanceKm: haversineKm(cLat, cLon, elLat, elLon),
        };
      })
      .sort(
        (a: Hospital, b: Hospital) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0),
      )
      .slice(0, 30);
  };

  // ── Fetch hospitals by coordinates ──────────────────────────────────────────
  const fetchHospitalsByCoords = async (cLat: number, cLon: number) => {
    setLoading(true);
    setError("");
    setSearched(true);
    setMapCenter({ lat: cLat, lon: cLon });

    try {
      const radius = 10000; // 10 km
      const overpassQuery = `
        [out:json][timeout:40];
        (
          nwr["amenity"~"hospital|clinic|pharmacy|doctors|dentist"](around:${radius},${cLat},${cLon});
          nwr["healthcare"~"hospital|clinic|doctor|pharmacy|centre"](around:${radius},${cLat},${cLon});
        );
        out center tags;
      `;

      const overpassData = await queryOverpass(overpassQuery);

      if (!overpassData) {
        setError(
          "Medical facility search is temporarily unavailable. Please try again in a moment.",
        );
        setHospitals([]);
      } else {
        const elements = parseOverpassResults(overpassData, cLat, cLon);
        setHospitals(elements);
      }
    } catch (err) {
      setError(
        "Could not fetch results. Please check your internet connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch logic ──────────────────────────────────────────────────────────────
  const fetchHospitals = async (locationQuery: string) => {
    setLoading(true);
    setError("");
    setSearched(true);

    try {
      // Step 1: Geocode the location text → lat/lon via Nominatim
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationQuery)}&format=json&limit=1`,
        {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "EduTrackHealth/1.0",
          },
        },
      );
      const geoData = await geoRes.json();

      if (!geoData.length) {
        setHospitals([]);
        setLoading(false);
        return;
      }

      const { lat, lon } = geoData[0];
      const cLat = parseFloat(lat);
      const cLon = parseFloat(lon);
      setMapCenter({ lat: cLat, lon: cLon });
      const radius = 10000; // 10 km

      // Step 2: Overpass query – hospitals, clinics, pharmacies
      const overpassQuery = `
        [out:json][timeout:40];
        (
          nwr["amenity"~"hospital|clinic|pharmacy|doctors|dentist"](around:${radius},${cLat},${cLon});
          nwr["healthcare"~"hospital|clinic|doctor|pharmacy|centre"](around:${radius},${cLat},${cLon});
        );
        out center tags;
      `;

      const overpassData = await queryOverpass(overpassQuery);

      if (!overpassData) {
        setError(
          "Medical facility search is temporarily unavailable. Please try again in a moment.",
        );
        setHospitals([]);
      } else {
        const elements = parseOverpassResults(overpassData, cLat, cLon);
        setHospitals(elements);
      }
    } catch (err) {
      setError(
        "Could not fetch results. Please check your internet connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ── GPS real-time tracking ─────────────────────────────────────────────────
  const startGpsTracking = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser");
      return;
    }

    setGpsTracking(true);
    setGpsError("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setUserLocation(loc);
        fetchHospitalsByCoords(loc.lat, loc.lon);
      },
      (err) => {
        setGpsError(`GPS Error: ${err.message}`);
        setGpsTracking(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setUserLocation(loc);
      },
      (err) => {
        setGpsError(`GPS Error: ${err.message}`);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
  };

  const stopGpsTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setGpsTracking(false);
  };

  // Cleanup GPS on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // ── Debounce input ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (!trimmed) {
      setHospitals([]);
      setSearched(false);
      setError("");
      setLoading(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      fetchHospitals(trimmed);
    }, 1000);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="fh-root">
      {/* Background blobs */}
      <div className="fh-blob-1" />
      <div className="fh-blob-2" />

      {/* ── Header ── */}
      <header className="fh-header">
        <div className="fh-header-inner">
          {/* Logo */}
          <div className="fh-logo">
            <div className="fh-logo-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="fh-logo-text">EduTrack</span>
          </div>

          {/* Page title */}
          <div className="fh-title-group">
            <span className="fh-page-title">Find Hospital</span>
            <span className="fh-page-sub">
              Locate nearby medical facilities
            </span>
          </div>

          {/* Actions */}
          <div className="fh-header-actions">
            <button className="fh-btn-back" onClick={onBack}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ width: 14, height: 14 }}
              >
                <path d="M19 12H5m7-7l-7 7 7 7" />
              </svg>
              Back
            </button>
            <button className="fh-btn-logout" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="fh-main">
        {/* Hero search card */}
        <div className="fh-hero-card">
          <div className="fh-hero-badge">
            <SparkleIcon /> Emergency Medical Locator
          </div>
          <h1 className="fh-hero-title">Find Nearest Hospital</h1>
          <p className="fh-hero-sub">
            Use your GPS or type a location to discover nearby hospitals,
            clinics, and medical centres.
          </p>

          {/* GPS Button */}
          <div className="fh-action-row">
            <button
              className={`fh-gps-btn ${gpsTracking ? "active" : ""}`}
              onClick={gpsTracking ? stopGpsTracking : startGpsTracking}
            >
              📍 {gpsTracking ? "GPS Tracking Active" : "Use My Location"}
              {gpsTracking && <span className="fh-gps-pulse" />}
            </button>
          </div>

          {gpsError && <div className="fh-gps-error">⚠️ {gpsError}</div>}

          {/* Search input */}
          <div className="fh-search-wrap">
            <span className="fh-search-icon">
              <SearchIcon />
            </span>
            <input
              className="fh-search-input"
              type="text"
              placeholder="Type a location (e.g. Colombo, Kandy, Galle...)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            {query && (
              <button
                className="fh-clear-btn"
                onClick={() => setQuery("")}
                title="Clear"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ── Map ── */}
        {mapCenter && (
          <div className="fh-map-container">
            <iframe
              className="fh-map-iframe"
              title="Hospital Map"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapCenter.lon - 0.08},${mapCenter.lat - 0.06},${mapCenter.lon + 0.08},${mapCenter.lat + 0.06}&layer=mapnik&marker=${mapCenter.lat},${mapCenter.lon}`}
              allowFullScreen
            />
            <div className="fh-map-info">
              <span className="fh-map-pin">📍</span>
              <span>Showing facilities within 10km radius</span>
              {userLocation && (
                <span className="fh-gps-live-badge">● GPS Live</span>
              )}
            </div>
          </div>
        )}

        {/* Status strip */}
        <div className="fh-status-strip">
          {loading && (
            <>
              <div className="fh-spinner" />
              Searching for hospitals near{" "}
              <strong style={{ color: "#059669", marginLeft: 4 }}>
                "{query}"
              </strong>
              …
            </>
          )}
          {!loading && searched && !error && hospitals.length > 0 && (
            <span className="fh-count-badge">
              🏥 {hospitals.length} facilities found near "{query}"
            </span>
          )}
          {!loading &&
            searched &&
            !error &&
            hospitals.length === 0 &&
            query && (
              <span>
                No results found for "<strong>{query}</strong>"
              </span>
            )}
        </div>

        {/* Error */}
        {error && <div className="fh-error-box">⚠️ {error}</div>}

        {/* Results */}
        {!error && (
          <div className="fh-results">
            {!loading && !searched && (
              <div className="fh-prompt">
                <div className="fh-prompt-icon">🏥</div>
                <div className="fh-prompt-title">Start typing a location</div>
                <div className="fh-prompt-sub">
                  Hospitals, clinics, and pharmacies in that area will appear
                  here in real time.
                </div>
              </div>
            )}

            {!loading && searched && hospitals.length === 0 && (
              <div className="fh-empty">
                <div className="fh-empty-icon">🔍</div>
                <div className="fh-empty-title">No facilities found</div>
                <div className="fh-empty-sub">
                  Try a different or more specific location name.
                </div>
              </div>
            )}

            {hospitals.map((h) => (
              <div key={h.id} className="fh-card">
                {/* Icon */}
                <div className="fh-card-icon">
                  <HospitalBuildingIcon />
                </div>

                {/* Body */}
                <div className="fh-card-body">
                  <div className="fh-card-top">
                    <span className="fh-card-name" title={h.name}>
                      {h.name}
                    </span>
                    <span
                      className={`fh-type-badge ${getTypeBadgeClass(h.type)}`}
                    >
                      {getTypeLabel(h.type)}
                    </span>
                  </div>

                  <div className="fh-card-address">📍 {h.address}</div>

                  <div className="fh-card-footer">
                    {/* Distance */}
                    {h.distanceKm !== undefined && (
                      <span className="fh-dist-pill">
                        <MapPinIcon />
                        {h.distanceKm < 1
                          ? `${Math.round(h.distanceKm * 1000)} m away`
                          : `${h.distanceKm.toFixed(1)} km away`}
                      </span>
                    )}

                    {/* Phone */}
                    {h.phone && (
                      <a href={`tel:${h.phone}`} className="fh-phone-pill">
                        <PhoneIcon /> {h.phone}
                      </a>
                    )}

                    {/* Open in Maps */}
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${h.lat}&mlon=${h.lon}#map=17/${h.lat}/${h.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="fh-maps-btn"
                    >
                      Open in Maps <ExternalLinkIcon />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

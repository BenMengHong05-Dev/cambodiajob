import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useTranslation } from 'react-i18next'
import { MapPin, Search, Navigation, Check, X, Loader2 } from 'lucide-react'

interface MapPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectLocation: (formattedLocation: string, coords: { lat: number; lng: number; address: string }) => void
  initialQuery?: string
}

const DEFAULT_COORDS = { lat: 11.5564, lng: 104.9282 } // Phnom Penh, Cambodia

const createPinIcon = () =>
  L.divIcon({
    className: 'custom-map-pin',
    html: `<div style="width:32px;height:32px;border-radius:9999px 9999px 9999px 0;background:#2563eb;border:3px solid #ffffff;transform:rotate(-45deg);box-shadow:0 6px 14px rgba(37,99,235,0.4);display:flex;align-items:center;justify-content:center;"><div style="width:10px;height:10px;border-radius:9999px;background:#ffffff;transform:rotate(45deg);"></div></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  })

export const MapPickerModal: React.FC<MapPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  initialQuery = '',
}) => {
  const { i18n } = useTranslation()
  const isKhmer = i18n.language === 'km'

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  const [coords, setCoords] = useState(DEFAULT_COORDS)
  const [address, setAddress] = useState('')
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [isSearching, setIsSearching] = useState(false)
  const [isResolvingAddress, setIsResolvingAddress] = useState(false)
  const [isLocating, setIsLocating] = useState(false)

  const reverseGeocode = async (lat: number, lng: number) => {
    setIsResolvingAddress(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': isKhmer ? 'km,en' : 'en' } }
      )
      const data = await res.json()
      if (data?.display_name) {
        const parts = String(data.display_name).split(',').map((s) => s.trim())
        setAddress(parts.slice(0, 4).join(', '))
      } else {
        setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`)
      }
    } catch {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    } finally {
      setIsResolvingAddress(false)
    }
  }

  const updateMarkerPosition = (lat: number, lng: number, zoom?: number) => {
    const next = { lat, lng }
    setCoords(next)
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
    }
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], zoom ?? mapRef.current.getZoom(), { animate: true })
    }
    reverseGeocode(lat, lng)
  }

  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: [DEFAULT_COORDS.lat, DEFAULT_COORDS.lng],
      zoom: 13,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map)

    const marker = L.marker([DEFAULT_COORDS.lat, DEFAULT_COORDS.lng], {
      icon: createPinIcon(),
      draggable: true,
    }).addTo(map)

    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      setCoords({ lat: pos.lat, lng: pos.lng })
      reverseGeocode(pos.lat, pos.lng)
    })

    map.on('click', (e: L.LeafletMouseEvent) => {
      updateMarkerPosition(e.latlng.lat, e.latlng.lng)
    })

    mapRef.current = map
    markerRef.current = marker

    setTimeout(() => map.invalidateSize(), 120)
    reverseGeocode(DEFAULT_COORDS.lat, DEFAULT_COORDS.lng)

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [isOpen])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setIsSearching(true)
    try {
      const q = encodeURIComponent(searchQuery.trim())
      let res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${q}&countrycodes=kh&limit=1`
      )
      let results = await res.json()
      if (!Array.isArray(results) || results.length === 0) {
        res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`)
        results = await res.json()
      }
      if (Array.isArray(results) && results.length > 0) {
        const hit = results[0]
        updateMarkerPosition(parseFloat(hit.lat), parseFloat(hit.lon), 16)
      }
    } catch {
      // Ignore network errors quietly
    } finally {
      setIsSearching(false)
    }
  }

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateMarkerPosition(pos.coords.latitude, pos.coords.longitude, 16)
        setIsLocating(false)
      },
      () => {
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const handleConfirm = () => {
    const mapUrl = `https://maps.google.com/?q=${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}`
    const cleanAddress = address.trim()
    const formatted = cleanAddress ? `${cleanAddress} (${mapUrl})` : mapUrl
    onSelectLocation(formatted, { lat: coords.lat, lng: coords.lng, address: cleanAddress })
    onClose()
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isKhmer ? 'ជ្រើសរើសទីតាំងលើផែនទី' : 'Pick Interview Location on Map'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isKhmer
                  ? 'ចុចលើផែនទី ឬអូសសញ្ញាសម្គាល់ដើម្បីកំណត់ទីតាំងការិយាល័យ'
                  : 'Click on the map or drag the pin to set your office location'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & My Location Bar */}
        <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-2">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isKhmer ? 'ស្វែងរកទីតាំង ឬផ្លូវ (ឧ. Toul Kork, Phnom Penh)...' : 'Search place or street (e.g. Toul Kork, Phnom Penh)...'}
                className="w-full h-9 pl-8 pr-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-500 transition"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="h-9 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer shrink-0 disabled:opacity-60 flex items-center gap-1.5"
            >
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>{isKhmer ? 'ស្វែងរក' : 'Search'}</span>
            </button>
          </form>

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="h-9 px-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
          >
            {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" /> : <Navigation className="w-3.5 h-3.5 text-blue-600" />}
            <span>{isKhmer ? 'ទីតាំងខ្ញុំ' : 'My Location'}</span>
          </button>
        </div>

        {/* Map Canvas */}
        <div className="relative w-full h-72 sm:h-80 bg-slate-100 dark:bg-slate-800">
          <div ref={mapContainerRef} className="w-full h-full z-10" />
        </div>

        {/* Selected Address & Confirm Footer */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              {isKhmer ? 'ទីតាំងដែលបានជ្រើសរើស' : 'Selected Location'}
            </div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate mt-0.5 flex items-center gap-1.5">
              {isResolvingAddress && <Loader2 className="w-3 h-3 animate-spin text-blue-600 shrink-0" />}
              <span className="truncate">
                {address || `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
            >
              {isKhmer ? 'បោះបង់' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isKhmer ? 'ប្រើទីតាំងនេះ' : 'Use This Location'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

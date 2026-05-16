import { useEffect, useRef, useState } from 'react';
import { Input, Label } from './ui/Input';
import { VALID_POSTCODES } from '@/lib/suburbs';

export interface ParsedAddress {
  street: string;
  suburb: string;
  postcode: string;
  lat: number | null;
  lng: number | null;
}

interface Props {
  value: ParsedAddress | null;
  onChange: (a: ParsedAddress) => void;
}

let mapsLoadPromise: Promise<typeof google> | null = null;

async function resolveApiKey(): Promise<string> {
  const buildKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '') as string;
  if (buildKey) return buildKey;
  const res = await fetch('/api/config', { credentials: 'include' });
  if (!res.ok) throw new Error('Address autocomplete is not configured yet');
  const body = (await res.json()) as { google_maps_api_key?: string };
  if (!body.google_maps_api_key) throw new Error('Address autocomplete is not configured yet');
  return body.google_maps_api_key;
}

function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.google?.maps?.places) return Promise.resolve(window.google);
  if (mapsLoadPromise) return mapsLoadPromise;
  mapsLoadPromise = resolveApiKey()
    .then(
      (key) =>
        new Promise<typeof google>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&v=weekly`;
          script.async = true;
          script.defer = true;
          script.onload = () => resolve(window.google);
          script.onerror = () => reject(new Error('Failed to load Google Maps'));
          document.head.appendChild(script);
        }),
    )
    .catch((e) => {
      mapsLoadPromise = null;
      throw e;
    });
  return mapsLoadPromise;
}

export function AddressAutocomplete({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(value ? `${value.street}, ${value.suburb} ${value.postcode}` : '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let listener: google.maps.MapsEventListener | null = null;
    loadGoogleMaps()
      .then((g) => {
        if (!mounted || !inputRef.current) return;
        const ac = new g.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: 'au' },
          fields: ['address_components', 'geometry', 'formatted_address'],
          types: ['address'],
        });
        listener = ac.addListener('place_changed', () => {
          const place = ac.getPlace();
          const parsed = parsePlace(place);
          if (parsed) {
            onChange(parsed);
            setText(`${parsed.street}, ${parsed.suburb} ${parsed.postcode}`);
          }
        });
        setError(null);
      })
      .catch((e) => {
        if (mounted) setError((e as Error).message);
      });
    return () => {
      mounted = false;
      if (listener) listener.remove();
    };
  }, [onChange]);

  const showWarning = value && !VALID_POSTCODES.includes(value.postcode);

  return (
    <div>
      <Label htmlFor="address">Address</Label>
      <Input
        id="address"
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Start typing the street address"
        autoComplete="off"
      />
      {error && (
        <p className="mt-1 text-xs text-text-light">
          Address autocomplete unavailable. Continue typing — the entry will save without coordinates.
        </p>
      )}
      {showWarning && (
        <p className="mt-1 text-xs text-gold">
          Heads up: postcode {value.postcode} is outside the 4551 / 4575 area.
        </p>
      )}
    </div>
  );
}

function parsePlace(place: google.maps.places.PlaceResult): ParsedAddress | null {
  const components = place.address_components ?? [];
  const get = (type: string) => components.find((c) => c.types.includes(type));
  const streetNumber = get('street_number')?.long_name ?? '';
  const route = get('route')?.long_name ?? '';
  const suburb = get('locality')?.long_name ?? get('postal_town')?.long_name ?? '';
  const postcode = get('postal_code')?.long_name ?? '';
  const street = [streetNumber, route].filter(Boolean).join(' ').trim();
  if (!street || !suburb) return null;
  const lat = place.geometry?.location?.lat() ?? null;
  const lng = place.geometry?.location?.lng() ?? null;
  return { street, suburb, postcode, lat, lng };
}

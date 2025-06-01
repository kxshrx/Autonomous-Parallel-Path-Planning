'use client';

import { useState, useEffect } from 'react';
import { pathfinderAPI } from '@/lib/api';
import { usePathfinderStore } from '@/store/pathfinderStore';

export default function LocationInput({ type, placeholder }) {
  const [value, setValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { 
    setStartLocation, 
    setEndLocation, 
    startLocationText, 
    endLocationText 
  } = usePathfinderStore();

  // Update input value when store text changes
  useEffect(() => {
    const storeText = type === 'start' ? startLocationText : endLocationText;
    if (storeText && storeText !== value) {
      setValue(storeText);
    }
  }, [startLocationText, endLocationText, type, value]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!value.trim()) return;

    setIsLoading(true);
    try {
      const result = await pathfinderAPI.geocode(value);
      const location = { lat: result.lat, lng: result.lng };
      
      if (type === 'start') {
        setStartLocation(location, value); // Store both location and text
      } else {
        setEndLocation(location, value); // Store both location and text
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
      alert('Location not found. Please try a different search term.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setValue(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={isLoading}
        className="location-input"
      />
      <button
        type="submit"
        disabled={isLoading || !value.trim()}
        className="location-button"
      >
        {isLoading ? 'Searching...' : `Set ${type === 'start' ? 'Start' : 'End'}`}
      </button>
    </form>
  );
}

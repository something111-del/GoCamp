import React, { useState } from 'react';
import axios from 'axios';
import Map, { Marker } from 'react-map-gl';

const CampgroundForm = () => {
    const [form, setForm] = useState({ name: '', location: '', description: '', image: null });
    const [viewport, setViewport] = useState({ latitude: 37.7749, longitude: -122.4194, zoom: 8 });
    const [markerPosition, setMarkerPosition] = useState({ latitude: 37.7749, longitude: -122.4194 });
    const [showSuccess, setShowSuccess] = useState(false);
    const [clickAnimation, setClickAnimation] = useState(false);

    const handleChange = (e) => {
        if (e.target.name === 'image') setForm({ ...form, image: e.target.files[0] });
        else setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append('name', form.name);
        data.append('location', form.location);
        data.append('description', form.description);
        if (form.image) data.append('image', form.image);

        try {
            await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/campgrounds`, data);
            setShowSuccess(true);
            setForm({ name: '', location: '', description: '', image: null });
            setTimeout(() => setShowSuccess(false), 3000);
        } catch {
            alert('Error adding campground');
        }
    };

    const handleMapClick = (evt) => {
        const { lng, lat } = evt.lngLat;
        setForm({ ...form, location: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });
        setMarkerPosition({ latitude: lat, longitude: lng });
        setViewport({ ...viewport, latitude: lat, longitude: lng });

        // Trigger click animation
        setClickAnimation(true);
        setTimeout(() => setClickAnimation(false), 600);
    };

    return (
        <div className="card" style={{ position: 'relative' }}>
            {showSuccess && (
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '1rem 1.5rem',
                    borderRadius: '8px',
                    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                    animation: 'slideUp 0.5s ease-out',
                    zIndex: 1000,
                    fontWeight: '600'
                }}>
                    ✅ Campground added successfully!
                </div>
            )}

            <h2 style={{ marginBottom: '2rem' }}>Add New Campground</h2>
            <form onSubmit={handleSubmit}>
                <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Campground Name"
                    required
                />
                <div style={{ position: 'relative' }}>
                    <input
                        name="location"
                        value={form.location}
                        placeholder="📍 Click on map below to set location"
                        readOnly
                        required
                        style={{
                            background: form.location ? '#e8f5e9' : '#f5f5f5',
                            cursor: 'not-allowed',
                            color: form.location ? '#2e7d32' : '#999'
                        }}
                    />
                    {form.location && (
                        <span style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#2e7d32',
                            fontSize: '1.2rem'
                        }}>
                            ✓
                        </span>
                    )}
                </div>
                <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Description"
                    required
                    rows="4"
                />
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontWeight: '600',
                        color: '#667eea'
                    }}>
                        Upload Image
                    </label>
                    <input
                        type="file"
                        name="image"
                        onChange={handleChange}
                        accept="image/*"
                        style={{
                            padding: '0.5rem',
                            border: '2px dashed #667eea',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    />
                </div>
                <button type="submit" style={{ width: '100%', marginBottom: '2rem' }}>
                    Add Campground
                </button>
            </form>

            <div style={{
                marginTop: '2rem',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid #ddd',
                position: 'relative'
            }}>
                <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '1rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    justifyContent: 'space-between'
                }}>
                    <span>📍 Click anywhere on the map to pin your campground location</span>
                    {form.location && (
                        <span style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '4px',
                            fontSize: '0.85rem'
                        }}>
                            Location Set ✓
                        </span>
                    )}
                </div>
                <Map
                    {...viewport}
                    onMove={(evt) => setViewport(evt.viewState)}
                    style={{ width: '100%', height: '400px', cursor: 'crosshair' }}
                    mapStyle="mapbox://styles/mapbox/streets-v11"
                    mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
                    onClick={handleMapClick}
                    transitionDuration={400}
                >
                    <Marker
                        latitude={markerPosition.latitude}
                        longitude={markerPosition.longitude}
                        color="#e74c3c"
                    >
                        <div
                            className={clickAnimation ? 'marker-pulse' : ''}
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: '#e74c3c',
                                border: '4px solid white',
                                boxShadow: '0 4px 16px rgba(231, 76, 60, 0.6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.5rem',
                                transition: 'all 0.3s ease',
                                transform: clickAnimation ? 'scale(1.3)' : 'scale(1)'
                            }}
                        >
                            📍
                        </div>
                    </Marker>
                </Map>
            </div>
        </div>
    );
};

export default CampgroundForm;

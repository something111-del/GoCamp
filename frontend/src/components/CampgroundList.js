import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Map, { Marker, Popup } from 'react-map-gl';
import { deleteCampground } from '../services/api';

const CampgroundList = () => {
    const [campgrounds, setCampgrounds] = useState([]);
    const [selectedCamp, setSelectedCamp] = useState(null);
    const [hoveredCamp, setHoveredCamp] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [viewport, setViewport] = useState({ latitude: 39.8283, longitude: -98.5795, zoom: 3 });
    const hoverTimeoutRef = useRef(null);
    const longPressTimerRef = useRef(null);

    useEffect(() => {
        fetchCampgrounds();
    }, []);

    const fetchCampgrounds = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/campgrounds`);
            setCampgrounds(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleMarkerMouseEnter = (camp, lat, lng) => {
        // Show popup on hover at any zoom level
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        setHoveredCamp({ ...camp, lat, lng });
    };

    const handleMarkerMouseLeave = () => {
        // Delay hiding to allow smooth transitions
        hoverTimeoutRef.current = setTimeout(() => {
            setHoveredCamp(null);
        }, 200);
    };

    const handlePopupMouseEnter = () => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };

    const handlePopupMouseLeave = () => {
        setHoveredCamp(null);
    };

    const handleMarkerMouseDown = (camp, lat, lng) => {
        // Start long-press timer (500ms)
        longPressTimerRef.current = setTimeout(() => {
            setDeleteConfirm({ ...camp, lat, lng });
        }, 500);
    };

    const handleMarkerMouseUp = () => {
        // Cancel long-press if mouse released before 500ms
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    };

    const handleDeleteCampground = async (id) => {
        try {
            await deleteCampground(id);
            setDeleteConfirm(null);
            setSelectedCamp(null);
            setHoveredCamp(null);
            // Refresh campgrounds list
            fetchCampgrounds();
        } catch (err) {
            console.error('Error deleting campground:', err);
            alert('Failed to delete campground');
        }
    };

    return (
        <div>
            <div className="map-container card" style={{ marginBottom: '2rem', height: '500px', padding: 0, overflow: 'hidden' }}>
                <Map
                    {...viewport}
                    onMove={(evt) => setViewport(evt.viewState)}
                    style={{ width: '100%', height: '100%' }}
                    mapStyle="mapbox://styles/mapbox/outdoors-v12"
                    mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
                    transitionDuration={400}
                >
                    {campgrounds.map(camp => {
                        const parts = camp.location.split(',');
                        let lat = 37.7749;
                        let lng = -122.4194;
                        if (parts.length === 2) {
                            const parsedLat = parseFloat(parts[0]);
                            const parsedLng = parseFloat(parts[1]);
                            if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
                                lat = parsedLat;
                                lng = parsedLng;
                            }
                        }

                        return (
                            <Marker
                                key={camp._id}
                                latitude={lat}
                                longitude={lng}
                                color="#e74c3c"
                                onClick={e => {
                                    e.originalEvent.stopPropagation();
                                    setSelectedCamp({ ...camp, lat, lng });
                                }}
                                style={{ cursor: 'pointer' }} // Removed transition to fix drift
                            >
                                <div
                                    onMouseEnter={() => handleMarkerMouseEnter(camp, lat, lng)}
                                    onMouseLeave={handleMarkerMouseLeave}
                                    onMouseDown={() => handleMarkerMouseDown(camp, lat, lng)}
                                    onMouseUp={handleMarkerMouseUp}
                                    style={{
                                        width: '3px', // Ultra-small marker
                                        height: '3px', // Ultra-small marker
                                        borderRadius: '50%',
                                        background: '#e74c3c',
                                        border: '0.5px solid white', // Minimal border
                                        boxShadow: '0 0.5px 2px rgba(231, 76, 60, 0.4)', // Minimal shadow
                                        cursor: 'pointer',
                                        transition: 'background 0.3s ease'
                                    }}
                                />
                            </Marker>
                        )
                    })}

                    {/* Hover Popup - shows on hover at any zoom level */}
                    {hoveredCamp && (
                        <Popup
                            latitude={hoveredCamp.lat}
                            longitude={hoveredCamp.lng}
                            closeButton={false}
                            closeOnClick={false}
                            offset={15}
                            className="hover-popup"
                        >
                            <div
                                onMouseEnter={handlePopupMouseEnter}
                                onMouseLeave={handlePopupMouseLeave}
                            >
                                {hoveredCamp.image && (
                                    <img
                                        src={hoveredCamp.image}
                                        alt={hoveredCamp.name}
                                        className="popup-image"
                                    />
                                )}
                                <div className="popup-content">
                                    <h4 className="popup-title">{hoveredCamp.name}</h4>
                                    <p className="popup-description">{hoveredCamp.description?.substring(0, 100)}...</p>
                                </div>
                            </div>
                        </Popup>
                    )}

                    {/* Click Popup - shows on click */}
                    {selectedCamp && (
                        <Popup
                            latitude={selectedCamp.lat}
                            longitude={selectedCamp.lng}
                            onClose={() => setSelectedCamp(null)}
                            offset={15}
                        >
                            <div>
                                {selectedCamp.image && (
                                    <img
                                        src={selectedCamp.image}
                                        alt={selectedCamp.name}
                                        className="popup-image"
                                    />
                                )}
                                <div className="popup-content">
                                    <h4 className="popup-title">{selectedCamp.name}</h4>
                                    <p className="popup-description">{selectedCamp.description}</p>
                                    <p style={{ color: '#999', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                                        📍 {selectedCamp.location}
                                    </p>
                                </div>
                            </div>
                        </Popup>
                    )}

                    {/* Delete Confirmation Popup - shows on long-press */}
                    {deleteConfirm && (
                        <Popup
                            latitude={deleteConfirm.lat}
                            longitude={deleteConfirm.lng}
                            onClose={() => setDeleteConfirm(null)}
                            offset={15}
                            closeOnClick={false}
                        >
                            <div style={{ padding: '0.5rem' }}>
                                <h4 style={{ margin: '0 0 1rem 0', color: '#e74c3c', fontSize: '1rem' }}>
                                    Delete Campground?
                                </h4>
                                <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#555' }}>
                                    Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
                                </p>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => handleDeleteCampground(deleteConfirm._id)}
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem',
                                            background: '#e74c3c',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        Delete
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(null)}
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem',
                                            background: '#ddd',
                                            color: '#333',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </Popup>
                    )}
                </Map>
            </div>

            <h2>Explore Campgrounds</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                {campgrounds.map((camp, index) => (
                    <div
                        key={camp._id}
                        className="card"
                        style={{
                            padding: 0,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            animationDelay: `${index * 0.1}s`
                        }}
                    >
                        {camp.image ? (
                            <img
                                src={camp.image}
                                alt={camp.name}
                                style={{
                                    width: '100%',
                                    height: '200px',
                                    objectFit: 'cover',
                                    transition: 'transform 0.4s ease'
                                }}
                                onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                            />
                        ) : (
                            <div style={{
                                width: '100%',
                                height: '200px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '1.2rem',
                                fontWeight: '600'
                            }}>
                                🏕️ {camp.name}
                            </div>
                        )}
                        <div style={{ padding: '1.5rem' }}>
                            <h3 style={{ marginTop: 0, color: '#667eea' }}>{camp.name}</h3>
                            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>📍 {camp.location}</p>
                            <p style={{ lineHeight: '1.6', color: '#555' }}>{camp.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CampgroundList;

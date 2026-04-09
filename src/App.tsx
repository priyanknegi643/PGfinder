import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  MapPin, 
  Home, 
  Star, 
  Navigation, 
  LogOut, 
  User as UserIcon, 
  Filter, 
  Plus, 
  ChevronRight,
  Info,
  TrendingDown,
  ShoppingBag,
  PlusSquare,
  X
} from 'lucide-react';
import { Accommodation, User, SearchFilters } from './types';
import { scoreAccommodations } from './services/accommodationService';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

const CAMPUS_COORDS = { lat: 30.3165, lon: 78.0322 };

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Component to update map center
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'auth' | 'dashboard' | 'search'>('auth');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [searchResults, setSearchResults] = useState<Accommodation[]>([]);
  const [selectedAccommodation, setSelectedAccommodation] = useState<Accommodation | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    radius: 5,
    type: 'PG',
    weights: {
      campus: 0.5,
      grocery: 0.3,
      hospital: 0.2
    }
  });

  useEffect(() => {
    if (user) {
      fetchAccommodations();
    }
  }, [user]);

  const fetchAccommodations = async () => {
    try {
      const res = await fetch('/api/accommodations');
      const data = await res.json();
      setAccommodations(data);
    } catch (err) {
      console.error("Failed to fetch", err);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = authMode === 'login' ? '/api/login' : '/api/signup';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        if (authMode === 'login') {
          setUser({ username: data.username });
          setView('dashboard');
        } else {
          setAuthMode('login');
          setError('Signup successful! Please login.');
        }
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  const handleSearch = () => {
    const filtered = accommodations.filter(acc => 
      acc.type === filters.type
    );
    
    const scored = scoreAccommodations(
      filtered, 
      CAMPUS_COORDS.lat, 
      CAMPUS_COORDS.lon, 
      filters.weights
    );

    // Filter by radius after scoring (distance is calculated during scoring)
    const finalResults = scored.filter(acc => (acc.distanceFromCampus || 0) <= filters.radius);
    setSearchResults(finalResults);
    setView('search');
  };

  if (view === 'auth') {
    return (
      <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white border border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        >
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-black flex items-center justify-center">
              <Home className="text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tighter uppercase italic">NestGrid</h1>
          </div>

          <h2 className="text-sm font-mono uppercase opacity-50 mb-6">{authMode} to continue</h2>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase mb-1">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-black p-3 focus:outline-none focus:bg-black focus:text-white transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-black p-3 focus:outline-none focus:bg-black focus:text-white transition-colors"
                required
              />
            </div>
            {error && <p className="text-xs font-mono text-red-600">{error}</p>}
            <button 
              type="submit"
              className="w-full bg-black text-white p-4 font-bold uppercase tracking-widest hover:bg-white hover:text-black border border-black transition-all"
            >
              {authMode === 'login' ? 'Enter System' : 'Register User'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-[11px] font-mono uppercase underline underline-offset-4 hover:opacity-70"
            >
              {authMode === 'login' ? 'Need an account? Signup' : 'Already registered? Login'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E4E3E0] font-sans text-black">
      {/* Navigation */}
      <nav className="border-b border-black bg-white p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('dashboard')}>
            <div className="w-8 h-8 bg-black flex items-center justify-center">
              <Home className="text-white w-5 h-5" />
            </div>
            <span className="font-bold uppercase italic tracking-tighter">NestGrid</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs font-mono uppercase">
              <UserIcon size={14} />
              <span>{user?.username}</span>
            </div>
            <button 
              onClick={() => setUser(null)}
              className="flex items-center gap-2 text-xs font-mono uppercase hover:opacity-50"
            >
              <LogOut size={14} />
              <span>Exit</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar / Filters */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-2 mb-6">
                <Filter size={18} />
                <h2 className="font-bold uppercase italic text-sm">Search Parameters</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-mono uppercase opacity-50 mb-2">Radius (km)</label>
                  <input 
                    type="range" min="1" max="20" step="0.5"
                    value={filters.radius}
                    onChange={(e) => setFilters({...filters, radius: parseFloat(e.target.value)})}
                    className="w-full accent-black"
                  />
                  <div className="flex justify-between text-[10px] font-mono mt-1">
                    <span>1km</span>
                    <span className="font-bold">{filters.radius}km</span>
                    <span>20km</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase opacity-50 mb-2">Accommodation Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['PG', 'Flat'].map(t => (
                      <button
                        key={t}
                        onClick={() => setFilters({...filters, type: t})}
                        className={`p-2 text-xs font-mono border border-black transition-all ${filters.type === t ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-black/10">
                  <label className="block text-[10px] font-mono uppercase opacity-50 mb-4">Weight Distribution (DSA Scoring)</label>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-[10px] font-mono mb-1">
                        <span>Campus Proximity</span>
                        <span>{Math.round(filters.weights.campus * 100)}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="1" step="0.1"
                        value={filters.weights.campus}
                        onChange={(e) => setFilters({...filters, weights: {...filters.weights, campus: parseFloat(e.target.value)}})}
                        className="w-full accent-black"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-mono mb-1">
                        <span>Grocery Access</span>
                        <span>{Math.round(filters.weights.grocery * 100)}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="1" step="0.1"
                        value={filters.weights.grocery}
                        onChange={(e) => setFilters({...filters, weights: {...filters.weights, grocery: parseFloat(e.target.value)}})}
                        className="w-full accent-black"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-mono mb-1">
                        <span>Medical Access</span>
                        <span>{Math.round(filters.weights.hospital * 100)}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="1" step="0.1"
                        value={filters.weights.hospital}
                        onChange={(e) => setFilters({...filters, weights: {...filters.weights, hospital: parseFloat(e.target.value)}})}
                        className="w-full accent-black"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSearch}
                  className="w-full bg-black text-white p-4 font-bold uppercase tracking-widest hover:bg-white hover:text-black border border-black transition-all flex items-center justify-center gap-2"
                >
                  <Search size={18} />
                  Run Algorithm
                </button>
              </div>
            </div>

            <div className="bg-black text-white p-6 border border-black">
              <div className="flex items-center gap-2 mb-4">
                <Info size={16} className="text-gray-400" />
                <h3 className="text-[10px] font-mono uppercase tracking-widest">System Info</h3>
              </div>
              <p className="text-xs leading-relaxed opacity-70">
                NestGrid uses a weighted scoring algorithm to rank accommodations. 
                Normalization is applied to distance values to ensure fair comparison across different metrics.
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {view === 'dashboard' ? (
                <motion.div 
                  key="dashboard"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-3xl font-bold uppercase italic tracking-tighter">Available Dataset</h2>
                      <p className="text-xs font-mono opacity-50 mt-1 uppercase">Total tracked units: {accommodations.length}</p>
                    </div>
                    <button className="bg-white border border-black px-4 py-2 text-xs font-mono uppercase hover:bg-black hover:text-white transition-all flex items-center gap-2">
                      <PlusSquare size={14} />
                      Add Entry
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {accommodations.map(acc => (
                      <div key={acc.id} className="bg-white border border-black p-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="text-[9px] font-mono uppercase bg-black text-white px-2 py-0.5 mb-2 inline-block">
                              {acc.type}
                            </span>
                            <h3 className="font-bold uppercase text-lg leading-none">{acc.name}</h3>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-mono opacity-50 uppercase">Rent</div>
                            <div className="font-bold">₹{acc.rent}</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 border-t border-black/10 pt-4">
                          <div className="flex items-center gap-2">
                            <Star size={14} className="text-yellow-500 fill-yellow-500" />
                            <span className="text-xs font-mono">{acc.rating}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="opacity-50" />
                            <span className="text-xs font-mono">{acc.lat.toFixed(2)}, {acc.lon.toFixed(2)}</span>
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => { setSelectedAccommodation(acc); setShowMap(true); }}
                          className="w-full mt-4 bg-white border border-black px-3 py-2 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                          <MapPin size={14} />
                          View on Map
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="search"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-3xl font-bold uppercase italic tracking-tighter">Ranked Results</h2>
                      <p className="text-xs font-mono opacity-50 mt-1 uppercase">
                        Algorithm matched {searchResults.length} units within {filters.radius}km
                      </p>
                    </div>
                    <button 
                      onClick={() => setView('dashboard')}
                      className="text-xs font-mono uppercase underline underline-offset-4 hover:opacity-50"
                    >
                      Back to Dataset
                    </button>
                  </div>

                  {searchResults.length === 0 ? (
                    <div className="bg-white border border-black p-12 text-center">
                      <p className="font-mono uppercase text-sm opacity-50">No matches found for current parameters.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {searchResults.map((acc, index) => (
                        <motion.div 
                          key={acc.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-white border border-black flex flex-col md:flex-row shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                        >
                          <div className="bg-black text-white p-6 flex flex-col items-center justify-center md:w-24 border-r border-black">
                            <span className="text-[10px] font-mono uppercase opacity-50 mb-1">Rank</span>
                            <span className="text-2xl font-bold italic">#{index + 1}</span>
                          </div>
                          
                          <div className="p-6 flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-[9px] font-mono uppercase border border-black px-2 py-0.5">
                                  {acc.type}
                                </span>
                                <span className="text-[9px] font-mono uppercase bg-green-100 text-green-800 px-2 py-0.5">
                                  Score: {acc.score?.toFixed(3)}
                                </span>
                              </div>
                              <h3 className="text-xl font-bold uppercase italic mb-4">{acc.name}</h3>
                              
                              <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                    <Navigation size={14} className="text-blue-600" />
                                  </div>
                                  <div>
                                    <div className="text-[9px] font-mono uppercase opacity-50">To Campus</div>
                                    <div className="text-xs font-bold">{acc.distanceFromCampus?.toFixed(2)} km</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                    <ShoppingBag size={14} className="text-orange-600" />
                                  </div>
                                  <div>
                                    <div className="text-[9px] font-mono uppercase opacity-50">Grocery</div>
                                    <div className="text-xs font-bold">{acc.groceryDist} km</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                    <TrendingDown size={14} className="text-red-600" />
                                  </div>
                                  <div>
                                    <div className="text-[9px] font-mono uppercase opacity-50">Medical</div>
                                    <div className="text-xs font-bold">{acc.hospitalDist} km</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                    <Star size={14} className="text-yellow-600" />
                                  </div>
                                  <div>
                                    <div className="text-[9px] font-mono uppercase opacity-50">Rating</div>
                                    <div className="text-xs font-bold">{acc.rating}/5.0</div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="border-t md:border-t-0 md:border-l border-black/10 pt-6 md:pt-0 md:pl-6 flex flex-col justify-between">
                              <div>
                                <div className="text-[10px] font-mono uppercase opacity-50 mb-1">Monthly Rent</div>
                                <div className="text-3xl font-bold tracking-tighter">₹{acc.rent}</div>
                              </div>
                              <button 
                                onClick={() => { setSelectedAccommodation(acc); setShowMap(true); }}
                                className="w-full bg-black text-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black border border-black transition-all mt-4 flex items-center justify-center gap-2"
                              >
                                <MapPin size={14} />
                                View on Map
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Map Modal */}
      {showMap && selectedAccommodation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowMap(false)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white border border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-4xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold uppercase italic">{selectedAccommodation.name}</h3>
                <p className="text-xs font-mono opacity-50 mt-1">
                  {selectedAccommodation.type} • ₹{selectedAccommodation.rent}/month
                </p>
              </div>
              <button 
                onClick={() => setShowMap(false)}
                className="p-2 hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="border border-black mb-4" style={{ height: '400px' }}>
              <MapContainer
                center={[selectedAccommodation.lat, selectedAccommodation.lon]}
                zoom={14}
                style={{ width: '100%', height: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MapUpdater center={[selectedAccommodation.lat, selectedAccommodation.lon]} />
                <Marker position={[selectedAccommodation.lat, selectedAccommodation.lon]}>
                  <Popup>
                    <div className="text-center">
                      <strong>{selectedAccommodation.name}</strong><br />
                      {selectedAccommodation.type}<br />
                      ₹{selectedAccommodation.rent}/month
                    </div>
                  </Popup>
                </Marker>
                {/* Campus Marker */}
                <Marker position={[CAMPUS_COORDS.lat, CAMPUS_COORDS.lon]}>
                  <Popup>
                    <div className="text-center">
                      <strong>Campus</strong><br />
                      Graphic Era University
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="border border-black p-3">
                <div className="text-[9px] font-mono uppercase opacity-50">Distance to Campus</div>
                <div className="font-bold">{selectedAccommodation.distanceFromCampus?.toFixed(2) || 'N/A'} km</div>
              </div>
              <div className="border border-black p-3">
                <div className="text-[9px] font-mono uppercase opacity-50">Grocery</div>
                <div className="font-bold">{selectedAccommodation.groceryDist} km</div>
              </div>
              <div className="border border-black p-3">
                <div className="text-[9px] font-mono uppercase opacity-50">Hospital</div>
                <div className="font-bold">{selectedAccommodation.hospitalDist} km</div>
              </div>
              <div className="border border-black p-3">
                <div className="text-[9px] font-mono uppercase opacity-50">Rating</div>
                <div className="font-bold">{selectedAccommodation.rating}/5.0</div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-black mt-12 p-8 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-black flex items-center justify-center">
              <Home className="text-white w-4 h-4" />
            </div>
            <span className="font-bold uppercase italic text-xs">NestGrid v1.0</span>
          </div>
          <p className="text-[10px] font-mono uppercase opacity-50">
            © 2026 Graphic Era University - Team NESTGRID (DAA-IV-T056)
          </p>
          <div className="flex gap-4">
            <span className="text-[10px] font-mono uppercase underline cursor-pointer">Documentation</span>
            <span className="text-[10px] font-mono uppercase underline cursor-pointer">Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

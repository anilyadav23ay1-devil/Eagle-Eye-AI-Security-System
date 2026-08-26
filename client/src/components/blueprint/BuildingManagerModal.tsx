import React, { useState } from 'react';
import { 
  X, Building2, Plus, Trash2, Layers, MapPin, 
  Check, AlertCircle, Edit3, Shield 
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';

interface BuildingManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BuildingManagerModal: React.FC<BuildingManagerModalProps> = ({ isOpen, onClose }) => {
  const { 
    buildings, createBuilding, deleteBuilding, addFloor, deleteFloor,
    activeBuilding, setActiveBuilding 
  } = useSecurity();

  const [activeTab, setActiveTab] = useState<'register' | 'manage'>('manage');

  // Register Building Form State
  const [bldgName, setBldgName] = useState<string>('Corporate Tower C');
  const [bldgCode, setBldgCode] = useState<string>('TWR-C');
  const [bldgAddress, setBldgAddress] = useState<string>('746 Evergreen Tech Campus, South Wing');
  const [totalFloors, setTotalFloors] = useState<number>(3);
  const [description, setDescription] = useState<string>('AI Research Labs & Data Infrastructure');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // New Floor Form State
  const [selectedBldgForFloor, setSelectedBldgForFloor] = useState<string>(buildings[0]?.id || 'bldg-tower-a');
  const [newFloorName, setNewFloorName] = useState<string>('Floor 5 - Rooftop Terrace');
  const [newFloorNumber, setNewFloorNumber] = useState<number>(5);

  if (!isOpen) return null;

  const handleRegisterBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createBuilding({
        name: bldgName,
        code: bldgCode,
        address: bldgAddress,
        total_floors: totalFloors,
        description
      });
      setIsSubmitting(false);
      setActiveTab('manage');
    } catch (e) {
      setIsSubmitting(false);
      alert('Error registering building.');
    }
  };

  const handleAddFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addFloor(selectedBldgForFloor, {
        floor_name: newFloorName,
        floor_number: newFloorNumber,
        building_id: selectedBldgForFloor
      });
      setNewFloorName(`Floor ${newFloorNumber + 1}`);
      setNewFloorNumber(newFloorNumber + 1);
    } catch (e) {
      alert('Error adding floor.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850/70">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Building & Facility Profile Manager</h2>
              <p className="text-xs text-slate-400 font-mono">
                Register corporate facilities, configure floor counts, and assign spatial zones
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-6 pt-4 border-b border-slate-800 flex space-x-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('manage')}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === 'manage' ? 'border-sky-400 text-sky-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Manage Facilities ({buildings.length})
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-1 ${
              activeTab === 'register' ? 'border-sky-400 text-sky-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> Register New Building
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'register' ? (
            /* Register New Building Form */
            <form onSubmit={handleRegisterBuilding} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Building Full Name</label>
                  <input
                    type="text"
                    required
                    value={bldgName}
                    onChange={(e) => setBldgName(e.target.value)}
                    placeholder="e.g. Corporate Tower C"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Building Code / Acronym</label>
                  <input
                    type="text"
                    required
                    value={bldgCode}
                    onChange={(e) => setBldgCode(e.target.value)}
                    placeholder="e.g. TWR-C or HUB-1"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Physical Address / Campus Zone</label>
                <input
                  type="text"
                  required
                  value={bldgAddress}
                  onChange={(e) => setBldgAddress(e.target.value)}
                  placeholder="e.g. 746 Evergreen Tech Campus"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Total Floors</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    required
                    value={totalFloors}
                    onChange={(e) => setTotalFloors(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Floors (1 to {totalFloors}) will be auto-generated</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Facility Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Primary AI Research Facility"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('manage')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-sky-500/25"
                >
                  {isSubmitting ? 'Registering...' : 'Register Building & Generate Floors'}
                </button>
              </div>
            </form>
          ) : (
            /* Manage Buildings & Floors View */
            <div className="space-y-6">
              {buildings.map((b) => (
                <div key={b.id} className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-extrabold text-sm text-white">{b.name}</h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          {b.code}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {b.floors.length} Floors Configured
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{b.address}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setActiveBuilding(b.name)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                          activeBuilding === b.name
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {activeBuilding === b.name ? 'Active Building' : 'Select Building'}
                      </button>

                      {buildings.length > 1 && (
                        <button
                          onClick={() => deleteBuilding(b.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                          title="Delete Building"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Floor Pills List */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Configured Floors & Blueprints:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {b.floors.map((fl) => (
                        <div
                          key={fl.id}
                          className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between group"
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-200">{fl.floor_name}</div>
                            <div className="text-[9px] font-mono text-slate-400">
                              {fl.rooms.length} Rooms • {fl.blueprint_type}
                            </div>
                          </div>
                          {b.floors.length > 1 && (
                            <button
                              onClick={() => deleteFloor(b.id, fl.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-opacity"
                              title="Delete Floor"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* Add New Floor Form Strip */}
              <form onSubmit={handleAddFloor} className="p-4 rounded-2xl bg-slate-850/60 border border-slate-700 space-y-3">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-sky-400" />
                  <span>Add Additional Floor Level to Existing Facility</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Target Building</label>
                    <select
                      value={selectedBldgForFloor}
                      onChange={(e) => setSelectedBldgForFloor(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-medium"
                    >
                      {buildings.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Floor Display Name</label>
                    <input
                      type="text"
                      required
                      value={newFloorName}
                      onChange={(e) => setNewFloorName(e.target.value)}
                      placeholder="e.g. Floor 5"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md"
                    >
                      Add Floor Level
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

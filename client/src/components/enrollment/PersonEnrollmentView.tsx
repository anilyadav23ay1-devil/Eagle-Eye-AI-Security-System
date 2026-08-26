import React, { useState } from 'react';
import { 
  UserPlus, UserCheck, Shield, Camera, Check, Clock, 
  Calendar, MapPin, QrCode, Sparkles, Search, Filter, Trash2, 
  ShieldCheck, AlertTriangle, Eye, ArrowRight, Download 
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import { PersonRole, Person } from '../../types';

export const PersonEnrollmentView: React.FC = () => {
  const { 
    persons, enrollPerson, activeBuilding, activeFloor,
    unknownDetectionData, triggerUnknownPersonPrompt 
  } = useSecurity();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  // Form State
  const [name, setName] = useState<string>('');
  const [mobile, setMobile] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [idProofType, setIdProofType] = useState<string>('Aadhaar Card');
  const [idProofNumber, setIdProofNumber] = useState<string>('');
  const [role, setRole] = useState<PersonRole>('Visitor');
  const [permissionType, setPermissionType] = useState<string>('Temporary (24 Hours)');
  const [validFrom, setValidFrom] = useState<string>(new Date().toISOString().slice(0, 10));
  const [validTo, setValidTo] = useState<string>(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [allowedZones, setAllowedZones] = useState<string[]>([
    'Floor 1 - Reception',
    'Floor 2 - Meeting Room',
    'Floor 2 - Office 201'
  ]);
  const [notes, setNotes] = useState<string>('Visitor pass requested for corporate meeting.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [generatedPass, setGeneratedPass] = useState<any>(null);

  const availableZones = [
    'Floor 1 - Reception',
    'Floor 2 - Meeting Room',
    'Floor 2 - Office 201',
    'Floor 2 - Office 202',
    'Floor 2 - Corridor',
    'Floor 2 - Server Room (Restricted)',
    'Floor 3 - Executive Suites',
    'Floor 4 - Telecom Vault (Restricted)',
  ];

  const toggleZone = (zone: string) => {
    if (allowedZones.includes(zone)) {
      setAllowedZones(allowedZones.filter(z => z !== zone));
    } else {
      setAllowedZones([...allowedZones, zone]);
    }
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !mobile) return;
    setIsSubmitting(true);

    const payload = {
      name,
      mobile,
      email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      id_proof_type: idProofType,
      id_proof_number: idProofNumber || `ID-${Math.floor(100000 + Math.random() * 900000)}`,
      role,
      permission_type: permissionType,
      valid_from: validFrom,
      valid_to: validTo,
      allowed_zones: allowedZones,
      photo_url: unknownDetectionData?.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face',
      notes,
      temporary_track_id: unknownDetectionData?.trackId
    };

    const newPerson = await enrollPerson(payload);
    setIsSubmitting(false);
    setGeneratedPass(newPerson || payload);

    // Reset Form
    setName('');
    setMobile('');
    setEmail('');
    setIdProofNumber('');
  };

  const filteredPersons = persons.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.person_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.mobile?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || p.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <span>Person Enrollment & Access Pass Clearance</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                {persons.length} Enrolled Personnel
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Biometric face enrollment • QR digital badges • Whitelisted floor access
            </p>
          </div>
        </div>

        <button
          onClick={() => triggerUnknownPersonPrompt()}
          className="px-3.5 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Simulate Optical Capture Prompt</span>
        </button>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Enrollment Form */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-sky-400" />
                <span>Register New Personnel / Visitor</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">Security Clearance Gate #1</span>
            </div>

            {/* Photo Capture Avatar Preview */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center space-x-4">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-purple-500 shadow-md">
                <img
                  src={unknownDetectionData?.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face'}
                  alt="Captured face crop"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0 inset-x-0 bg-purple-600/90 text-[8px] font-mono text-center text-white py-0.5">
                  FACE CROP
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                    {unknownDetectionData?.trackId || 'TRK-2025-001088'}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">512-D Biometric Embedding Ready</span>
                </div>
                <p className="text-xs text-slate-400">
                  Detected via Optical AI. Enter credentials to issue an authorized digital badge.
                </p>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleEnrollSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. sarah@enterprise.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Role / Classification</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as PersonRole)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-medium"
                  >
                    <option value="Visitor">Visitor</option>
                    <option value="Employee">Employee</option>
                    <option value="Contractor">Contractor</option>
                    <option value="VIP">VIP</option>
                    <option value="Vendor">Vendor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">ID Proof Type</label>
                  <select
                    value={idProofType}
                    onChange={(e) => setIdProofType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-medium"
                  >
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Corporate ID">Corporate Employee ID</option>
                    <option value="Govt ID">Govt Official ID</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">ID Proof Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 4589 1234 9876"
                    value={idProofNumber}
                    onChange={(e) => setIdProofNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono font-medium"
                  />
                </div>
              </div>

              {/* Clearance Zones Multi-Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Allowed Clearance Zones ({allowedZones.length} Selected)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableZones.map(zone => {
                    const isSelected = allowedZones.includes(zone);
                    const isRestricted = zone.includes('Restricted');
                    return (
                      <button
                        type="button"
                        key={zone}
                        onClick={() => toggleZone(zone)}
                        className={`p-2 rounded-xl text-left text-xs border transition-all flex items-center justify-between ${
                          isSelected
                            ? isRestricted
                              ? 'bg-amber-950/60 border-amber-600 text-amber-300'
                              : 'bg-sky-950/60 border-sky-500 text-sky-300'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="truncate pr-1">{zone}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Purpose / Guard Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-2 transition-all"
              >
                <UserCheck className="w-4 h-4" />
                <span>{isSubmitting ? 'Enrolling & Syncing...' : 'Complete Enrollment & Generate Access Pass'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Active Enrolled Roster & Badge Pass Output */}
        <div className="lg:col-span-5 space-y-4">
          {/* Generated Digital Badge Card (if just enrolled) */}
          {generatedPass && (
            <div className="glass-panel rounded-2xl p-5 border border-emerald-500/50 bg-emerald-950/20 space-y-4 shadow-xl shadow-emerald-950/30 animate-fade-in">
              <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold text-xs text-emerald-300">DIGITAL ACCESS CLEARANCE PASS</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900 text-emerald-300 font-bold">
                  ACTIVE PASS
                </span>
              </div>

              <div className="flex items-center space-x-4">
                <img
                  src={generatedPass.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face'}
                  alt={generatedPass.name}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-400 shadow-md"
                />
                <div className="space-y-0.5">
                  <h4 className="font-extrabold text-sm text-white">{generatedPass.name}</h4>
                  <div className="text-[10px] font-mono text-slate-300">
                    ID: <strong className="text-sky-400">{generatedPass.person_id || 'P-10088'}</strong> • Role: <strong className="text-emerald-400">{generatedPass.role}</strong>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Track: {generatedPass.track_id || 'TRK-2025-001088'}
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-400 font-mono">
                  <span>Authorized Zones:</span>
                  <span className="text-slate-200 font-semibold">{generatedPass.allowed_zones?.length || 3} Floors/Rooms</span>
                </div>
                <div className="flex justify-between text-slate-400 font-mono">
                  <span>Validity:</span>
                  <span className="text-emerald-400 font-bold">Pass Active (24h)</span>
                </div>
              </div>
            </div>
          )}

          {/* Enrolled Personnel Directory */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">Enrolled Personnel Directory</h3>
              <span className="text-xs font-mono text-sky-400 font-bold">{filteredPersons.length} Registered</span>
            </div>

            {/* Filter and Search */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by name, ID, phone..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 font-medium"
                />
              </div>

              <div className="flex items-center space-x-1.5 text-[11px] overflow-x-auto pb-1">
                {['all', 'Visitor', 'Employee', 'Contractor', 'VIP'].map(r => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      roleFilter === r
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Directory Cards List */}
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {filteredPersons.map(p => (
                <div
                  key={p.person_id}
                  className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={p.photo_url}
                      alt={p.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                    />
                    <div>
                      <h4 className="font-semibold text-xs text-white">{p.name}</h4>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {p.person_id} • <span className="text-emerald-400">{p.status}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-purple-300 border border-purple-800/40">
                    {p.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

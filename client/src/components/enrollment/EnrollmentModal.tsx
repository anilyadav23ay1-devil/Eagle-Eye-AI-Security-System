import React, { useState } from 'react';
import { 
  X, UserCheck, Shield, Camera, Check, Clock, 
  Calendar, MapPin, QrCode, Sparkles 
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import { PersonRole } from '../../types';

export const EnrollmentModal: React.FC = () => {
  const { isEnrollModalOpen, setIsEnrollModalOpen, enrollPerson, unknownDetectionData } = useSecurity();

  const [name, setName] = useState<string>('Rahul Verma');
  const [mobile, setMobile] = useState<string>('9876543210');
  const [email, setEmail] = useState<string>('rahul.verma@email.com');
  const [idProofType, setIdProofType] = useState<string>('Aadhaar Card');
  const [idProofNumber, setIdProofNumber] = useState<string>('1234 5678 9012');
  const [role, setRole] = useState<PersonRole>('Visitor');
  const [permissionType, setPermissionType] = useState<string>('Temporary');
  const [validFrom, setValidFrom] = useState<string>('2025-08-24 10:00 AM');
  const [validTo, setValidTo] = useState<string>('2025-08-24 06:00 PM');
  const [allowedZones, setAllowedZones] = useState<string[]>([
    'Floor 1 - Reception',
    'Floor 2 - Meeting Room',
    'Floor 2 - Office 201'
  ]);
  const [notes, setNotes] = useState<string>('Client Demo & Executive Briefing');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [generatedPass, setGeneratedPass] = useState<any>(null);

  if (!isEnrollModalOpen) return null;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      name,
      mobile,
      email,
      id_proof_type: idProofType,
      id_proof_number: idProofNumber,
      role,
      permission_type: permissionType,
      valid_from: validFrom,
      valid_to: validTo,
      allowed_zones: allowedZones,
      photo_url: unknownDetectionData?.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
      notes,
      temporary_track_id: unknownDetectionData?.trackId
    };

    await enrollPerson(payload);
    setIsSubmitting(false);
    setGeneratedPass(payload);
  };

  const handleClose = () => {
    setGeneratedPass(null);
    setIsEnrollModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850/70">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">
                {generatedPass ? 'Visitor Authorization Complete' : 'New Person Registration & Enrollment'}
              </h2>
              <p className="text-xs text-slate-400">First-Time Entry Access Clearance Engine</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {!generatedPass ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Photo & Biometric Card */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-purple-500/30 flex items-center space-x-5 shadow-lg">
                <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-purple-400/80 shadow-xl bg-slate-950 flex-shrink-0">
                  <img
                    src={unknownDetectionData?.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face'}
                    alt="Captured clear portrait"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-0 inset-x-0 bg-purple-600/90 backdrop-blur-sm text-[9px] font-mono text-center text-white py-0.5 tracking-wider">
                    HD PORTRAIT
                  </span>
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-purple-950/80 text-purple-300 border border-purple-700/60">
                      {unknownDetectionData?.trackId || 'TRK-2025-000123'}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      512-D ArcFace Biometrics
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Clear optical portrait captured from live hardware feed. Assign official clearance, visitor badge, and security authorization.
                  </p>
                </div>
              </div>

              {/* Personal Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 font-medium"
                    placeholder="e.g. Rahul Sharma"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 font-medium font-mono"
                    placeholder="e.g. 9876543210"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 font-medium"
                    placeholder="e.g. rahul@company.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Role / Classification</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as PersonRole)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 font-medium"
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
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 font-medium"
                  >
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="Govt ID">Govt Official ID</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">ID Proof Number</label>
                  <input
                    type="text"
                    required
                    value={idProofNumber}
                    onChange={(e) => setIdProofNumber(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 font-mono"
                    placeholder="e.g. 1234 5678 9012"
                  />
                </div>
              </div>

              {/* Validity Timing */}
              <div className="grid grid-cols-2 gap-4 p-3 rounded-2xl bg-slate-800/30 border border-slate-700/60">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" /> Valid From
                  </label>
                  <input
                    type="text"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-red-400" /> Valid To (Auto-Expiry)
                  </label>
                  <input
                    type="text"
                    value={validTo}
                    onChange={(e) => setValidTo(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Allowed Clearance Zones Multi-Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Authorized Zones & Floor Access (Click to Toggle)
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableZones.map((zone) => {
                    const isSelected = allowedZones.includes(zone);
                    const isRestricted = zone.includes('Restricted');

                    return (
                      <button
                        type="button"
                        key={zone}
                        onClick={() => toggleZone(zone)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 transition-all ${
                          isSelected
                            ? isRestricted 
                              ? 'bg-red-950 text-red-300 border-red-500 shadow-sm' 
                              : 'bg-sky-500 text-white border-sky-400 shadow-sm shadow-sky-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        <span>{zone}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-sky-500/25 flex items-center space-x-2 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSubmitting ? 'Generating Track Token...' : 'Save & Authorize Access'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Digital Visitor Pass Generation View */
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <Check className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">Access Successfully Authorized</h3>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Biometric Track Token & Spatial Permissions Issued
                </p>
              </div>

              {/* Digital Pass Card */}
              <div className="max-w-md mx-auto p-5 rounded-2xl bg-gradient-to-br from-slate-850 to-slate-900 border border-sky-500/50 shadow-2xl text-left space-y-4">
                <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-3">
                    <img
                      src={generatedPass.photo_url}
                      alt={generatedPass.name}
                      className="w-12 h-12 rounded-xl object-cover border-2 border-sky-400"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-white">{generatedPass.name}</h4>
                      <p className="text-xs text-slate-400 font-mono">{generatedPass.mobile}</p>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/40">
                      {generatedPass.role}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 text-[10px]">TRACK TOKEN:</span>
                    <p className="font-bold text-sky-400">{generatedPass.temporary_track_id || 'TRK-2025-000123'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px]">VALID UNTIL:</span>
                    <p className="font-bold text-slate-200">{generatedPass.valid_to}</p>
                  </div>
                </div>

                <div className="text-xs">
                  <span className="text-slate-500 text-[10px] font-mono">PERMITTED ZONES:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {generatedPass.allowed_zones.map((z: string) => (
                      <span key={z} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        {z}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/30"
              >
                Close & Return to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

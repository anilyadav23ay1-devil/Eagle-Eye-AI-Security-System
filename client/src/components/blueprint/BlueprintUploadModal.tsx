import React, { useState } from 'react';
import { 
  X, UploadCloud, FileImage, FileText, Check, 
  AlertCircle, Sparkles, RefreshCw, Eye 
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';

interface BlueprintUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: (blueprintUrl: string) => void;
}

export const BlueprintUploadModal: React.FC<BlueprintUploadModalProps> = ({ 
  isOpen, onClose, onUploadComplete 
}) => {
  const { buildings, activeBuilding, activeFloor, uploadBlueprint, saveBlueprint } = useSecurity();

  const [selectedBuildingName, setSelectedBuildingName] = useState<string>(activeBuilding);
  const [selectedFloorName, setSelectedFloorName] = useState<string>(activeFloor);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentBldg = buildings.find(b => b.name === selectedBuildingName) || buildings[0];
  const currentFloors = currentBldg?.floors || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      // Create preview
      if (file.type.includes('image')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setPreviewUrl(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        // PDF placeholder
        setPreviewUrl('PDF_DOC');
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const res = await uploadBlueprint(selectedFile, selectedBuildingName, selectedFloorName);
      if (res.success && res.blueprint_url) {
        // Persist to floor
        await saveBlueprint({
          building_id: selectedBuildingName,
          floor_id: selectedFloorName,
          blueprint_url: res.blueprint_url,
          blueprint_type: res.file_type === 'PDF' ? 'PDF' : 'Image',
          shapes: [],
          rooms: []
        });

        if (onUploadComplete) onUploadComplete(res.blueprint_url);
        setIsUploading(false);
        onClose();
      }
    } catch (e) {
      setIsUploading(false);
      alert('Failed to upload blueprint. Please check file format.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850/70">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Upload Architectural Blueprint</h2>
              <p className="text-xs text-slate-400 font-mono">
                Supports PDF CAD drawings, High-Res PNG, JPG, SVG, and WebP
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

        {/* Modal Form */}
        <form onSubmit={handleUpload} className="p-6 space-y-4">
          {/* Target Building and Floor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Facility</label>
              <select
                value={selectedBuildingName}
                onChange={(e) => setSelectedBuildingName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium"
              >
                {buildings.map(b => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Floor Level</label>
              <select
                value={selectedFloorName}
                onChange={(e) => setSelectedFloorName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium"
              >
                {currentFloors.map(fl => (
                  <option key={fl.id} value={fl.floor_name}>{fl.floor_name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* File Dropzone Area */}
          <div className="p-6 rounded-2xl border-2 border-dashed border-slate-700 hover:border-purple-500/60 bg-slate-850/40 text-center space-y-3 transition-colors relative cursor-pointer">
            <input
              type="file"
              required
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />

            {!selectedFile ? (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white">Click or drag & drop blueprint file</span>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono">PDF, PNG, JPG, or SVG up to 25MB</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 flex flex-col items-center">
                {previewUrl && previewUrl !== 'PDF_DOC' ? (
                  <div className="relative w-40 h-24 rounded-xl overflow-hidden border border-slate-600 shadow-md">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <span className="text-xs font-bold text-white">{selectedFile.name}</span>
                  <p className="text-[10px] text-emerald-400 font-mono font-bold">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Ready to Ingest
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/25 flex items-center space-x-1.5 transition-all disabled:opacity-50"
            >
              {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
              <span>{isUploading ? 'Uploading...' : 'Ingest & Apply Blueprint'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

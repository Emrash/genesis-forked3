import React, { useState } from 'react';
import { X, Save, Trash2, Clock, Timer } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { HolographicButton } from '../HolographicButton';
import { DelayNodeData } from '../../../types/canvas';

interface DelayConfigProps {
  data: DelayNodeData;
  onUpdate: (nodeId: string, data: Partial<DelayNodeData>) => void;
  onDelete: (nodeId: string) => void;
  nodeId: string;
  onClose: () => void;
}

export function DelayConfig({ data, onUpdate, onDelete, nodeId, onClose }: DelayConfigProps) {
  const [formData, setFormData] = useState<{
    label: string;
    description: string;
    delayType: string;
    duration: string;
  }>({
    label: data.label,
    description: data.description,
    delayType: data.delayType,
    duration: data.duration
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(nodeId, {
      label: formData.label,
      description: formData.description,
      delayType: formData.delayType as DelayNodeData['delayType'],
      duration: formData.duration,
    });
    onClose();
  };

  return (
    <GlassCard variant="medium" className="w-96 p-6 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Configure Delay</h3>
        <button 
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-white text-sm">Delay Name</label>
          <input
            type="text"
            name="label"
            value={formData.label}
            onChange={handleChange}
            className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-white text-sm">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-white text-sm">Delay Type</label>
          <select
            name="delayType"
            value={formData.delayType}
            onChange={handleChange}
            className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="fixed">Fixed Delay</option>
            <option value="dynamic">Dynamic Delay</option>
            <option value="conditional">Conditional Delay</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="text-white text-sm">Duration</label>
          <input
            type="text"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            placeholder="5s, 2m, 1h"
            className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            required
          />
          <p className="text-xs text-gray-400">
            Format: number + unit (e.g., 5s, 2m, 1h)
          </p>
        </div>

        <div className="flex justify-between pt-4 border-t border-white/10">
          <HolographicButton
            type="button"
            onClick={() => onDelete(nodeId)}
            variant="outline"
            className="text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </HolographicButton>
          
          <HolographicButton type="submit" variant="primary" glow>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </HolographicButton>
        </div>
      </form>
    </GlassCard>
  );
}
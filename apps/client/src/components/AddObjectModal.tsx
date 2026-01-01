import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { Character, Location } from '@perpetu-ai/models';

interface AddObjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ObjectType = 'character' | 'location';

/**
 * Modal for adding new characters or locations to the game
 */
export const AddObjectModal: React.FC<AddObjectModalProps> = ({ isOpen, onClose }) => {
  const { addCharacter, addLocation, world } = useGameStore();
  const [objectType, setObjectType] = useState<ObjectType>('character');
  const [formData, setFormData] = useState<Record<string, any>>({});

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const now = Date.now();
    const API_BASE = 'http://localhost:3000/api';

    // Check if world exists
    if (!world || !world.id) {
      alert('No world selected. Please select or create a world first.');
      return;
    }

    try {
      if (objectType === 'character') {
        // Create new character
        const newCharacter: Character = {
          id: `char-${now}-${Math.random().toString(36).substr(2, 9)}`,
          name: formData.name || 'Unnamed Character',
          description: formData.description || '',
          advancementTier: formData.advancementTier || 'Foundation',
          madraCore: {
            nature: formData.madraCore || 'Pure',
            currentMadra: parseInt(formData.currentMadra) || 100,
            maxMadra: parseInt(formData.maxMadra) || 100,
            tier: formData.advancementTier || 'Foundation',
          },
          stats: {
            strength: parseInt(formData.strength) || 10,
            dexterity: parseInt(formData.dexterity) || 10,
            constitution: parseInt(formData.constitution) || 10,
            intelligence: parseInt(formData.intelligence) || 10,
            wisdom: parseInt(formData.wisdom) || 10,
            charisma: parseInt(formData.charisma) || 10,
            maxHp: parseInt(formData.maxHp) || 30,
            currentHp: parseInt(formData.currentHp) || 30,
            armorClass: parseInt(formData.armorClass) || 10,
            initiative: parseInt(formData.initiative) || 0,
            tierBonus: 0,
          },
          position: {
            x: parseFloat(formData.positionX) || 50,
            y: parseFloat(formData.positionY) || 50,
          },
          activity: formData.activity || 'idle',
          currentGoal: formData.currentGoal || '',
          timeline: [],
          faction: formData.faction || '',
          inventory: [],
          techniques: [],
          isPlayerCharacter: false,
          isInPlayerParty: formData.isInPlayerParty === 'true',
          discoveredByPlayer: true,
          createdAt: now,
          lastUpdated: now,
        };

        // Save to backend
        const response = await fetch(`${API_BASE}/worlds/${world.id}/characters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCharacter),
        });

        if (!response.ok) {
          throw new Error('Failed to create character');
        }

        // Update local state
        addCharacter(newCharacter);
      } else {
        // Create new location
        const newLocation: Location = {
          id: `loc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: formData.name || 'Unnamed Location',
          description: formData.description || '',
          position: {
            x: parseFloat(formData.positionX) || 50,
            y: parseFloat(formData.positionY) || 50,
          },
          type: formData.type || 'other',
          discoveredByPlayer: true,
          faction: formData.faction || undefined,
        };

        // Save to backend
        const response = await fetch(`${API_BASE}/worlds/${world.id}/locations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newLocation),
        });

        if (!response.ok) {
          throw new Error('Failed to create location');
        }

        // Update local state
        addLocation(newLocation);
      }

      // Reset form and close
      setFormData({});
      onClose();
    } catch (error) {
      console.error('Create error:', error);
      alert('Failed to create object');
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-panel-bg border-2 border-panel-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-accent">Add New Object</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-accent transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Object Type Selection */}
          <div>
            <label className="block text-sm font-semibold mb-2">Object Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setObjectType('character')}
                className={`flex-1 py-2 px-4 rounded transition-colors ${
                  objectType === 'character'
                    ? 'bg-accent text-white'
                    : 'bg-panel-border text-text-secondary hover:bg-opacity-70'
                }`}
              >
                Character
              </button>
              <button
                type="button"
                onClick={() => setObjectType('location')}
                className={`flex-1 py-2 px-4 rounded transition-colors ${
                  objectType === 'location'
                    ? 'bg-accent text-white'
                    : 'bg-panel-border text-text-secondary hover:bg-opacity-70'
                }`}
              >
                Location
              </button>
            </div>
          </div>

          {/* Common Fields */}
          <div>
            <label className="block text-sm font-semibold mb-1">Name *</label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 bg-panel-border border border-panel-border rounded focus:border-accent focus:outline-none"
              placeholder="Enter name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 bg-panel-border border border-panel-border rounded focus:border-accent focus:outline-none resize-none"
              placeholder="Enter description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Position X *</label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.positionX || ''}
                onChange={(e) => handleInputChange('positionX', e.target.value)}
                className="w-full px-3 py-2 bg-panel-border border border-panel-border rounded focus:border-accent focus:outline-none"
                placeholder="50.0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Position Y *</label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.positionY || ''}
                onChange={(e) => handleInputChange('positionY', e.target.value)}
                className="w-full px-3 py-2 bg-panel-border border border-panel-border rounded focus:border-accent focus:outline-none"
                placeholder="50.0"
              />
            </div>
          </div>

          {/* Character-Specific Fields */}
          {objectType === 'character' && (
            <>
              <div>
                <label className="block text-sm font-semibold mb-1">Advancement Tier</label>
                <select
                  value={formData.advancementTier || 'Foundation'}
                  onChange={(e) => handleInputChange('advancementTier', e.target.value)}
                  className="w-full px-3 py-2 bg-panel-border border border-panel-border rounded focus:border-accent focus:outline-none"
                >
                  <option value="Foundation">Foundation</option>
                  <option value="Iron">Iron</option>
                  <option value="Jade">Jade</option>
                  <option value="LowGold">Low Gold</option>
                  <option value="HighGold">High Gold</option>
                  <option value="TrueGold">True Gold</option>
                  <option value="Underlord">Underlord</option>
                  <option value="Overlord">Overlord</option>
                  <option value="Archlord">Archlord</option>
                  <option value="Herald">Herald</option>
                  <option value="Sage">Sage</option>
                  <option value="Monarch">Monarch</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Madra Nature</label>
                <input
                  type="text"
                  value={formData.madraCore || ''}
                  onChange={(e) => handleInputChange('madraCore', e.target.value)}
                  className="w-full px-3 py-2 bg-panel-border border border-panel-border rounded focus:border-accent focus:outline-none"
                  placeholder="Pure, Fire, Water, Earth, etc."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Current HP</label>
                  <input
                    type="number"
                    value={formData.currentHp || ''}
                    onChange={(e) => handleInputChange('currentHp', e.target.value)}
                    className="w-full px-3 py-2 bg-panel-border border border-panel-border rounded focus:border-accent focus:outline-none"
                    placeholder="30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Max HP</label>
                  <input
                    type="number"
                    value={formData.maxHp || ''}
                    onChange={(e) => handleInputChange('maxHp', e.target.value)}
                    className="w-full px-3 py-2 bg-panel-border border border-panel-border rounded focus:border-accent focus:outline-none"
                    placeholder="30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">AC</label>
                  <input
                    type="number"
                    value={formData.armorClass || ''}
                    onChange={(e) => handleInputChange('armorClass', e.target.value)}
                    className="w-full px-3 py-2 bg-panel-border border border-panel-border rounded focus:border-accent focus:outline-none"
                    placeholder="10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Add to Party</label>
                <select
                  value={formData.isInPlayerParty || 'false'}
                  onChange={(e) => handleInputChange('isInPlayerParty', e.target.value)}
                  className="w-full px-3 py-2 bg-panel-border border border-panel-border rounded focus:border-accent focus:outline-none"
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
            </>
          )}

          {/* Location-Specific Fields */}
          {objectType === 'location' && (
            <div>
              <label className="block text-sm font-semibold mb-1">Location Type</label>
              <select
                value={formData.type || 'other'}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full px-3 py-2 bg-panel-border border border-panel-border rounded focus:border-accent focus:outline-none"
              >
                <option value="city">City</option>
                <option value="town">Town</option>
                <option value="dungeon">Dungeon</option>
                <option value="landmark">Landmark</option>
                <option value="wilderness">Wilderness</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}

          {/* Faction (common) */}
          <div>
            <label className="block text-sm font-semibold mb-1">Faction (Optional)</label>
            <input
              type="text"
              value={formData.faction || ''}
              onChange={(e) => handleInputChange('faction', e.target.value)}
              className="w-full px-3 py-2 bg-panel-border border border-panel-border rounded focus:border-accent focus:outline-none"
              placeholder="Enter faction name"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 bg-panel-border text-text-secondary rounded hover:bg-opacity-70 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-accent text-white rounded hover:bg-accent-dark transition-colors"
            >
              Create {objectType === 'character' ? 'Character' : 'Location'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

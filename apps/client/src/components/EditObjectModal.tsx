import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import type { Character, Location } from '@perpetu-ai/models';

interface EditObjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  object: Character | Location | null;
  objectType: 'character' | 'location';
}

/**
 * Modal for editing characters or locations
 */
export const EditObjectModal: React.FC<EditObjectModalProps> = ({
  isOpen,
  onClose,
  object,
  objectType,
}) => {
  const { updateCharacter, updateLocation, world } = useGameStore();
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (object && isOpen) {
      if (objectType === 'character') {
        const char = object as Character;
        setFormData({
          name: char.name,
          description: char.description || '',
          positionX: char.position.x,
          positionY: char.position.y,
          advancementTier: char.advancementTier,
          madraCore: char.madraCore.nature,
          currentMadra: char.madraCore.currentMadra,
          maxMadra: char.madraCore.maxMadra,
          strength: char.stats.strength,
          dexterity: char.stats.dexterity,
          constitution: char.stats.constitution,
          intelligence: char.stats.intelligence,
          wisdom: char.stats.wisdom,
          charisma: char.stats.charisma,
          maxHp: char.stats.maxHp,
          currentHp: char.stats.currentHp,
          armorClass: char.stats.armorClass,
          initiative: char.stats.initiative,
          activity: char.activity,
          currentGoal: char.currentGoal || '',
          faction: char.faction || '',
          isInPlayerParty: char.isInPlayerParty ? 'true' : 'false',
        });
      } else {
        const loc = object as Location;
        setFormData({
          name: loc.name,
          description: loc.description,
          positionX: loc.position.x,
          positionY: loc.position.y,
          type: loc.type,
          faction: loc.faction || '',
        });
      }
    }
  }, [object, isOpen, objectType]);

  if (!isOpen || !object) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const API_BASE = 'http://localhost:3000/api';

    try {
      if (objectType === 'character') {
        const character = object as Character;
        const updates: Partial<Character> = {
          name: formData.name,
          description: formData.description,
          position: {
            x: parseFloat(formData.positionX),
            y: parseFloat(formData.positionY),
          },
          advancementTier: formData.advancementTier,
          madraCore: {
            ...character.madraCore,
            nature: formData.madraCore,
            currentMadra: parseInt(formData.currentMadra),
            maxMadra: parseInt(formData.maxMadra),
          },
          stats: {
            ...character.stats,
            strength: parseInt(formData.strength),
            dexterity: parseInt(formData.dexterity),
            constitution: parseInt(formData.constitution),
            intelligence: parseInt(formData.intelligence),
            wisdom: parseInt(formData.wisdom),
            charisma: parseInt(formData.charisma),
            maxHp: parseInt(formData.maxHp),
            currentHp: parseInt(formData.currentHp),
            armorClass: parseInt(formData.armorClass),
            initiative: parseInt(formData.initiative),
          },
          activity: formData.activity,
          currentGoal: formData.currentGoal,
          faction: formData.faction,
          isInPlayerParty: formData.isInPlayerParty === 'true',
          lastUpdated: Date.now(),
        };

        const response = await fetch(
          `${API_BASE}/worlds/${world?.id}/characters/${character.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to update character');
        }

        updateCharacter(character.id, updates);
      } else {
        const location = object as Location;
        const updates: Partial<Location> = {
          name: formData.name,
          description: formData.description,
          position: {
            x: parseFloat(formData.positionX),
            y: parseFloat(formData.positionY),
          },
          type: formData.type,
          faction: formData.faction || undefined,
        };

        const response = await fetch(
          `${API_BASE}/worlds/${world?.id}/locations/${location.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to update location');
        }

        updateLocation(location.id, updates);
      }

      onClose();
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update object');
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-panel-bg border-2 border-panel-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-accent">
            Edit {objectType === 'character' ? 'Character' : 'Location'}
          </h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-accent transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

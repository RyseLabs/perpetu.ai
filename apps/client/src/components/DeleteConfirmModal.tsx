import React from 'react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType: 'character' | 'location';
}

/**
 * Modal for confirming deletion of characters or locations
 */
export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType,
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-panel-bg border-2 border-panel-border rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-accent">Confirm Delete</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-accent transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-text-primary">
            Are you sure you want to delete the {itemType}{' '}
            <span className="font-bold text-accent">"{itemName}"</span>?
          </p>
          <p className="text-text-secondary text-sm">
            This action cannot be undone.
          </p>

          <div className="flex gap-2 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 bg-panel-border text-text-secondary rounded hover:bg-opacity-70 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

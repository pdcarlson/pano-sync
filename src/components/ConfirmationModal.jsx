// src/components/ConfirmationModal.jsx

function ConfirmationModal({ isOpen, onConfirm, onCancel, isUpdating }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-semibold text-[#2D2D31]">Confirm Action</h2>
        <p className="mt-2 text-[#56565C]">
          By downloading the JSON file, you will also update the master version in the cloud with your new changes.
        </p>
        <p className="mt-1 text-[#56565C]">
          Are you sure you want to proceed?
        </p>
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={onCancel}
            disabled={isUpdating}
            className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isUpdating}
            className="px-4 py-2 rounded-md bg-[#FD366E] text-white hover:bg-pink-600 disabled:opacity-50"
          >
            {isUpdating ? 'Updating Cloud...' : 'Confirm & Download'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;
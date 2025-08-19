// src/components/ActionPanel.jsx

// this component holds the main action button and download links
function ActionPanel({ onProcess, results, isLoading }) {
  return (
    <div className="flex w-full flex-col gap-4 rounded-md border border-[#EDEDF0] bg-white p-4">
      <h2 className="text-xl font-light text-[#2D2D31]">3. Process & Download</h2>
      <button
        onClick={onProcess}
        disabled={isLoading}
        className="cursor-pointer rounded-md bg-[#FD366E] px-4 py-2 text-white disabled:opacity-50"
      >
        {isLoading ? 'Processing...' : 'Process Files'}
      </button>

      {results && (
        <div className="mt-4 flex flex-col gap-2">
          <h3 className="font-semibold">Results:</h3>
          <a href={results.zipUrl} download={results.zipName} className="text-pink-600 hover:underline">
            Download Renamed Images (.zip)
          </a>
          <a href={results.jsonUrl} download="pano_correction_data.json" className="text-pink-600 hover:underline">
            Download Updated JSON
          </a>
        </div>
      )}
    </div>
  );
}

export default ActionPanel;
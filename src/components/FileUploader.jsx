// src/components/FileUploader.jsx

// a simple, reusable file uploader component
function FileUploader({ title, onFilesSelected, accept, multiple = false }) {
  const handleFileChange = (event) => {
    if (event.target.files) {
      onFilesSelected(Array.from(event.target.files));
    }
  };

  return (
    <div className="flex w-full flex-col gap-2 rounded-md border border-[#EDEDF0] bg-white p-4">
      <h2 className="text-xl font-light text-[#2D2D31]">{title}</h2>
      <input
        type="file"
        onChange={handleFileChange}
        accept={accept}
        multiple={multiple}
        className="text-sm text-slate-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-pink-50 file:text-pink-700
          hover:file:bg-pink-100"
      />
    </div>
  );
}

export default FileUploader;
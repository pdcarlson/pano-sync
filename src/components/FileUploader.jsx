// src/components/FileUploader.jsx
import { useState, useRef } from 'react';

// a reusable file uploader component with drag-and-drop support
function FileUploader({ title, onFilesSelected, accept, multiple = false }) {
  // state to track if a file is being dragged over the component
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  // a ref to access the hidden file input element
  const inputRef = useRef(null);

  // prevent default browser behavior for drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  // handle when the dragged file leaves the drop zone
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  // handle the file drop event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    
    // get files from the drop event
    const files = Array.from(e.dataTransfer.files);
    if (files && files.length > 0) {
      // pass the files up to the parent component
      onFilesSelected(files);
    }
  };

  // handle file selection from the standard file input dialog
  const handleFileChange = (event) => {
    if (event.target.files) {
      onFilesSelected(Array.from(event.target.files));
    }
  };

  // trigger the hidden file input when the drop zone is clicked
  const onAreaClick = () => {
    inputRef.current.click();
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <h2 className="text-xl font-light text-[#2D2D31]">{title}</h2>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={onAreaClick}
        className={`flex justify-center items-center w-full px-6 py-10 border-2 border-dashed rounded-md cursor-pointer transition-colors
          ${isDraggingOver ? 'border-gray-400 bg-gray-100' : 'border-gray-300 bg-white hover:bg-gray-50'}`
        }
      >
        <div className="text-center">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-[#FD366E]">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-400">
            {accept.replaceAll('.', '').replaceAll(',', ', ').toUpperCase()}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          onChange={handleFileChange}
          accept={accept}
          multiple={multiple}
          className="hidden" // the input is hidden and triggered by the div click
        />
      </div>
    </div>
  );
}

export default FileUploader;
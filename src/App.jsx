// src/App.jsx
import { useState } from 'react';
import './App.css';
import FileUploader from './components/FileUploader';
import PrefixInput from './components/PrefixInput';
import ActionPanel from './components/ActionPanel';
import Modal from './components/Modal';
import {
  renameImageFiles,
  convertCsvToJson,
  mergeJsonData,
  createZip,
} from './lib/fileUtils';

function App() {
  const [imageFiles, setImageFiles] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [jsonFile, setJsonFile] = useState(null);
  const [prefix, setPrefix] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);

  const handleFileSelection = (selectedFiles) => {
    const csv = selectedFiles.find(file => file.name.toLowerCase().endsWith('.csv'));
    const images = selectedFiles.filter(file => 
      file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')
    );

    if (csv) {
      setCsvFile(csv);
    }
    
    if (images.length > 0) {
      setImageFiles(images);
    }
  };

  const handleProcessFiles = async () => {
    if (!imageFiles.length || !csvFile || !jsonFile || !prefix) {
      alert('please upload all files and provide a prefix.');
      return;
    }

    setIsLoading(true);
    setResults(null);

    try {
      const processingPrefix = prefix.endsWith('_') ? prefix : `${prefix}_`;
      const zipName = `${prefix.replace(/_$/, '')}.zip`;

      const existingJsonText = await jsonFile.text();
      const existingJson = JSON.parse(existingJsonText);

      const renamedImages = await renameImageFiles(imageFiles, processingPrefix);
      if (renamedImages.length === 0) {
        throw new Error("no images matched the expected naming format '###-pano.jpg'.");
      }

      const newJsonData = await convertCsvToJson(csvFile, processingPrefix);
      const finalJson = mergeJsonData(existingJson, newJsonData);

      const zipBlob = await createZip(renamedImages, zipName);
      
      const zipUrl = URL.createObjectURL(zipBlob);
      const jsonBlob = new Blob([JSON.stringify(finalJson, null, 2)], { type: 'application/json' });
      const jsonUrl = URL.createObjectURL(jsonBlob);
      
      setResults({
        zipUrl,
        zipName,
        jsonUrl,
      });

      setIsResultsModalOpen(true);

    } catch (error) {
      console.error("error processing files:", error);
      alert(`an error occurred: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isResultsModalOpen}
        onClose={() => setIsResultsModalOpen(false)}
        title="Processing Complete"
      >
        <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-600">Your files have been processed successfully. You can download them below.</p>
            <a 
              href={results?.zipUrl} 
              download={results?.zipName} 
              className="w-full text-center px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-700 transition-colors"
            >
              Download Renamed Images (.zip)
            </a>
            <a 
              href={results?.jsonUrl} 
              download="pano_correction_data.json" 
              className="w-full text-center px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-700 transition-colors"
            >
              Download Updated JSON
            </a>
        </div>
      </Modal>

      <main className="flex flex-col items-center p-5 space-y-4 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold">Pano Sync Processor</h1>
        
        <div className="w-full p-4 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-light text-[#2D2D31] mb-2">1. Upload Files</h2>
          <div className="space-y-4">
            <div>
              <FileUploader
                title="JPG Images & CSV File"
                onFilesSelected={handleFileSelection}
                accept=".jpg,.jpeg,.csv"
                multiple
              />
              <div className="mt-2 space-y-1">
                {csvFile && <p className="text-sm text-pink-600">CSV file loaded: {csvFile.name}</p>}
                {imageFiles.length > 0 && <p className="text-sm text-pink-600">{imageFiles.length} image(s) loaded.</p>}
              </div>
            </div>

            <div>
              <FileUploader
                title="Existing JSON Data"
                onFilesSelected={(files) => setJsonFile(files[0])}
                accept=".json"
              />
              <div className="mt-2 space-y-1">
                {jsonFile && <p className="text-sm text-pink-600">JSON file loaded: {jsonFile.name}</p>}
              </div>
            </div>
          </div>
        </div>
        
        <PrefixInput value={prefix} onChange={setPrefix} />
        
        <ActionPanel onProcess={handleProcessFiles} isLoading={isLoading} />
      </main>
    </>
  );
}

export default App;
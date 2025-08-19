// src/App.jsx
import { useState } from 'react';
import './App.css';
import FileUploader from './components/FileUploader';
import PrefixInput from './components/PrefixInput';
import ActionPanel from './components/ActionPanel';
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

    } catch (error) {
      console.error("error processing files:", error);
      alert(`an error occurred: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
              {/* updated this section */}
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
              {/* updated this line */}
              {jsonFile && <p className="text-sm text-pink-600">JSON file loaded: {jsonFile.name}</p>}
            </div>
          </div>
        </div>
      </div>
      
      <PrefixInput value={prefix} onChange={setPrefix} />
      
      <ActionPanel onProcess={handleProcessFiles} results={results} isLoading={isLoading} />
    </main>
  );
}

export default App;
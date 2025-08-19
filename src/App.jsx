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

  const handleProcessFiles = async () => {
    if (!imageFiles.length || !csvFile || !jsonFile || !prefix) {
      alert('please upload all files and provide a prefix.');
      return;
    }

    setIsLoading(true);
    setResults(null);

    try {
      // step 1: read the uploaded json file
      const existingJsonText = await jsonFile.text();
      const existingJson = JSON.parse(existingJsonText);

      // step 2: rename images
      const renamedImages = await renameImageFiles(imageFiles, prefix);
      
      // if no images were successfully renamed (e.g., wrong naming format), stop processing.
      if (renamedImages.length === 0) {
        throw new Error("no images matched the expected naming format '###-pano.jpg'.");
      }

      // step 3: convert csv to json using the prefix
      const newJsonData = await convertCsvToJson(csvFile, prefix);

      // step 4: merge json data
      const finalJson = mergeJsonData(existingJson, newJsonData);

      // step 5: create zip file
      const zipBlob = await createZip(renamedImages, `${prefix.replace(/_$/, '')}.zip`);

      // step 6: create downloadable urls for the results
      const zipUrl = URL.createObjectURL(zipBlob);
      const jsonBlob = new Blob([JSON.stringify(finalJson, null, 2)], { type: 'application/json' });
      const jsonUrl = URL.createObjectURL(jsonBlob);
      
      setResults({
        zipUrl,
        zipName: `${prefix.replace(/_$/, '')}.zip`,
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
          <FileUploader
            title="JPG Images (e.g., 001-pano.jpg)"
            onFilesSelected={(files) => setImageFiles(files)}
            accept=".jpg,.jpeg"
            multiple
          />
          <FileUploader
            title="CSV Correction File"
            onFilesSelected={(files) => setCsvFile(files[0])}
            accept=".csv"
          />
          <FileUploader
            title="Existing JSON Data"
            onFilesSelected={(files) => setJsonFile(files[0])}
            accept=".json"
          />
        </div>
      </div>
      
      <PrefixInput value={prefix} onChange={setPrefix} />
      
      <ActionPanel onProcess={handleProcessFiles} results={results} isLoading={isLoading} />
    </main>
  );
}

export default App;
// src/App.jsx
import { useState, useEffect } from 'react';
import './App.css';
import FileUploader from './components/FileUploader';
import PrefixInput from './components/PrefixInput';
import ActionPanel from './components/ActionPanel';
import ConfirmationModal from './components/ConfirmationModal';
import {
  renameImageFiles,
  convertCsvToJson,
  mergeJsonData,
  createZip,
  getCloudJson,
  updateCloudJson
} from './lib/fileUtils';

function App() {
  const [imageFiles, setImageFiles] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [prefix, setPrefix] = useState('');
  
  // loading states
  const [isFetchingJson, setIsFetchingJson] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUpdatingCloud, setIsUpdatingCloud] = useState(false);
  
  const [cloudJson, setCloudJson] = useState({});
  const [results, setResults] = useState(null);
  
  // state for the confirmation modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setIsFetchingJson(true);
    getCloudJson()
      .then(data => setCloudJson(data))
      .catch(error => {
        console.error(error);
        alert(error.message);
      })
      .finally(() => setIsFetchingJson(false));
  }, []);

  const handleFileSelection = (selectedFiles) => {
    const csv = selectedFiles.find(file => file.name.endsWith('.csv'));
    const images = selectedFiles.filter(file => file.name.endsWith('.jpg') || file.name.endsWith('.jpeg'));

    if (csv) setCsvFile(csv);
    if (images.length > 0) setImageFiles(images);
  };

  const handleProcessFiles = async () => {
    if (!imageFiles.length || !csvFile || !prefix) {
      alert('please upload image(s), a csv file, and provide a prefix.');
      return;
    }

    setIsProcessing(true);
    setResults(null);

    try {
      const existingJson = cloudJson;
      const renamedImages = await renameImageFiles(imageFiles, prefix);
      if (renamedImages.length === 0) throw new Error("no images matched the expected naming format '###-pano.jpg'.");

      const newJsonData = await convertCsvToJson(csvFile, prefix);
      const finalJson = mergeJsonData(existingJson, newJsonData);

      // do not update the cloud yet. just prepare the results for download.
      const zipBlob = await createZip(renamedImages, `${prefix.replace(/_$/, '')}.zip`);
      const zipUrl = URL.createObjectURL(zipBlob);
      const jsonBlob = new Blob([JSON.stringify(finalJson, null, 2)], { type: 'application/json' });
      const jsonUrl = URL.createObjectURL(jsonBlob);
      
      setResults({
        zipUrl,
        zipName: `${prefix.replace(/_$/, '')}.zip`,
        jsonUrl,
        finalJsonData: finalJson, // hold the raw data for the update step
      });

    } catch (error) {
      console.error("error processing files:", error);
      alert(`an error occurred: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // this function is called when the user clicks the download link
  const handleDownloadRequest = () => {
    if (!results) return;
    setIsModalOpen(true);
  };
  
  // this function is called when the user confirms the action in the modal
  const handleConfirmAndUpdate = async () => {
    if (!results || !results.finalJsonData) return;
    
    setIsUpdatingCloud(true);
    try {
      // step 1: push the update to appwrite
      await updateCloudJson(results.finalJsonData);

      // step 2: trigger the local download
      const link = document.createElement('a');
      link.href = results.jsonUrl;
      link.setAttribute('download', 'pano_correction_data.json');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // step 3: update local state and close modal
      setCloudJson(results.finalJsonData);
      alert("cloud file updated successfully!");
    } catch (error) {
      console.error(error);
      alert(`failed to update cloud file: ${error.message}`);
    } finally {
      setIsUpdatingCloud(false);
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <ConfirmationModal
        isOpen={isModalOpen}
        onConfirm={handleConfirmAndUpdate}
        onCancel={() => setIsModalOpen(false)}
        isUpdating={isUpdatingCloud}
      />
      <main className="flex flex-col items-center p-5 space-y-4 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold">Pano Sync Processor</h1>
        
        <div className="w-full p-4 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-light text-[#2D2D31] mb-2">1. Upload JPGs & CSV File</h2>
          <FileUploader
            title="Select files"
            onFilesSelected={handleFileSelection}
            accept=".jpg,.jpeg,.csv"
            multiple
          />
          {isFetchingJson && <p className="text-sm text-gray-500 mt-2">loading cloud data...</p>}
          {csvFile && <p className="text-sm text-green-600 mt-2">✔️ csv file loaded: {csvFile.name}</p>}
          {imageFiles.length > 0 && <p className="text-sm text-green-600 mt-2">✔️ {imageFiles.length} image(s) loaded.</p>}
        </div>
        
        <PrefixInput value={prefix} onChange={setPrefix} />
        
        <ActionPanel 
          onProcess={handleProcessFiles} 
          onDownloadJson={handleDownloadRequest} 
          results={results} 
          isLoading={isProcessing} 
        />
      </main>
    </>
  );
}

export default App;
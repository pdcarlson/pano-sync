// src/lib/fileUtils.js

// ... (keep imports and constants the same) ...
import Papa from 'papaparse';
import JSZip from 'jszip';
import { storage as appwriteStorage, ID } from './appwrite';

const BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID;
const JSON_FILE_ID = import.meta.env.VITE_JSON_FILE_ID;

/**
 * fetches and parses the main json file from appwrite storage.
 * @returns {Promise<object>} - a promise that resolves to the parsed json data.
 */
export const getCloudJson = async () => {
  try {
    // correct: use the getfiledownload method which returns a promise resolving to a url.
    const url = appwriteStorage.getFileDownload(BUCKET_ID, JSON_FILE_ID);
    
    // fetch the content from that url.
    const response = await fetch(url.href);

    if (!response.ok) {
      // make the error more specific if possible.
      throw new Error(`network response was not ok: ${response.status} ${response.statusText}`);
    }
    
    // now we can parse the response body directly as json.
    return await response.json();
  } catch (error) {
    console.error("failed to fetch cloud json:", error);
    // if the file isn't found (a 404 error), we can return an empty object to start fresh.
    if (error.message.includes('404')) {
      console.log("json file not found in cloud, starting with an empty object.");
      return {};
    }
    throw new Error("could not retrieve the json data file from the cloud.");
  }
};


// ... (The rest of the file: updateCloudJson, renameImageFiles, etc., remains exactly the same as before) ...
export const updateCloudJson = async (jsonData) => {
  try {
    const jsonString = JSON.stringify(jsonData, null, 2);
    const file = new File([jsonString], "pano_correction_data.json", { type: "application/json" });
    
    // appwrite doesn't have a direct 'update' via file, so we delete and re-create.
    // this ensures we always have the latest version under the same id.
    await appwriteStorage.deleteFile(BUCKET_ID, JSON_FILE_ID);
    await appwriteStorage.createFile(BUCKET_ID, JSON_FILE_ID, file);
    console.log("successfully updated cloud json.");
  } catch (error) {
    // if the delete failed (e.g., file didn't exist), try creating it anyway.
    if (error.code === 404) {
         const jsonString = JSON.stringify(jsonData, null, 2);
         const file = new File([jsonString], "pano_correction_data.json", { type: "application/json" });
         await appwriteStorage.createFile(BUCKET_ID, JSON_FILE_ID, file);
         console.log("successfully created cloud json.");
         return;
    }
    console.error("failed to update cloud json:", error);
    throw new Error("could not save the updated json data to the cloud.");
  }
};

export const renameImageFiles = async (imageFiles, prefix) => {
  const renamedFiles = imageFiles.map((file) => {
    const match = file.name.match(/^(\d+)-pano\.jpg$/);
    if (match && match[1]) {
      const originalNumber = match[1].padStart(5, '0'); // ensure 5-digit padding
      const newName = `${prefix}${originalNumber}.jpg`;
      return new File([file], newName, { type: file.type });
    }
    return null; 
  });
  return renamedFiles.filter(file => file !== null);
};

export const convertCsvToJson = (csvFile, prefix) => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvFile, {
      delimiter: ';',
      header: false,
      skipEmptyLines: true,
      comments: '#',
      complete: (results) => {
        try {
          const convertedData = {};
          const col_names = [
              'ID', 'filename', 'timestamp', 'pano_pos_x', 'pano_pos_y', 'pano_pos_z',
              'pano_ori_w', 'pano_ori_x', 'pano_ori_y', 'pano_ori_z'
          ];
          results.data.forEach((rowArray, rowIndex) => {
            const row = col_names.reduce((obj, key, index) => {
                obj[key] = rowArray[index] ? rowArray[index].trim() : undefined;
                return obj;
            }, {});
            if (!row.filename) {
                console.warn(`skipping row ${rowIndex + 2} due to missing filename.`);
                return;
            }
            const shot_number = String(row.filename).split('-')[0];
            const key = `${prefix}${shot_number}.jpg`;
            convertedData[key] = {
              id: parseInt(row.ID, 10),
              timestamp: parseFloat(row.timestamp),
              position: {
                x: parseFloat(row.pano_pos_x),
                y: parseFloat(row.pano_pos_y),
                z: parseFloat(row.pano_pos_z),
              },
              orientation: {
                w: parseFloat(row.pano_ori_w),
                x: parseFloat(row.pano_ori_x),
                y: parseFloat(row.pano_ori_y),
                z: parseFloat(row.pano_ori_z),
              },
            };
          });
          resolve(convertedData);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};

export const mergeJsonData = (existingJson, newJson) => {
  return { ...existingJson, ...newJson };
};

export const createZip = async (files, zipName) => {
  const zip = new JSZip();
  files.forEach((file) => {
    zip.file(file.name, file);
  });
  const blob = await zip.generateAsync({ type: 'blob' });
  return blob;
};
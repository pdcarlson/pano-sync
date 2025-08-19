// src/lib/fileUtils.js
import Papa from 'papaparse';
import JSZip from 'jszip';

/**
 * renames uploaded image files based on a prefix.
 * example: 001-pano.jpg -> MYPREFIX_001.jpg
 * @param {File[]} imageFiles - the array of original image files.
 * @param {string} prefix - the user-provided prefix.
 * @returns {Promise<File[]>} - a promise that resolves to an array of new file objects.
 */
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
  // filter out any files that didn't match the naming convention
  return renamedFiles.filter(file => file !== null);
};

/**
 * parses a csv file and converts it to a json object, mirroring the python script.
 * @param {File} csvFile - the uploaded csv file.
 * @param {string} prefix - the user-provided prefix to build the new keys.
 * @returns {Promise<object>} - a promise that resolves to the converted json object.
 */
export const convertCsvToJson = (csvFile, prefix) => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvFile, {
      delimiter: ';',
      header: false, // the file has no true header row
      skipEmptyLines: true,
      comments: '#', // treat lines starting with # as comments
      complete: (results) => {
        try {
          const convertedData = {};
          // define column names as per the python script logic
          const col_names = [
              'ID', 'filename', 'timestamp', 'pano_pos_x', 'pano_pos_y', 'pano_pos_z',
              'pano_ori_w', 'pano_ori_x', 'pano_ori_y', 'pano_ori_z'
          ];

          results.data.forEach((rowArray, rowIndex) => {
            // convert array to an object with keys
            const row = col_names.reduce((obj, key, index) => {
                obj[key] = rowArray[index] ? rowArray[index].trim() : undefined;
                return obj;
            }, {});

            if (!row.filename) {
                console.warn(`skipping row ${rowIndex + 2} due to missing filename.`);
                return;
            }

            // extract the shot number (e.g., '00000-pano.jpg' -> '00000')
            const shot_number = String(row.filename).split('-')[0];
            const key = `${prefix}${shot_number}.jpg`;

            // build the nested json structure
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

/**
 * merges the newly converted json data into the existing json data.
 * the new data takes precedence.
 * @param {object} existingJson - the parsed json from the uploaded file.
 * @param {object} newJson - the json object converted from the csv.
 * @returns {object} - the final merged json object.
 */
export const mergeJsonData = (existingJson, newJson) => {
  return { ...existingJson, ...newJson };
};

/**
 * creates a zip archive from an array of files.
 * @param {File[]} files - the files to add to the zip.
 * @param {string} zipName - the name of the zip file.
 * @returns {Promise<Blob>} - a promise that resolves to the zip file blob.
 */
export const createZip = async (files, zipName) => {
  const zip = new JSZip();
  files.forEach((file) => {
    zip.file(file.name, file);
  });
  const blob = await zip.generateAsync({ type: 'blob' });
  return blob;
};
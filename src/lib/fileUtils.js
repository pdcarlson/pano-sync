// src/lib/fileUtils.js
import Papa from 'papaparse';
import JSZip from 'jszip';

/**
 * renames uploaded image files based on a prefix.
 * example: 001-pano.jpg -> MYPREFIX_001.jpg
 * @param {File[]} imageFiles - the array of original image files.
 * @param {string} prefix - the user-provided prefix, with trailing underscore.
 * @returns {Promise<File[]>} - a promise that resolves to an array of new file objects.
 */
export const renameImageFiles = async (imageFiles, prefix) => {
  // map over each file to create a new file object with the updated name
  const renamedFiles = imageFiles.map((file) => {
    // use a regular expression to capture the numeric part of the filename
    const match = file.name.match(/^(\d+)-pano\.jpg$/);
    if (match && match[1]) {
      const originalNumber = match[1].padStart(5, '0'); // ensure 5-digit padding
      const newName = `${prefix}${originalNumber}.jpg`;
      // return a new file object to avoid mutating the original file data
      return new File([file], newName, { type: file.type });
    }
    // if a file doesn't match the expected format, return null
    return null;
  });
  // filter out any null entries from files that didn't match the naming convention
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
    // use papaparse to process the csv file
    Papa.parse(csvFile, {
      delimiter: ';',
      header: false,
      skipEmptyLines: true,
      comments: '#', // ignore lines starting with a hash
      complete: (results) => {
        try {
          const convertedData = {};
          // define column names as they appear in the csv
          const col_names = [
              'ID', 'filename', 'timestamp', 'pano_pos_x', 'pano_pos_y', 'pano_pos_z',
              'pano_ori_w', 'pano_ori_x', 'pano_ori_y', 'pano_ori_z'
          ];

          // iterate over each row of parsed data
          results.data.forEach((rowArray, rowIndex) => {
            // map the array of values to an object with the defined column names
            const row = col_names.reduce((obj, key, index) => {
                obj[key] = rowArray[index] ? rowArray[index].trim() : undefined;
                return obj;
            }, {});

            if (!row.filename) {
                console.warn(`skipping row ${rowIndex + 2} due to missing filename.`);
                return; // skip this row if there's no filename
            }

            // construct the new key for the json object
            const shot_number = String(row.filename).split('-')[0];
            const key = `${prefix}${shot_number}.jpg`;

            // build the nested json structure with correctly typed values
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
 * the new data takes precedence and will overwrite existing keys.
 * @param {object} existingJson - the parsed json from the uploaded file.
 * @param {object} newJson - the json object converted from the csv.
 * @returns {object} - the final merged json object.
 */
export const mergeJsonData = (existingJson, newJson) => {
  // use the spread operator to merge objects. keys from newjson will overwrite those in existingjson.
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
  // add each file to the zip archive
  files.forEach((file) => {
    zip.file(file.name, file);
  });
  // generate the zip file as a blob
  const blob = await zip.generateAsync({ type: 'blob' });
  return blob;
};

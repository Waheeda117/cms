import JSZip from 'jszip';

/**
 * Convert array of objects to CSV string
 */
const arrayToCSV = (data, headers) => {
  if (!data || data.length === 0) return '';
  
  const csvRows = [];
  
  // Add header row
  csvRows.push(headers.join(','));
  
  // Add data rows
  data.forEach(row => {
    const values = headers.map(header => {
      let value = row[header] || '';
      // Escape quotes and wrap in quotes if contains comma or quote
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  });
  
  return csvRows.join('\n');
};

/**
 * Convert data with mapped headers for CSV display
 */
const convertDataWithMappedHeaders = (data, fieldMapping) => {
  return data.map(row => {
    const mappedRow = {};
    Object.keys(fieldMapping).forEach(csvHeader => {
      const dataField = fieldMapping[csvHeader];
      mappedRow[csvHeader] = row[dataField] || '';
    });
    return mappedRow;
  });
};

/**
 * Download results as ZIP file with folder structure
 */
export const downloadResultsAsZip = async (results) => {
  try {
    const zip = new JSZip();
    
    // Create Results folder
    const resultsFolder = zip.folder('Results');
    
    // Define field mapping: CSV header -> data field
    const fieldMapping = {
      'name': 'name',
      'strength': 'strength', 
      'type': 'category',
      'manufacturer': 'manufacturer',
      'formula': 'description'
    };
    
    const fieldMappingWithReason = {
      ...fieldMapping,
      'reason': 'error'
    };
    
    // Define CSV headers (what appears in CSV)
    const headers = ['name', 'strength', 'type', 'manufacturer', 'formula'];
    const headersWithReason = [...headers, 'reason'];
    
    // Create Success folder and CSV
    if (results.results.success && results.results.success.length > 0) {
      const successFolder = resultsFolder.folder('success');
      const mappedSuccessData = convertDataWithMappedHeaders(results.results.success, fieldMapping);
      const successCSV = arrayToCSV(mappedSuccessData, headers);
      successFolder.file('success.csv', successCSV);
    }
    
    // Create Failed folder and CSV
    if (results.results.failed && results.results.failed.length > 0) {
      const failedFolder = resultsFolder.folder('failed');
      const mappedFailedData = convertDataWithMappedHeaders(results.results.failed, fieldMappingWithReason);
      const failedCSV = arrayToCSV(mappedFailedData, headersWithReason);
      failedFolder.file('failed.csv', failedCSV);
    }
    
    // Create Duplicate folder and CSV
    if (results.results.duplicates && results.results.duplicates.length > 0) {
      const duplicateFolder = resultsFolder.folder('duplicate');
      const mappedDuplicateData = convertDataWithMappedHeaders(results.results.duplicates, fieldMappingWithReason);
      const duplicateCSV = arrayToCSV(mappedDuplicateData, headersWithReason);
      duplicateFolder.file('duplicate.csv', duplicateCSV);
    }
    
    // Generate ZIP file
    const content = await zip.generateAsync({ type: 'blob' });
    
    // Create download link and trigger download
    const url = window.URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bulk_upload_results_${new Date().getTime()}.zip`;
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up URL object
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error creating ZIP file:', error);
    throw new Error('Failed to create download file');
  }
};

/**
 * Download single CSV file
 */
export const downloadCSV = (data, filename, headers) => {
  try {
    const csv = arrayToCSV(data, headers);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading CSV:', error);
    throw new Error('Failed to download CSV file');
  }
};
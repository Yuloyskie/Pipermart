const PDFDocument = require('pdfkit');

/**
 * Generate analytics PDF with two formats:
 * - 'simple': Table-only export
 * - 'full': Full report with statistics
 */
exports.generateAnalyticsPDF = async (data, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const { format = 'simple', title = 'Analytics Report', stats = null } = options;
      
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
      });

      let pdfBuffer = Buffer.alloc(0);
      doc.on('data', (chunk) => {
        pdfBuffer = Buffer.concat([pdfBuffer, chunk]);
      });

      doc.on('end', () => {
        resolve(pdfBuffer);
      });

      // ===== HEADER =====
      doc.fontSize(20).font('Helvetica-Bold').text(title, { align: 'center' });
      doc.fontSize(10).fillColor('#666666').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(0.5);
      doc.strokeColor('#CCCCCC').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(1);

      // ===== CONTENT BY FORMAT =====
      if (format === 'full' && stats) {
        // Full Report with Statistics
        generateFullReport(doc, data, stats);
      } else {
        // Simple Table Export
        generateSimpleTable(doc, data);
      }

      doc.moveDown(1);
      doc.fontSize(8).fillColor('#999999').text('PiperSmart Analytics Export', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate simple table-only PDF
 */
function generateSimpleTable(doc, data) {
  if (!data || data.length === 0) {
    doc.fontSize(12).fillColor('#333333').text('No data available for export.', { align: 'center' });
    return;
  }

  // Determine columns based on data type
  const firstItem = data[0];
  let tableHTML = '';
  let columns = [];

  if (firstItem.results?.ripeness !== undefined) {
    // Bunga Analysis
    columns = ['User', 'Ripeness', 'Market Grade', 'Health Class', 'Confidence', 'Date'];
    tableHTML = `
      <table>
        <thead>
          <tr style="background-color: #27AE60; color: white; font-weight: bold;">
            ${columns.map(col => `<th>${col}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map((item, idx) => `
            <tr style="background-color: ${idx % 2 === 0 ? '#FFFFFF' : '#F0F9F4'};">
              <td>${item.userName || 'N/A'}</td>
              <td>${item.results?.ripeness || 'N/A'}</td>
              <td>${item.results?.market_grade || 'N/A'}</td>
              <td>${item.results?.health_class || 'N/A'}</td>
              <td>${item.results?.confidence || 'N/A'}%</td>
              <td>${new Date(item.createdAt).toLocaleDateString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    drawBungaTable(doc, data);
  } else if (firstItem.results?.disease !== undefined) {
    // Leaf Analysis
    columns = ['User', 'Disease', 'Confidence', 'Detections', 'Date'];
    drawLeafTable(doc, data);
  } else {
    // Generic activity data
    columns = ['Type', 'User/Title', 'Details', 'Date'];
    drawActivityTable(doc, data);
  }
}

/**
 * Draw Bunga Analysis table
 */
function drawBungaTable(doc, data) {
  const startX = 40;
  const startY = doc.y;
  const colWidth = (555 - 40) / 6;
  const rowHeight = 25;
  const headerColor = '#27AE60';
  const headerTextColor = '#FFFFFF';
  const alternateColor = '#F0F9F4';
  const textColor = '#333333';

  const columns = ['User', 'Ripeness', 'Market Grade', 'Health Class', 'Confidence', 'Date'];

  // Draw header
  doc.fillColor(headerColor).rect(startX, doc.y, 555 - startX, rowHeight).fill();
  doc.fillColor(headerTextColor).fontSize(9).font('Helvetica-Bold');
  columns.forEach((col, i) => {
    doc.text(col, startX + (i * colWidth) + 5, startY + 7, { width: colWidth - 10, align: 'left' });
  });

  doc.moveDown(1.5);
  
  // Draw rows
  let yPos = doc.y;
  data.slice(0, 50).forEach((item, idx) => {
    const rowStartY = yPos;
    const bgColor = idx % 2 === 0 ? '#FFFFFF' : alternateColor;
    
    doc.fillColor(bgColor).rect(startX, rowStartY, 555 - startX, rowHeight).fill();
    doc.fillColor(textColor).fontSize(8).font('Helvetica');
    
    const values = [
      item.userName || 'N/A',
      item.results?.ripeness || 'N/A',
      item.results?.market_grade || 'N/A',
      item.results?.health_class || 'N/A',
      `${item.results?.confidence || 'N/A'}%`,
      new Date(item.createdAt).toLocaleDateString()
    ];

    columns.forEach((col, i) => {
      doc.text(values[i], startX + (i * colWidth) + 5, rowStartY + 7, { width: colWidth - 10, align: 'left' });
    });

    yPos += rowHeight;

    // Check if we need a new page
    if (yPos > 750) {
      doc.addPage();
      yPos = 40;
    }
  });

  doc.moveDown(2);
}

/**
 * Draw Leaf Analysis table
 */
function drawLeafTable(doc, data) {
  const startX = 40;
  const startY = doc.y;
  const colWidth = (555 - 40) / 5;
  const rowHeight = 25;
  const headerColor = '#27AE60';
  const headerTextColor = '#FFFFFF';
  const alternateColor = '#F0F9F4';
  const textColor = '#333333';

  const columns = ['User', 'Disease', 'Confidence', 'Detections', 'Date'];

  // Draw header
  doc.fillColor(headerColor).rect(startX, doc.y, 555 - startX, rowHeight).fill();
  doc.fillColor(headerTextColor).fontSize(9).font('Helvetica-Bold');
  columns.forEach((col, i) => {
    doc.text(col, startX + (i * colWidth) + 5, startY + 7, { width: colWidth - 10, align: 'left' });
  });

  doc.moveDown(1.5);
  
  // Draw rows
  let yPos = doc.y;
  data.slice(0, 50).forEach((item, idx) => {
    const rowStartY = yPos;
    const bgColor = idx % 2 === 0 ? '#FFFFFF' : alternateColor;
    
    doc.fillColor(bgColor).rect(startX, rowStartY, 555 - startX, rowHeight).fill();
    doc.fillColor(textColor).fontSize(8).font('Helvetica');
    
    const values = [
      item.userName || 'N/A',
      item.results?.disease || 'N/A',
      `${item.results?.confidence || 'N/A'}%`,
      (item.results?.detections?.length || 0).toString(),
      new Date(item.createdAt).toLocaleDateString()
    ];

    columns.forEach((col, i) => {
      doc.text(values[i], startX + (i * colWidth) + 5, rowStartY + 7, { width: colWidth - 10, align: 'left' });
    });

    yPos += rowHeight;

    // Check if we need a new page
    if (yPos > 750) {
      doc.addPage();
      yPos = 40;
    }
  });

  doc.moveDown(2);
}

/**
 * Draw Activity table
 */
function drawActivityTable(doc, data) {
  const startX = 40;
  const startY = doc.y;
  const colWidth = (555 - 40) / 4;
  const rowHeight = 25;
  const headerColor = '#27AE60';
  const headerTextColor = '#FFFFFF';
  const alternateColor = '#F0F9F4';
  const textColor = '#333333';

  const columns = ['Type', 'User/Title', 'Details', 'Date'];

  // Draw header
  doc.fillColor(headerColor).rect(startX, doc.y, 555 - startX, rowHeight).fill();
  doc.fillColor(headerTextColor).fontSize(9).font('Helvetica-Bold');
  columns.forEach((col, i) => {
    doc.text(col, startX + (i * colWidth) + 5, startY + 7, { width: colWidth - 10, align: 'left' });
  });

  doc.moveDown(1.5);
  
  // Draw rows
  let yPos = doc.y;
  data.slice(0, 50).forEach((item, idx) => {
    const rowStartY = yPos;
    const bgColor = idx % 2 === 0 ? '#FFFFFF' : alternateColor;
    
    doc.fillColor(bgColor).rect(startX, rowStartY, 555 - startX, rowHeight).fill();
    doc.fillColor(textColor).fontSize(8).font('Helvetica');
    
    const values = [
      item.type || 'N/A',
      item.userName || item.title || 'N/A',
      item.description || 'N/A',
      new Date(item.timestamp || item.createdAt).toLocaleDateString()
    ];

    columns.forEach((col, i) => {
      doc.text(values[i], startX + (i * colWidth) + 5, rowStartY + 7, { width: colWidth - 10, align: 'left' });
    });

    yPos += rowHeight;

    // Check if we need a new page
    if (yPos > 750) {
      doc.addPage();
      yPos = 40;
    }
  });

  doc.moveDown(2);
}

/**
 * Generate full report with statistics
 */
function generateFullReport(doc, data, stats) {
  if (!data || data.length === 0) {
    doc.fontSize(12).fillColor('#333333').text('No data available for export.', { align: 'center' });
    return;
  }

  // ==== STATISTICS SECTION ====
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#27AE60').text('📊 Analytics Summary');
  doc.moveDown(0.5);

  // Display statistics as key-value pairs
  const statKeys = Object.keys(stats).slice(0, 6);
  statKeys.forEach((key) => {
    const value = stats[key];
    const displayKey = key.replace(/([A-Z])/g, ' $1').trim();
    const displayValue = typeof value === 'object' ? JSON.stringify(value).substring(0, 50) : value;
    
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#27AE60');
    doc.text(`${displayKey}: `, { continued: true });
    doc.font('Helvetica').fillColor('#333333').text(displayValue.toString());
  });

  doc.moveDown(1);
  doc.strokeColor('#CCCCCC').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
  doc.moveDown(1);

  // ==== DATA TABLE ====
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#27AE60').text('📋 Detailed Records');
  doc.moveDown(0.5);

  // Determine which table to draw based on data type
  const firstItem = data[0];
  if (firstItem.results?.ripeness !== undefined) {
    drawBungaTable(doc, data);
  } else if (firstItem.results?.disease !== undefined) {
    drawLeafTable(doc, data);
  } else {
    drawActivityTable(doc, data);
  }
}

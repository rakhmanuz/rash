/**
 * Google Sheets - Qarzdorlik (debt) by Student ID
 * 
 * tolov 2.0 jadvali: C ustunida ID (rash.uz dagi o'quvchi ID si bilan bir xil), AM ustunida Holat (qarzdorlik).
 * Ishlatish: Deploy as Web App -> Execute as: Me, Who has access: Anyone
 */

// ID qaysi ustunda — C = 3 (jadvaldagi ID = rash.uz o'quvchi ID si)
var ID_COLUMN = 3;   // C - ID
// Qarzdorlik (Holat) qaysi ustunda — AM = 39
var DEBT_COLUMN = 39; // AM - Holat
// Qaysi varag'idan o'qiladi (0 = matematika, 1 = fizika)
var SHEET_INDEX = 0;

function doGet(e) {
  var id = (e && e.parameter && e.parameter.id) ? String(e.parameter.id).trim() : '';
  var result = { debt: 0 };
  
  if (!id) {
    return jsonOutput(result);
  }
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[SHEET_INDEX];
  var data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return jsonOutput(result);
  
  var header = data[0];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var cellId = row[ID_COLUMN - 1];
    if (cellId === null || cellId === undefined) continue;
    var strId = String(cellId).trim();
    if (strId === id) {
      var val = row[DEBT_COLUMN - 1];
      if (val !== null && val !== undefined && val !== '') {
        if (typeof val === 'number') {
          result.debt = val;
        } else {
          var num = parseFloat(String(val).replace(/\s/g, '').replace(/,/g, '.'));
          result.debt = isNaN(num) ? 0 : num;
        }
      }
      break;
    }
  }
  
  return jsonOutput(result);
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

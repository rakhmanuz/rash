/**
 * Google Sheets - Qarzdorlik (debt) by Student ID
 * 
 * Loyiha: tolov 2.0 jadvalidagi "matematika" / "fizika" varag'ida:
 * - ID ustuni (C): o'quvchi ID (masalan 3736)
 * - Qarzdorlik ustuni: S (19-ustun) yoki Holat E (5-ustun) - quyida sozlang
 * 
 * Ishlatish: Deploy as Web App -> Execute as: Me, Who has access: Anyone
 * URL dan keyin ?id=3736 qo'shiladi, shu ID li qatordagi qarzdorlik qaytadi.
 */

// ID qaysi ustunda (A=1, B=2, C=3, ...)
var ID_COLUMN = 3;   // C - ID
// Qarzdorlik qaysi ustunda (sikrinshotda Holat = E = 5, yoki S = 19)
var DEBT_COLUMN = 5; // E - Holat (agar S kerak bo'lsa 19 yozing)
// Qaysi varag'idan o'qiladi (0 = birinchi varag')
var SHEET_INDEX = 0;  // 0 = matematika

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

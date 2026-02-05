// Google Sheets API Service - Faqat o'qish (Read-Only)
// Google Sheets'da barcha hisob-kitoblar bo'ladi, tizim faqat kerakli kataklarni o'qiydi

// Google Sheets client
let sheetsClient: any = null
let googleapisModule: any = null

// Lazy load googleapis (faqat kerak bo'lganda)
async function loadGoogleApis() {
  if (googleapisModule) {
    return googleapisModule
  }
  
  try {
    googleapisModule = await import('googleapis')
    return googleapisModule
  } catch (error) {
    console.warn('googleapis paketi o\'rnatilmagan. Faqat public link yoki API key ishlatiladi.')
    return null
  }
}

// Public Google Sheets'ni CSV orqali o'qish
async function readPublicSheetsCSV(range?: string): Promise<{ success: boolean; data?: any[][]; error?: string }> {
  try {
    const publicUrl = process.env.GOOGLE_SHEETS_PUBLIC_URL
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID
    const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME || "To'lovlar"

    if (!publicUrl && !spreadsheetId) {
      return { success: false, error: 'Google Sheets URL yoki ID topilmadi' }
    }

    let csvUrl: string

    // Agar publicUrl bo'lsa va u published link formatida bo'lsa (/e/2PACX-...)
    if (publicUrl) {
      // Published link formatini tekshirish: /e/2PACX-.../pubhtml yoki /pubhtml
      if (publicUrl.includes('/e/2PACX-') || publicUrl.includes('/pubhtml')) {
        // Published linkni CSV export formatiga o'zgartirish
        csvUrl = publicUrl.replace('/pubhtml', '/pub?output=csv')
        if (!csvUrl.includes('/pub?')) {
          // Agar /pub? bo'lmasa, qo'shamiz
          csvUrl = publicUrl.replace(/\/pubhtml$/, '/pub?output=csv')
        }
      } else if (publicUrl.includes('/spreadsheets/d/')) {
        // Oddiy spreadsheet link: /spreadsheets/d/SPREADSHEET_ID/edit
        const match = publicUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
        if (match) {
          const finalSpreadsheetId = match[1]
          csvUrl = `https://docs.google.com/spreadsheets/d/${finalSpreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
          if (range) {
            csvUrl += `&range=${encodeURIComponent(range)}`
          }
        } else {
          return { success: false, error: 'Google Sheets URL dan ID ajratib bo\'lmadi' }
        }
      } else {
        // To'g'ridan-to'g'ri CSV URL bo'lishi mumkin
        csvUrl = publicUrl
      }
    } else if (spreadsheetId) {
      // Faqat spreadsheet ID bo'lsa
      csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
      if (range) {
        csvUrl += `&range=${encodeURIComponent(range)}`
      }
    } else {
      return { success: false, error: 'Google Sheets URL yoki ID topilmadi' }
    }

    // CSV ni o'qish
    const response = await fetch(csvUrl)
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` }
    }

    const csvText = await response.text()
    
    // CSV ni parse qilish (yaxshilangan versiya)
    const rows: any[][] = []
    const lines = csvText.split(/\r?\n/)
    
    for (const line of lines) {
      if (!line.trim()) continue
      
      const row: any[] = []
      let current = ''
      let inQuotes = false
      let i = 0
      
      while (i < line.length) {
        const char = line[i]
        const nextChar = line[i + 1]
        
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            // Escaped quote
            current += '"'
            i += 2
            continue
          }
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          row.push(current.trim())
          current = ''
        } else {
          current += char
        }
        
        i++
      }
      
      // Oxirgi katakni qo'shish
      row.push(current.trim())
      rows.push(row)
    }

    return { success: true, data: rows }
  } catch (error: any) {
    console.error('Public Google Sheets dan CSV o\'qish xatolik:', error)
    return { success: false, error: error.message }
  }
}

// Google Sheets client ni initialize qilish
export async function initializeSheetsClient() {
  if (sheetsClient) {
    return sheetsClient
  }

  // Public URL yoki API key orqali ishlash
  const publicUrl = process.env.GOOGLE_SHEETS_PUBLIC_URL
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY
  
  // Agar public URL yoki API key bo'lsa, ularni ishlatamiz
  if (publicUrl || apiKey) {
    // Public spreadsheet uchun API key ishlatamiz
    if (apiKey) {
      try {
        const googleapis = await loadGoogleApis()
        if (googleapis) {
          sheetsClient = googleapis.google.sheets({ 
            version: 'v4', 
            auth: apiKey 
          })
          return sheetsClient
        }
      } catch (error) {
        console.error('Google Sheets API key initialize xatolik:', error)
        return null
      }
    }
    // Agar faqat public URL bo'lsa, CSV orqali o'qamiz
    return null
  }

  // Service account credentials (eski yondashuv)
  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID

  if (!credentials || !spreadsheetId) {
    console.warn('Google Sheets credentials topilmadi. Google Sheets integratsiyasi o\'chirilgan.')
    return null
  }

  try {
    const googleapis = await loadGoogleApis()
    if (!googleapis) {
      console.warn('googleapis paketi o\'rnatilmagan. Service account ishlatib bo\'lmaydi.')
      return null
    }

    const auth = new googleapis.google.auth.GoogleAuth({
      credentials: JSON.parse(credentials),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })

    sheetsClient = googleapis.google.sheets({ version: 'v4', auth })
    return sheetsClient
  } catch (error) {
    console.error('Google Sheets client initialize xatolik:', error)
    return null
  }
}

// Google Sheets'dan ma'lumotlarni o'qish
export async function readFromSheets(range: string) {
  try {
    // Avval public CSV orqali o'qishga harakat qilamiz
    const publicUrl = process.env.GOOGLE_SHEETS_PUBLIC_URL
    if (publicUrl) {
      const csvResult = await readPublicSheetsCSV(range)
      if (csvResult.success) {
        return csvResult
      }
    }

    // API key orqali o'qish
    const apiKey = process.env.GOOGLE_SHEETS_API_KEY
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || 
      (publicUrl ? publicUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1] : null)
    
    if (apiKey && spreadsheetId) {
      try {
        const response = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(process.env.GOOGLE_SHEETS_SHEET_NAME || "To'lovlar")}!${range}?key=${apiKey}`
        )
        
        if (response.ok) {
          const data = await response.json()
          return {
            success: true,
            data: data.values || [],
          }
        }
      } catch (error) {
        console.warn('API key orqali o\'qishda xatolik, CSV ga o\'tamiz:', error)
      }
    }

    // Service account orqali o'qish (eski yondashuv)
    const client = await initializeSheetsClient()
    if (!client) {
      return { success: false, error: 'Google Sheets client topilmadi' }
    }

    if (!spreadsheetId) {
      return { success: false, error: 'Spreadsheet ID topilmadi' }
    }

    const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME || "To'lovlar"

    // Ma'lumotlarni o'qish
    const response = await client.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!${range}`,
    })

    return {
      success: true,
      data: response.data.values || [],
    }
  } catch (error: any) {
    console.error('Google Sheets dan o\'qish xatolik:', error)
    return { success: false, error: error.message }
  }
}

// O'quvchi ID (C ustuni) va To'lov holati (S ustuni) ni o'qish
export async function getPaymentStatusFromSheets() {
  try {
    // C va S ustunlarni o'qish (2-qatordan boshlab)
    const result = await readFromSheets('C2:S1000')
    
    if (!result.success) {
      return result
    }

    const rows = result.data || []
    
    // Har bir qator uchun: C ustuni = studentId, S ustuni = paymentStatus
    const paymentStatuses: Array<{ studentId: string; status: number }> = []
    
    rows.forEach((row: any[]) => {
      if (row.length >= 17) { // C va S ustunlar mavjud
        const studentId = row[0]?.toString().trim() || '' // C ustuni (0-index)
        const statusValue = row[16]?.toString().trim() || '0' // S ustuni (16-index, chunki C=0, D=1, ..., S=16)
        
        if (studentId) {
          const status = parseFloat(statusValue) || 0
          paymentStatuses.push({
            studentId,
            status, // Manfiy = qarzdorlik, musbat = ortiqcha to'lov
          })
        }
      }
    })

    return {
      success: true,
      data: paymentStatuses,
    }
  } catch (error: any) {
    console.error('Google Sheets dan to\'lov holatini o\'qish xatolik:', error)
    return { success: false, error: error.message }
  }
}

// Barcha to'lovlar ma'lumotlarini o'qish
export async function getAllPaymentsFromSheets() {
  try {
    const result = await readFromSheets('A:Z') // Barcha ustunlarni o'qish
    
    if (!result.success) {
      return result
    }

    const rows = result.data || []
    if (rows.length === 0) {
      return { success: true, data: [] }
    }

    // Birinchi qator - headers
    const headers = rows[0]
    const dataRows = rows.slice(1)

    // Ma'lumotlarni object'larga aylantirish
    const payments = dataRows.map((row: any[]) => {
      const payment: any = {}
      headers.forEach((header: string, index: number) => {
        payment[header.toLowerCase().replace(/\s+/g, '_')] = row[index] || ''
      })
      return payment
    })

    return {
      success: true,
      data: payments,
      headers,
    }
  } catch (error: any) {
    console.error('Google Sheets dan to\'lovlarni o\'qish xatolik:', error)
    return { success: false, error: error.message }
  }
}

// Muayyan katakni o'qish
export async function getCellValue(cell: string) {
  try {
    const result = await readFromSheets(cell)
    
    if (!result.success) {
      return result
    }

    const values = result.data || []
    if (values.length === 0 || values[0].length === 0) {
      return { success: true, value: null }
    }

    return {
      success: true,
      value: values[0][0],
    }
  } catch (error: any) {
    console.error('Google Sheets dan katak o\'qish xatolik:', error)
    return { success: false, error: error.message }
  }
}

// Muayyan qatorni o'qish
export async function getRow(rowNumber: number) {
  try {
    const result = await readFromSheets(`A${rowNumber}:Z${rowNumber}`)
    
    if (!result.success) {
      return result
    }

    const rows = result.data || []
    if (rows.length === 0) {
      return { success: true, data: [] }
    }

    return {
      success: true,
      data: rows[0],
    }
  } catch (error: any) {
    console.error('Google Sheets dan qator o\'qish xatolik:', error)
    return { success: false, error: error.message }
  }
}

// Muayyan ustunni o'qish
export async function getColumn(column: string) {
  try {
    const result = await readFromSheets(`${column}:${column}`)
    
    if (!result.success) {
      return result
    }

    const rows = result.data || []
    const values = rows.map((row: any[]) => row[0] || '')

    return {
      success: true,
      data: values,
    }
  } catch (error: any) {
    console.error('Google Sheets dan ustun o\'qish xatolik:', error)
    return { success: false, error: error.message }
  }
}

// Muayyan diapazonni o'qish
export async function getRange(startCell: string, endCell: string) {
  try {
    const range = `${startCell}:${endCell}`
    const result = await readFromSheets(range)
    
    if (!result.success) {
      return result
    }

    return {
      success: true,
      data: result.data || [],
    }
  } catch (error: any) {
    console.error('Google Sheets dan diapazon o\'qish xatolik:', error)
    return { success: false, error: error.message }
  }
}

// To'lovlar statistikasini o'qish (Google Sheets'dan)
export async function getPaymentStatsFromSheets() {
  try {
    // Statistikalar kataklarini o'qish
    // Bu kataklar Google Sheets'da hisoblanadi
    const statsRange = process.env.GOOGLE_SHEETS_STATS_RANGE || 'A1:B10'
    const result = await readFromSheets(statsRange)
    
    if (!result.success) {
      return result
    }

    // Statistikalar object'ga aylantirish
    const stats: any = {}
    const rows = result.data || []
    
    rows.forEach((row: any[]) => {
      if (row.length >= 2) {
        const key = row[0]
        const value = row[1]
        stats[key] = value
      }
    })

    return {
      success: true,
      data: stats,
    }
  } catch (error: any) {
    console.error('Google Sheets dan statistika o\'qish xatolik:', error)
    return { success: false, error: error.message }
  }
}

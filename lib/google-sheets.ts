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
        if (publicUrl.includes('/pubhtml')) {
          // /pubhtml ni /pub?output=csv ga o'zgartirish
          csvUrl = publicUrl.replace('/pubhtml', '/pub?output=csv')
        } else if (publicUrl.includes('/pub')) {
          // Agar allaqachon /pub bo'lsa, faqat output=csv qo'shamiz
          csvUrl = publicUrl.includes('?') 
            ? `${publicUrl}&output=csv` 
            : `${publicUrl}?output=csv`
        } else if (publicUrl.includes('/e/2PACX-')) {
          // Agar /e/2PACX-... bo'lsa lekin /pubhtml bo'lmasa, /pub?output=csv qo'shamiz
          // Format: .../e/2PACX-... -> .../e/2PACX-.../pub?output=csv
          csvUrl = publicUrl.endsWith('/') 
            ? `${publicUrl}pub?output=csv`
            : `${publicUrl}/pub?output=csv`
        } else {
          // Boshqa holatda, to'g'ridan-to'g'ri ishlatish
          csvUrl = publicUrl
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
    console.log('Google Sheets CSV URL:', csvUrl)
    const response = await fetch(csvUrl)
    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error('Google Sheets CSV o\'qish xatolik:', {
        status: response.status,
        statusText: response.statusText,
        url: csvUrl,
        error: errorText.substring(0, 200)
      })
      return { 
        success: false, 
        error: `HTTP ${response.status}: ${response.statusText}. URL: ${csvUrl}` 
      }
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
      // Agar public URL bo'lsa va CSV o'qish muvaffaqiyatsiz bo'lsa, xatolikni qaytarish
      return { 
        success: false, 
        error: csvResult.error || 'Google Sheets dan CSV o\'qishda xatolik' 
      }
    }

    // API key orqali o'qish
    const apiKey = process.env.GOOGLE_SHEETS_API_KEY
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID
    
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
        } else {
          return { 
            success: false, 
            error: `API key orqali o'qishda xatolik: HTTP ${response.status}` 
          }
        }
      } catch (error: any) {
        return { 
          success: false, 
          error: `API key orqali o'qishda xatolik: ${error.message}` 
        }
      }
    }

    // Service account orqali o'qish (faqat agar public URL va API key bo'lmasa)
    const client = await initializeSheetsClient()
    if (!client) {
      return { 
        success: false, 
        error: 'Google Sheets client topilmadi. Iltimos, GOOGLE_SHEETS_PUBLIC_URL yoki GOOGLE_SHEETS_API_KEY ni sozlang.' 
      }
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
    // 1-qatorni o'qib, ustun nomlarini topamiz
    const headersResult = await readFromSheets('A1:ASA1')
    if (!headersResult.success) {
      return headersResult
    }
    
    const headers = headersResult.data?.[0] || []
    
    // 2-qatorni o'qish (statistikalar)
    const statsResult = await readFromSheets('A2:ASA2')
    if (!statsResult.success) {
      return statsResult
    }
    
    const statsRow = statsResult.data?.[0] || []
    
    // Bugungi sana
    const today = new Date()
    const todayDay = today.getDate()
    const todayMonth = today.getMonth() + 1 // 1-12
    const todayYear = today.getFullYear()
    
    // Sana formatlari
    const dateFormats = [
      `${String(todayDay).padStart(2, '0')}.${String(todayMonth).padStart(2, '0')}.${todayYear}`, // 04.02.2024
      `${String(todayDay).padStart(2, '0')}.${String(todayMonth).padStart(2, '0')}.${todayYear + 1}`, // 04.02.2025
      `${todayDay}.${todayMonth}.${todayYear}`, // 4.2.2024
      `${todayDay}/${todayMonth}/${todayYear}`, // 4/2/2024
    ]
    
    // 1. Qarzdorlik - S2 katakdan (S ustuni = 19-ustun, index 18)
    let qarzdorlik = 0
    const sColumnIndex = 18 // S ustuni (A=0, B=1, ..., S=18)
    if (statsRow[sColumnIndex] !== undefined) {
      const value = statsRow[sColumnIndex]
      const numValue = parseFloat(String(value).replace(/[^\d.-]/g, '')) || 0
      qarzdorlik = Math.abs(numValue) // Absolyut qiymat
      console.log(`✅ Qarzdorlik (S2): ${qarzdorlik}`)
    }
    
    // 2. Oylik to'lov - D2 dan P2 gacha (D=4, P=16, index 3-15)
    // Joriy oyning ustunini topish
    const monthNames = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
      'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
    ]
    const currentMonthName = monthNames[todayMonth - 1]
    
    let oylikTolov = 0
    let monthColumnIndex = -1
    
    // D dan P gacha (index 3-15) oylarni qidirish
    for (let i = 3; i <= 15; i++) {
      const header = String(headers[i] || '').trim()
      if (header.toLowerCase().includes(currentMonthName.toLowerCase())) {
        monthColumnIndex = i
        break
      }
    }
    
    if (monthColumnIndex >= 0 && statsRow[monthColumnIndex] !== undefined) {
      const value = statsRow[monthColumnIndex]
      const numValue = parseFloat(String(value).replace(/[^\d.-]/g, '')) || 0
      oylikTolov = numValue
      console.log(`✅ Oylik to'lov (${headers[monthColumnIndex]}): ${oylikTolov}`)
    }
    
    // 3. Bugun to'lov - T2 dan ASA2 gacha (T=20, index 19 dan oxirigacha)
    // Bugungi sananing ustunini topish
    let bugunTolov = 0
    let todayColumnIndex = -1
    
    // T dan oxirigacha (index 19 dan) sanalarni qidirish
    for (let i = 19; i < headers.length; i++) {
      const header = String(headers[i] || '').trim()
      // Sana formatlarini tekshirish
      const matchesFormat = dateFormats.some(format => {
        if (header === format) return true
        // Qisman mos kelish
        const formatParts = format.split(/[.\/-]/)
        const headerParts = header.split(/[.\/-]/)
        if (formatParts.length >= 2 && headerParts.length >= 2) {
          if (formatParts[0] === headerParts[0] && formatParts[1] === headerParts[1]) {
            return true
          }
        }
        return false
      })
      
      if (matchesFormat) {
        todayColumnIndex = i
        break
      }
    }
    
    if (todayColumnIndex >= 0 && statsRow[todayColumnIndex] !== undefined) {
      const value = statsRow[todayColumnIndex]
      const numValue = parseFloat(String(value).replace(/[^\d.-]/g, '')) || 0
      bugunTolov = numValue
      console.log(`✅ Bugun to'lov (${headers[todayColumnIndex]}): ${bugunTolov}`)
    }
    
    return {
      success: true,
      data: {
        totalDebt: qarzdorlik,
        totalPayments: oylikTolov,
        totalIncome: bugunTolov,
        debug: {
          sColumnIndex,
          monthColumnIndex,
          todayColumnIndex,
          currentMonth: currentMonthName,
        },
      },
    }
  } catch (error: any) {
    console.error('Google Sheets dan statistika o\'qish xatolik:', error)
    return { success: false, error: error.message }
  }
}

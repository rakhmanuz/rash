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
    // Barcha ma'lumotlarni o'qish (kengroq diapazon)
    const result = await readFromSheets('A1:Z1000')
    
    if (!result.success) {
      return result
    }

    const rows = result.data || []
    if (rows.length === 0) {
      return {
        success: true,
        data: {
          totalIncome: 0,
          totalDebt: 0,
          totalPayments: 0,
        },
      }
    }

    // Birinchi qator - headers
    const headers = rows[0] || []
    
    // Bugungi sana
    const today = new Date()
    const todayDay = today.getDate()
    const todayMonth = today.getMonth() + 1 // 1-12
    const todayYear = today.getFullYear()
    
    // Sana formatlari (turli xil formatlarni qo'llab-quvvatlash)
    const dateFormats = [
      `${todayDay}.${todayMonth}.${todayYear}`, // 4.2.2024
      `${todayDay}/${todayMonth}/${todayYear}`, // 4/2/2024
      `${todayYear}-${String(todayMonth).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`, // 2024-02-04
      `${String(todayDay).padStart(2, '0')}.${String(todayMonth).padStart(2, '0')}.${todayYear}`, // 04.02.2024
      `${String(todayDay).padStart(2, '0')}.${String(todayMonth).padStart(2, '0')}.${todayYear + 1}`, // 04.02.2025 (keyingi yil)
    ]
    
    console.log('📊 Google Sheets Stats Debug:', {
      today: `${String(todayDay).padStart(2, '0')}.${String(todayMonth).padStart(2, '0')}.${todayYear}`,
      dateFormats,
      headers: headers.slice(0, 10), // Birinchi 10 ta header
    })

    // Joriy oy nomlari (O'zbek va Ingliz)
    const monthNames = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
      'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
    ]
    const monthNamesEn = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    const currentMonthName = monthNames[todayMonth - 1]
    const currentMonthNameEn = monthNamesEn[todayMonth - 1]
    const currentMonthNumber = String(todayMonth).padStart(2, '0')

    // 1. Jami Kirim - Bugungi sananing ustunini topish
    let todayColumnIndex = -1
    for (let i = 0; i < headers.length; i++) {
      const header = String(headers[i] || '').trim()
      // Sana formatlarini tekshirish (to'liq mos kelish yoki qisman)
      const matchesFormat = dateFormats.some(format => {
        // To'liq mos kelish
        if (header === format) return true
        // Qisman mos kelish (masalan, "01.02.2025" ichida "01.02" bor)
        const formatParts = format.split(/[.\/-]/)
        const headerParts = header.split(/[.\/-]/)
        if (formatParts.length >= 2 && headerParts.length >= 2) {
          // Kun va oy mos kelishi
          if (formatParts[0] === headerParts[0] && formatParts[1] === headerParts[1]) {
            return true
          }
        }
        return false
      })
      
      if (matchesFormat) {
        todayColumnIndex = i
        console.log(`✅ Bugungi sana ustuni topildi: "${header}" (index: ${i})`)
        break
      }
    }
    
    if (todayColumnIndex === -1) {
      console.warn('⚠️ Bugungi sana ustuni topilmadi. Qidirilgan formatlar:', dateFormats)
    }

    let totalIncome = 0
    if (todayColumnIndex >= 0) {
      // Bugungi sananing ustunidagi barcha qiymatlarni qo'shish (2-qatordan boshlab)
      for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex] || []
        const value = row[todayColumnIndex]
        if (value) {
          const numValue = parseFloat(String(value).replace(/[^\d.-]/g, '')) || 0
          totalIncome += numValue
        }
      }
    }

    // 2. Qarzdorlik - "Holat" ustunini topish va manfiy sonlarni qo'shish
    let statusColumnIndex = -1
    for (let i = 0; i < headers.length; i++) {
      const header = String(headers[i] || '').trim().toLowerCase()
      if (header.includes('holat') || header.includes('status') || header === 's' || header === 'holat') {
        statusColumnIndex = i
        console.log(`✅ Holat ustuni topildi: "${headers[i]}" (index: ${i})`)
        break
      }
    }
    
    if (statusColumnIndex === -1) {
      console.warn('⚠️ Holat ustuni topilmadi. Qidirilgan: "holat", "status", "s"')
    }

    let totalDebt = 0
    if (statusColumnIndex >= 0) {
      // "Holat" ustunidagi manfiy sonlarni qo'shish (2-qatordan boshlab)
      for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex] || []
        const value = row[statusColumnIndex]
        if (value) {
          const numValue = parseFloat(String(value).replace(/[^\d.-]/g, '')) || 0
          // Faqat manfiy sonlarni qo'shish (qarzdorlik)
          if (numValue < 0) {
            totalDebt += Math.abs(numValue) // Absolyut qiymat
          }
        }
      }
    }

    // 3. Jami To'lovlar - Joriy oyning ustunini topish
    let monthColumnIndex = -1
    for (let i = 0; i < headers.length; i++) {
      const header = String(headers[i] || '').trim()
      // Oy nomini yoki raqamini tekshirish (case-insensitive)
      const headerLower = header.toLowerCase()
      if (
        headerLower === currentMonthName.toLowerCase() ||
        headerLower === currentMonthNameEn.toLowerCase() ||
        headerLower.includes(currentMonthName.toLowerCase()) ||
        headerLower.includes(currentMonthNameEn.toLowerCase()) ||
        headerLower.includes(currentMonthNumber) ||
        headerLower.includes(`oy ${todayMonth}`) ||
        headerLower.includes(`month ${todayMonth}`)
      ) {
        monthColumnIndex = i
        console.log(`✅ Joriy oy ustuni topildi: "${header}" (index: ${i})`)
        break
      }
    }
    
    if (monthColumnIndex === -1) {
      console.warn(`⚠️ Joriy oy ustuni topilmadi. Qidirilgan: "${currentMonthName}", "${currentMonthNameEn}", "${currentMonthNumber}"`)
    }

    let totalPayments = 0
    if (monthColumnIndex >= 0) {
      // Joriy oyning ustunidagi barcha qiymatlarni qo'shish (2-qatordan boshlab)
      for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex] || []
        const value = row[monthColumnIndex]
        if (value) {
          const numValue = parseFloat(String(value).replace(/[^\d.-]/g, '')) || 0
          totalPayments += numValue
        }
      }
    }

    return {
      success: true,
      data: {
        totalIncome,
        totalDebt,
        totalPayments,
        // Debug ma'lumotlari
        debug: {
          todayColumnIndex,
          statusColumnIndex,
          monthColumnIndex,
          today: dateFormats[0],
          currentMonth: currentMonthName,
        },
      },
    }
  } catch (error: any) {
    console.error('Google Sheets dan statistika o\'qish xatolik:', error)
    return { success: false, error: error.message }
  }
}

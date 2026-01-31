import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET() {
  try {
    // Create workbook
    const workbook = XLSX.utils.book_new()
    
    // Create worksheet data
    const worksheetData = [
      // Header row
      ['Guruh nomi', 'Sana (DD/MM/YYYY)', 'Vaqtlar (vergul bilan ajratilgan)', 'Izohlar (ixtiyoriy)'],
      // Example rows
      ['Matematika 1', '01/02/2026', '08:00, 10:00, 14:00', 'Birinchi dars'],
      ['Fizika 1', '02/02/2026', '09:00, 13:00', ''],
      ['Ingliz tili', '03/02/2026', '05:30, 15:00, 18:00', 'Guruh darslari'],
    ]
    
    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 25 }, // Guruh nomi
      { wch: 18 }, // Sana
      { wch: 40 }, // Vaqtlar
      { wch: 30 }, // Izohlar
    ]
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dars Rejasi')
    
    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    
    // Return file as download
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="dars_rejasi_shablon.xlsx"',
      },
    })
  } catch (error) {
    console.error('Error generating Excel template:', error)
    return NextResponse.json(
      { error: 'Shablon yaratishda xatolik' },
      { status: 500 }
    )
  }
}

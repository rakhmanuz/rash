import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET() {
  try {
    // Create workbook
    const workbook = XLSX.utils.book_new()
    
    // Create worksheet data
    const worksheetData = [
      // Header row
      ['Ism', 'Login', 'Telefon', 'Parol', 'O\'quvchi ID', 'Guruh'],
      // Example rows
      ['Ali Valiyev', 'ali_valiyev', '+998901234567', 'parol123', 'STU001', 'Matematika 1'],
      ['Vali Aliyev', 'vali_aliyev', '+998901234568', 'parol123', 'STU002', 'Fizika 1'],
    ]
    
    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 20 }, // Ism
      { wch: 15 }, // Login
      { wch: 15 }, // Telefon
      { wch: 15 }, // Parol
      { wch: 15 }, // O'quvchi ID
      { wch: 20 }, // Guruh
    ]
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'O\'quvchilar')
    
    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    
    // Return file as download
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="o\'quvchilar_shablon.xlsx"',
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

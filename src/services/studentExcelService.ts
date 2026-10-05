import { Student, SchoolClass } from '../types';
import { storageService } from './storageService';
import * as XLSX from 'xlsx';

export const studentExcelService = {
  /**
   * Downloads a clean Excel (.xlsx) sample template for Student batch import.
   */
  downloadSampleTemplate: (institutionName: string = 'Kurum') => {
    const rows = [
      ['Öğrenci No', 'Adı', 'Soyadı', 'Sınıfı'],
      ['1001', 'Ahmet', 'Yılmaz', '8-A'],
      ['1002', 'Zeynep', 'Demir', '8-A'],
      ['1003', 'Mehmet', 'Kaya', '8-B'],
      ['1004', 'Ayşe', 'Çelik', '12-SAY-1'],
      ['1005', 'Mustafa', 'Şahin', '12-SAY-1']
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
      { wch: 14 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Öğrenci Listesi');

    const cleanInstName = institutionName.replace(/\s+/g, '_');
    XLSX.writeFile(wb, `Opteno_Ogrenci_Listesi_Sablonu_${cleanInstName}.xlsx`);
  },

  /**
   * Downloads CSV sample template for Student batch import (optional alternative).
   */
  downloadSampleCsvTemplate: (institutionName: string = 'Kurum') => {
    const csvRows = [
      'Öğrenci No,Adı,Soyadı,Sınıfı',
      '1001,Ahmet,Yılmaz,8-A',
      '1002,Zeynep,Demir,8-A',
      '1003,Mehmet,Kaya,8-B',
      '1004,Ayşe,Çelik,12-SAY-1',
      '1005,Mustafa,Şahin,12-SAY-1'
    ];

    const csvContent = '\uFEFF' + csvRows.join('\n'); // Add BOM for Excel UTF-8 support
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Opteno_Ogrenci_Listesi_Sablonu_${institutionName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Imports students directly from an uploaded File (.xlsx, .xls, .csv, .txt)
   */
  importStudentsFromFile: async (
    file: File,
    targetInstitutionId: string
  ): Promise<{ importedCount: number; createdClassesCount: number }> => {
    return new Promise((resolve, reject) => {
      const isExcelBinary = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

      if (isExcelBinary) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number)[][];

            const existingClasses = storageService.getClasses(targetInstitutionId);
            const existingStudents = storageService.getStudents(targetInstitutionId);
            let importedCount = 0;
            let createdClassesCount = 0;

            for (let i = 0; i < rows.length; i++) {
              const row = rows[i];
              if (!row || row.length === 0) continue;

              const col0 = String(row[0] || '').trim();
              if (
                i === 0 &&
                (col0.toLowerCase().includes('öğrenci no') ||
                  col0.toLowerCase().includes('okul no') ||
                  col0.toLowerCase().includes('no'))
              ) {
                continue;
              }

              if (row.length < 3) continue;
              const studentNo = String(row[0] || '').trim();
              const firstName = String(row[1] || '').trim();
              const lastName = String(row[2] || '').trim();
              const className = String(row[3] || 'Genel').trim();

              if (!studentNo || !firstName || !lastName) continue;

              let targetClass = existingClasses.find(
                c => c.name.toLowerCase() === className.toLowerCase()
              );

              if (!targetClass) {
                let gradeLevel = 12;
                const gradeMatch = className.match(/\d+/);
                if (gradeMatch) gradeLevel = parseInt(gradeMatch[0], 10);

                targetClass = {
                  id: `cls-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                  institutionId: targetInstitutionId,
                  name: className,
                  gradeLevel,
                  studentCount: 0
                };
                storageService.addClass(targetClass);
                existingClasses.push(targetClass);
                createdClassesCount++;
              }

              const existingStudentIndex = existingStudents.findIndex(
                s => s.studentNo === studentNo && s.institutionId === targetInstitutionId
              );

              const newStudent: Student = {
                id:
                  existingStudentIndex >= 0
                    ? existingStudents[existingStudentIndex].id
                    : `std-${Date.now()}-${i}`,
                institutionId: targetInstitutionId,
                classId: targetClass.id,
                className: targetClass.name,
                studentNo,
                firstName,
                lastName
              };

              storageService.addStudent(newStudent);
              importedCount++;
            }

            resolve({ importedCount, createdClassesCount });
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = err => reject(err);
        reader.readAsArrayBuffer(file);
      } else {
        const reader = new FileReader();
        reader.onload = e => {
          const text = e.target?.result as string;
          const result = studentExcelService.importStudentsFromText(text, targetInstitutionId);
          resolve(result);
        };
        reader.onerror = err => reject(err);
        reader.readAsText(file, 'UTF-8');
      }
    });
  },

  /**
   * Parses CSV / Excel file text and imports students into storage,
   * automatically creating any missing classes.
   */
  importStudentsFromText: (
    fileText: string,
    targetInstitutionId: string
  ): { importedCount: number; createdClassesCount: number } => {
    if (!fileText || !targetInstitutionId) {
      return { importedCount: 0, createdClassesCount: 0 };
    }

    const existingClasses = storageService.getClasses(targetInstitutionId);
    const existingStudents = storageService.getStudents(targetInstitutionId);

    const lines = fileText.split(/\r?\n/);
    let importedCount = 0;
    let createdClassesCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Skip header line if detected
      if (
        i === 0 &&
        (line.toLowerCase().includes('öğrenci no') ||
          line.toLowerCase().includes('okul no') ||
          line.toLowerCase().includes('adı'))
      ) {
        continue;
      }

      const parts = line.split(/[,;\t]/).map(p => p.replace(/"/g, '').trim());
      if (parts.length < 3) continue;

      const studentNo = parts[0];
      const firstName = parts[1];
      const lastName = parts[2];
      const className = parts[3] || 'Genel';

      if (!studentNo || !firstName || !lastName) continue;

      // Check if class exists, if not create it
      let targetClass = existingClasses.find(
        c => c.name.toLowerCase() === className.toLowerCase()
      );

      if (!targetClass) {
        let gradeLevel = 12;
        const gradeMatch = className.match(/\d+/);
        if (gradeMatch) {
          gradeLevel = parseInt(gradeMatch[0], 10);
        }

        targetClass = {
          id: `cls-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          institutionId: targetInstitutionId,
          name: className,
          gradeLevel,
          studentCount: 0
        };

        storageService.addClass(targetClass);
        existingClasses.push(targetClass);
        createdClassesCount++;
      }

      // Check if student with same studentNo already exists in institution
      const existingStudentIndex = existingStudents.findIndex(
        s => s.studentNo === studentNo && s.institutionId === targetInstitutionId
      );

      const newStudent: Student = {
        id: existingStudentIndex >= 0 ? existingStudents[existingStudentIndex].id : `std-${Date.now()}-${i}`,
        institutionId: targetInstitutionId,
        classId: targetClass.id,
        className: targetClass.name,
        studentNo,
        firstName,
        lastName
      };

      storageService.addStudent(newStudent);
      importedCount++;
    }

    return { importedCount, createdClassesCount };
  }
};

// utils/csv.ts
import { Parser } from "@json2csv/plainjs";

// Helper function to convert data to a flat structure for CSV
const flattenObject = (obj: any, parentKey = "", result: any = {}) => {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newKey = parentKey ? `${parentKey}.${key}` : key;
      if (typeof obj[key] === "object" && obj[key] !== null) {
        flattenObject(obj[key], newKey, result);
      } else {
        result[newKey] = obj[key];
      }
    }
  }
  return result;
};

// Map of English keys to Chinese headers for export
const fieldNameMap: { [key: string]: string } = {
  propertyName: "物件名稱",
  area: "主要都市",
  district: "行政區",
  otherDistrict: "其他行政區",
  source: "物件來源",
  otherSource: "其他來源",
  type: "房屋種類",
  carParkType: "車位形式",
  carParkFloor: "車位樓層",
  layoutRooms: "房間數",
  layoutLivingRooms: "客餐廳數",
  layoutBathrooms: "衛浴數",
  hasPXMart: "附近是否有全聯",
  address: "地址",
  floor: "樓層",
  totalPing: "權狀坪數",
  mainBuildingPing: "主建物(坪)",
  accessoryBuildingPing: "附屬建物(坪)",
  carParkPing: "車位(坪)",
  totalAmount: "總價(萬)",
  carParkPrice: "車位價格(萬)",
  buildingAge: "屋齡",
  mrtStation: "附近的捷運站",
  mrtDistance: "距離捷運站幾公尺",
  notes: "備註",
  rating_採光: "採光",
  rating_生活機能: "生活機能",
  rating_交通: "交通",
  rating_價格滿意度: "價格滿意度",
  rating_未來發展潛力: "未來發展潛力",
  unitPrice: "單坪價格(萬)",
  indoorUsablePing: "室內可用坪數",
  publicAreaRatio: "公設比",
  totalRating: "物件評分",
  communityName: "社區名稱",
  reason: "獲選的原因",
  id: "記錄ID",
  timestamp: "時間戳記",
  type: "物件類型", // This refers to record.type (指定社區/一般物件)
};

// Fields to exclude from the general display, but include in CSV for completeness
const fieldsToExcludeFromDisplay = ["otherDistrict", "otherSource"];

export const exportToCsv = (records: any[]) => {
  if (records.length === 0) {
    alert("沒有記錄可以匯出。");
    return;
  }

  const dataForCsv = records.map((record) => {
    const flattened = flattenObject(record); // Flatten the entire record object
    // Map keys to Chinese headers for CSV output
    const row: any = {};
    for (const key in flattened) {
      if (Object.prototype.hasOwnProperty.call(flattened, key)) {
        // Use fieldNameMap for `formData.key` or directly for `id`, `timestamp`, `type`
        if (key.startsWith("formData.")) {
          const originalKey = key.substring("formData.".length);
          row[fieldNameMap[originalKey] || originalKey] = flattened[key];
        } else {
          row[fieldNameMap[key] || key] = flattened[key];
        }
      }
    }
    return row;
  });

  try {
    const parser = new Parser({
      fields: Object.keys(dataForCsv[0]), // Use keys from the first row as headers
      // Use the actual mapped headers from dataForCsv[0] to ensure correct order and names
      // Or, if you want a fixed order, define it explicitly here:
      // fields: Object.values(fieldNameMap).filter(f => dataForCsv[0][f] !== undefined), // This would be more robust for consistent headers
    });
    const csv = parser.parse(dataForCsv);

    const blob = new Blob([`\ufeff${csv}`], {
      type: "text/csv;charset=utf-8;",
    }); // Add BOM for Chinese characters
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `property_records_${Date.now()}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    alert("記錄已成功匯出為 CSV 檔案！");
  } catch (err) {
    console.error("匯出 CSV 時發生錯誤:", err);
    alert("匯出 CSV 時發生錯誤。請檢查控制台。");
  }
};

export const importFromCsv = (file: File) => {
  return new Promise<any[]>((resolve, reject) => {
    if (!file || file.type !== "text/csv") {
      reject(new Error("請選擇一個有效的 CSV 檔案。"));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text
          .split(/\r\n|\n/)
          .filter((line) => line.trim() !== ""); // Handle empty lines
        if (lines.length < 1) {
          reject(new Error("CSV 檔案內容為空。"));
          return;
        }

        // Reverse map for import (Chinese header to English key)
        const reverseFieldNameMap: { [key: string]: string } = {};
        for (const key in fieldNameMap) {
          if (Object.prototype.hasOwnProperty.call(fieldNameMap, key)) {
            reverseFieldNameMap[fieldNameMap[key]] = key;
          }
        }

        const headers = lines[0]
          .split(",")
          .map((h) => h.trim().replace(/^\ufeff/, "")); // Remove BOM if present
        const records: any[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = parseCsvLine(lines[i]); // Use a more robust CSV line parser
          if (values.length !== headers.length) {
            console.warn(
              `Skipping malformed row: ${lines[i]} (Expected ${headers.length} columns, got ${values.length})`
            );
            continue; // Skip malformed rows
          }

          const record: any = {
            formData: {},
            id: Date.now() + i, // Generate unique ID for imported records
            timestamp: new Date().toLocaleString(),
          };

          headers.forEach((header, index) => {
            const value = values[index];
            const originalKey = reverseFieldNameMap[header] || header; // Get original key

            if (originalKey === "id")
              record.id = parseInt(value, 10); // Keep original ID if available
            else if (originalKey === "timestamp") record.timestamp = value;
            else if (originalKey === "type")
              record.type =
                value; // This is the record type (指定社區/一般物件)
            else {
              // Determine if it's a number, and if so, parse it
              let parsedValue: string | number | null = value;
              if (!isNaN(parseFloat(value)) && !isNaN(Number(value))) {
                // Check if it's a number
                parsedValue = parseFloat(value);
              } else if (value === "是" || value === "否") {
                // For "是"/"否" options, keep as string
              } else if (value === "") {
                // Treat empty strings as null for numbers
                parsedValue = null;
              }
              record.formData[originalKey] = parsedValue;
            }
          });

          // Ensure calculated fields are initialized or re-calculated after import
          // These will be recalculated by useEffects in App.tsx after state update
          if (record.type === "一般物件") {
            record.formData.unitPrice = null;
            record.formData.indoorUsablePing = null;
            record.formData.publicAreaRatio = null;
            record.formData.totalRating = 0; // Initialize to 0 or null
          }

          records.push(record);
        }
        resolve(records);
      } catch (error) {
        reject(
          new Error(`解析 CSV 檔案時發生錯誤: ${(error as Error).message}`)
        );
      }
    };

    reader.onerror = () => {
      reject(new Error("無法讀取檔案。"));
    };

    reader.readAsText(file, "UTF-8"); // Read as UTF-8
  });
};

// A more robust CSV line parser to handle commas within quoted fields
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let inQuote = false;
  let currentField = "";
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuote && line[i + 1] === '"') {
        // Handle escaped quotes ""
        currentField += '"';
        i++; // Skip the next quote
      } else {
        inQuote = !inQuote;
      }
    } else if (char === "," && !inQuote) {
      result.push(currentField);
      currentField = "";
    } else {
      currentField += char;
    }
  }
  result.push(currentField); // Add the last field
  return result;
}

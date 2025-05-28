// src/utils/csv.ts

// ============== 介面定義 START ==============
// 這些介面必須與 App.tsx 中的定義保持一致
interface GeneralPropertyFormType {
  propertyName: string;
  area: string;
  district: string;
  otherDistrict: string;
  source: string;
  otherSource: string;
  type: string; // 房屋種類 (預售屋, 中古屋, 新成屋, 指定社區)
  carParkType: string;
  carParkFloor: string;
  layoutRooms: "" | string;
  layoutLivingRooms: "" | string;
  layoutBathrooms: "" | string;
  hasPXMart: string;
  address: string;
  floor: string;
  totalPing: "" | string;
  mainBuildingPing: "" | string;
  accessoryBuildingPing: "" | string;
  carParkPing: "" | string;
  totalAmount: "" | string;
  carParkPrice: "" | string;
  buildingAge: "" | string;
  mrtStation: string;
  mrtDistance: "" | string;
  notes: string;
  rating_採光: "" | string;
  rating_生活機能: "" | string;
  rating_交通: "" | string;
  rating_價格滿意度: "" | string;
  rating_未來發展潛力: "" | string;
  unitPrice: number | null;
  indoorUsablePing: number | null;
  publicAreaRatio: number | null;
  totalRating: number | null;
}

interface CommunityFormType {
  area: string;
  district: string;
  communityName: string;
  address: string;
  reason: string;
}

type ObjectCategory = "general" | "community"; // 與 App.tsx 中的定義一致

interface RecordType {
  id: number;
  timestamp: string;
  objectCategory: ObjectCategory; // 新增的物件類別屬性
  formData: GeneralPropertyFormType | CommunityFormType;
}
// ============== 介面定義 END ==============


// 映射物件欄位到 CSV 標頭
const fieldNameMap: { [key: string]: string } = {
  // 核心記錄屬性 (CSV 中新增)
  objectCategory: "物件類別", // 新增的 CSV 欄位
  id: "ID",
  timestamp: "時間",

  // 一般物件的欄位
  propertyName: "物件名稱",
  area: "主要都市",
  district: "行政區",
  otherDistrict: "其他行政區",
  source: "物件來源",
  otherSource: "其他來源",
  type: "房屋種類", // 這是房屋種類 (預售屋, 中古屋等)，而不是物件類別
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

  // 指定社區的欄位 (這些欄位只會出現在 CommunityFormType 中)
  communityName: "社區名稱",
  reason: "獲選的原因",
};

// 所有可能的 CSV 標頭順序
// 這個順序決定了 CSV 檔案中欄位的排列
const csvHeaders = [
  "ID",
  "時間",
  "物件類別", // 新增的欄位
  "物件名稱",
  "主要都市",
  "行政區",
  "其他行政區",
  "物件來源",
  "其他來源",
  "房屋種類", // 這個是 type，代表預售屋、中古屋等
  "車位形式",
  "車位樓層",
  "房間數",
  "客餐廳數",
  "衛浴數",
  "附近是否有全聯",
  "地址",
  "樓層",
  "權狀坪數",
  "主建物(坪)",
  "附屬建物(坪)",
  "車位(坪)",
  "總價(萬)",
  "車位價格(萬)",
  "屋齡",
  "附近的捷運站",
  "距離捷運站幾公尺",
  "備註",
  "採光",
  "生活機能",
  "交通",
  "價格滿意度",
  "未來發展潛力",
  "單坪價格(萬)",
  "室內可用坪數",
  "公設比",
  "物件評分",
  "社區名稱", // 指定社區欄位
  "獲選的原因", // 指定社區欄位
];

export const exportToCsv = (records: RecordType[]) => {
  if (records.length === 0) {
    alert("沒有記錄可以匯出！");
    return;
  }

  // 映射中文標頭到英文鍵名
  const reverseFieldNameMap: { [key: string]: string } = {};
  for (const key in fieldNameMap) {
    if (Object.prototype.hasOwnProperty.call(fieldNameMap, key)) {
      reverseFieldNameMap[fieldNameMap[key]] = key;
    }
  }

  const headerRow = csvHeaders.map(header => `"${header.replace(/"/g, '""')}"`).join(","); // 確保標頭也被正確引用
  const dataRows = records.map((record) => {
    const row: (string | number | null)[] = [];
    csvHeaders.forEach((header) => {
      const fieldKey = reverseFieldNameMap[header]; // 獲取英文鍵名

      if (!fieldKey) {
        row.push(""); // 如果 CSV 標頭沒有對應的鍵名，則留空
        return;
      }

      let value: any = null;

      // 特殊處理 id, timestamp 和新的 objectCategory
      if (fieldKey === "id") {
        value = record.id;
      } else if (fieldKey === "timestamp") {
        value = record.timestamp;
      } else if (fieldKey === "objectCategory") {
        // 匯出 objectCategory 為中文
        value = record.objectCategory === "general" ? "一般物件" : "指定社區";
      } else {
        // 從 formData 中獲取值，根據 objectCategory 判斷類型
        if (record.objectCategory === "general") {
            const generalFormData = record.formData as GeneralPropertyFormType;
            value = generalFormData[fieldKey as keyof GeneralPropertyFormType];
        } else if (record.objectCategory === "community") {
            const communityFormData = record.formData as CommunityFormType;
            value = communityFormData[fieldKey as keyof CommunityFormType];
        }
      }

      // 確保將 undefined 或 null 轉換為空字串，並處理逗號
      row.push(value === undefined || value === null || value === "" ? "" : `"${String(value).replace(/"/g, '""')}"`);
    });
    return row.join(",");
  });

  const csvContent = [headerRow, ...dataRows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "property_records.csv");
  link.click();
  URL.revokeObjectURL(url);
};

export const importFromCsv = async (file: File): Promise<RecordType[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim() !== "");

      if (lines.length < 1) {
        reject(new Error("CSV 檔案內容為空。"));
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
      const importedRecords: RecordType[] = [];

      // 反向映射 CSV 標頭到英文鍵名
      const reverseFieldNameMap: { [key: string]: string } = {};
      for (const key in fieldNameMap) {
        if (Object.prototype.hasOwnProperty.call(fieldNameMap, key)) {
          reverseFieldNameMap[fieldNameMap[key]] = key;
        }
      }

      for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i]); // 使用 helper 函數解析行
        if (values.length !== headers.length) {
          console.warn(`Skipping malformed row ${i + 1}: ${lines[i]}`);
          continue; // 跳過格式不正確的行
        }

        let record: Partial<RecordType> = {};
        let formData: Partial<GeneralPropertyFormType & CommunityFormType> = {}; // 使用交叉類型方便賦值
        let objectCategory: ObjectCategory | undefined; // 儲存解析到的物件類別

        headers.forEach((header, index) => {
          const fieldKey = reverseFieldNameMap[header];
          let value = values[index];

          if (fieldKey) {
            // 將空字串轉換為空字串，避免數字轉換問題
            const processedValue: string = value === "" ? "" : value;

            if (fieldKey === "id") {
              record.id = parseInt(processedValue as string, 10);
            } else if (fieldKey === "timestamp") {
              record.timestamp = processedValue as string;
            } else if (fieldKey === "objectCategory") {
              // 根據中文值設置 objectCategory
              if (processedValue === "一般物件") {
                objectCategory = "general";
              } else if (processedValue === "指定社區") {
                objectCategory = "community";
              } else {
                console.warn(`Unknown objectCategory: ${processedValue}. Attempting to infer.`);
              }
            } else {
              // 對於數字欄位嘗試轉換為數字，否則保留字串或空字串
              const numericFields = [
                "totalPing", "mainBuildingPing", "accessoryBuildingPing", "carParkPing",
                "totalAmount", "carParkPrice", "buildingAge", "mrtDistance",
                "unitPrice", "indoorUsablePing", "publicAreaRatio", "totalRating"
              ];
              // 評分欄位也是數字，但它們是字串形式的 "1", "2"
              const ratingFields = ratingCategories.map(cat => `rating_${cat}`);

              if (numericFields.includes(fieldKey) && processedValue !== "") {
                const numValue = parseFloat(processedValue);
                if (!isNaN(numValue)) {
                  (formData as any)[fieldKey] = numValue;
                } else {
                  (formData as any)[fieldKey] = processedValue; // 保持為原始字串
                }
              } else if (ratingFields.includes(fieldKey)) {
                  // 評分欄位直接賦值，因為其值為字串 "1"~"5"
                  (formData as any)[fieldKey] = processedValue;
              }
              else {
                (formData as any)[fieldKey] = processedValue;
              }
            }
          }
        });

        // 確保 objectCategory 有被設定，如果沒有則嘗試推斷
        if (!objectCategory) {
            // 如果 CSV 沒有 objectCategory 欄位或值無效，嘗試根據其他欄位推斷
            if (formData.communityName || formData.reason) { // 如果有指定社區特有欄位
                objectCategory = "community";
            } else {
                objectCategory = "general"; // 預設為一般物件
            }
        }

        // 根據 objectCategory 來創建正確的 formData 結構
        let finalFormData: GeneralPropertyFormType | CommunityFormType;
        if (objectCategory === "general") {
            // 為 GeneralPropertyFormType 補齊所有預期屬性，確保類型完整
            finalFormData = {
                propertyName: "", area: "", district: "", otherDistrict: "", source: "", otherSource: "",
                type: "", carParkType: "", carParkFloor: "", layoutRooms: "", layoutLivingRooms: "",
                layoutBathrooms: "", hasPXMart: "", address: "", floor: "", totalPing: "",
                mainBuildingPing: "", accessoryBuildingPing: "", carParkPing: "", totalAmount: "",
                carParkPrice: "", buildingAge: "", mrtStation: "", mrtDistance: "", notes: "",
                rating_採光: "", rating_生活機能: "", rating_交通: "", rating_價格滿意度: "",
                rating_未來發展潛力: "", unitPrice: null, indoorUsablePing: null, publicAreaRatio: null,
                totalRating: null,
                ...formData // 覆蓋從 CSV 讀取到的值
            } as GeneralPropertyFormType;
        } else { // objectCategory === "community"
            // 為 CommunityFormType 補齊所有預期屬性
            finalFormData = {
                area: "", district: "", communityName: "", address: "", reason: "",
                ...formData
            } as CommunityFormType;
        }

        // 確保 record 的 id, timestamp, objectCategory 已被設定
        if (record.id !== undefined && record.timestamp && objectCategory) { // 檢查id不為undefined
          importedRecords.push({
            id: record.id,
            timestamp: record.timestamp,
            objectCategory: objectCategory,
            formData: finalFormData,
          });
        } else {
            console.warn(`Skipping record due to missing core data: ID=${record.id}, Timestamp=${record.timestamp}, Category=${objectCategory}. Original line: "${lines[i]}"`);
        }
      }
      resolve(importedRecords);
    };

    reader.onerror = (error) => {
      reject(new Error(`讀取檔案失敗: ${error.message || error}`));
    };
    reader.readAsText(file, "UTF-8");
  });
};

// Helper function to parse a CSV line with quoted fields
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let inQuote = false;
  let currentField = '';

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuote && nextChar === '"') { // Escaped double quote
        currentField += '"';
        i++; // Skip the next quote
      } else {
        inQuote = !inQuote;
      }
    } else if (char === ',' && !inQuote) {
      result.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
  }
  result.push(currentField); // Add the last field
  return result.map(field => field.replace(/^"|"$/g, '').replace(/""/g, '"')); // 移除首尾引號並解引用
}
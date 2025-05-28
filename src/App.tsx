import React, { useState, useEffect, useCallback, useRef } from "react";
import { exportToCsv, importFromCsv } from "./utils/csv";

// ============== 介面定義 START ==============
interface GeneralPropertyFormType {
  propertyName: string;
  area: string;
  district: string;
  otherDistrict: string;
  source: string;
  otherSource: string;
  type: string; // 這個 'type' 是房屋種類 (預售屋, 中古屋, 新成屋, 指定社區)
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
  // 新增計算後欄位，它們應該是 number 或 null
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

// 定義新的物件類別聯合類型
type ObjectCategory = "general" | "community";

interface RecordType {
  id: number;
  timestamp: string;
  objectCategory: ObjectCategory; // 新增的物件類別屬性
  // formData 的類型根據 objectCategory 而定
  formData: GeneralPropertyFormType | CommunityFormType;
}

// ============== 介面定義 END ==============

// 定義所有區域和其下的行政區選項
const areas = ["台北市", "新北市"];

const districtsByArea: { [key: string]: string[] } = {
  台北市: [
    "中正區",
    "大同區",
    "中山區",
    "松山區",
    "大安區",
    "萬華區",
    "信義區",
    "士林區",
    "北投區",
    "內湖區",
    "南港區",
    "文山區",
  ],
  新北市: [
    "板橋區",
    "三重區",
    "中和區",
    "永和區",
    "新莊區",
    "新店區",
    "土城區",
    "蘆洲區",
    "樹林區",
    "汐止區",
    "鶯歌區",
    "三峽區",
    "淡水區",
    "瑞芳區",
    "五股區",
    "泰山區",
    "林口區",
    "深坑區",
    "石碇區",
    "坪林區",
    "三芝區",
    "石門區",
    "八里區",
    "平溪區",
    "雙溪區",
    "貢寮區",
    "金山區",
    "萬里區",
    "烏來區",
    "其他區", // 新增 "其他區" 選項
  ],
};

const sources = ["永慶房屋", "信義房屋", "住商", "591", "樂居"];
const propertyTypes = [
  "預售屋",
  "中古屋",
  "新成屋",
  "店面",
  "辦公室",
  "土地",
  "其他",
];
const carParkTypes = ["坡道平面", "坡道機械", "升降平面", "升降機械", "無"];
const carParkFloors = ["B1", "B2", "B3", "B4", "B5", "1F", "RF"];
const roomOptions = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10+"];
const livingRoomOptions = ["1", "2", "3", "4", "5+"];
const bathroomOptions = ["1", "2", "3", "4", "5+"];
const yesNoOptions = ["是", "否"];
const ratingOptions = ["1", "2", "3", "4", "5"];

// 這裡加上 export，以便 csv.ts 可以導入
export const ratingCategories = [
  "採光",
  "生活機能",
  "交通",
  "價格滿意度",
  "未來發展潛力",
];

// 計算顯示的單坪價格
const calculateUnitPrice = (
  totalAmount: string,
  totalPing: string,
  carParkPrice: string,
  carParkPing: string
): number | null => {
  const totalAmountNum = parseFloat(totalAmount);
  const totalPingNum = parseFloat(totalPing);
  const carParkPriceNum = parseFloat(carParkPrice);
  const carParkPingNum = parseFloat(carParkPing);

  // 檢查所有數值是否有效
  if (
    isNaN(totalAmountNum) ||
    isNaN(totalPingNum) ||
    totalPingNum <= 0 ||
    (carParkPrice && isNaN(carParkPriceNum)) || // 如果有車位價格，檢查其有效性
    (carParkPing && isNaN(carParkPingNum)) // 如果有車位坪數，檢查其有效性
  ) {
    return null; // 無效輸入
  }

  let calculatedAmount = totalAmountNum;
  let calculatedPing = totalPingNum;

  // 如果有車位，從總價和總坪數中扣除車位部分
  if (!isNaN(carParkPriceNum) && !isNaN(carParkPingNum) && carParkPingNum > 0) {
    calculatedAmount -= carParkPriceNum;
    calculatedPing -= carParkPingNum;
  }

  if (calculatedPing <= 0) {
    return null; // 扣除車位後坪數為0或負數，無法計算單價
  }

  return parseFloat((calculatedAmount / calculatedPing).toFixed(2));
};

// 計算室內使用坪
const calculateIndoorUsablePing = (
  mainBuildingPing: string,
  accessoryBuildingPing: string
): number | null => {
  const mainBuildingPingNum = parseFloat(mainBuildingPing);
  const accessoryBuildingPingNum = parseFloat(accessoryBuildingPing);

  if (isNaN(mainBuildingPingNum) || isNaN(accessoryBuildingPingNum)) {
    return null;
  }
  return parseFloat(
    (mainBuildingPingNum + accessoryBuildingPingNum).toFixed(2)
  );
};

// 計算公設比
const calculatePublicAreaRatio = (
  totalPing: string,
  mainBuildingPing: string,
  accessoryBuildingPing: string
): number | null => {
  const totalPingNum = parseFloat(totalPing);
  const mainBuildingPingNum = parseFloat(mainBuildingPing);
  const accessoryBuildingPingNum = parseFloat(accessoryBuildingPing);

  if (
    isNaN(totalPingNum) ||
    totalPingNum <= 0 ||
    isNaN(mainBuildingPingNum) ||
    isNaN(accessoryBuildingPingNum)
  ) {
    return null;
  }

  const indoorUsable = mainBuildingPingNum + accessoryBuildingPingNum;
  if (indoorUsable >= totalPingNum) {
    return 0; // 室內坪數大於總坪數，公設比為0或數據有問題
  }

  return parseFloat(
    (((totalPingNum - indoorUsable) / totalPingNum) * 100).toFixed(2)
  );
};

// 用於 InputGroup 的類型
interface InputGroupProps {
  label: string;
  name: string;
  value: string | number | null;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;
  isSelect?: boolean;
  options?: string[];
  isTextArea?: boolean;
  rows?: number;
  placeholder?: string;
  type?: string; // 允許指定 input 的 type，例如 "text", "number"
}

// InputGroup 組件 (假設您已經定義或將定義在 App.tsx 內部)
const InputGroup: React.FC<InputGroupProps> = ({
  label,
  name,
  value,
  onChange,
  isSelect = false,
  options = [],
  isTextArea = false,
  rows = 3,
  placeholder = "",
  type = "text",
}) => {
  const id = `input-${name}`;

  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      {isSelect ? (
        <select
          id={id}
          name={name}
          value={value === null ? "" : value} // 將 null 轉換為空字串，以正確顯示下拉選單
          onChange={onChange}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
        >
          <option value="">請選擇</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : isTextArea ? (
        <textarea
          id={id}
          name={name}
          value={value === null ? "" : value} // 將 null 轉換為空字串
          onChange={onChange}
          rows={rows}
          placeholder={placeholder}
          className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-2"
        ></textarea>
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          value={value === null ? "" : value} // 將 null 轉換為空字串
          onChange={onChange}
          placeholder={placeholder}
          className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-2"
        />
      )}
    </div>
  );
};

// CalculatedValueDisplay 組件
interface CalculatedValueDisplayProps {
  label: string;
  value: string | number | null;
  unit: string;
}

const CalculatedValueDisplay: React.FC<CalculatedValueDisplayProps> = ({
  label,
  value,
  unit,
}) => {
  return (
    <div className="flex flex-col">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="mt-1 p-2 border border-gray-300 bg-gray-100 rounded-md text-gray-800 font-semibold text-sm">
        {value !== null && value !== "" ? `${value} ${unit}` : "N/A"}
      </div>
    </div>
  );
};

function App() {
  // isDesignatedCommunity 現在不僅控制顯示哪個表單，也幫助區分返回行為
  const [isDesignatedCommunity, setIsDesignatedCommunity] = useState<
    boolean | null
  >(null);

  const [designatedCommunityForm, setDesignatedCommunityForm] =
    useState<CommunityFormType>({
      area: "",
      district: "",
      communityName: "",
      address: "",
      reason: "",
    });

  // 初始一般物件表單狀態
  const initialGeneralPropertyForm: GeneralPropertyFormType = {
    propertyName: "",
    area: "",
    district: "",
    otherDistrict: "",
    source: "",
    otherSource: "",
    type: "", // 這個是房屋種類，預設空字串
    carParkType: "",
    carParkFloor: "",
    layoutRooms: "",
    layoutLivingRooms: "",
    layoutBathrooms: "",
    hasPXMart: "",
    address: "",
    floor: "",
    totalPing: "",
    mainBuildingPing: "",
    accessoryBuildingPing: "",
    carParkPing: "",
    totalAmount: "",
    carParkPrice: "",
    buildingAge: "",
    mrtStation: "",
    mrtDistance: "",
    notes: "",
    rating_採光: "",
    rating_生活機能: "",
    rating_交通: "",
    rating_價格滿意度: "",
    rating_未來發展潛力: "",
    unitPrice: null, // 初始化為 null
    indoorUsablePing: null, // 初始化為 null
    publicAreaRatio: null, // 初始化為 null
    totalRating: null, // 初始化為 null
  };

  const [generalPropertyForm, setGeneralPropertyForm] =
    useState<GeneralPropertyFormType>(initialGeneralPropertyForm);

  // 自動計算結果的狀態 (這些變為依賴 `generalPropertyForm` 而計算出的值)
  const [unitPrice, setUnitPrice] = useState<number | null>(null);
  const [indoorUsablePing, setIndoorUsablePing] = useState<number | null>(null);
  const [publicAreaRatio, setPublicAreaRatio] = useState<number | null>(null);
  const [totalRating, setTotalRating] = useState<number>(0);

  // 儲存的資料記錄，現在使用 RecordType 介面
  const [savedRecords, setSavedRecords] = useState<RecordType[]>(() => {
    const saved = localStorage.getItem("propertyRecords");
    // 解析時可能需要處理舊格式的資料，如果 localStorage 中有舊數據，需要轉換
    try {
      const parsed = saved ? JSON.parse(saved) : [];
      // 如果舊資料沒有 objectCategory，給予一個預設值（例如根據formData來判斷）
      return parsed.map((record: any) => {
        if (!record.objectCategory) {
          // 簡易判斷，如果formData中有communityName，則視為community
          const inferredCategory: ObjectCategory =
            record.formData && record.formData.communityName
              ? "community"
              : "general";
          return { ...record, objectCategory: inferredCategory };
        }
        return record;
      });
    } catch (e) {
      console.error("Error parsing saved records from localStorage:", e);
      return []; // 返回空陣列以避免應用程式崩潰
    }
  });

  // 編輯模式的 ID
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  // 控制顯示記錄列表
  const [showRecords, setShowRecords] = useState(true);

  // 用於匯入檔案的 ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 效果：當表單數據改變時，自動計算單價、室內坪數和公設比
  useEffect(() => {
    // 只有在一般物件表單時才進行這些計算
    if (isDesignatedCommunity === false) {
      setUnitPrice(
        calculateUnitPrice(
          generalPropertyForm.totalAmount,
          generalPropertyForm.totalPing,
          generalPropertyForm.carParkPrice,
          generalPropertyForm.carParkPing
        )
      );
      setIndoorUsablePing(
        calculateIndoorUsablePing(
          generalPropertyForm.mainBuildingPing,
          generalPropertyForm.accessoryBuildingPing
        )
      );
      setPublicAreaRatio(
        calculatePublicAreaRatio(
          generalPropertyForm.totalPing,
          generalPropertyForm.mainBuildingPing,
          generalPropertyForm.accessoryBuildingPing
        )
      );

      // 計算總評分
      const ratings = ratingCategories.map(
        (category) =>
          parseFloat(
            generalPropertyForm[
              `rating_${category}` as keyof typeof generalPropertyForm
            ] as string
          ) || 0
      );
      const sumRatings = ratings.reduce((sum, current) => sum + current, 0);
      setTotalRating(parseFloat(sumRatings.toFixed(2)));
    } else {
      // 如果不是一般物件，則清空這些計算值
      setUnitPrice(null);
      setIndoorUsablePing(null);
      setPublicAreaRatio(null);
      setTotalRating(0);
    }
  }, [generalPropertyForm, isDesignatedCommunity]);

  // 效果：當 savedRecords 改變時，儲存到 localStorage
  useEffect(() => {
    localStorage.setItem("propertyRecords", JSON.stringify(savedRecords));
  }, [savedRecords]);

  // 重置表單
  const resetForm = useCallback(
    (resetToInitialChoice: boolean) => {
      setDesignatedCommunityForm({
        area: "",
        district: "",
        communityName: "",
        address: "",
        reason: "",
      });
      setGeneralPropertyForm(initialGeneralPropertyForm); // 使用初始值
      setEditingRecordId(null);
      setShowRecords(true); // 重置或清空後顯示記錄
      // 如果需要回到初始選擇頁面，設置 isDesignatedCommunity 為 null
      if (resetToInitialChoice) {
        setIsDesignatedCommunity(null);
      }
    },
    [initialGeneralPropertyForm]
  );

  // 處理一般物件表單的輸入改變
  const handleGeneralChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      const { name, value } = e.target;
      setGeneralPropertyForm((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  // 處理指定社區表單的輸入改變
  const handleDesignatedChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      const { name, value } = e.target;
      setDesignatedCommunityForm((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  // 提交或更新表單資料
  const handleSubmit = () => {
    let newRecordData: GeneralPropertyFormType | CommunityFormType; // 定義聯合類型
    let objectCategory: ObjectCategory; // 使用新的物件類別屬性

    if (isDesignatedCommunity) {
      objectCategory = "community"; // 指定為指定社區類別
      newRecordData = designatedCommunityForm;
    } else {
      objectCategory = "general"; // 指定為一般物件類別
      newRecordData = {
        ...generalPropertyForm,
        unitPrice,
        indoorUsablePing,
        publicAreaRatio,
        totalRating,
      };
    }

    if (editingRecordId) {
      // 更新現有記錄
      const updatedRecords = savedRecords.map((record) =>
        record.id === editingRecordId
          ? {
              ...record,
              objectCategory: objectCategory, // 更新新的物件類別
              formData: newRecordData,
              timestamp: new Date().toLocaleString(),
            }
          : record
      );
      setSavedRecords(updatedRecords);
      alert("資料已成功更新！");
    } else {
      // 新增記錄
      const newRecord: RecordType = {
        // 明確指定類型為 RecordType
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        objectCategory: objectCategory, // 使用新的物件類別屬性
        formData: newRecordData,
      };
      setSavedRecords((prev) => [...prev, newRecord]);
      alert("資料已成功提交並儲存！");
    }

    resetForm(false); // 提交後清空表單，但不返回到初始選擇頁面
  };

  // 載入記錄以供編輯
  const handleEdit = (
    recordId: number,
    recordObjectCategory: ObjectCategory
  ) => {
    // 這裡的參數改為 recordObjectCategory
    const recordToEdit = savedRecords.find((record) => record.id === recordId);
    if (recordToEdit) {
      // 使用 record.objectCategory 來設定表單模式
      setIsDesignatedCommunity(recordObjectCategory === "community");
      setEditingRecordId(recordId); // 設定編輯中的記錄 ID

      if (recordObjectCategory === "community") {
        // 這裡也使用 recordObjectCategory
        setDesignatedCommunityForm(recordToEdit.formData as CommunityFormType); // 斷言類型
      } else {
        const loadedForm = { ...initialGeneralPropertyForm };
        for (const key in recordToEdit.formData) {
          // 確保只複製 GeneralPropertyFormType 中存在的屬性
          if (
            Object.prototype.hasOwnProperty.call(
              initialGeneralPropertyForm,
              key
            )
          ) {
            (loadedForm as any)[key] = (recordToEdit.formData as any)[key];
          }
        }
        // 載入計算後的數值（如果存在的話）
        setUnitPrice(
          (recordToEdit.formData as GeneralPropertyFormType).unitPrice || null
        );
        setIndoorUsablePing(
          (recordToEdit.formData as GeneralPropertyFormType).indoorUsablePing ||
            null
        );
        setPublicAreaRatio(
          (recordToEdit.formData as GeneralPropertyFormType).publicAreaRatio ||
            null
        );
        setTotalRating(
          (recordToEdit.formData as GeneralPropertyFormType).totalRating || 0
        );

        setGeneralPropertyForm(loadedForm);
      }
      setShowRecords(false); // 編輯時隱藏記錄列表
      window.scrollTo({ top: 0, behavior: "smooth" }); // 滾動到頂部
    }
  };

  // 刪除記錄
  const handleDelete = (id: number) => {
    if (window.confirm("您確定要刪除這筆記錄嗎？")) {
      setSavedRecords((prev) => prev.filter((record) => record.id !== id));
      alert("記錄已刪除！");
    }
  };

  // 匯出 CSV
  const handleExportCsv = () => {
    exportToCsv(savedRecords);
  };

  // 匯入 CSV
  const handleImportCsv = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const imported = await importFromCsv(file);
        setSavedRecords((prev) => [...prev, ...imported]); // 將匯入的記錄添加到現有記錄中
        alert(`成功匯入 ${imported.length} 筆記錄！`);
      } catch (error: any) {
        alert(`匯入失敗: ${error.message}`);
        console.error("CSV Import Error:", error);
      } finally {
        // 清空 file input，以便可以再次選擇同一個檔案
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  // 用於顯示 "顯示所有欄位與值" 細節的映射表
  const fieldNameMap: { [key: string]: string } = {
    propertyName: "物件名稱",
    area: "主要都市",
    district: "行政區",
    otherDistrict: "其他行政區",
    source: "物件來源",
    otherSource: "其他來源",
    type: "房屋種類", // 這是房屋種類 (預售屋, 中古屋, 新成屋, 指定社區)
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
  };

  // 不希望在 "顯示所有欄位與值" 中重複顯示的欄位
  const fieldsToExclude = [
    "id",
    "timestamp",
    "objectCategory", // 這個不應該在這裡顯示，因為已經在上方顯示物件類型了
    "propertyName", // 已在概覽顯示
    "address", // 已在概覽顯示
    "totalPing", // 已在概覽顯示
    "totalAmount", // 已在概覽顯示
    "unitPrice", // 已在概覽顯示
    "indoorUsablePing", // 已在概覽顯示
    "publicAreaRatio", // 已在概覽顯示
    "totalRating", // 已在概覽顯示
    "notes", // 已在概覽顯示
    "communityName", // 已在概覽顯示
    "reason", // 已在概覽顯示
  ];

  const sectionTitleClasses =
    "text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200";

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          房屋物件資訊記錄器
        </h1>

        {/* 初始判斷區塊 */}
        {isDesignatedCommunity === null && (
          <div className="flex flex-col items-center space-y-6">
            <h2 className={sectionTitleClasses}>請選擇物件類型</h2>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
              <button
                className="px-8 py-4 bg-blue-600 text-white font-bold text-lg rounded-md shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out"
                onClick={() => setIsDesignatedCommunity(true)}
              >
                是 (指定社區)
              </button>
              <button
                className="px-8 py-4 bg-green-600 text-white font-bold text-lg rounded-md shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-150 ease-in-out"
                onClick={() => setIsDesignatedCommunity(false)}
              >
                否 (一般物件)
              </button>
            </div>
          </div>
        )}

        {/* 1. 指定社區的填寫選項 */}
        {isDesignatedCommunity === true && (
          <div className="space-y-6">
            <h2 className={sectionTitleClasses}>1. 指定社區填寫選項</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputGroup
                label="區域"
                name="area"
                value={designatedCommunityForm.area}
                onChange={handleDesignatedChange}
                isSelect
                options={areas}
              />
              {designatedCommunityForm.area && (
                <InputGroup
                  label="行政區"
                  name="district"
                  value={designatedCommunityForm.district}
                  onChange={handleDesignatedChange}
                  isSelect
                  options={districtsByArea?.[designatedCommunityForm.area]}
                />
              )}
            </div>

            <div className="space-y-4">
              <InputGroup
                label="社區名稱"
                name="communityName"
                value={designatedCommunityForm.communityName}
                onChange={handleDesignatedChange}
                placeholder="請輸入社區名稱"
              />
              <InputGroup
                label="地址"
                name="address"
                value={designatedCommunityForm.address}
                onChange={handleDesignatedChange}
                placeholder="請輸入地址"
              />
              <InputGroup
                label="原因"
                name="reason"
                value={designatedCommunityForm.reason}
                onChange={handleDesignatedChange}
                isTextArea
                placeholder="請輸入原因"
              />
            </div>

            {/* 提交與返回按鈕 */}
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mt-6 justify-between">
              <button
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full sm:w-auto"
                onClick={handleSubmit}
              >
                {editingRecordId ? "更新記錄" : "提交並儲存"}
              </button>
              <button
                className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-md shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 w-full sm:w-auto"
                onClick={() => resetForm(false)} // 不回到初始選擇頁面，只清空表單
              >
                {editingRecordId ? "取消編輯並清空" : "清空表單"}
              </button>
              {editingRecordId === null && ( // 只有在非編輯模式下顯示切換回選擇頁的按鈕
                <button
                  className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-md shadow-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 w-full sm:w-auto"
                  onClick={() => resetForm(true)} // 返回到初始選擇頁面
                >
                  切換物件類型
                </button>
              )}
            </div>
          </div>
        )}

        {/* 2. 一般物件的填寫選項 */}
        {isDesignatedCommunity === false && (
          <div className="space-y-6">
            <h2 className={sectionTitleClasses}>2. 一般物件填寫選項</h2>
            {/* 新增物件名稱欄位 */}
            <InputGroup
              label="物件名稱"
              name="propertyName"
              value={generalPropertyForm.propertyName}
              onChange={handleGeneralChange}
              placeholder="請輸入物件的名稱或代號"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 區域 & 行政區 */}
              <InputGroup
                label="區域"
                name="area"
                value={generalPropertyForm.area}
                onChange={handleGeneralChange}
                isSelect
                options={areas}
              />
              {generalPropertyForm.area && (
                <InputGroup
                  label="行政區"
                  name="district"
                  value={generalPropertyForm.district}
                  onChange={handleGeneralChange}
                  isSelect
                  options={districtsByArea?.[generalPropertyForm.area]}
                />
              )}
              {generalPropertyForm.area === "新北市" &&
                generalPropertyForm.district === "其他區" && (
                  <InputGroup
                    label="其他區 (手動輸入)"
                    name="otherDistrict"
                    value={generalPropertyForm.otherDistrict}
                    onChange={handleGeneralChange}
                    placeholder="請輸入其他區名稱"
                  />
                )}

              {/* 來源 */}
              <InputGroup
                label="來源"
                name="source"
                value={generalPropertyForm.source}
                onChange={handleGeneralChange}
                isSelect
                options={sources}
              />
              {generalPropertyForm.source === "其他" && (
                <InputGroup
                  label="其他來源 (手動輸入)"
                  name="otherSource"
                  value={generalPropertyForm.otherSource}
                  onChange={handleGeneralChange}
                  placeholder="請輸入其他來源"
                />
              )}

              {/* 類型 */}
              <InputGroup
                label="類型"
                name="type"
                value={generalPropertyForm.type}
                onChange={handleGeneralChange}
                isSelect
                options={propertyTypes}
              />

              {/* 車位類型 */}
              <InputGroup
                label="車位類型"
                name="carParkType"
                value={generalPropertyForm.carParkType}
                onChange={handleGeneralChange}
                isSelect
                options={carParkTypes}
              />

              {/* 車位樓層 (如果車位類型不是"無"才顯示) */}
              {generalPropertyForm.carParkType &&
                generalPropertyForm.carParkType !== "無" && (
                  <InputGroup
                    label="車位樓層"
                    name="carParkFloor"
                    value={generalPropertyForm.carParkFloor}
                    onChange={handleGeneralChange}
                    isSelect
                    options={carParkFloors}
                  />
                )}

              {/* 格局 */}
              <div className="col-span-1 md:col-span-2 grid grid-cols-3 gap-4">
                <InputGroup
                  label="房"
                  name="layoutRooms"
                  value={generalPropertyForm.layoutRooms}
                  onChange={handleGeneralChange}
                  isSelect
                  options={roomOptions}
                />
                <InputGroup
                  label="廳"
                  name="layoutLivingRooms"
                  value={generalPropertyForm.layoutLivingRooms}
                  onChange={handleGeneralChange}
                  isSelect
                  options={livingRoomOptions}
                />
                <InputGroup
                  label="衛"
                  name="layoutBathrooms"
                  value={generalPropertyForm.layoutBathrooms}
                  onChange={handleGeneralChange}
                  isSelect
                  options={bathroomOptions}
                />
              </div>

              {/* 走路附近是否有全聯 */}
              <InputGroup
                label="走路附近是否有全聯"
                name="hasPXMart"
                value={generalPropertyForm.hasPXMart}
                onChange={handleGeneralChange}
                isSelect
                options={yesNoOptions}
              />
            </div>

            {/* 手動輸入區塊 */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputGroup
                label="地址"
                name="address"
                value={generalPropertyForm.address}
                onChange={handleGeneralChange}
                placeholder="請輸入地址"
              />
              <InputGroup
                label="樓層 (例如10/21F)"
                name="floor"
                value={generalPropertyForm.floor}
                onChange={handleGeneralChange}
                placeholder="請輸入樓層 (例如10/21F)"
              />
              <InputGroup
                label="總坪數"
                name="totalPing"
                type="text"
                value={generalPropertyForm.totalPing}
                onChange={handleGeneralChange}
                placeholder="請輸入總坪數"
              />
              <InputGroup
                label="主建物(坪)"
                name="mainBuildingPing"
                type="text"
                value={generalPropertyForm.mainBuildingPing}
                onChange={handleGeneralChange}
                placeholder="請輸入主建物坪"
              />
              <InputGroup
                label="附屬建物(坪)"
                name="accessoryBuildingPing"
                type="text"
                value={generalPropertyForm.accessoryBuildingPing}
                onChange={handleGeneralChange}
                placeholder="請輸入附屬建物坪"
              />
              {/* 車位坪數(坪) 只有當車位類型不是"無"才顯示 */}
              {generalPropertyForm.carParkType &&
                generalPropertyForm.carParkType !== "無" && (
                  <InputGroup
                    label="車位坪數(坪)"
                    name="carParkPing"
                    type="text"
                    value={generalPropertyForm.carParkPing}
                    onChange={handleGeneralChange}
                    placeholder="請輸入車位坪數"
                  />
                )}
              <InputGroup
                label="總金額(萬元)"
                name="totalAmount"
                type="text"
                value={generalPropertyForm.totalAmount}
                onChange={handleGeneralChange}
                placeholder="請輸入總金額"
              />
              {/* 車位價格(萬元) 只有當車位類型不是"無"才顯示 */}
              {generalPropertyForm.carParkType &&
                generalPropertyForm.carParkType !== "無" && (
                  <InputGroup
                    label="車位價格(萬元)"
                    name="carParkPrice"
                    type="text"
                    value={generalPropertyForm.carParkPrice}
                    onChange={handleGeneralChange}
                    placeholder="請輸入車位價格"
                  />
                )}
              <InputGroup
                label="屋齡(年)"
                name="buildingAge"
                type="text"
                value={generalPropertyForm.buildingAge}
                onChange={handleGeneralChange}
                placeholder="請輸入屋齡"
              />
              <InputGroup
                label="附近捷運站名稱"
                name="mrtStation"
                value={generalPropertyForm.mrtStation}
                onChange={handleGeneralChange}
                placeholder="請輸入捷運站名稱"
              />
              <InputGroup
                label="距離捷運站(公尺)"
                name="mrtDistance"
                type="text"
                value={generalPropertyForm.mrtDistance}
                onChange={handleGeneralChange}
                placeholder="請輸入距離"
              />
            </div>

            {/* 自動計算與視覺化區塊 */}
            <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2 mt-8">
              自動計算與視覺化
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CalculatedValueDisplay
                label="室內使用坪"
                value={indoorUsablePing !== null ? indoorUsablePing : ""}
                unit="坪"
              />
              <CalculatedValueDisplay
                label="單價 (萬/坪)"
                value={unitPrice !== null ? unitPrice : ""}
                unit="萬/坪"
              />
              <CalculatedValueDisplay
                label="公設比 (%)"
                value={publicAreaRatio !== null ? publicAreaRatio : ""}
                unit="%"
              />
            </div>

            {/* 評分系統 (改用下拉式選單) */}
            <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2 mt-8">
              本物件評分 (1-5分)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ratingCategories.map((category) => (
                <InputGroup
                  key={category}
                  label={category}
                  name={`rating_${category}`}
                  value={
                    generalPropertyForm[
                      `rating_${category}` as keyof typeof generalPropertyForm
                    ]
                  }
                  onChange={handleGeneralChange}
                  isSelect
                  options={ratingOptions}
                />
              ))}
              <CalculatedValueDisplay
                label="本物件總評分"
                value={totalRating}
                unit="分"
              />
            </div>

            {/* 文字備註框 */}
            <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2 mt-8">
              備註
            </h3>
            <InputGroup
              label="文字備註"
              name="notes"
              value={generalPropertyForm.notes}
              onChange={handleGeneralChange}
              isTextArea
              rows={5}
              placeholder="請在此輸入任何個人感受或特殊情況..."
            />

            {/* 提交與返回按鈕 */}
            <div className="flex justify-between mt-6">
              <button
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={handleSubmit}
              >
                {editingRecordId ? "更新記錄" : "提交並儲存"}
              </button>
              <button
                className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-md shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                onClick={() => resetForm(false)} // 不回到初始選擇頁面，只清空表單
              >
                {editingRecordId ? "取消編輯並清空" : "清空表單"}
              </button>
              {editingRecordId === null && ( // 只有在非編輯模式下顯示切換回選擇頁的按鈕
                <button
                  className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-md shadow-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2"
                  onClick={() => resetForm(true)} // 返回到初始選擇頁面
                >
                  切換物件類型
                </button>
              )}
            </div>
          </div>
        )}

        {/* 顯示記錄與匯出/匯入按鈕 */}
        <div className="mt-8 pt-8 border-t border-gray-200 text-center space-x-4">
          <button
            className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-md shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            onClick={() => setShowRecords(!showRecords)}
          >
            {showRecords ? "隱藏記錄" : "顯示記錄"} ({savedRecords.length} 筆)
          </button>
          <button
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            onClick={handleExportCsv}
          >
            匯出記錄為 CSV
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportCsv}
            accept=".csv"
            style={{ display: "none" }} // 隱藏原生檔案輸入框
          />
          <button
            className="px-6 py-3 bg-teal-600 text-white font-semibold rounded-md shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            onClick={() => fileInputRef.current?.click()} // 點擊按鈕觸發檔案輸入框
          >
            從 CSV 匯入記錄
          </button>
        </div>

        {/* 記錄列表 */}
        {showRecords && (
          <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-md shadow-inner">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              所有儲存的物件記錄
            </h3>
            {savedRecords.length === 0 ? (
              <p className="text-gray-600">目前沒有儲存的物件記錄。</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {savedRecords.map((record) => (
                  <div
                    key={record.id}
                    className="p-4 border border-gray-300 rounded-md bg-white shadow-sm relative"
                  >
                    <p className="text-sm font-bold text-gray-700 mb-2">
                      記錄 ID: {record.id} - 時間: {record.timestamp}
                    </p>
                    <p className="text-sm text-gray-800">
                      {/* 這裡現在使用 record.objectCategory 來判斷顯示類型 */}
                      物件類型:{" "}
                      {record.objectCategory === "general"
                        ? "一般物件"
                        : "指定社區"}
                      <br />
                      {/* 針對主要欄位進行客製化顯示 */}
                      {record.objectCategory === "general" ? (
                        <>
                          物件名稱:{" "}
                          {(record.formData as GeneralPropertyFormType)
                            .propertyName || "N/A"}
                          <br />
                          地址:{" "}
                          {(record.formData as GeneralPropertyFormType)
                            .address || "N/A"}
                          <br />
                          總坪數:{" "}
                          {(record.formData as GeneralPropertyFormType)
                            .totalPing || "N/A"}{" "}
                          坪
                          <br />
                          總金額:{" "}
                          {(record.formData as GeneralPropertyFormType)
                            .totalAmount || "N/A"}{" "}
                          萬元
                          <br />
                          單價:{" "}
                          {(record.formData as GeneralPropertyFormType)
                            .unitPrice !== null
                            ? `${
                                (record.formData as GeneralPropertyFormType)
                                  .unitPrice
                              } 萬/坪`
                            : "N/A"}
                          <br />
                          室內使用坪:{" "}
                          {(record.formData as GeneralPropertyFormType)
                            .indoorUsablePing !== null
                            ? `${
                                (record.formData as GeneralPropertyFormType)
                                  .indoorUsablePing
                              } 坪`
                            : "N/A"}
                          <br />
                          公設比:{" "}
                          {(record.formData as GeneralPropertyFormType)
                            .publicAreaRatio !== null
                            ? `${
                                (record.formData as GeneralPropertyFormType)
                                  .publicAreaRatio
                              } %`
                            : "N/A"}
                          <br />
                          總評分:{" "}
                          {(record.formData as GeneralPropertyFormType)
                            .totalRating !== null
                            ? `${
                                (record.formData as GeneralPropertyFormType)
                                  .totalRating
                              } 分`
                            : "N/A"}
                          <br />
                          備註:{" "}
                          {(record.formData as GeneralPropertyFormType).notes ||
                            "無"}
                        </>
                      ) : (
                        <>
                          社區名稱:{" "}
                          {(record.formData as CommunityFormType)
                            .communityName || "N/A"}
                          <br />
                          地址:{" "}
                          {(record.formData as CommunityFormType).address ||
                            "N/A"}
                          <br />
                          原因:{" "}
                          {(record.formData as CommunityFormType).reason ||
                            "無"}
                        </>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      (完整資料可在CSV中匯出或下方查看)
                      {record.formData && (
                        <details>
                          <summary className="cursor-pointer text-blue-600 hover:underline">
                            顯示所有資料
                          </summary>
                          <div className="text-xs bg-gray-100 p-2 rounded-md mt-1 overflow-x-auto text-black">
                            {/* 過濾並顯示所有欄位 */}
                            {Object.entries(record.formData).map(
                              ([key, value]) => {
                                // 排除特定欄位
                                if (fieldsToExclude.includes(key)) {
                                  return null;
                                }
                                // 獲取中文名稱，如果沒有則使用英文鍵名
                                const displayKey = fieldNameMap[key] || key;
                                return (
                                  <p key={key} className="mb-0.5">
                                    <span className="font-semibold">
                                      {displayKey}
                                    </span>
                                    :{" "}
                                    {value !== null && value !== ""
                                      ? String(value)
                                      : "N/A"}
                                  </p>
                                );
                              }
                            )}
                          </div>
                        </details>
                      )}
                    </p>
                    {/* 編輯和刪除按鈕 */}
                    <div className="absolute top-4 right-4 flex space-x-2">
                      <button
                        onClick={() =>
                          handleEdit(record.id, record.objectCategory)
                        } // 傳入新的物件類別
                        className="px-3 py-1 bg-yellow-500 text-white text-xs rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1"
                      >
                        編輯
                      </button>
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="px-3 py-1 bg-red-500 text-white text-xs rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1"
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

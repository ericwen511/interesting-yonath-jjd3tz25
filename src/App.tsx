import React, { useState, useEffect, useCallback } from "react";

// 定義所有區域和其下的行政區選項
const areas = ["台北市", "新北市"];

const districtsByArea: { [key: string]: string[] } = {
  台北市: [
    "北投區",
    "士林區",
    "大同區",
    "中山區",
    "松山區",
    "內湖區",
    "萬華區",
    "中正區",
    "大安區",
    "信義區",
    "南港區",
    "文山區",
  ],
  新北市: [
    "三重區",
    "板橋區",
    "中和區",
    "永和區",
    "新莊區",
    "新店區",
    "土城區",
    "蘆洲區",
    "汐止區",
    "樹林區",
    "三峽區",
    "鶯歌區",
    "林口區",
    "深坑區",
    "淡水區",
  ],
};

// 下拉選單選項
const sources = ["永慶房屋", "信義房屋", "住商", "591", "樂居", "其他"];
const propertyTypes = ["預售屋", "新成屋", "中古屋"];
const carParkTypes = ["平面坡道", "機械", "塔式", "無"];
const carParkFloors = ["B1", "B2", "B3", "B4", "B5"];
const roomOptions = [1, 2, 3, 4];
const livingRoomOptions = [1, 2, 3];
const bathroomOptions = [1, 2, 3];
const yesNoOptions = ["是", "否"];

// 評分項目
const ratingCategories = [
  "採光",
  "生活機能",
  "交通",
  "價格滿意度",
  "未來發展潛力",
];
const ratingOptions = ["1", "2", "3", "4", "5"]; // 1-5 分的下拉選單選項

// 共用的 Tailwind CSS 類別，方便管理
const commonSelectClasses =
  "block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900";
const commonInputClasses =
  "mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900";
const commonLabelClasses = "block text-sm font-medium text-gray-700";
const sectionTitleClasses =
  "text-xl font-semibold text-gray-800 mb-4 border-b pb-2";
const calculatedValueClasses =
  "mt-1 block w-full p-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-md shadow-inner"; // 計算結果顯示樣式

// 輔助元件：用於顯示計算結果的 InputGroup
const CalculatedValueDisplay = ({
  label,
  value,
  unit,
}: {
  label: string;
  value: string | number;
  unit: string;
}) => (
  <div>
    <label className={commonLabelClasses}>{label}</label>
    <div className={calculatedValueClasses}>
      {value !== "" && value !== null ? `${value}${unit}` : "N/A"}
    </div>
  </div>
);

const InputGroup = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder = "",
  options,
  isSelect = false,
  isTextArea = false,
  rows = 3,
  min,
  max,
  step,
}: {
  label: string;
  name: string;
  type?: string;
  value: string | number | null;
  onChange: (
    e: React.ChangeEvent<
      HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement
    >
  ) => void;
  placeholder?: string;
  options?: (string | number)[];
  isSelect?: boolean;
  isTextArea?: boolean;
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
}) => (
  <div>
    <label htmlFor={name} className={commonLabelClasses}>
      {label}
    </label>
    {isSelect ? (
      <select
        id={name}
        name={name}
        value={value === null ? "" : value.toString()}
        onChange={onChange}
        className={commonSelectClasses}
      >
        <option value="">請選擇</option>
        {options?.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    ) : isTextArea ? (
      <textarea
        id={name}
        name={name}
        value={value as string}
        onChange={onChange}
        rows={rows}
        className={`${commonInputClasses} resize-y`}
        placeholder={placeholder}
      ></textarea>
    ) : (
      <input
        type={type}
        id={name}
        name={name}
        value={value === null ? "" : value.toString()}
        onChange={onChange}
        className={commonInputClasses}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
      />
    )}
  </div>
);

// 新增一個映射，用於將英文欄位名稱轉換為中文
const fieldNameMap: { [key: string]: string } = {
  propertyName: "物件名稱",
  area: "主要都市",
  district: "行政區",
  // otherDistrict: '其他行政區', // 不顯示，所以不需要在這裡
  source: "物件來源",
  // otherSource: '其他來源', // 不顯示，所以不需要在這裡
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
};

// 排除顯示的欄位
const fieldsToExclude = ["otherDistrict", "otherSource"];

function App() {
  // isDesignatedCommunity 現在不僅控制顯示哪個表單，也幫助區分返回行為
  const [isDesignatedCommunity, setIsDesignatedCommunity] = useState<
    boolean | null
  >(null);

  const [designatedCommunityForm, setDesignatedCommunityForm] = useState({
    area: "",
    district: "",
    communityName: "",
    address: "",
    reason: "",
  });

  // 初始一般物件表單狀態
  const initialGeneralPropertyForm = {
    propertyName: "",
    area: "",
    district: "",
    otherDistrict: "",
    source: "",
    otherSource: "",
    type: "",
    carParkType: "",
    carParkFloor: "",
    layoutRooms: "",
    layoutLivingRooms: "",
    layoutBathrooms: "",
    hasPXMart: "" as string,
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
  };

  const [generalPropertyForm, setGeneralPropertyForm] = useState(
    initialGeneralPropertyForm
  );

  // 自動計算結果的狀態
  const [unitPrice, setUnitPrice] = useState<number | null>(null);
  const [indoorUsablePing, setIndoorUsablePing] = useState<number | null>(null);
  const [publicAreaRatio, setPublicAreaRatio] = useState<number | null>(null);
  const [totalRating, setTotalRating] = useState<number>(0);

  // 儲存的資料記錄
  const [savedRecords, setSavedRecords] = useState<any[]>(() => {
    const saved = localStorage.getItem("propertyRecords");
    return saved ? JSON.parse(saved) : [];
  });
  const [showRecords, setShowRecords] = useState<boolean>(false);
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null); // 用於追蹤正在編輯的記錄 ID

  // 將資料存入 localStorage 的副作用
  useEffect(() => {
    localStorage.setItem("propertyRecords", JSON.stringify(savedRecords));
  }, [savedRecords]);

  const handleDesignatedChange = (
    e: React.ChangeEvent<
      HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setDesignatedCommunityForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "area" && { district: "" }),
    }));
  };

  const handleGeneralChange = (
    e: React.ChangeEvent<
      HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    if (name.startsWith("rating_")) {
      setGeneralPropertyForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else {
      setGeneralPropertyForm((prev) => ({
        ...prev,
        [name]: value,
        ...(name === "area" && { district: "", otherDistrict: "" }),
        ...(name === "source" && value !== "其他" && { otherSource: "" }),
        ...(name === "carParkType" &&
          value === "無" && {
            carParkFloor: "",
            carParkPing: "",
            carParkPrice: "",
          }),
      }));
    }
  };

  // --- 自動計算邏輯 ---
  useEffect(() => {
    const mainBuilding = parseFloat(generalPropertyForm.mainBuildingPing);
    const accessoryBuilding = parseFloat(
      generalPropertyForm.accessoryBuildingPing
    );
    setIndoorUsablePing(
      !isNaN(mainBuilding) && !isNaN(accessoryBuilding)
        ? parseFloat((mainBuilding + accessoryBuilding).toFixed(2))
        : null
    );
  }, [
    generalPropertyForm.mainBuildingPing,
    generalPropertyForm.accessoryBuildingPing,
  ]);

  useEffect(() => {
    const totalAmount = parseFloat(generalPropertyForm.totalAmount);
    const totalPing = parseFloat(generalPropertyForm.totalPing);
    const carParkPrice = parseFloat(generalPropertyForm.carParkPrice);
    const carParkPing = parseFloat(generalPropertyForm.carParkPing);

    if (!isNaN(totalAmount) && !isNaN(totalPing) && totalPing > 0) {
      const actualTotalAmount = isNaN(carParkPrice)
        ? totalAmount
        : totalAmount - carParkPrice;
      const actualTotalPing = isNaN(carParkPing)
        ? totalPing
        : totalPing - carParkPing;
      setUnitPrice(
        actualTotalPing > 0
          ? parseFloat((actualTotalAmount / actualTotalPing).toFixed(2))
          : null
      );
    } else {
      setUnitPrice(null);
    }
  }, [
    generalPropertyForm.totalAmount,
    generalPropertyForm.totalPing,
    generalPropertyForm.carParkPrice,
    generalPropertyForm.carParkPing,
  ]);

  useEffect(() => {
    const mainBuilding = parseFloat(generalPropertyForm.mainBuildingPing);
    const accessoryBuilding = parseFloat(
      generalPropertyForm.accessoryBuildingPing
    );
    const totalPing = parseFloat(generalPropertyForm.totalPing);
    const carParkPing = parseFloat(generalPropertyForm.carParkPing);

    if (
      !isNaN(mainBuilding) &&
      !isNaN(accessoryBuilding) &&
      !isNaN(totalPing) &&
      totalPing > 0
    ) {
      const indoorArea = mainBuilding + accessoryBuilding;
      const actualTotalPing = isNaN(carParkPing)
        ? totalPing
        : totalPing - carParkPing;
      const publicRatio =
        actualTotalPing > 0 ? (1 - indoorArea / actualTotalPing) * 100 : null;
      setPublicAreaRatio(
        publicRatio !== null ? parseFloat(publicRatio.toFixed(2)) : null
      );
    } else {
      setPublicAreaRatio(null);
    }
  }, [
    generalPropertyForm.mainBuildingPing,
    generalPropertyForm.accessoryBuildingPing,
    generalPropertyForm.totalPing,
    generalPropertyForm.carParkPing,
  ]);

  useEffect(() => {
    let sum = 0;
    ratingCategories.forEach((category) => {
      const ratingValue =
        generalPropertyForm[
          `rating_${category}` as keyof typeof generalPropertyForm
        ];
      if (typeof ratingValue === "string" && ratingValue !== "") {
        sum += parseInt(ratingValue, 10);
      }
    });
    setTotalRating(sum);
  }, [
    generalPropertyForm.rating_採光,
    generalPropertyForm.rating_生活機能,
    generalPropertyForm.rating_交通,
    generalPropertyForm.rating_價格滿意度,
    generalPropertyForm.rating_未來發展潛力,
  ]);

  // 重置表單
  const resetForm = useCallback(
    (resetToInitialChoice = false) => {
      setDesignatedCommunityForm({
        area: "",
        district: "",
        communityName: "",
        address: "",
        reason: "",
      });
      setGeneralPropertyForm(initialGeneralPropertyForm);
      setUnitPrice(null);
      setIndoorUsablePing(null);
      setPublicAreaRatio(null);
      setTotalRating(0);
      setEditingRecordId(null); // 重置編輯狀態
      if (resetToInitialChoice) {
        // 如果需要回到最初的選擇頁面
        setIsDesignatedCommunity(null);
      }
    },
    [initialGeneralPropertyForm]
  );

  // 提交或更新表單資料
  const handleSubmit = () => {
    let newRecordData;
    let recordType;

    if (isDesignatedCommunity) {
      recordType = "指定社區";
      newRecordData = designatedCommunityForm;
    } else {
      recordType = "一般物件";
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
              formData: newRecordData,
              timestamp: new Date().toLocaleString(),
            }
          : record
      );
      setSavedRecords(updatedRecords);
      alert("資料已成功更新！");
    } else {
      // 新增記錄
      const newRecord = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        type: recordType,
        formData: newRecordData,
      };
      setSavedRecords((prev) => [...prev, newRecord]);
      alert("資料已成功提交並儲存！");
    }

    resetForm(false); // 提交後清空表單，但不返回到初始選擇頁面
  };

  // 載入記錄以供編輯
  const handleEdit = (recordId: number, recordType: string) => {
    const recordToEdit = savedRecords.find((record) => record.id === recordId);
    if (recordToEdit) {
      setIsDesignatedCommunity(recordType === "指定社區"); // 設定表單模式
      setEditingRecordId(recordId); // 設定編輯中的記錄 ID

      if (recordType === "指定社區") {
        setDesignatedCommunityForm(recordToEdit.formData);
      } else {
        const loadedForm = { ...initialGeneralPropertyForm };
        for (const key in recordToEdit.formData) {
          if (
            Object.prototype.hasOwnProperty.call(
              initialGeneralPropertyForm,
              key
            )
          ) {
            // 更嚴謹地檢查屬性是否存在於初始狀態
            (loadedForm as any)[key] = recordToEdit.formData[key];
          }
        }
        setGeneralPropertyForm(loadedForm);
      }
      setShowRecords(false); // 編輯時隱藏記錄列表
      window.scrollTo({ top: 0, behavior: "smooth" }); // 滾動到頂部
    }
  };

  // 刪除記錄
  const handleDelete = (recordId: number) => {
    if (window.confirm("確定要刪除這筆記錄嗎？")) {
      const updatedRecords = savedRecords.filter(
        (record) => record.id !== recordId
      );
      setSavedRecords(updatedRecords);
      alert("記錄已刪除！");
      if (editingRecordId === recordId) {
        resetForm(false); // 如果正在編輯的記錄被刪除了，重置編輯狀態但不返回選擇頁
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
      <div className="bg-white p-4 sm:p-8 rounded-lg shadow-xl w-full sm:max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          買房便利通 2025 (v1.0版)
        </h1>
        {/* 新增的署名行 */}
        <p className="text-sm text-gray-500 text-center mb-6">
          Made by Eric Wen
        </p>
        {/* 初始判斷區塊 */}
        {isDesignatedCommunity === null && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <p className="text-lg text-gray-700">
              要輸入的物件是指定社區的嗎？
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full justify-center">
              <button
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={() => setIsDesignatedCommunity(true)}
              >
                是 (指定社區)
              </button>
              <button
                className="px-6 py-3 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
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

        {/* 顯示記錄與匯出按鈕 */}
        <div className="mt-8 pt-8 border-t border-gray-200 text-center space-x-4">
          <button
            className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-md shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            onClick={() => setShowRecords(!showRecords)}
          >
            {showRecords ? "隱藏記錄" : "顯示記錄"} ({savedRecords.length} 筆)
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
                      物件類型: {record.type}
                      <br />
                      {/* 針對主要欄位進行客製化顯示 */}
                      {record.type === "一般物件" ? (
                        <>
                          物件名稱: {record.formData.propertyName || "N/A"}
                          <br />
                          地址: {record.formData.address || "N/A"}
                          <br />
                          總坪數: {record.formData.totalPing || "N/A"} 坪<br />
                          總金額: {record.formData.totalAmount || "N/A"} 萬元
                          <br />
                          單價:{" "}
                          {record.formData.unitPrice !== null
                            ? `${record.formData.unitPrice} 萬/坪`
                            : "N/A"}
                          <br />
                          室內使用坪:{" "}
                          {record.formData.indoorUsablePing !== null
                            ? `${record.formData.indoorUsablePing} 坪`
                            : "N/A"}
                          <br />
                          公設比:{" "}
                          {record.formData.publicAreaRatio !== null
                            ? `${record.formData.publicAreaRatio} %`
                            : "N/A"}
                          <br />
                          總評分:{" "}
                          {record.formData.totalRating !== null
                            ? `${record.formData.totalRating} 分`
                            : "N/A"}
                          <br />
                          備註: {record.formData.notes || "無"}
                        </>
                      ) : (
                        <>
                          社區名稱: {record.formData.communityName || "N/A"}
                          <br />
                          地址: {record.formData.address || "N/A"}
                          <br />
                          原因: {record.formData.reason || "無"}
                        </>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      (完整資料可在CSV中匯出或下方查看)
                      {record.formData && (
                        <details>
                          <summary className="cursor-pointer text-blue-600 hover:underline">
                            顯示所有欄位與值
                          </summary>
                          <div className="text-xs bg-gray-100 p-2 rounded-md mt-1 overflow-x-auto text-black">
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
                        onClick={() => handleEdit(record.id, record.type)}
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

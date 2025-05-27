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
    "文山區",
    "中正區",
    "大安區",
    "信義區",
    "萬華區",
    "南港區",
  ],
  新北市: [
    "板橋區",
    "三重區",
    "中和區",
    "永和區",
    "新莊區",
    "新店區",
    "樹林區",
    "鶯歌區",
    "三峽區",
    "淡水區",
    "汐止區",
    "瑞芳區",
    "土城區",
    "蘆洲區",
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
  ],
};

// 型別定義
interface FormData {
  area: string;
  district: string;
  address: string;
  floor: string;
  totalFloors: string;
  layout: string;
  squareFootage: string;
  age: string;
  managementFee: string;
  parkingFee: string;
  otherExpenses: string;
  contactPerson: string;
  contactInfo: string;
  description: string;
  pricePerPing: string;
  houseType: string;
  parkingSpaceType?: string; // 停車位類型
}

interface RecordData {
  id: string;
  timestamp: string;
  type: "designated" | "general";
  formData: FormData;
}

const App: React.FC = () => {
  const [isDesignatedCommunity, setIsDesignatedCommunity] = useState<
    boolean | null
  >(null);
  const [formData, setFormData] = useState<FormData>({
    area: "",
    district: "",
    address: "",
    floor: "",
    totalFloors: "",
    layout: "",
    squareFootage: "",
    age: "",
    managementFee: "",
    parkingFee: "",
    otherExpenses: "",
    contactPerson: "",
    contactInfo: "",
    description: "",
    pricePerPing: "",
    houseType: "",
    parkingSpaceType: "", // 初始化停車位類型
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [savedRecords, setSavedRecords] = useState<RecordData[]>(() => {
    try {
      const storedRecords = localStorage.getItem("savedRecords");
      return storedRecords ? JSON.parse(storedRecords) : [];
    } catch (error) {
      console.error("Error parsing saved records from localStorage:", error);
      return [];
    }
  });
  const [showRecords, setShowRecords] = useState(false);

  useEffect(() => {
    localStorage.setItem("savedRecords", JSON.stringify(savedRecords));
  }, [savedRecords]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    // 將 name 斷言為 FormData 的鍵類型
    const fieldName = name as keyof FormData;

    setFormData((prevData) => ({
      ...prevData,
      [fieldName]: value, // 使用斷言後的 fieldName
    }));
    if (errors[fieldName]) {
      // 使用斷言後的 fieldName
      setErrors((prevErrors) => ({ ...prevErrors, [fieldName]: undefined }));
    }
  };

  const validateForm = useCallback(() => {
    const newErrors: Partial<FormData> = {};
    if (!formData.area) newErrors.area = "請選擇區域";
    if (!formData.district) newErrors.district = "請選擇行政區";
    if (!formData.address) newErrors.address = "請輸入地址";
    if (!formData.floor) newErrors.floor = "請輸入樓層";
    if (!formData.totalFloors) newErrors.totalFloors = "請輸入總樓層";
    if (!formData.layout) newErrors.layout = "請輸入格局";
    if (!formData.squareFootage) newErrors.squareFootage = "請輸入權狀坪數";
    if (!formData.age) newErrors.age = "請輸入屋齡";
    if (!formData.managementFee) newErrors.managementFee = "請輸入管理費";
    if (!formData.parkingFee) newErrors.parkingFee = "請輸入車位費";
    if (!formData.otherExpenses) newErrors.otherExpenses = "請輸入其他費用";
    if (!formData.contactPerson) newErrors.contactPerson = "請輸入聯絡人";
    if (!formData.contactInfo) newErrors.contactInfo = "請輸入聯絡方式";
    if (!formData.description) newErrors.description = "請輸入說明";
    if (!formData.pricePerPing) newErrors.pricePerPing = "請輸入每坪單價";
    if (!formData.houseType) newErrors.houseType = "請選擇房屋型態";
    if (isDesignatedCommunity && !formData.parkingSpaceType) {
      newErrors.parkingSpaceType = "請選擇車位類型";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, isDesignatedCommunity]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (validateForm()) {
        const newRecord: RecordData = {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleString("zh-TW", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }),
          type: isDesignatedCommunity ? "designated" : "general",
          formData: { ...formData },
        };
        setSavedRecords((prevRecords) => [...prevRecords, newRecord]);
        setFormData({
          area: "",
          district: "",
          address: "",
          floor: "",
          totalFloors: "",
          layout: "",
          squareFootage: "",
          age: "",
          managementFee: "",
          parkingFee: "",
          otherExpenses: "",
          contactPerson: "",
          contactInfo: "",
          description: "",
          pricePerPing: "",
          houseType: "",
          parkingSpaceType: "", // 重置停車位類型
        });
        setErrors({});
        alert("記錄已儲存！");
      } else {
        alert("請檢查表單中的錯誤！");
      }
    },
    [formData, isDesignatedCommunity, validateForm]
  );

  const handleDeleteRecord = useCallback((id: string) => {
    setSavedRecords((prevRecords) =>
      prevRecords.filter((record) => record.id !== id)
    );
    alert("記錄已刪除！");
  }, []);

  const handleReset = useCallback(() => {
    setIsDesignatedCommunity(null);
    setFormData({
      area: "",
      district: "",
      address: "",
      floor: "",
      totalFloors: "",
      layout: "",
      squareFootage: "",
      age: "",
      managementFee: "",
      parkingFee: "",
      otherExpenses: "",
      contactPerson: "",
      contactInfo: "",
      description: "",
      pricePerPing: "",
      houseType: "",
      parkingSpaceType: "",
    });
    setErrors({});
  }, []);

  // ====== 新增的匯出資料功能 ======
  const exportData = useCallback(() => {
    if (savedRecords.length === 0) {
      alert("沒有資料可以匯出！");
      return;
    }

    // 格式化日期時間為檔案名的一部分
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const filenameTimestamp = `${year}${month}${day}_${hours}${minutes}${seconds}`;

    // 將資料打包成一個物件，包含時間戳記和實際記錄
    const dataToExport = {
      exportedAt: now.toISOString(), // ISO 格式的時間戳記，更精確
      records: savedRecords,
    };

    const jsonString = JSON.stringify(dataToExport, null, 2); // 格式化 JSON 輸出

    const blob = new Blob([jsonString], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `房產紀錄_備份_${filenameTimestamp}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href); // 釋放 Blob URL 資源
    alert("資料已成功匯出！");
  }, [savedRecords]);

  // ====== 新增的匯入資料功能 ======
  const importData = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      if (file.type !== "application/json") {
        alert("請選擇一個 JSON 檔案！");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const importedData: { exportedAt?: string; records: RecordData[] } =
            JSON.parse(content);

          // 驗證匯入資料的格式
          if (!importedData || !Array.isArray(importedData.records)) {
            throw new Error("檔案格式不正確，無法識別為房產記錄。");
          }

          let confirmMessage =
            "您確定要匯入此資料嗎？這將會覆蓋您當前所有房產記錄。";
          if (importedData.exportedAt) {
            const exportDate = new Date(importedData.exportedAt).toLocaleString(
              "zh-TW",
              {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
              }
            );
            confirmMessage = `您確定要匯入此資料嗎？\n\n此備份建立於：${exportDate}\n\n這將會覆蓋您當前所有房產記錄。`;
          }

          if (window.confirm(confirmMessage)) {
            setSavedRecords(importedData.records);
            alert("資料已成功匯入！");
          } else {
            alert("匯入操作已取消。");
          }
        } catch (error) {
          console.error("Error importing data:", error);
          alert(
            `匯入資料失敗：${
              error instanceof Error
                ? error.message
                : "檔案內容有誤或格式不正確。"
            }`
          );
        }
        // 清空檔案選擇器，以便再次選擇同一個檔案
        event.target.value = "";
      };
      reader.readAsText(file);
    },
    [setSavedRecords]
  );
  // ==============================

  if (isDesignatedCommunity === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-gray-100">
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md text-center max-w-lg w-full">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">
            買房便利通 2025{" "}
            <span className="text-base sm:text-xl">(v1.5版)</span>
          </h1>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 w-full">
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

          <div className="mt-8 pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 w-full">
            <button
              className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-md shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              onClick={() => setShowRecords(!showRecords)}
            >
              {showRecords ? "隱藏記錄" : "顯示記錄"} ({savedRecords.length} 筆)
            </button>
            {/* 匯入資料按鈕 */}
            <label
              htmlFor="importFile"
              className="px-6 py-3 bg-yellow-600 text-white font-semibold rounded-md shadow-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 cursor-pointer"
            >
              匯入資料
              <input
                id="importFile"
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
              />
            </label>
            {/* 匯出資料按鈕 */}
            <button
              className="px-6 py-3 bg-orange-600 text-white font-semibold rounded-md shadow-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              onClick={exportData}
            >
              匯出資料
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-gray-100 flex flex-col items-center">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md max-w-3xl w-full">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800 text-center">
          買房便利通 - {isDesignatedCommunity ? "指定社區" : "一般物件"}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                區域:
              </label>
              <select
                name="area"
                value={formData.area}
                onChange={handleChange}
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                  errors.area ? "border-red-500" : ""
                }`}
              >
                <option value="">請選擇</option>
                {areas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
              {errors.area && (
                <p className="text-red-500 text-xs italic">{errors.area}</p>
              )}
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                行政區:
              </label>
              <select
                name="district"
                value={formData.district}
                onChange={handleChange}
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                  errors.district ? "border-red-500" : ""
                }`}
                disabled={!formData.area}
              >
                <option value="">請選擇</option>
                {formData.area &&
                  districtsByArea[formData.area].map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
              </select>
              {errors.district && (
                <p className="text-red-500 text-xs italic">{errors.district}</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              地址:
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.address ? "border-red-500" : ""
              }`}
            />
            {errors.address && (
              <p className="text-red-500 text-xs italic">{errors.address}</p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                樓層:
              </label>
              <input
                type="number"
                name="floor"
                value={formData.floor}
                onChange={handleChange}
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                  errors.floor ? "border-red-500" : ""
                }`}
              />
              {errors.floor && (
                <p className="text-red-500 text-xs italic">{errors.floor}</p>
              )}
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                總樓層:
              </label>
              <input
                type="number"
                name="totalFloors"
                value={formData.totalFloors}
                onChange={handleChange}
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                  errors.totalFloors ? "border-red-500" : ""
                }`}
              />
              {errors.totalFloors && (
                <p className="text-red-500 text-xs italic">
                  {errors.totalFloors}
                </p>
              )}
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                格局:
              </label>
              <input
                type="text"
                name="layout"
                value={formData.layout}
                onChange={handleChange}
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                  errors.layout ? "border-red-500" : ""
                }`}
              />
              {errors.layout && (
                <p className="text-red-500 text-xs italic">{errors.layout}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                權狀坪數:
              </label>
              <input
                type="number"
                step="0.01"
                name="squareFootage"
                value={formData.squareFootage}
                onChange={handleChange}
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                  errors.squareFootage ? "border-red-500" : ""
                }`}
              />
              {errors.squareFootage && (
                <p className="text-red-500 text-xs italic">
                  {errors.squareFootage}
                </p>
              )}
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                屋齡:
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                  errors.age ? "border-red-500" : ""
                }`}
              />
              {errors.age && (
                <p className="text-red-500 text-xs italic">{errors.age}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                管理費:
              </label>
              <input
                type="number"
                name="managementFee"
                value={formData.managementFee}
                onChange={handleChange}
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                  errors.managementFee ? "border-red-500" : ""
                }`}
              />
              {errors.managementFee && (
                <p className="text-red-500 text-xs italic">
                  {errors.managementFee}
                </p>
              )}
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                車位費:
              </label>
              <input
                type="number"
                name="parkingFee"
                value={formData.parkingFee}
                onChange={handleChange}
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                  errors.parkingFee ? "border-red-500" : ""
                }`}
              />
              {errors.parkingFee && (
                <p className="text-red-500 text-xs italic">
                  {errors.parkingFee}
                </p>
              )}
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                其他費用:
              </label>
              <input
                type="number"
                name="otherExpenses"
                value={formData.otherExpenses}
                onChange={handleChange}
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                  errors.otherExpenses ? "border-red-500" : ""
                }`}
              />
              {errors.otherExpenses && (
                <p className="text-red-500 text-xs italic">
                  {errors.otherExpenses}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                聯絡人:
              </label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                  errors.contactPerson ? "border-red-500" : ""
                }`}
              />
              {errors.contactPerson && (
                <p className="text-red-500 text-xs italic">
                  {errors.contactPerson}
                </p>
              )}
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                聯絡方式:
              </label>
              <input
                type="text"
                name="contactInfo"
                value={formData.contactInfo}
                onChange={handleChange}
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                  errors.contactInfo ? "border-red-500" : ""
                }`}
              />
              {errors.contactInfo && (
                <p className="text-red-500 text-xs italic">
                  {errors.contactInfo}
                </p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              說明:
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.description ? "border-red-500" : ""
              }`}
            ></textarea>
            {errors.description && (
              <p className="text-red-500 text-xs italic">
                {errors.description}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                每坪單價:
              </label>
              <input
                type="number"
                step="0.01"
                name="pricePerPing"
                value={formData.pricePerPing}
                onChange={handleChange}
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                  errors.pricePerPing ? "border-red-500" : ""
                }`}
              />
              {errors.pricePerPing && (
                <p className="text-red-500 text-xs italic">
                  {errors.pricePerPing}
                </p>
              )}
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                房屋型態:
              </label>
              <select
                name="houseType"
                value={formData.houseType}
                onChange={handleChange}
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                  errors.houseType ? "border-red-500" : ""
                }`}
              >
                <option value="">請選擇</option>
                <option value="電梯大樓">電梯大樓</option>
                <option value="公寓">公寓</option>
                <option value="透天厝">透天厝</option>
                <option value="別墅">別墅</option>
                <option value="套房">套房</option>
              </select>
              {errors.houseType && (
                <p className="text-red-500 text-xs italic">
                  {errors.houseType}
                </p>
              )}
            </div>
          </div>
          {isDesignatedCommunity && (
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                車位類型:
              </label>
              <select
                name="parkingSpaceType"
                value={formData.parkingSpaceType}
                onChange={handleChange}
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                  errors.parkingSpaceType ? "border-red-500" : ""
                }`}
              >
                <option value="">請選擇</option>
                <option value="坡道平面">坡道平面</option>
                <option value="坡道機械">坡道機械</option>
                <option value="升降平面">升降平面</option>
                <option value="升降機械">升降機械</option>
                <option value="塔式車位">塔式車位</option>
                <option value="其他">其他</option>
              </select>
              {errors.parkingSpaceType && (
                <p className="text-red-500 text-xs italic">
                  {errors.parkingSpaceType}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mt-6">
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              儲存記錄
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-md shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              重置表單
            </button>
            <button
              type="button"
              onClick={() => setIsDesignatedCommunity(null)}
              className="px-6 py-3 bg-red-600 text-white font-semibold rounded-md shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              返回選擇頁
            </button>
          </div>
        </form>
      </div>

      {showRecords && (
        <div className="mt-8 bg-white p-6 sm:p-8 rounded-lg shadow-md max-w-3xl w-full">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center">
            所有記錄 ({savedRecords.length} 筆)
          </h2>
          {savedRecords.length === 0 ? (
            <p className="text-gray-600 text-center">沒有記錄</p>
          ) : (
            <ul className="space-y-4">
              {savedRecords.map((record) => (
                <li
                  key={record.id}
                  className="p-4 border border-gray-200 rounded-md shadow-sm"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm text-gray-500">
                        時間: {record.timestamp}
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {record.formData.address}
                      </p>
                      <p className="text-gray-700">
                        {record.formData.area} {record.formData.district} -{" "}
                        {record.formData.layout}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteRecord(record.id)}
                      className="ml-4 px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                    >
                      刪除
                    </button>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      類型:{" "}
                      {record.type === "designated" ? "指定社區" : "一般物件"}
                    </p>
                    <p>
                      樓層: {record.formData.floor} /{" "}
                      {record.formData.totalFloors} (總)
                    </p>
                    <p>權狀坪數: {record.formData.squareFootage}</p>
                    <p>屋齡: {record.formData.age}</p>
                    <p>管理費: {record.formData.managementFee}</p>
                    <p>車位費: {record.formData.parkingFee}</p>
                    <p>其他費用: {record.formData.otherExpenses}</p>
                    <p>聯絡人: {record.formData.contactPerson}</p>
                    <p>聯絡方式: {record.formData.contactInfo}</p>
                    <p>說明: {record.formData.description}</p>
                    <p>每坪單價: {record.formData.pricePerPing}</p>
                    <p>房屋型態: {record.formData.houseType}</p>
                    {record.formData.parkingSpaceType && (
                      <p>車位類型: {record.formData.parkingSpaceType}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default App;

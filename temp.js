async function getPath(extensionName) {
    try {
        const response = await fetch("project-paths.json");

        // 檢查回應是否成功 (例如, HTTP 狀態碼 200-299)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const jsonData = await response.json(); // <-- 修正點：加上括號 ()
        console.log(jsonData[extensionName]);
        return jsonData[extensionName];
    } catch (error) {
        console.error("Fetching project paths failed:", error);
        // 根據需求可以回傳 null 或重新拋出錯誤
        return null;
    }
}

getPath("novel-reader");
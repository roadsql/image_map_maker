$sheetId = "1YAG4YAxdeb87dFCYjGvNpT4L0iamozL4UZWXLDwPcNc"
curl.exe -L -o schema.dbml "https://script.google.com/macros/s/AKfycbyF2rcx8Er32OIuQC7RMvL2-TvMiyhJwWvMVYZpIHqQ-kaEIcNC5RFnHdQw790h-T_wxQ/exec?mode=schema&sheetId=$sheetId"
dbdocs build schema.dbml
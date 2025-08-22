# Moodle "Token Not Found" Debug Checklist

## 🔍 Token Type Check
Run: `node debug-token-type.js` to see what type of token you have.

**Expected Results:**
- ✅ 32-character hex string = Web service token (good!)
- ⚠️ 40-character base64-ish = OAuth token (needs conversion)

## 🛠️ Moodle Configuration Check

### 1. Enable Web Services
1. Go to: **Site administration → Advanced features**
2. Check: ✅ **Enable web services**
3. Save changes

### 2. Enable REST Protocol
1. Go to: **Site administration → Server → Web services → Manage protocols**
2. Enable: ✅ **REST protocol**

### 3. Check OAuth2 Service
1. Go to: **Site administration → Server → OAuth 2 services**
2. Find your OAuth2 service
3. Check: ✅ **Enabled**
4. Note the **Service name** (use this in callback code)

### 4. Check External Services
1. Go to: **Site administration → Server → Web services → External services**
2. Look for a service that includes the functions you need:
   - `core_webservice_get_site_info`
   - `core_course_create_courses`
   - `core_course_get_courses`

### 5. Check User Capabilities
Your Moodle user needs these capabilities:
- `webservice/rest:use`
- `moodle/course:create`
- `moodle/course:update`

## 🧪 Manual API Test

Try these URLs in your browser (replace `{TOKEN}` with your actual token):

### Web Service API:
```
http://localhost:8888/moodle500/webservice/rest/server.php?wstoken={TOKEN}&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json
```

### OAuth API (alternative):
```
http://localhost:8888/moodle500/webservice/oauth2/server.php?access_token={TOKEN}&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json
```

## 📋 Expected Responses

### ✅ Success:
```json
{
  "sitename": "Your Moodle Site",
  "username": "your_username",
  "userid": 123,
  ...
}
```

### ❌ Invalid Token:
```json
{
  "exception": "core\\exception\\moodle_exception",
  "errorcode": "invalidtoken",
  "message": "Invalid token - token not found"
}
```

### ❌ Web Services Disabled:
```json
{
  "exception": "core\\exception\\moodle_exception", 
  "errorcode": "enablewsdescription",
  "message": "Web services are not enabled"
}
```

## 🔧 Solutions by Token Type

### If you have OAuth token (40 chars, base64-ish):
1. **Option A:** Fix the callback to get web service token
2. **Option B:** Use OAuth2 API endpoints instead
3. **Option C:** Manually create web service token in Moodle admin

### If you have Web service token (32 hex chars):
1. Check Moodle web services configuration
2. Verify user permissions
3. Check if token is active in Moodle database







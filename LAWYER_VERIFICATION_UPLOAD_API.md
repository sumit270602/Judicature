# Lawyer Verification Document Upload - JSON Body Request

## API Endpoint
```
POST /api/documents/verification/upload
```

## Headers Required
```json
{
  "Authorization": "Bearer <JWT_TOKEN>",
  "Content-Type": "multipart/form-data"
}
```

## Request Body (Form Data)

Since this is a file upload endpoint using `multer.single('document')`, you need to send the request as **multipart/form-data**, not JSON.

### Form Data Fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `document` | File | Yes | The document file to upload |
| `documentType` | String | Yes | Type of verification document |

### Valid Document Types:
- `bar_certificate` - Bar Council Certificate
- `license` - Professional License  
- `identity` - Identity Proof (Passport/ID)

## Example Requests

### 1. Using Postman
```
Method: POST
URL: http://localhost:5000/api/documents/verification/upload
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  
Body (form-data):
  document: [SELECT FILE] - Choose your PDF/image file
  documentType: "bar_certificate"
```

### 2. Using cURL
```bash
curl -X POST \
  http://localhost:5000/api/documents/verification/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "document=@/path/to/your/bar_certificate.pdf" \
  -F "documentType=bar_certificate"
```

### 3. Using JavaScript/Fetch
```javascript
const formData = new FormData();
formData.append('document', fileInput.files[0]); // File from input element
formData.append('documentType', 'bar_certificate');

fetch('/api/documents/verification/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
    // Don't set Content-Type, let browser set it for FormData
  },
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

### 4. Using Axios (JavaScript)
```javascript
const formData = new FormData();
formData.append('document', file); // File object
formData.append('documentType', 'license');

axios.post('/api/documents/verification/upload', formData, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data'
  }
})
.then(response => console.log(response.data))
.catch(error => console.error(error));
```

## Example Upload Scenarios

### Upload Bar Certificate
```
Form Data:
  document: bar_certificate.pdf
  documentType: "bar_certificate"
```

### Upload Professional License
```
Form Data:
  document: license.jpg
  documentType: "license"
```

### Upload Identity Proof
```
Form Data:
  document: passport.pdf
  documentType: "identity"
```

## Success Response
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "documentId": "65f1a2b3c4d5e6f7g8h9i0j1"
}
```

## Error Responses

### Missing File
```json
{
  "message": "No file uploaded"
}
```

### Invalid Document Type
```json
{
  "message": "Invalid document type"
}
```

### Unauthorized (Missing/Invalid Token)
```json
{
  "message": "Access denied"
}
```

### File Too Large
```json
{
  "message": "File size too large. Maximum size is 10MB."
}
```

### Invalid File Type
```json
{
  "message": "File type not supported"
}
```

## Supported File Types
- PDF: `application/pdf`
- JPEG: `image/jpeg`
- PNG: `image/png`

## File Size Limit
- Maximum: 10MB per file

## Notes
- Only lawyers can upload verification documents
- Each document type can be uploaded multiple times
- Documents start with status "pending" and require admin approval
- User must be authenticated with valid JWT token
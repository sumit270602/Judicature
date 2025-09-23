const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  upload,
  uploadVerificationDoc,
  uploadCaseDoc,
  getUserDocs,
  getCaseDocs,
  downloadDoc,
} = require("../controllers/documentController");

// Upload verification document (for lawyers)
router.post(
  "/verification/upload",
  auth,
  upload.single("document"), // Back to "document"
  uploadVerificationDoc
);

// Upload case document
router.post("/case/upload", auth, upload.single("document"), uploadCaseDoc);

// Get user's documents
router.get("/my-documents", auth, getUserDocs);

// Get case documents
router.get("/case/:caseId", auth, getCaseDocs);

// Download document
router.get("/download/:documentId", auth, downloadDoc);

module.exports = router;

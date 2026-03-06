import express from 'express';
import multer from 'multer';
import { saveHealthDiagnosis, getHealthStats, getRecentDiagnoses } from './health.controller.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB max

const upload = multer({ storage: multer.memoryStorage() });

router.post('/save', upload.single('image'), saveHealthDiagnosis);
router.get('/stats', getHealthStats);
router.get('/recent', getRecentDiagnoses);
router.get('/locations', getHealthLocations);
router.get('/:id', getDiagnosisById);

export default router;

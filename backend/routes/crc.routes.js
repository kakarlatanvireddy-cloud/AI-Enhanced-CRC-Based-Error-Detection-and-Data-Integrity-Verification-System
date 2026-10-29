import { Router } from 'express';
import { handleGenerateCrc, handleVerifyCrc, handleGetAlgorithms } from '../controllers/crc.controller.js';

const router = Router();

/**
 * @route POST /api/crc/generate
 * @desc  Generate CRC checksum for payload
 */
router.post('/generate', handleGenerateCrc);

/**
 * @route POST /api/crc/verify
 * @desc  Verify payload against expected CRC checksum
 */
router.post('/verify', handleVerifyCrc);

/**
 * @route GET /api/crc/algorithms
 * @desc  Get parameters and metadata for supported CRC algorithms
 */
router.get('/algorithms', handleGetAlgorithms);

export default router;


import { Router } from 'express';
import { handleSendTransmission, handleGetTransmissionStats } from '../controllers/transmission.controller.js';

const router = Router();

/**
 * @route POST /api/transmission/send
 * @desc  Simulate end-to-end payload transmission and verification
 */
router.post('/send', handleSendTransmission);

/**
 * @route GET /api/transmission/stats
 * @desc  Get live in-memory transmission telemetry statistics
 */
router.get('/stats', handleGetTransmissionStats);

export default router;

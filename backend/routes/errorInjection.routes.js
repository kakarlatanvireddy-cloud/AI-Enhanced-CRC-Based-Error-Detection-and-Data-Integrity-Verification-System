import { Router } from 'express';
import { handleSimulateErrorInjection, handleGetErrorInjectionStats } from '../controllers/errorInjection.controller.js';

const router = Router();

/**
 * @route POST /api/error-injection/simulate
 * @desc  Simulate bit-level error injection (SINGLE_BIT, MULTI_BIT, BURST, RANDOM) and verify CRC error detection
 */
router.post('/simulate', handleSimulateErrorInjection);

/**
 * @route GET /api/error-injection/stats
 * @desc  Get live in-memory error injection telemetry statistics
 */
router.get('/stats', handleGetErrorInjectionStats);

export default router;

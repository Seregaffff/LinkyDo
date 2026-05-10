const router = require('express').Router();
const {
  getMetrics,
  updateMetrics,
  downloadReport,
  taxReport,
  getTaxReportData,
  generateTaxReportCustom,
  getActuals,
} = require('../controllers/metricsController');


const authenticate = require('../middlewares/authenticate');

router.get('/', authenticate, getMetrics);
router.put('/', authenticate, updateMetrics);
router.get('/download', authenticate, downloadReport);
router.get('/tax-report', authenticate, taxReport);

router.get('/tax-report-data', authenticate, getTaxReportData);
router.post('/tax-report/generate', authenticate, generateTaxReportCustom);
router.post('/generate', authenticate, generateTaxReportCustom);
router.get('/actuals', authenticate, getActuals);


module.exports = router;
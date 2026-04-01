import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ status: 'success', message: 'Get services - coming soon' });
});

router.get('/:id', (req, res) => {
  res.json({ status: 'success', message: 'Get service - coming soon' });
});

router.post('/', (req, res) => {
  res.json({ status: 'success', message: 'Create service - coming soon' });
});

router.put('/:id', (req, res) => {
  res.json({ status: 'success', message: 'Update service - coming soon' });
});

router.delete('/:id', (req, res) => {
  res.json({ status: 'success', message: 'Delete service - coming soon' });
});

export default router;
import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ status: 'success', message: 'Get users - coming soon' });
});

router.get('/:id', (req, res) => {
  res.json({ status: 'success', message: 'Get user - coming soon' });
});

router.post('/', (req, res) => {
  res.json({ status: 'success', message: 'Create user - coming soon' });
});

router.put('/:id', (req, res) => {
  res.json({ status: 'success', message: 'Update user - coming soon' });
});

router.delete('/:id', (req, res) => {
  res.json({ status: 'success', message: 'Delete user - coming soon' });
});

export default router;
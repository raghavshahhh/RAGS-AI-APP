import { Router } from 'express';
import { supabase } from '../config/supabase';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// Get all routines
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ routines: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create routine
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { name, description, time, days, tasks } = req.body;

    const { data, error } = await supabase
      .from('routines')
      .insert({
        user_id: req.user!.id,
        name,
        description,
        time,
        days: days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        tasks: tasks || [],
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ routine: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update routine
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('routines')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ routine: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete routine
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('routines')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user!.id);

    if (error) throw error;

    res.json({ message: 'Routine deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Complete routine for today
router.post('/:id/complete', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('routine_completions')
      .insert({
        routine_id: id,
        user_id: req.user!.id,
        completed_at: new Date().toISOString(),
        date: today,
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ completion: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;


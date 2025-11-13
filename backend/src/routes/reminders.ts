import { Router } from 'express';
import { supabase } from '../config/supabase';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// Get all reminders
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = supabase
      .from('reminders')
      .select('*')
      .eq('user_id', req.user!.id);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('remind_at', { ascending: true });

    if (error) throw error;

    res.json({ reminders: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create reminder
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { title, description, remind_at, repeat, priority } = req.body;

    const { data, error } = await supabase
      .from('reminders')
      .insert({
        user_id: req.user!.id,
        title,
        description,
        remind_at: new Date(remind_at).toISOString(),
        repeat: repeat || 'none',
        priority: priority || 'medium',
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ reminder: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update reminder
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('reminders')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ reminder: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mark reminder as completed
router.post('/:id/complete', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('reminders')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ reminder: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Snooze reminder
router.post('/:id/snooze', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { minutes } = req.body;

    const newTime = new Date();
    newTime.setMinutes(newTime.getMinutes() + (minutes || 10));

    const { data, error } = await supabase
      .from('reminders')
      .update({
        remind_at: newTime.toISOString(),
        status: 'snoozed',
      })
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ reminder: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete reminder
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user!.id);

    if (error) throw error;

    res.json({ message: 'Reminder deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;


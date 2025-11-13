import { Router } from 'express';
import { supabase } from '../config/supabase';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// Get all notes
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { folder, search } = req.query;
    
    let query = supabase
      .from('notes')
      .select('*')
      .eq('user_id', req.user!.id);

    if (folder) {
      query = query.eq('folder', folder);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) throw error;

    res.json({ notes: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single note
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (error) throw error;

    res.json({ note: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create note
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { title, content, folder, tags } = req.body;

    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: req.user!.id,
        title: title || 'Untitled Note',
        content: content || '',
        folder: folder || 'default',
        tags: tags || [],
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ note: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update note
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('notes')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ note: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete note
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user!.id);

    if (error) throw error;

    res.json({ message: 'Note deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get folders
router.get('/folders/list', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('folder')
      .eq('user_id', req.user!.id);

    if (error) throw error;

    const folders = [...new Set(data.map(n => n.folder))];

    res.json({ folders });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;


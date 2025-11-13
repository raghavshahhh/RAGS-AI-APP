import { motion } from 'framer-motion';
import { X, Plus, Search, FolderOpen, Tag, Trash2, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { notesService, Note } from '../services/notesService';
import toast from 'react-hot-toast';
import { RAGSIcon } from './RAGSLogo';

interface NotesPanelProps {
  onClose: () => void;
}

export default function NotesPanel({ onClose }: NotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<string[]>(['default']);
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotes();
    loadFolders();
  }, [selectedFolder, searchQuery]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const data = await notesService.getAllNotes(
        selectedFolder === 'all' ? undefined : selectedFolder,
        searchQuery || undefined
      );
      setNotes(data);
    } catch (error) {
      toast.error('Failed to load notes');
    }
    setLoading(false);
  };

  const loadFolders = async () => {
    try {
      const data = await notesService.getFolders();
      setFolders(data);
    } catch (error) {
      console.error('Failed to load folders');
    }
  };

  const createNewNote = async () => {
    try {
      const newNote = await notesService.createNote({
        title: 'New Note',
        content: '',
        folder: selectedFolder === 'all' ? 'default' : selectedFolder,
        tags: []
      });
      setNotes([newNote, ...notes]);
      setSelectedNote(newNote);
      setEditTitle(newNote.title);
      setEditContent(newNote.content);
      setEditMode(true);
      toast.success('New note created!');
    } catch (error) {
      toast.error('Failed to create note');
    }
  };

  const saveNote = async () => {
    if (!selectedNote) return;
    
    try {
      const updated = await notesService.updateNote(selectedNote.id, {
        title: editTitle,
        content: editContent
      });
      setNotes(notes.map(n => n.id === updated.id ? updated : n));
      setSelectedNote(updated);
      setEditMode(false);
      toast.success('Note saved!');
    } catch (error) {
      toast.error('Failed to save note');
    }
  };

  const deleteNote = async (id: string) => {
    if (!confirm('Delete this note?')) return;
    
    try {
      await notesService.deleteNote(id);
      setNotes(notes.filter(n => n.id !== id));
      if (selectedNote?.id === id) {
        setSelectedNote(null);
      }
      toast.success('Note deleted!');
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const selectNote = (note: Note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditMode(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass w-[900px] h-[600px] rounded-3xl p-6 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <RAGSIcon size={40} />
            <h2 className="text-2xl font-bold text-white">Notes</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex gap-4 flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 glass p-4 rounded-xl flex flex-col">
            <button
              onClick={createNewNote}
              className="w-full bg-gradient-to-r from-primary to-secondary text-white px-4 py-3 rounded-xl flex items-center justify-center gap-2 hover:scale-105 transition-transform mb-4"
            >
              <Plus size={20} />
              New Note
            </button>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" size={16} />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-dark/50 text-white pl-10 pr-4 py-2 rounded-lg border border-primary/20 focus:border-primary outline-none text-sm"
              />
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setSelectedFolder('all')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedFolder === 'all' ? 'bg-primary/20 text-primary' : 'text-muted hover:bg-dark/50'
                }`}
              >
                <FolderOpen className="inline mr-2" size={16} />
                All Notes ({notes.length})
              </button>
              {folders.map(folder => (
                <button
                  key={folder}
                  onClick={() => setSelectedFolder(folder)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedFolder === folder ? 'bg-primary/20 text-primary' : 'text-muted hover:bg-dark/50'
                  }`}
                >
                  <FolderOpen className="inline mr-2" size={16} />
                  {folder}
                </button>
              ))}
            </div>
          </div>

          {/* Notes List */}
          <div className="w-64 glass p-4 rounded-xl overflow-y-auto">
            {loading ? (
              <div className="text-center text-muted">Loading...</div>
            ) : notes.length === 0 ? (
              <div className="text-center text-muted">No notes yet</div>
            ) : (
              <div className="space-y-2">
                {notes.map(note => (
                  <div
                    key={note.id}
                    onClick={() => selectNote(note)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedNote?.id === note.id ? 'bg-primary/20' : 'hover:bg-dark/50'
                    }`}
                  >
                    <h3 className="text-white font-semibold text-sm truncate">{note.title}</h3>
                    <p className="text-xs text-muted mt-1 line-clamp-2">{note.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <FolderOpen size={12} className="text-muted" />
                      <span className="text-xs text-muted">{note.folder}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Note Editor */}
          <div className="flex-1 glass p-6 rounded-xl flex flex-col">
            {selectedNote ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    disabled={!editMode}
                    className="flex-1 bg-transparent text-white text-xl font-bold outline-none disabled:cursor-default"
                  />
                  <div className="flex gap-2">
                    {editMode ? (
                      <button
                        onClick={saveNote}
                        className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors flex items-center gap-2"
                      >
                        <Save size={16} />
                        Save
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditMode(true)}
                        className="px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => deleteNote(selectedNote.id)}
                      className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  disabled={!editMode}
                  className="flex-1 bg-transparent text-white outline-none resize-none disabled:cursor-default"
                  placeholder="Start typing..."
                />
                <div className="flex items-center gap-2 mt-4 text-xs text-muted">
                  <Tag size={12} />
                  {selectedNote.tags.length > 0 ? selectedNote.tags.join(', ') : 'No tags'}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted">
                Select a note or create a new one
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

import { useState } from 'react';
import { CalendarDays, Plus, Trash2, Clock, User } from 'lucide-react';
import type { CreateEventData, EventSession } from '../../types/event.types';

interface Props {
  data: CreateEventData;
  onUpdate: (data: Partial<CreateEventData>) => void;
}

export default function AgendaStep({ data, onUpdate }: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [newSession, setNewSession] = useState<Partial<EventSession>>({
    title: '',
    time: '',
    date: '',
    speaker: '',
    description: ''
  });

  const handleAddSession = () => {
    if (!newSession.title || !newSession.time) return;

    const session: EventSession = {
      id: crypto.randomUUID(),
      title: newSession.title,
      time: newSession.time,
      date: newSession.date,
      speaker: newSession.speaker || '',
      description: newSession.description
    };

    onUpdate({ agenda: [...data.agenda, session] });
    setNewSession({ title: '', time: '', date: '', speaker: '', description: '' });
    setIsAdding(false);
  };

  const removeSession = (id: string) => {
    onUpdate({ agenda: data.agenda.filter(s => s.id !== id) });
  };

  return (
    <div>
      <div className="ce-step-title">
        <div className="ce-step-title-icon">
          <CalendarDays size={20} />
        </div>
        Event Agenda
      </div>
      <p className="ce-step-subtitle">Outline the schedule for your event attendees.</p>

      {/* List of existing sessions */}
      <div className="flex flex-col gap-4 mb-6">
        {data.agenda.length === 0 && !isAdding && (
          <div className="text-center py-8 border border-dashed border-[var(--border-primary)] rounded-xl bg-[var(--bg-card)]">
            <p className="text-[var(--text-muted)]">No sessions added yet.</p>
          </div>
        )}

        {data.agenda.map((session) => (
          <div key={session.id} className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-4 flex gap-4 items-start group">
            <div className="flex flex-col items-center min-w-[60px] text-center">
              <span className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider">
                {session.time}
              </span>
              {session.date && (
                <span className="text-[10px] text-[var(--text-muted)] mt-1">
                  {new Date(session.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-[var(--text-primary)] truncate">{session.title}</h4>
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mt-1">
                {session.speaker && (
                   <span className="flex items-center gap-1"><User size={12}/> {session.speaker}</span>
                )}
              </div>
              {session.description && (
                <p className="text-sm text-[var(--text-muted)] mt-2 line-clamp-2">{session.description}</p>
              )}
            </div>

            <button 
              onClick={() => removeSession(session.id)}
              className="p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Add New Session Form */}
      {isAdding ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2">
          <h4 className="font-bold text-[var(--text-primary)] mb-4">Add Session</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
             <div className="form-row">
                <label className="label">Session Title *</label>
                <input 
                  className="input" 
                  value={newSession.title} 
                  onChange={e => setNewSession({...newSession, title: e.target.value})}
                  placeholder="e.g. Keynote Speech"
                />
             </div>
             <div className="form-row">
                <label className="label">Time Range *</label>
                <div className="relative">
                   <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                   <input 
                      className="input pl-9" 
                      value={newSession.time} 
                      onChange={e => setNewSession({...newSession, time: e.target.value})}
                      placeholder="e.g. 10:00 AM - 11:00 AM"
                   />
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
             <div className="form-row">
                <label className="label">Date (Optional)</label>
                <input 
                   type="date"
                   className="input" 
                   value={newSession.date} 
                   onChange={e => setNewSession({...newSession, date: e.target.value})}
                />
                <span className="helper-text">Leave blank if single day event</span>
             </div>
             <div className="form-row">
                <label className="label">Speaker (Optional)</label>
                <div className="relative">
                   <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                   <input 
                      className="input pl-9" 
                      value={newSession.speaker} 
                      onChange={e => setNewSession({...newSession, speaker: e.target.value})}
                      placeholder="e.g. Jane Doe"
                   />
                </div>
             </div>
          </div>

          <div className="form-row mb-4">
             <label className="label">Description</label>
             <textarea 
                className="textarea" 
                rows={3}
                value={newSession.description} 
                onChange={e => setNewSession({...newSession, description: e.target.value})}
                placeholder="Session details..."
             />
          </div>

          <div className="flex gap-3 justify-end">
             <button 
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 rounded-lg text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
             >
                Cancel
             </button>
             <button 
                onClick={handleAddSession}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-[var(--color-primary)] text-white hover:opacity-90"
             >
                Add Session
             </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full py-3 rounded-xl border border-dashed border-[var(--border-primary)] flex items-center justify-center gap-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:border-[var(--color-primary)] transition-all font-bold"
        >
           <Plus size={18} />
           Add Session
        </button>
      )}

    </div>
  );
}

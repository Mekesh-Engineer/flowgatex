import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, ChevronLeft, ChevronRight, Save, Check,
  Sparkles, Calendar, Ticket, Zap, CheckCircle, Trash2, Rocket, Database
} from 'lucide-react';

import { useAuthStore } from '@/store/zustand/stores';
import { eventService } from '@/features/events/services/eventService';
import { INITIAL_EVENT_DATA, CreateEventData } from '@/features/events/types/event.types';

// Steps
import BasicInfoStep from '@/features/events/components/CreateEvent/BasicInfoStep';
import DateStep from '@/features/events/components/CreateEvent/DateStep';
import VenueStep from '@/features/events/components/CreateEvent/VenueStep';
import TicketsStep from '@/features/events/components/CreateEvent/TicketsStep';
import DetailsStep from '@/features/events/components/CreateEvent/DetailsStep';
import AgendaStep from '@/features/events/components/CreateEvent/AgendaStep';
import MediaStep from '@/features/events/components/CreateEvent/MediaStep';
import OrganizerStep from '@/features/events/components/CreateEvent/OrganizerStep';
import SettingsStep from '@/features/events/components/CreateEvent/SettingsStep';
import ReviewStep from '@/features/events/components/CreateEvent/ReviewStep';
import LivePreview from '@/features/events/components/CreateEvent/LivePreview';

const STEPS = [
  'Basic', 'Time', 'Venue', 'Tickets', 'Details', 'Agenda', 'Media', 'Organizer', 'Settings', 'Review'
];

const LOCAL_STORAGE_KEY = 'flowgatex_imported_events';

export default function CreateEventPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<CreateEventData>(INITIAL_EVENT_DATA);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // JSON Import Modal state
  const [showModal, setShowModal] = useState(false);
  const [importedEvents, setImportedEvents] = useState<CreateEventData[]>([]);
  const [publishProgress, setPublishProgress] = useState(0);
  const [isBulkPublishing, setIsBulkPublishing] = useState(false);
  const [bulkPublishDone, setBulkPublishDone] = useState(false);

  // On mount, check if there are previously imported events in localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed: CreateEventData[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setImportedEvents(parsed);
          setShowModal(true);
        }
      }
    } catch {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, []);

  const updateFormData = (newData: Partial<CreateEventData>) => {
    setFormData(prev => ({ ...prev, ...newData }));
  };

  const handleNext = () => {
    setActiveStep(prev => Math.min(prev + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setActiveStep(prev => Math.max(prev - 1, 0));
  };

  const goToStep = (index: number) => {
    setActiveStep(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── JSON Upload Handler ─────────────────────────────────────────
  const handleJsonUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset file input so re-uploading the same file works
    event.target.value = '';

    try {
      const events = await eventService.parseEventJsonFile(file);

      // Save to localStorage
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(events));

      // Show modal
      setImportedEvents(events);
      setPublishProgress(0);
      setBulkPublishDone(false);
      setIsBulkPublishing(false);
      setShowModal(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse JSON file');
    }
  };

  // ── Bulk Publish (JSON data) ────────────────────────────────────
  const handleBulkPublish = async () => {
    if (!user || importedEvents.length === 0) return;
    setIsBulkPublishing(true);
    setPublishProgress(0);
    setBulkPublishDone(false);
    setError(null);

    try {
      for (let i = 0; i < importedEvents.length; i++) {
        await eventService.publishEvent(importedEvents[i], user.uid);
        setPublishProgress(i + 1);
      }

      // Also publish the form data if the user has filled anything meaningful
      if (formData.title.trim()) {
        await eventService.publishEvent(formData, user.uid);
      }

      // Clear localStorage after success
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setBulkPublishDone(true);
    } catch {
      setError('Some events failed to publish. Please try again.');
      setIsBulkPublishing(false);
    }
  };

  // ── Clear Imported Events ───────────────────────────────────────
  const handleClearImport = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setImportedEvents([]);
    setShowModal(false);
    setPublishProgress(0);
    setBulkPublishDone(false);
    setIsBulkPublishing(false);
  };

  // ── Publish Single Event (form) ─────────────────────────────────
  const handlePublish = async () => {
    if (!user) return;
    setIsPublishing(true);
    setError(null);
    try {
      await eventService.publishEvent(formData, user.uid);
      navigate('/organizer/events', { state: { success: 'Event published!' } });
    } catch {
      setError('Failed to publish. Please check your connection.');
    } finally {
      setIsPublishing(false);
    }
  };

  const renderStep = () => {
    const props = { data: formData, onUpdate: updateFormData, onNext: handleNext, onPrev: handleBack };

    switch (activeStep) {
      case 0: return <BasicInfoStep {...props} />;
      case 1: return <DateStep {...props} />;
      case 2: return <VenueStep {...props} />;
      case 3: return <TicketsStep {...props} />;
      case 4: return <DetailsStep {...props} />;
      case 5: return <AgendaStep {...props} />;
      case 6: return <MediaStep {...props} />;
      case 7: return <OrganizerStep {...props} />;
      case 8: return <SettingsStep {...props} />;
      case 9: return <ReviewStep {...props} onSubmit={handlePublish} isSubmitting={isPublishing} />;
      default: return null;
    }
  };

  const progressPercent = importedEvents.length > 0
    ? Math.round((publishProgress / importedEvents.length) * 100)
    : 0;

  return (
    <div className="ce-page">
      {/* Floating Decorations */}
      <motion.div
        className="ce-glow-orb is-primary"
        style={{ width: 300, height: 300, top: '5%', right: '-5%' }}
        animate={{ y: [0, -20, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="ce-glow-orb is-secondary"
        style={{ width: 250, height: 250, bottom: '10%', left: '-5%' }}
        animate={{ y: [0, 15, 0], scale: [1.1, 1, 1.1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="ce-float-element"
        style={{ width: 48, height: 48, top: '12%', right: '8%' }}
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Sparkles size={20} style={{ color: 'var(--color-primary)' }} />
      </motion.div>
      <motion.div
        className="ce-float-element"
        style={{ width: 44, height: 44, top: '35%', left: '3%' }}
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        <Calendar size={18} style={{ color: 'var(--color-secondary)' }} />
      </motion.div>
      <motion.div
        className="ce-float-element"
        style={{ width: 40, height: 40, bottom: '20%', right: '5%' }}
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      >
        <Ticket size={16} style={{ color: 'var(--color-primary)' }} />
      </motion.div>

      <div className="ce-page-inner">
        {/* Header */}
        <motion.div
          className="ce-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="ce-header-left">
            <h1>Create Event</h1>
            <p>Step {activeStep + 1} of {STEPS.length} — {STEPS[activeStep]}</p>
          </div>
          <div className="ce-header-actions">
            <label className="btn btn-outline" style={{ cursor: isPublishing ? 'not-allowed' : 'pointer' }}>
              <Upload size={16} />
              Import JSON
              <input type="file" hidden accept=".json" onChange={handleJsonUpload} disabled={isPublishing} />
            </label>
            <button className="btn btn-secondary" onClick={() => console.log('Draft saved')}>
              <Save size={16} />
              Save Draft
            </button>
          </div>
        </motion.div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="ce-alert is-error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Zap size={18} />
              <span>{error}</span>
              <button className="ce-alert-close" onClick={() => setError(null)}>✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stepper (Desktop) */}
        <motion.div
          className="ce-stepper"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {STEPS.map((label, idx) => (
            <div
              key={label}
              className={`ce-step ${idx === activeStep ? 'is-active' : ''} ${idx < activeStep ? 'is-completed' : ''}`}
              onClick={() => goToStep(idx)}
            >
              <div className="ce-step-dot">
                {idx < activeStep ? <Check size={14} /> : idx + 1}
              </div>
              <span className="ce-step-label">{label}</span>
            </div>
          ))}
        </motion.div>

        {/* Mobile Step Indicator */}
        <div className="ce-mobile-step">
          <span className="ce-mobile-step-text">
            {STEPS[activeStep]} ({activeStep + 1}/{STEPS.length})
          </span>
          <div className="ce-mobile-step-progress">
            {STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`ce-mobile-step-bar ${idx < activeStep ? 'is-completed' : ''} ${idx === activeStep ? 'is-filled' : ''}`}
              />
            ))}
          </div>
        </div>

        {/* Content Grid */}
        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative pb-20">
          {/* Main Form Panel */}
          <div className="lg:col-span-8 w-full min-w-0">
            <motion.div
              className="ce-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  {renderStep()}
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="ce-nav">
                <button
                  className="btn btn-ghost"
                  disabled={activeStep === 0}
                  onClick={handleBack}
                >
                  <ChevronLeft size={18} />
                  Back
                </button>
                {activeStep !== STEPS.length - 1 && (
                  <button className="btn btn-primary" onClick={handleNext}>
                    Next Step
                    <ChevronRight size={18} />
                  </button>
                )}
              </div>
            </motion.div>
          </div>

          {/* Live Preview */}
          <div className="hidden lg:block lg:col-span-4 sticky top-24 z-10">
            <LivePreview data={formData} />
          </div>
        </div>
      </div>

      {/* ── JSON Import Modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="ce-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !isBulkPublishing) {
                setShowModal(false);
              }
            }}
          >
            <motion.div
              className="ce-modal"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
            >
              {/* Header */}
              <div className="ce-modal-header">
                <div className="ce-modal-header-icon">
                  {bulkPublishDone ? <CheckCircle size={22} /> : <Database size={22} />}
                </div>
                <div>
                  <h3>{bulkPublishDone ? 'Published Successfully!' : 'JSON Uploaded to Local Storage'}</h3>
                  <p>
                    {bulkPublishDone
                      ? `All ${importedEvents.length} events are now live.`
                      : 'Event data has been saved locally and is ready to publish.'
                    }
                  </p>
                </div>
              </div>

              {/* Body */}
              <div className="ce-modal-body">
                {/* Event Count Stat */}
                <div className="ce-modal-stat">
                  <span className="ce-modal-stat-number">{importedEvents.length}</span>
                  <div className="ce-modal-stat-label">
                    <strong>Event{importedEvents.length !== 1 ? 's' : ''} Detected</strong>
                    in uploaded JSON file
                  </div>
                </div>

                {/* Publishing Progress */}
                {isBulkPublishing && !bulkPublishDone && (
                  <>
                    <p className="ce-modal-info">
                      Publishing events to Firebase database...
                    </p>
                    <div className="ce-modal-progress">
                      <div
                        className="ce-modal-progress-bar"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className="ce-modal-progress-text">
                      {publishProgress} / {importedEvents.length} ({progressPercent}%)
                    </p>
                  </>
                )}

                {/* Done message */}
                {bulkPublishDone && (
                  <p className="ce-modal-info" style={{ color: 'var(--color-success)' }}>
                    ✓ All events have been published to the "events" collection in Firebase.
                    Local storage has been cleared.
                  </p>
                )}

                {/* Before publish info */}
                {!isBulkPublishing && !bulkPublishDone && (
                  <p className="ce-modal-info">
                    Click <strong>Publish All</strong> to push all {importedEvents.length} event{importedEvents.length !== 1 ? 's' : ''} 
                    {formData.title.trim() ? ' (plus your form data)' : ''} into the Firebase "events" collection, 
                    or <strong>Clear</strong> to remove the imported data from local storage.
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="ce-modal-footer">
                {bulkPublishDone ? (
                  <>
                    <button
                      className="btn btn-primary"
                      onClick={() => navigate('/organizer/events', { state: { success: `${importedEvents.length} events published!` } })}
                    >
                      <Rocket size={16} />
                      View Events
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => {
                        handleClearImport();
                        setShowModal(false);
                      }}
                    >
                      Close
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn btn-primary"
                      onClick={handleBulkPublish}
                      disabled={isBulkPublishing || !user}
                    >
                      <Rocket size={16} />
                      {isBulkPublishing ? 'Publishing...' : 'Publish All'}
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={handleClearImport}
                      disabled={isBulkPublishing}
                    >
                      <Trash2 size={16} />
                      Clear
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { checkRefundEligibility, processRefund } from '../services/refundService';
import { useAuthStore } from '@/store/zustand/stores';
import { useQueryClient } from '@tanstack/react-query';

interface RefundDialogProps {
    isOpen: boolean;
    onClose: () => void;
    bookingId: string;
    eventTitle: string;
    amountPaid: number;
}

type Step = 'confirm' | 'processing' | 'success' | 'error';

const REFUND_REASONS = [
    'Schedule conflict',
    'Event cancelled / rescheduled',
    'Booked by mistake',
    'Found a better option',
    'Personal / health reasons',
    'Other',
];

export default function RefundDialog({
    isOpen,
    onClose,
    bookingId,
    eventTitle,
    amountPaid,
}: RefundDialogProps) {
    const user = useAuthStore((s) => s.user);
    const queryClient = useQueryClient();

    const [step, setStep] = useState<Step>('confirm');
    const [reason, setReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleClose = () => {
        // Reset state when closing
        setStep('confirm');
        setReason('');
        setCustomReason('');
        setErrorMsg('');
        onClose();
    };

    const handleSubmit = async () => {
        if (!user?.uid) return;

        const finalReason = reason === 'Other' ? customReason.trim() || 'Other' : reason;
        if (!finalReason) return;

        setStep('processing');

        try {
            // Check eligibility first
            const eligibility = await checkRefundEligibility(bookingId, user.uid);
            if (!eligibility.eligible) {
                setErrorMsg(eligibility.reason || 'Not eligible for refund');
                setStep('error');
                return;
            }

            // Process refund
            const result = await processRefund({
                bookingId,
                userId: user.uid,
                reason: finalReason,
            });

            if (result.success) {
                setStep('success');
                // Invalidate booking & transaction queries so lists refresh
                queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
                queryClient.invalidateQueries({ queryKey: ['transactions'] });
            } else {
                setErrorMsg(result.message);
                setStep('error');
            }
        } catch (err: any) {
            setErrorMsg(err.message || 'Something went wrong');
            setStep('error');
        }
    };

    const formatCurrency = (v: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Request Refund" size="md">
            <AnimatePresence mode="wait">
                {/* ── Step 1: Confirm ── */}
                {step === 'confirm' && (
                    <motion.div
                        key="confirm"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="space-y-5"
                    >
                        {/* Warning banner */}
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                            <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-semibold text-amber-800 dark:text-amber-300">Are you sure?</p>
                                <p className="text-amber-700 dark:text-amber-400 mt-0.5">
                                    This will cancel your booking and invalidate all tickets. The refund will be credited back.
                                </p>
                            </div>
                        </div>

                        {/* Booking summary */}
                        <div className="rounded-xl bg-gray-50 dark:bg-neutral-700/40 p-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-neutral-400">Event</span>
                                <span className="font-medium text-gray-900 dark:text-white text-right max-w-[60%] truncate">{eventTitle}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-neutral-400">Booking ID</span>
                                <span className="font-mono text-xs text-gray-700 dark:text-neutral-300">{bookingId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-neutral-400">Refund Amount</span>
                                <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(amountPaid)}</span>
                            </div>
                        </div>

                        {/* Reason selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                                Reason for refund
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {REFUND_REASONS.map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setReason(r)}
                                        className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all text-left ${reason === r
                                                ? 'border-primary-400 dark:border-primary-500 bg-primary-50 dark:bg-primary-500/15 text-primary-700 dark:text-primary-300'
                                                : 'border-gray-200 dark:border-neutral-600 text-gray-600 dark:text-neutral-400 hover:border-gray-300 dark:hover:border-neutral-500'
                                            }`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>

                            {reason === 'Other' && (
                                <textarea
                                    value={customReason}
                                    onChange={(e) => setCustomReason(e.target.value)}
                                    placeholder="Please describe your reason..."
                                    rows={3}
                                    className="mt-3 w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                />
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="primary"
                                className="flex-1 !bg-red-600 hover:!bg-red-700"
                                onClick={handleSubmit}
                                disabled={!reason || (reason === 'Other' && !customReason.trim())}
                            >
                                <RotateCcw size={14} className="mr-1.5" /> Confirm Refund
                            </Button>
                            <Button variant="ghost" onClick={handleClose}>
                                Cancel
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* ── Step 2: Processing ── */}
                {step === 'processing' && (
                    <motion.div
                        key="processing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center py-10 gap-4"
                    >
                        <Loader2 size={40} className="text-primary-500 animate-spin" />
                        <p className="text-gray-700 dark:text-neutral-300 font-medium">Processing your refund…</p>
                        <p className="text-xs text-gray-400 dark:text-neutral-500">Please don't close this window</p>
                    </motion.div>
                )}

                {/* ── Step 3: Success ── */}
                {step === 'success' && (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center py-10 gap-4 text-center"
                    >
                        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/15 flex items-center justify-center">
                            <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Refund Processed</h3>
                            <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">
                                {formatCurrency(amountPaid)} will be credited back to your original payment method.
                            </p>
                        </div>
                        <Button variant="primary" onClick={handleClose} className="mt-2">
                            Done
                        </Button>
                    </motion.div>
                )}

                {/* ── Step 4: Error ── */}
                {step === 'error' && (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center py-10 gap-4 text-center"
                    >
                        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/15 flex items-center justify-center">
                            <XCircle size={32} className="text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Refund Failed</h3>
                            <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">{errorMsg}</p>
                        </div>
                        <div className="flex gap-3 mt-2">
                            <Button variant="primary" onClick={() => setStep('confirm')}>
                                Try Again
                            </Button>
                            <Button variant="ghost" onClick={handleClose}>
                                Close
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Modal>
    );
}

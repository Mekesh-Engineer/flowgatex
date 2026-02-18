import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { getBookingById } from '@/features/booking/services/bookingService';
import { getTicketById, updateTicketStatus } from '@/features/booking/services/ticketService';
import { verifyQRData } from '@/features/booking/utils/qrUtils';
import { BookingStatus } from '@/lib/constants';
import type { Booking } from '@/features/booking/types/booking.types';
import type { Ticket } from '@/features/booking/types/ticket.types';
import { CheckCircle, XCircle, AlertCircle, Scan, ShieldAlert } from 'lucide-react';
import Button from '@/components/common/Button';
import { useAuthStore } from '@/store/zustand/stores';

type ScanStatus = 'valid' | 'invalid' | 'error' | 'fraud' | 'scanning';

interface ScanResult {
    status: ScanStatus;
    message?: string;
    booking?: Booking;
    ticket?: Ticket;
}

export default function ScannerPage() {
    const { user } = useAuthStore();
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [isScanning, setIsScanning] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!isScanning) return;

        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );

        scanner.render(onScanSuccess, onScanFailure);

        function onScanSuccess(decodedText: string) {
            scanner.clear();
            setIsScanning(false);
            validateTicket(decodedText);
        }

        function onScanFailure(_error: any) {
            // Keep scanning silently
        }

        return () => {
            scanner.clear().catch(error => {
                console.error("Failed to clear html5-qrcode scanner. ", error);
            });
        };
    }, [isScanning]);

    const validateTicket = async (qrContent: string) => {
        setIsProcessing(true);
        try {
            // --- Strategy 1: Secure QR (Base64-encoded payload+hash) ---
            const verification = await verifyQRData(qrContent);

            if (verification.valid && verification.payload?.ticketId) {
                const { payload } = verification;

                // Verify hash integrity passed — now check Firestore
                const ticket = await getTicketById(payload.ticketId);

                if (!ticket) {
                    setScanResult({ status: 'invalid', message: 'Ticket not found in database.' });
                    return;
                }

                if (ticket.status === 'used') {
                    setScanResult({
                        status: 'invalid',
                        message: 'Ticket already used — duplicate entry attempt.',
                        ticket,
                    });
                    return;
                }

                if (ticket.status === 'cancelled' || ticket.status === 'expired') {
                    setScanResult({
                        status: 'invalid',
                        message: `Ticket is ${ticket.status}. Entry denied.`,
                        ticket,
                    });
                    return;
                }

                // QR hash verification already done by verifyQRData above.
                // If ticket.qrHash is stored, it was validated during QR integrity check.

                // Fetch the associated booking for display
                const booking = await getBookingById(ticket.bookingId);

                if (booking && booking.status !== BookingStatus.CONFIRMED) {
                    setScanResult({
                        status: 'invalid',
                        message: `Booking is ${booking.status}. Cannot validate ticket.`,
                        booking,
                        ticket,
                    });
                    return;
                }

                // Mark ticket as used
                await updateTicketStatus(ticket.id, 'used', user?.uid);

                setScanResult({
                    status: 'valid',
                    message: 'Access Granted',
                    booking: booking || undefined,
                    ticket,
                });
                return;
            }

            // Hash verification failed
            if (!verification.valid && verification.reason) {
                if (verification.reason.includes('Hash mismatch')) {
                    setScanResult({
                        status: 'fraud',
                        message: `⚠️ FRAUD ALERT: ${verification.reason}`,
                    });
                    return;
                }
            }

            // --- Strategy 2: Legacy fallback (JSON { b: bookingId, t: ticketId }) ---
            try {
                const data = JSON.parse(qrContent);
                if (data.b && data.t) {
                    const booking = await getBookingById(data.b);
                    if (!booking) {
                        setScanResult({ status: 'invalid', message: 'Booking not found.' });
                        return;
                    }
                    if (booking.status !== BookingStatus.CONFIRMED) {
                        setScanResult({ status: 'invalid', message: `Booking status is ${booking.status}` });
                        return;
                    }
                    const hasTicket = booking.tickets.some(t => t.qrCodes?.includes(data.t));
                    if (!hasTicket) {
                        setScanResult({ status: 'invalid', message: 'Ticket ID not found in this booking.' });
                        return;
                    }
                    setScanResult({
                        status: 'valid',
                        message: 'Access Granted (legacy QR)',
                        booking,
                    });
                    return;
                }
            } catch {
                // Not JSON either
            }

            setScanResult({ status: 'invalid', message: 'Invalid QR format. Not a valid ticket code.' });
        } catch (error) {
            console.error(error);
            setScanResult({ status: 'error', message: 'System error during validation.' });
        } finally {
            setIsProcessing(false);
        }
    };

    const resetScanner = () => {
        setScanResult(null);
        setIsScanning(true);
    };

    return (
        <div className="max-w-md mx-auto p-4 space-y-6">
            <h1 className="text-2xl font-bold text-center mb-6">Ticket Scanner</h1>

            {isScanning ? (
                <div className="bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border-primary)] shadow-sm">
                    <div id="reader"></div>
                    <p className="text-center text-sm text-[var(--text-muted)] mt-4">Point your camera at a ticket QR code</p>
                </div>
            ) : (
                <div className="space-y-6 text-center animate-in fade-in zoom-in duration-300">
                    {isProcessing && (
                        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] p-8 rounded-3xl flex flex-col items-center gap-4">
                            <div className="animate-spin size-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full" />
                            <p className="text-[var(--text-muted)] font-medium">Verifying ticket...</p>
                        </div>
                    )}

                    {scanResult?.status === 'valid' && (
                        <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 p-8 rounded-3xl flex flex-col items-center gap-4">
                            <div className="p-4 bg-green-500 rounded-full text-white shadow-lg shadow-green-200 dark:shadow-green-500/20">
                                <CheckCircle size={48} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-green-700 dark:text-green-400">Valid Ticket</h2>
                                <p className="text-green-600 dark:text-green-300 font-medium">{scanResult.message}</p>
                            </div>

                            <div className="bg-white dark:bg-[var(--bg-base)] p-4 rounded-xl w-full text-left shadow-sm border border-green-100 dark:border-green-500/20 mt-2 space-y-3">
                                {scanResult.booking && (
                                    <>
                                        <div>
                                            <p className="text-xs text-[var(--text-muted)] uppercase font-bold">Event</p>
                                            <p className="font-bold text-[var(--text-primary)]">{scanResult.booking.eventTitle}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-[var(--text-muted)] uppercase font-bold">Attendee</p>
                                            <p className="font-medium text-[var(--text-primary)]">{scanResult.booking.attendees[0]?.name}</p>
                                        </div>
                                    </>
                                )}
                                {scanResult.ticket && (
                                    <>
                                        <div>
                                            <p className="text-xs text-[var(--text-muted)] uppercase font-bold">Ticket Type</p>
                                            <p className="font-medium text-[var(--text-primary)]">{scanResult.ticket.tierName}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-[var(--text-muted)] uppercase font-bold">Ticket ID</p>
                                            <p className="font-mono text-sm text-[var(--text-secondary)]">{scanResult.ticket.id}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {scanResult?.status === 'invalid' && (
                        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 p-8 rounded-3xl flex flex-col items-center gap-4">
                            <div className="p-4 bg-red-500 rounded-full text-white shadow-lg shadow-red-200 dark:shadow-red-500/20">
                                <XCircle size={48} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-red-700 dark:text-red-400">Invalid Ticket</h2>
                                <p className="text-red-600 dark:text-red-300 font-medium">{scanResult.message}</p>
                            </div>
                        </div>
                    )}

                    {scanResult?.status === 'fraud' && (
                        <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 p-8 rounded-3xl flex flex-col items-center gap-4">
                            <div className="p-4 bg-orange-600 rounded-full text-white shadow-lg shadow-orange-200 dark:shadow-orange-500/20">
                                <ShieldAlert size={48} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-orange-700 dark:text-orange-400">Fraud Alert</h2>
                                <p className="text-orange-600 dark:text-orange-300 font-medium">{scanResult.message}</p>
                            </div>
                        </div>
                    )}

                    {scanResult?.status === 'error' && (
                        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-8 rounded-3xl flex flex-col items-center gap-4">
                            <div className="p-4 bg-amber-500 rounded-full text-white shadow-lg shadow-amber-200 dark:shadow-amber-500/20">
                                <AlertCircle size={48} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-amber-700 dark:text-amber-400">Error</h2>
                                <p className="text-amber-600 dark:text-amber-300 font-medium">{scanResult.message}</p>
                            </div>
                        </div>
                    )}

                    <Button onClick={resetScanner} className="w-full gap-2" size="lg">
                        <Scan size={20} /> Scan Another
                    </Button>
                </div>
            )}
        </div>
    );
}

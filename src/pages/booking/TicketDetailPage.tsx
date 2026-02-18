import { useRef } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Calendar,
    Ticket,
    Download,
    Share2,
    Copy,
    Shield,
    Clock,
    User,
    Mail,
    AlertCircle,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getTicketById } from '@/features/booking/services/ticketService';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Button from '@/components/common/Button';
import { showSuccess } from '@/components/common/Toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function TicketDetailPage() {
    const { ticketId } = useParams<{ ticketId: string }>();
    const ticketRef = useRef<HTMLDivElement>(null);

    const { data: ticket, isLoading } = useQuery({
        queryKey: ['ticket', ticketId],
        queryFn: () => getTicketById(ticketId!),
        enabled: !!ticketId,
    });

    if (!ticketId) return <Navigate to="/my-tickets" replace />;

    if (isLoading) {
        return <LoadingSpinner fullScreen message="Loading ticket..." />;
    }

    if (!ticket) {
        return (
            <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-primary)] mb-4 inline-block">
                        <AlertCircle size={48} className="text-[var(--text-muted)]" />
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Ticket not found</h2>
                    <p className="text-[var(--text-muted)] mb-6">
                        This ticket may have been cancelled or does not exist.
                    </p>
                    <Link to="/my-tickets">
                        <Button variant="primary" className="gap-2">
                            <ArrowLeft size={16} /> Back to My Tickets
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const statusColor =
        ticket.status === 'valid'
            ? 'green'
            : ticket.status === 'used'
                ? 'blue'
                : 'red';

    const copyTicketId = () => {
        navigator.clipboard.writeText(ticket.id);
        showSuccess('Ticket ID copied!');
    };

    const handleDownloadPDF = async () => {
        if (!ticketRef.current) return;
        try {
            const canvas = await html2canvas(ticketRef.current, {
                backgroundColor: '#12121a',
                scale: 2,
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 190;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
            pdf.save(`FlowGateX-Ticket-${ticket.id}.pdf`);
            showSuccess('Ticket PDF downloaded!');
        } catch {
            window.print();
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: `FlowGateX Ticket - ${ticket.eventTitle}`,
            text: `My ticket for ${ticket.eventTitle} - ${ticket.tierName}`,
            url: window.location.href,
        };

        if (navigator.share) {
            await navigator.share(shareData).catch(() => { });
        } else {
            navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
            showSuccess('Link copied!');
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-base)] transition-colors duration-300">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                {/* Back */}
                <Link
                    to="/my-tickets"
                    className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors mb-6"
                >
                    <ArrowLeft size={16} /> Back to My Tickets
                </Link>

                {/* Ticket Card */}
                <motion.div
                    ref={ticketRef}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-primary)] overflow-hidden shadow-xl"
                >
                    {/* Top gradient */}
                    <div className="h-2 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]" />

                    {/* Header */}
                    <div className="p-6 sm:p-8 pb-0">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
                                    {ticket.eventTitle}
                                </h1>
                                <div className="flex flex-wrap items-center gap-3 mt-2">
                                    <span
                                        className={`text-xs font-bold px-3 py-1 rounded-full bg-${statusColor}-500/10 text-${statusColor}-500`}
                                    >
                                        {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                                    </span>
                                    <span className="text-sm font-medium text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2.5 py-0.5 rounded-lg">
                                        {ticket.tierName}
                                    </span>
                                </div>
                            </div>
                            <Ticket size={32} className="text-[var(--color-primary)] shrink-0" />
                        </div>
                    </div>

                    {/* Full-screen QR */}
                    <div className="flex justify-center py-8 px-6">
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                            <QRCodeSVG
                                value={ticket.qrData || ticket.id}
                                size={220}
                                level="H"
                                includeMargin={false}
                            />
                        </div>
                    </div>

                    {/* Perforated divider */}
                    <div className="relative">
                        <div className="absolute inset-x-0 border-t-2 border-dashed border-[var(--border-primary)]" />
                        <div className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-[var(--bg-base)]" />
                        <div className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-[var(--bg-base)]" />
                    </div>

                    {/* Details */}
                    <div className="p-6 sm:p-8 pt-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <DetailRow icon={Calendar} label="Date">
                                {new Date(ticket.eventDate).toLocaleDateString('en-IN', {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                })}
                            </DetailRow>

                            <DetailRow icon={Ticket} label="Tier">
                                {ticket.tierName}
                            </DetailRow>

                            {ticket.attendeeName && (
                                <DetailRow icon={User} label="Attendee">
                                    {ticket.attendeeName}
                                </DetailRow>
                            )}

                            {ticket.attendeeEmail && (
                                <DetailRow icon={Mail} label="Email">
                                    {ticket.attendeeEmail}
                                </DetailRow>
                            )}

                            {ticket.gateAccessLevel && (
                                <DetailRow icon={Shield} label="Access Level">
                                    <span className="capitalize">{ticket.gateAccessLevel}</span>
                                </DetailRow>
                            )}

                            {ticket.expiresAt && (
                                <DetailRow icon={Clock} label="Expires">
                                    {new Date(ticket.expiresAt).toLocaleDateString('en-IN')}
                                </DetailRow>
                            )}
                        </div>

                        {/* Ticket ID */}
                        <div className="pt-4 border-t border-[var(--border-primary)]">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold">
                                    Ticket ID
                                </span>
                                <button
                                    onClick={copyTicketId}
                                    className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-secondary)] bg-[var(--bg-surface)] px-2.5 py-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                                >
                                    {ticket.id}
                                    <Copy size={12} className="text-[var(--text-muted)]" />
                                </button>
                            </div>
                        </div>

                        {/* Security note */}
                        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] bg-[var(--bg-surface)] px-3 py-2 rounded-lg">
                            <Shield size={14} className="text-green-500 shrink-0" />
                            <span>
                                This ticket is cryptographically signed and verified. Do not share the QR code.
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Action buttons */}
                <div className="flex gap-3 mt-6 print:hidden">
                    <Button variant="primary" className="flex-1 gap-2" onClick={handleDownloadPDF}>
                        <Download size={16} /> Download PDF
                    </Button>
                    <Button variant="secondary" className="flex-1 gap-2" onClick={handleShare}>
                        <Share2 size={16} /> Share
                    </Button>
                </div>
            </div>
        </div>
    );
}

function DetailRow({
    icon: Icon,
    label,
    children,
}: {
    icon: typeof Calendar;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold flex items-center gap-1.5 mb-1">
                <Icon size={12} /> {label}
            </span>
            <p className="text-sm font-medium text-[var(--text-primary)]">{children}</p>
        </div>
    );
}

export default TicketDetailPage;

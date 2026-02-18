import { useEffect, useRef } from 'react';
import {
  CheckCircle,
  Download,
  Calendar,
  ArrowRight,
  Copy,
  Share2,
  Ticket,
  Printer,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { formatCurrency } from '@/lib/utils';
import type { Booking } from '../types/booking.types';
import Button from '@/components/common/Button';
import { showSuccess } from '@/components/common/Toast';
import confetti from 'canvas-confetti';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface BookingConfirmationProps {
  booking: Booking;
}

function BookingConfirmation({ booking }: BookingConfirmationProps) {
  const ticketRef = useRef<HTMLDivElement>(null);

  // Fire confetti on mount
  useEffect(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#00A3DB', '#10b981', '#f59e0b'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#00A3DB', '#10b981', '#f59e0b'],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  const copyBookingId = () => {
    navigator.clipboard.writeText(booking.id);
    showSuccess('Booking ID copied!');
  };

  const handleAddToCalendar = () => {
    const eventDate =
      typeof booking.eventDate === 'string' ? new Date(booking.eventDate) : new Date();
    const endDate = new Date(eventDate.getTime() + 3 * 60 * 60 * 1000); // +3 hours

    const formatDate = (d: Date) =>
      d
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d{3}/, '');

    const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      booking.eventTitle
    )}&dates=${formatDate(eventDate)}/${formatDate(endDate)}&details=${encodeURIComponent(
      `Booking ID: ${booking.id}`
    )}`;

    window.open(calUrl, '_blank');
  };

  const handleShare = async () => {
    const shareData = {
      title: `FlowGateX - ${booking.eventTitle}`,
      text: `I just booked tickets for ${booking.eventTitle}! 🎉`,
      url: window.location.href,
    };

    if (navigator.share) {
      await navigator.share(shareData).catch(() => { });
    } else {
      navigator.clipboard.writeText(
        `${shareData.text}\n${shareData.url}`
      );
      showSuccess('Link copied to clipboard!');
    }
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
      pdf.save(`FlowGateX-Booking-${booking.id}.pdf`);
      showSuccess('PDF downloaded!');
    } catch {
      // Fallback to print
      window.print();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-2xl mx-auto text-center py-6">
      <div className="mb-8 flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30 mb-6 animate-bounce">
          <CheckCircle size={40} className="text-white" />
        </div>
        <h1 className="text-4xl font-black text-[var(--text-primary)] mb-2 tracking-tight">
          Booking Confirmed!
        </h1>
        <p className="text-[var(--text-muted)] text-lg">
          Your tickets have been sent to your email.
        </p>
      </div>

      <div
        ref={ticketRef}
        className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-primary)] overflow-hidden shadow-xl text-left relative"
      >
        {/* Ticket Header Decor */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]" />

        <div className="p-8">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
            {booking.eventTitle}
          </h2>

          <div className="flex items-center gap-2 mb-6 text-[var(--text-secondary)]">
            <Calendar size={20} className="text-[var(--color-primary)]" />
            <span className="font-medium text-lg">
              {typeof booking.eventDate === 'string'
                ? new Date(booking.eventDate).toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
                : 'Date Not Available'}
            </span>
          </div>

          <div className="h-px bg-[var(--border-primary)] w-full my-6 bg-dashed" />

          {/* QR Codes */}
          <div className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4">
              Your Tickets
            </h3>
            <div className="flex gap-4 flex-wrap justify-center sm:justify-start">
              {booking.tickets.flatMap((ticket) => {
                const qrCodes = ticket.qrCodes && ticket.qrCodes.length > 0
                  ? ticket.qrCodes
                  : null;

                if (!qrCodes) {
                  // Fallback: render a single QR with booking + tier info
                  return Array.from({ length: ticket.quantity }, (_, i) => (
                    <div
                      key={`${ticket.tierId}-${i}`}
                      className="p-3 rounded-xl bg-white border border-gray-200 text-center shadow-sm"
                    >
                      <QRCodeSVG
                        value={JSON.stringify({
                          bookingId: booking.id,
                          tierId: ticket.tierId,
                          tierName: ticket.tierName,
                          index: i + 1,
                        })}
                        size={100}
                      />
                      <span className="block mt-2 text-xs font-bold text-gray-900">
                        {ticket.tierName} #{i + 1}
                      </span>
                    </div>
                  ));
                }

                return qrCodes.map((qr, index) => (
                  <div
                    key={`${ticket.tierId}-${index}`}
                    className="p-3 rounded-xl bg-white border border-gray-200 text-center shadow-sm"
                  >
                    {/* qr is already a secure Base64-encoded payload+hash string */}
                    <QRCodeSVG value={qr} size={100} />
                    <span className="block mt-2 text-xs font-bold text-gray-900">
                      {ticket.tierName} #{index + 1}
                    </span>
                  </div>
                ));
              })}
            </div>
          </div>

          <div className="h-px bg-[var(--border-primary)] w-full my-6 bg-dashed" />

          <div className="flex justify-between items-center mb-2">
            <span className="text-[var(--text-secondary)]">Booking ID</span>
            <button
              onClick={copyBookingId}
              className="flex items-center gap-2 font-mono font-medium text-[var(--text-primary)] bg-[var(--bg-surface)] px-3 py-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
              title="Copy Booking ID"
            >
              {booking.id}
              <Copy size={14} className="text-[var(--text-muted)]" />
            </button>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[var(--text-secondary)]">Total Paid</span>
            <span className="text-2xl font-black text-[var(--color-primary)]">
              {formatCurrency(booking.finalAmount)}
            </span>
          </div>

          {booking.paymentId && (
            <div className="flex justify-between items-center mt-2">
              <span className="text-[var(--text-secondary)]">Payment ID</span>
              <span className="font-mono text-sm text-[var(--text-muted)]">
                {booking.paymentId}
              </span>
            </div>
          )}

          {/* Ticket breakdown */}
          {booking.tickets.length > 0 && (
            <div className="mt-4 space-y-1">
              {booking.tickets.map((t) => (
                <div
                  key={t.tierId}
                  className="flex justify-between text-sm text-[var(--text-secondary)]"
                >
                  <span>
                    {t.tierName} × {t.quantity}
                  </span>
                  <span>{formatCurrency(t.price * t.quantity)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 print:hidden">
        <Button variant="secondary" className="gap-2" onClick={handleDownloadPDF}>
          <Download size={16} /> PDF
        </Button>
        <Button variant="secondary" className="gap-2" onClick={handlePrint}>
          <Printer size={16} /> Print
        </Button>
        <Button variant="secondary" className="gap-2" onClick={handleAddToCalendar}>
          <Calendar size={16} /> Calendar
        </Button>
        <Button variant="secondary" className="gap-2" onClick={handleShare}>
          <Share2 size={16} /> Share
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-6 justify-center print:hidden">
        <Link to="/my-tickets">
          <Button variant="primary" className="gap-2 w-full sm:w-auto">
            <Ticket size={18} /> View My Tickets
          </Button>
        </Link>
        <Link to="/dashboard">
          <Button variant="ghost" className="gap-2 w-full sm:w-auto">
            View My Bookings <ArrowRight size={18} />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default BookingConfirmation;

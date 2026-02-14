import { CheckCircle, Download, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { formatCurrency } from '@/lib/utils';
import type { Booking } from '../types/booking.types';
import Button from '@/components/common/Button';

interface BookingConfirmationProps {
  booking: Booking;
}

function BookingConfirmation({ booking }: BookingConfirmationProps) {
  return (
    <div className="max-w-2xl mx-auto text-center py-6">
      <div className="mb-8 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30 mb-6">
            <CheckCircle size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)] mb-2 tracking-tight">Booking Confirmed!</h1>
          <p className="text-[var(--text-muted)] text-lg">Your tickets have been sent to your email.</p>
      </div>

      <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-primary)] overflow-hidden shadow-xl text-left relative">
        {/* Ticket Header Decor */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]" />

        <div className="p-8">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">{booking.eventTitle}</h2>

            <div className="flex items-center gap-2 mb-6 text-[var(--text-secondary)]">
                <Calendar size={20} className="text-[var(--color-primary)]" />
                <span className="font-medium text-lg">
                    {typeof booking.eventDate === 'string' 
                        ? new Date(booking.eventDate).toLocaleDateString() 
                        : 'Date Not Available'}
                </span>
            </div>

            <div className="h-px bg-[var(--border-primary)] w-full my-6 bg-dashed" />

            {/* QR Codes */}
            <div className="mb-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4">Your Tickets</h3>
              <div className="flex gap-4 flex-wrap justify-center sm:justify-start">
                {booking.tickets.map((ticket) =>
                  ticket.qrCodes?.map((qr, index) => (
                    <div
                      key={qr}
                      className="p-3 rounded-xl bg-white border border-gray-200 text-center shadow-sm"
                    >
                      <QRCodeSVG value={qr} size={100} />
                      <span className="block mt-2 text-xs font-bold text-gray-900">
                        {ticket.tierName} #{index + 1}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="h-px bg-[var(--border-primary)] w-full my-6 bg-dashed" />

            <div className="flex justify-between items-center mb-2">
              <span className="text-[var(--text-secondary)]">Booking ID</span>
              <span className="font-mono font-medium text-[var(--text-primary)] bg-[var(--bg-surface)] px-2 py-1 rounded">{booking.id}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[var(--text-secondary)]">Total Paid</span>
              <span className="text-2xl font-black text-[var(--color-primary)]">
                {formatCurrency(booking.finalAmount)}
              </span>
            </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
        <Button variant="secondary" className="gap-2">
          <Download size={18} />
          Download Tickets
        </Button>
        <Link to="/dashboard">
             <Button variant="primary" className="gap-2 w-full sm:w-auto">
               View My Bookings <ArrowRight size={18} />
             </Button>
        </Link>
      </div>
    </div>
  );
}

export default BookingConfirmation;

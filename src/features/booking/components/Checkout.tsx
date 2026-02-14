import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, CreditCard, ShoppingBag, Trash2 } from 'lucide-react';
import { useCheckout } from '../hooks/useCheckout';
import { formatCurrency } from '@/lib/utils';
import type { Attendee } from '../types/booking.types';
import Button from '@/components/common/Button';

function Checkout() {
  const { items, totalPrice, isLoading, initiateCheckout } = useCheckout();
  const [attendees, setAttendees] = useState<Attendee[]>([{ name: '', email: '', phone: '' }]);

  const updateAttendee = (index: number, field: keyof Attendee, value: string) => {
    const updated = [...attendees];
    updated[index] = { ...updated[index], [field]: value };
    setAttendees(updated);
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    const eventTitle = items[0]?.eventTitle || 'Event';
    const eventDate = new Date().toISOString(); 
    await initiateCheckout(attendees, eventTitle, eventDate);
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="bg-[var(--bg-card)] p-6 rounded-full mb-4 shadow-sm">
            <ShoppingBag size={48} className="text-[var(--text-muted)]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Your cart is empty</h2>
        <p className="text-[var(--text-muted)] mt-2">Looks like you haven't added any tickets yet.</p>
        <Button variant="primary" className="mt-6" onClick={() => window.history.back()}>
            Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Attendee Details */}
      <div className="lg:col-span-2 space-y-8">
        <div>
           <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight mb-2">Checkout</h1>
           <p className="text-[var(--text-muted)]">Complete your purchase securely.</p>
        </div>

        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="size-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold">1</div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Attendee Information</h3>
            </div>

            {attendees.map((attendee, index) => (
                <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-sm hover:border-[var(--color-primary)] transition-colors group"
                >
                  <div className="flex items-center justify-between mb-4">
                     <h4 className="font-bold text-[var(--text-primary)]">Attendee {index + 1}</h4>
                     {index > 0 && (
                         <button className="text-red-500 hover:text-red-600 transition-colors" title="Remove Attendee">
                             <Trash2 size={16} />
                         </button>
                     )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Full Name</label>
                          <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors" size={18} />
                              <input 
                                  type="text"
                                  value={attendee.name} 
                                  onChange={(e) => updateAttendee(index, 'name', e.target.value)}
                                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-primary)] focus:border-[var(--color-primary)] outline-none transition-all"
                                  placeholder="John Doe"
                              />
                          </div>
                      </div>

                      <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Email Address</label>
                          <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors" size={18} />
                              <input 
                                  type="email"
                                  value={attendee.email} 
                                  onChange={(e) => updateAttendee(index, 'email', e.target.value)}
                                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-primary)] focus:border-[var(--color-primary)] outline-none transition-all"
                                  placeholder="john@example.com"
                              />
                          </div>
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Phone (Optional)</label>
                          <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors" size={18} />
                              <input 
                                  type="tel"
                                  value={attendee.phone || ''} 
                                  onChange={(e) => updateAttendee(index, 'phone', e.target.value)}
                                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-primary)] focus:border-[var(--color-primary)] outline-none transition-all"
                                  placeholder="+1 (555) 000-0000"
                              />
                          </div>
                      </div>
                  </div>
                </motion.div>
            ))}
            
            <button 
                className="text-sm font-bold text-[var(--color-primary)] hover:underline pl-2" 
                onClick={() => setAttendees([...attendees, { name: '', email: '', phone: '' }])}
            >
                + Add Another Attendee
            </button>
        </div>
      </div>

      {/* Right Column: Order Summary */}
      <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
              <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-lg">
                  <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">Order Summary</h3>
                  
                  <div className="space-y-4 mb-6">
                      {items.map((item) => (
                          <div key={`${item.eventId}-${item.tierId}`} className="flex justify-between items-start pb-4 border-b border-[var(--border-primary)] last:border-0 last:pb-0">
                              <div>
                                  <p className="font-bold text-[var(--text-primary)]">{item.eventTitle}</p>
                                  <p className="text-sm text-[var(--text-muted)]">{item.tierName} x {item.quantity}</p>
                              </div>
                              <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                          </div>
                      ))}
                  </div>
                  
                  <div className="space-y-2 py-4 border-t border-[var(--border-primary)]">
                       <div className="flex justify-between text-[var(--text-secondary)]">
                           <span>Subtotal</span>
                           <span>{formatCurrency(totalPrice)}</span>
                       </div>
                       <div className="flex justify-between text-[var(--text-secondary)]">
                           <span>Tax (0%)</span>
                           <span>$0.00</span>
                       </div>
                  </div>
                  
                  <div className="flex justify-between items-center py-4 border-t border-[var(--border-primary)] mb-6">
                      <span className="text-lg font-bold">Total</span>
                      <span className="text-2xl font-black text-[var(--color-primary)]">{formatCurrency(totalPrice)}</span>
                  </div>
                  
                  <Button 
                      variant="primary" 
                      className="w-full py-4 text-lg shadow-lg hover:shadow-primary-500/25"
                      onClick={handleCheckout}
                      disabled={isLoading}
                  >
                      {isLoading ? (
                          <span className="flex items-center gap-2">Processing...</span>
                      ) : (
                          <span className="flex items-center gap-2 justify-center">
                              <CreditCard size={20} /> Pay {formatCurrency(totalPrice)}
                          </span>
                      )}
                  </Button>
                  
                  <p className="text-xs text-center text-[var(--text-muted)] mt-4">
                      Secure payment powered by Stripe.
                  </p>
              </div>
          </div>
      </div>
    </div>
  );
}

export default Checkout;

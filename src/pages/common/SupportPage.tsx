import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  History, 
  Lock, 
  QrCode, 
  Terminal, 
  Ticket, 
  CreditCard, 
  ShieldCheck, 
  HelpCircle, 
  MessageCircle, 
  Phone, 
  Mail, 
  UploadCloud, 
  ChevronDown, 
  ChevronUp,
  FileText,
  CheckCircle2,
  Clock,
  Loader2,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '@/lib/utils';
import Input from '@/components/forms/Input';
import Button from '@/components/common/Button';
import { Card, CardContent } from '@/components/common/Card';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { showSuccess, showError } from '@/components/common/Toast';
import { GridCanvas, ParticleCanvas } from '@/features/home/components/canvas/CanvasEffects';
import { FloatingElement } from '@/features/home/components/ui/SharedComponents';

// =============================================================================
// MOCK DATA
// =============================================================================

const CATEGORIES = [
  { id: 'getting-started', icon: QrCode, title: 'Getting Started', desc: 'Account setup & basics' },
  { id: 'booking', icon: Ticket, title: 'Booking & Tickets', desc: 'Reservations & transfers' },
  { id: 'payments', icon: CreditCard, title: 'Payments', desc: 'Billing, invoices & refunds' },
  { id: 'security', icon: ShieldCheck, title: 'Privacy & Security', desc: 'Passwords & 2FA' },
  { id: 'api', icon: Terminal, title: 'Developer API', desc: 'Docs, keys & webhooks' },
];

const FAQS = [
  {
    id: 1,
    question: 'How do I process a refund for a cancelled event?',
    answer: 'Refunds can be processed directly from your Dashboard under the "Transactions" tab. Select the transaction ID, click "Issue Refund," and choose whether it\'s a full or partial refund. Funds typically return to the customer within 5-10 business days.'
  },
  {
    id: 2,
    question: 'Where can I find my API keys?',
    answer: 'Navigate to Settings > Developer > API Keys. You can generate new keys there. Remember to store your secret key securely as it will only be shown once.'
  },
  {
    id: 3,
    question: 'Can I transfer a ticket to another user?',
    answer: 'Yes! Go to "My Tickets", select the ticket you wish to transfer, and click "Transfer Ticket". Enter the recipient\'s email address. They will receive a link to claim the ticket.'
  },
  {
    id: 4,
    question: 'Why is my account locked?',
    answer: 'Accounts are temporarily locked after 5 failed login attempts. Please wait 15 minutes and try again, or use the "Forgot Password" link to reset your credentials.'
  }
];

const INITIAL_TICKETS = [
  { id: '#4829', subject: 'API Rate Limiting Issue', date: 'Oct 24, 2023', status: 'Pending', category: 'API' },
  { id: '#4810', subject: 'Refund Request - Event #99', date: 'Oct 20, 2023', status: 'Closed', category: 'Payments' },
];

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const floatVariants = {
  animate: {
    y: [0, -20, 0],
    rotate: [0, 5, -5, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function SupportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [ticketForm, setTicketForm] = useState({ 
    subject: '', 
    message: '',
    category: 'General'
  });

  const toggleFaq = (id: number) => {
    setActiveFaq(activeFaq === id ? null : id);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticketForm.subject.trim() || !ticketForm.message.trim()) {
      showError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate Backend Delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newTicket = {
      id: `#${Math.floor(Math.random() * 9000) + 1000}`,
      subject: ticketForm.subject,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Pending',
      category: ticketForm.category
    };

    setTickets(prev => [newTicket, ...prev]);
    setTicketForm({ subject: '', message: '', category: 'General' });
    setIsSubmitting(false);
    showSuccess('Support ticket created successfully!');
  };

  const filteredFaqs = FAQS.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--bg-base)] font-sans text-[var(--text-primary)]">
      
      {/* ─── Hero Section ─── */}
      <div className="relative bg-[var(--bg-base)] pt-24 pb-32 px-4 sm:px-6 lg:px-8 text-center overflow-hidden">
        
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/20 via-transparent to-[var(--color-secondary)]/10" />
        <div className="absolute inset-0 opacity-30"><GridCanvas /></div>
        <div className="absolute inset-0 opacity-40"><ParticleCanvas /></div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-3xl mx-auto space-y-6"
        >
          <FloatingElement duration={4} className="inline-block">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 backdrop-blur-md mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-success)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-success)]"></span>
              </span>
              <span className="text-xs font-medium text-[var(--color-primary)]">Support is Online</span>
            </div>
          </FloatingElement>

          <h1 className="text-4xl md:text-6xl font-black text-[var(--text-primary)] tracking-tight leading-tight">
            How can we <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]">help you?</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            Search our knowledge base or open a ticket. We're here to assist you with everything from account setup to technical issues.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative group mt-8">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] rounded-2xl opacity-30 group-hover:opacity-60 transition duration-300 blur-md"></div>
            <div className="relative flex items-center bg-[var(--bg-surface)] rounded-xl shadow-2xl border border-[var(--border-primary)] overflow-hidden">
              <div className="pl-5 text-[var(--text-muted)]">
                <Search size={22} />
              </div>
              <input
                type="text"
                className="w-full bg-transparent border-none py-4 px-4 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-0 text-base"
                placeholder="Ask a question (e.g. 'refunds', 'api keys')..."
                value={searchQuery}
                onChange={handleSearch}
              />
              <div className="pr-2">
                <Button size="sm" className="hidden sm:flex rounded-lg px-6">Search</Button>
              </div>
            </div>
          </div>

          {/* Quick Chips */}
          <div className="flex flex-wrap justify-center gap-3 pt-6">
            {[
              { label: 'Refunds', icon: History },
              { label: 'Login Issues', icon: Lock },
              { label: 'QR Tickets', icon: QrCode },
              { label: 'API Access', icon: Terminal },
            ].map((chip) => (
              <motion.button
                key={chip.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSearchQuery(chip.label.split(' ')[0])}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-surface)]/50 border border-[var(--border-primary)] hover:border-[var(--color-primary)]/50 transition-all text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] backdrop-blur-sm"
              >
                <chip.icon size={14} className="text-[var(--color-primary)]" />
                {chip.label}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ─── Main Content ─── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-20 pb-20">
        
        {/* Categories Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-12"
        >
          {CATEGORIES.map((cat) => (
            <motion.div key={cat.id} variants={itemVariants}>
              <Card 
                hover 
                className="bg-[var(--bg-card)] border-[var(--border-primary)] text-center h-full group transition-all hover:shadow-lg hover:-translate-y-1"
              >
                <CardContent className="p-6 flex flex-col items-center h-full justify-center">
                  <div className="p-4 rounded-2xl bg-[var(--bg-base)] text-[var(--color-primary)] mb-4 group-hover:scale-110 group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all duration-300 shadow-inner">
                    <cat.icon size={28} />
                  </div>
                  <h3 className="font-bold text-[var(--text-primary)] mb-1">{cat.title}</h3>
                  <p className="text-xs text-[var(--text-secondary)]">{cat.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: FAQ & Tickets */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* FAQ Section */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[var(--color-primary)]/10 rounded-lg text-[var(--color-primary)]">
                  <HelpCircle size={24} />
                </div>
                <h3 className="text-2xl font-bold text-[var(--text-primary)]">Frequently Asked Questions</h3>
              </div>
              
              <div className="space-y-3">
                <AnimatePresence mode='wait'>
                  {filteredFaqs.length > 0 ? (
                    filteredFaqs.map((faq) => (
                      <motion.div 
                        key={faq.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className={cn(
                          "bg-[var(--bg-card)] rounded-xl border border-[var(--border-primary)] overflow-hidden transition-all duration-300",
                          activeFaq === faq.id && "border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/20 shadow-md"
                        )}
                      >
                        <button
                          onClick={() => toggleFaq(faq.id)}
                          className="w-full flex justify-between items-center p-5 text-left font-medium text-[var(--text-primary)] hover:bg-[var(--bg-base)] transition-colors"
                        >
                          {faq.question}
                          {activeFaq === faq.id ? (
                            <ChevronUp className="text-[var(--color-primary)]" size={20} />
                          ) : (
                            <ChevronDown className="text-[var(--text-muted)]" size={20} />
                          )}
                        </button>
                        <motion.div 
                          initial={false}
                          animate={{ height: activeFaq === faq.id ? "auto" : 0, opacity: activeFaq === faq.id ? 1 : 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-subtle)] pt-4 mt-1 bg-[var(--bg-base)]/50">
                            {faq.answer}
                          </div>
                        </motion.div>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }}
                      className="text-center py-12 text-[var(--text-muted)] border border-dashed border-[var(--border-primary)] rounded-xl"
                    >
                      No answers found for "{searchQuery}"
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </section>

            {/* Ticket Section */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              
              {/* Submit Ticket Form */}
              <Card className="bg-[var(--bg-card)] border-[var(--border-primary)] shadow-sm h-fit overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]" />
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                    <Mail className="text-[var(--color-primary)]" size={20} />
                    Open a Ticket
                  </h3>
                  
                  {user ? (
                    <form onSubmit={handleTicketSubmit} className="space-y-4">
                      <Input
                        label="Subject"
                        placeholder="Briefly describe the issue"
                        value={ticketForm.subject}
                        onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                        required
                        className="bg-[var(--bg-base)] border-[var(--border-primary)] focus:border-[var(--color-primary)]"
                      />
                      
                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-[var(--text-secondary)]">Category</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['General', 'Billing', 'Technical'].map(cat => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setTicketForm(prev => ({ ...prev, category: cat }))}
                              className={cn(
                                "text-xs py-2 rounded-lg border transition-all",
                                ticketForm.category === cat 
                                  ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)] font-bold"
                                  : "bg-[var(--bg-base)] border-[var(--border-primary)] text-[var(--text-muted)] hover:border-[var(--text-muted)]"
                              )}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-[var(--text-secondary)]">Message</label>
                        <textarea
                          className="w-full bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-xl p-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all h-32 resize-none placeholder-[var(--text-muted)]"
                          placeholder="Provide details about what happened..."
                          value={ticketForm.message}
                          onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                          required
                        />
                      </div>
                      
                      {/* File Upload Mock */}
                      <div className="group border-2 border-dashed border-[var(--border-primary)] hover:border-[var(--color-primary)] rounded-xl p-6 text-center cursor-pointer transition-all bg-[var(--bg-base)]/50 hover:bg-[var(--bg-base)]">
                        <UploadCloud className="mx-auto text-[var(--text-muted)] group-hover:text-[var(--color-primary)] mb-2 transition-colors" size={24} />
                        <p className="text-sm text-[var(--text-secondary)]">
                          Drag & drop files or <span className="text-[var(--color-primary)] font-bold hover:underline">browse</span>
                        </p>
                      </div>

                      <Button type="submit" className="w-full flex items-center justify-center gap-2" isLoading={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : <><Send size={16} /> Submit Ticket</>}
                      </Button>
                    </form>
                  ) : (
                    <div className="text-center py-10 px-4 bg-[var(--bg-base)] rounded-xl border border-[var(--border-primary)]">
                      <Lock className="mx-auto text-[var(--text-muted)] mb-3" size={32} />
                      <p className="text-[var(--text-secondary)] mb-4">Please sign in to submit a support ticket.</p>
                      <Button variant="secondary" onClick={() => navigate('/login')}>Sign In</Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Tickets Table */}
              <div className="flex flex-col h-full">
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                  <History className="text-[var(--color-primary)]" size={20} />
                  Ticket History
                </h3>
                <div className="bg-[var(--bg-card)] rounded-2xl shadow-sm border border-[var(--border-primary)] overflow-hidden flex-1 flex flex-col">
                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[var(--bg-base)] border-b border-[var(--border-primary)]">
                        <tr>
                          <th className="px-6 py-3 font-semibold text-[var(--text-secondary)]">ID</th>
                          <th className="px-6 py-3 font-semibold text-[var(--text-secondary)]">Subject</th>
                          <th className="px-6 py-3 font-semibold text-[var(--text-secondary)]">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        <AnimatePresence>
                          {tickets.length > 0 ? (
                            tickets.map((ticket) => (
                              <motion.tr 
                                key={ticket.id} 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="hover:bg-[var(--bg-base)] transition-colors group"
                              >
                                <td className="px-6 py-4 font-mono text-xs text-[var(--text-muted)] group-hover:text-[var(--color-primary)] transition-colors">{ticket.id}</td>
                                <td className="px-6 py-4">
                                  <div className="font-medium text-[var(--text-primary)]">{ticket.subject}</div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] bg-[var(--bg-surface)] border border-[var(--border-primary)] px-1.5 rounded text-[var(--text-muted)]">
                                      {ticket.category || 'General'}
                                    </span>
                                    <span className="text-xs text-[var(--text-muted)]">{ticket.date}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={cn(
                                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                    ticket.status === 'Pending' 
                                      ? "bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20"
                                      : "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20"
                                  )}>
                                    {ticket.status === 'Pending' ? <Clock size={12} className="mr-1"/> : <CheckCircle2 size={12} className="mr-1"/>}
                                    {ticket.status}
                                  </span>
                                </td>
                              </motion.tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={3} className="px-6 py-12 text-center text-[var(--text-muted)]">
                                No tickets found.
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                  <div className="px-6 py-3 border-t border-[var(--border-primary)] bg-[var(--bg-base)] text-center">
                    <button className="text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-focus)] transition-colors">
                      View All Tickets
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Contact Support Panel */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Live Chat */}
            <Card hover className="bg-[var(--bg-card)] border-[var(--border-primary)] group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-20 bg-[var(--color-success)]/10 rounded-full blur-3xl -mr-10 -mt-10" />
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-[var(--text-primary)]">Live Chat</h4>
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-success)] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--color-success)]"></span>
                  </span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-6">
                  Our support team is online and ready to help you instantly.
                </p>
                <Button className="w-full flex items-center justify-center gap-2 shadow-lg shadow-[var(--color-success)]/20 hover:shadow-[var(--color-success)]/40">
                  <MessageCircle size={18} /> Start Chat
                </Button>
              </CardContent>
            </Card>

            {/* Phone Support */}
            <Card hover className="bg-[var(--bg-card)] border-[var(--border-primary)]">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-[var(--color-primary)]/10 p-2.5 rounded-lg text-[var(--color-primary)]">
                    <Phone size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[var(--text-primary)] text-sm">Phone Support</h4>
                    <p className="text-xs text-[var(--text-secondary)]">Mon-Fri, 9am - 5pm EST</p>
                  </div>
                </div>
                <a 
                  href="tel:+18001234567" 
                  className="block text-xl font-mono font-semibold text-[var(--text-primary)] hover:text-[var(--color-primary)] transition-colors text-center bg-[var(--bg-base)] py-3 rounded-xl border border-[var(--border-primary)] hover:border-[var(--color-primary)]"
                >
                  +1 (800) 123-4567
                </a>
              </CardContent>
            </Card>

            {/* Documentation Link */}
            <Card hover className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-white border-none relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <CardContent className="p-6 text-center relative z-10">
                <FileText className="mx-auto mb-3 opacity-90" size={32} />
                <h4 className="font-bold mb-2">Read Documentation</h4>
                <p className="text-sm text-white/80 mb-4">Detailed guides and API references.</p>
                <Button variant="secondary" size="sm" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm">
                  Visit Docs
                </Button>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>

      {/* ─── Footer ─── */}
      <footer className="bg-[var(--bg-card)] border-t border-[var(--border-primary)] py-10 px-4 text-center">
        <p className="text-[var(--text-muted)] text-sm">© 2026 FlowGateX Inc. All rights reserved.</p>
        <div className="flex justify-center gap-6 mt-4">
          <a href="#" className="text-[var(--text-muted)] hover:text-[var(--color-primary)] text-sm transition-colors">Privacy Policy</a>
          <a href="#" className="text-[var(--text-muted)] hover:text-[var(--color-primary)] text-sm transition-colors">Terms of Service</a>
          <a href="#" className="text-[var(--text-muted)] hover:text-[var(--color-primary)] text-sm transition-colors">Status Page</a>
        </div>
      </footer>
    </div>
  );
}
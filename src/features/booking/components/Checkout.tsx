import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    Mail,
    Phone,
    CreditCard,
    ShoppingBag,
    Trash2,
    ArrowLeft,
    Shield,
    Lock,
    CheckCircle,
    ChevronRight,
    Users,
} from 'lucide-react';
import { useCheckout } from '../hooks/useCheckout';
import { formatCurrency } from '@/lib/utils';
import type { Attendee } from '../types/booking.types';
import Button from '@/components/common/Button';
import PromoCodeInput from './PromoCodeInput';
import { showError } from '@/components/common/Toast';

const STEPS = ['Review Cart', 'Attendee Details', 'Payment'] as const;

import { z } from 'zod';

const attendeeSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().regex(/^\+?[0-9\s-]{10,}$/, "Invalid phone number").optional().or(z.literal("")),
});



function Checkout() {
    const {
        items,
        totalPrice,
        serviceFee,
        taxAmount,
        discount,
        finalTotal,
        isLoading,
        handlePayment,
        applyPromo,
        appliedPromo,
    } = useCheckout();

    const totalItemsCount = useMemo(
        () => items.reduce((sum, i) => sum + i.quantity, 0),
        [items]
    );

    const [currentStep, setCurrentStep] = useState(0);
    const [attendees, setAttendees] = useState<Attendee[]>([{ name: '', email: '', phone: '' }]);
    const [sameForAll, setSameForAll] = useState(true);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [agreedToGDPR, setAgreedToGDPR] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [promoLoading, setPromoLoading] = useState(false);

    const updateAttendee = (index: number, field: keyof Attendee, value: string) => {
        const updated = [...attendees];
        updated[index] = { ...updated[index], [field]: value };
        setAttendees(updated);
        // Clear validation errors for this field
        setValidationErrors((prev) => {
            const next = { ...prev };
            delete next[`${index}-${field}`];
            return next;
        });
    };

    const validateStep = useCallback(
        (step: number): boolean => {
            const errors: Record<string, string> = {};

            if (step === 0) {
                if (items.length === 0) {
                    errors['cart'] = 'Your cart is empty';
                }
            }

            if (step === 1) {
                // validate individual attendees
                attendees.forEach((a, i) => {
                    const result = attendeeSchema.safeParse(a);
                    if (!result.success) {
                        result.error.issues.forEach((issue) => {
                            // map zod path to our error key format
                            const field = issue.path[0];
                            errors[`${i}-${field}`] = issue.message;
                        });
                    }
                });

                if (!agreedToTerms) errors['terms'] = 'You must agree to terms and conditions';
                if (!agreedToGDPR) errors['gdpr'] = 'You must consent to data processing';
            }

            setValidationErrors(errors);
            return Object.keys(errors).length === 0;
        },
        [attendees, agreedToTerms, agreedToGDPR, items.length]
    );

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
        }
    };

    const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 0));

    const handlePromoApply = async (code: string) => {
        setPromoLoading(true);
        try {
            await applyPromo(code);
        } catch {
            showError('Failed to apply promo code');
        } finally {
            setPromoLoading(false);
        }
    };

    const onPay = async () => {
        if (!validateStep(1)) {
            setCurrentStep(1);
            return;
        }
        await handlePayment(attendees);
    };

    // Empty cart
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                <div className="bg-[var(--bg-card)] p-6 rounded-full mb-4 shadow-sm">
                    <ShoppingBag size={48} className="text-[var(--text-muted)]" />
                </div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">Your cart is empty</h2>
                <p className="text-[var(--text-muted)] mt-2">Add tickets to get started.</p>
                <Link to="/events">
                    <Button variant="primary" className="mt-6">
                        Browse Events
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            {/* Back to Cart */}
            <Link
                to="/cart"
                className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors mb-6"
            >
                <ArrowLeft size={16} /> Back to Cart
            </Link>

            <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight mb-2">
                Checkout
            </h1>
            <p className="text-[var(--text-muted)] mb-8">Complete your purchase securely.</p>

            {/* Progress Stepper */}
            <div className="flex items-center justify-center mb-10">
                {STEPS.map((label, idx) => (
                    <div key={label} className="flex items-center">
                        <button
                            onClick={() => idx < currentStep && setCurrentStep(idx)}
                            className={`flex items-center gap-2 transition-all ${idx < currentStep ? 'cursor-pointer' : 'cursor-default'
                                }`}
                            disabled={idx > currentStep}
                        >
                            <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${idx < currentStep
                                    ? 'bg-green-500 text-white'
                                    : idx === currentStep
                                        ? 'bg-[var(--color-primary)] text-white ring-4 ring-[var(--color-primary)]/20'
                                        : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-primary)]'
                                    }`}
                            >
                                {idx < currentStep ? <CheckCircle size={18} /> : idx + 1}
                            </div>
                            <span
                                className={`text-sm font-medium hidden sm:inline ${idx === currentStep
                                    ? 'text-[var(--text-primary)]'
                                    : 'text-[var(--text-muted)]'
                                    }`}
                            >
                                {label}
                            </span>
                        </button>
                        {idx < STEPS.length - 1 && (
                            <ChevronRight size={18} className="mx-3 text-[var(--text-muted)]" />
                        )}
                    </div>
                ))}
            </div>

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Step Content */}
                <div className="lg:col-span-2">
                    <AnimatePresence mode="wait">
                        {/* Step 0: Review Cart */}
                        {currentStep === 0 && (
                            <motion.div
                                key="step-0"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-4"
                            >
                                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                                    <ShoppingBag size={20} /> Review Your Items
                                </h2>
                                {items.map((item) => (
                                    <div
                                        key={`${item.eventId}-${item.tierId}`}
                                        className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] flex items-center gap-4"
                                    >
                                        {item.eventImage && (
                                            <img
                                                src={item.eventImage}
                                                alt={item.eventTitle}
                                                className="w-20 h-20 rounded-xl object-cover shrink-0"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-[var(--text-primary)] truncate">
                                                {item.eventTitle}
                                            </h4>
                                            <p className="text-sm text-[var(--text-muted)]">
                                                {item.tierName} × {item.quantity}
                                            </p>
                                            {item.eventDate && (
                                                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                                    {new Date(item.eventDate).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}
                                                </p>
                                            )}
                                        </div>
                                        <p className="text-lg font-bold text-[var(--text-primary)] shrink-0">
                                            {formatCurrency(item.price * item.quantity)}
                                        </p>
                                    </div>
                                ))}

                                <div className="flex justify-end pt-4">
                                    <Button variant="primary" className="gap-2 px-8 py-3" onClick={nextStep}>
                                        Continue <ChevronRight size={18} />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 1: Attendee Info */}
                        {currentStep === 1 && (
                            <motion.div
                                key="step-1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                                        <Users size={20} /> Attendee Information
                                    </h2>
                                    {totalItemsCount > 1 && (
                                        <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--text-muted)]">
                                            <input
                                                type="checkbox"
                                                checked={sameForAll}
                                                onChange={(e) => {
                                                    setSameForAll(e.target.checked);
                                                    if (e.target.checked) {
                                                        setAttendees([attendees[0] || { name: '', email: '', phone: '' }]);
                                                    }
                                                }}
                                                className="accent-[var(--color-primary)]"
                                            />
                                            Same details for all tickets
                                        </label>
                                    )}
                                </div>

                                {attendees.map((attendee, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-sm hover:border-[var(--color-primary)]/40 transition-colors"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-bold text-[var(--text-primary)]">
                                                Attendee {index + 1}
                                            </h4>
                                            {index > 0 && (
                                                <button
                                                    onClick={() =>
                                                        setAttendees((prev) => prev.filter((_, i) => i !== index))
                                                    }
                                                    className="text-red-500 hover:text-red-600 transition-colors"
                                                    title="Remove Attendee"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                                    Full Name <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <User
                                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                                                        size={18}
                                                    />
                                                    <input
                                                        type="text"
                                                        value={attendee.name}
                                                        onChange={(e) => updateAttendee(index, 'name', e.target.value)}
                                                        className={`w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-base)] border ${validationErrors[`${index}-name`]
                                                            ? 'border-red-500'
                                                            : 'border-[var(--border-primary)] focus:border-[var(--color-primary)]'
                                                            } outline-none transition-all`}
                                                        placeholder="John Doe"
                                                    />
                                                </div>
                                                {validationErrors[`${index}-name`] && (
                                                    <p className="text-xs text-red-500">
                                                        {validationErrors[`${index}-name`]}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                                    Email <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <Mail
                                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                                                        size={18}
                                                    />
                                                    <input
                                                        type="email"
                                                        value={attendee.email}
                                                        onChange={(e) => updateAttendee(index, 'email', e.target.value)}
                                                        className={`w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-base)] border ${validationErrors[`${index}-email`]
                                                            ? 'border-red-500'
                                                            : 'border-[var(--border-primary)] focus:border-[var(--color-primary)]'
                                                            } outline-none transition-all`}
                                                        placeholder="john@example.com"
                                                    />
                                                </div>
                                                {validationErrors[`${index}-email`] && (
                                                    <p className="text-xs text-red-500">
                                                        {validationErrors[`${index}-email`]}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-1.5 md:col-span-2">
                                                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                                    Phone (Optional)
                                                </label>
                                                <div className="relative">
                                                    <Phone
                                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                                                        size={18}
                                                    />
                                                    <input
                                                        type="tel"
                                                        value={attendee.phone || ''}
                                                        onChange={(e) => updateAttendee(index, 'phone', e.target.value)}
                                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-primary)] focus:border-[var(--color-primary)] outline-none transition-all"
                                                        placeholder="+91 98765 43210"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}

                                {!sameForAll && (
                                    <button
                                        className="text-sm font-bold text-[var(--color-primary)] hover:underline pl-2"
                                        onClick={() =>
                                            setAttendees([...attendees, { name: '', email: '', phone: '' }])
                                        }
                                    >
                                        + Add Another Attendee
                                    </button>
                                )}

                                {/* Terms & Conditions + GDPR */}
                                <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] space-y-4">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={agreedToTerms}
                                            onChange={(e) => {
                                                setAgreedToTerms(e.target.checked);
                                                setValidationErrors((prev) => {
                                                    const next = { ...prev };
                                                    delete next['terms'];
                                                    return next;
                                                });
                                            }}
                                            className="mt-1 accent-[var(--color-primary)]"
                                        />
                                        <span className="text-sm text-[var(--text-secondary)]">
                                            I agree to the{' '}
                                            <a href="#" className="text-[var(--color-primary)] underline">
                                                Terms &amp; Conditions
                                            </a>{' '}
                                            and{' '}
                                            <a href="#" className="text-[var(--color-primary)] underline">
                                                Refund Policy
                                            </a>
                                            . <span className="text-red-500">*</span>
                                        </span>
                                    </label>
                                    {validationErrors['terms'] && (
                                        <p className="text-xs text-red-500 ml-7">{validationErrors['terms']}</p>
                                    )}

                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={agreedToGDPR}
                                            onChange={(e) => {
                                                setAgreedToGDPR(e.target.checked);
                                                setValidationErrors((prev) => {
                                                    const next = { ...prev };
                                                    delete next['gdpr'];
                                                    return next;
                                                });
                                            }}
                                            className="mt-1 accent-[var(--color-primary)]"
                                        />
                                        <span className="text-sm text-[var(--text-secondary)]">
                                            I consent to the processing of my personal data in accordance with the{' '}
                                            <a href="#" className="text-[var(--color-primary)] underline">
                                                Privacy Policy
                                            </a>
                                            . <span className="text-red-500">*</span>
                                        </span>
                                    </label>
                                    {validationErrors['gdpr'] && (
                                        <p className="text-xs text-red-500 ml-7">{validationErrors['gdpr']}</p>
                                    )}
                                </div>

                                <div className="flex justify-between pt-4">
                                    <Button variant="secondary" className="gap-2" onClick={prevStep}>
                                        <ArrowLeft size={16} /> Back
                                    </Button>
                                    <Button variant="primary" className="gap-2 px-8 py-3" onClick={nextStep}>
                                        Continue to Payment <ChevronRight size={18} />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Payment */}
                        {currentStep === 2 && (
                            <motion.div
                                key="step-2"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-6"
                            >
                                <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                                    <CreditCard size={20} /> Payment
                                </h2>

                                {/* Attendee summary */}
                                <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)]">
                                    <h4 className="font-bold text-[var(--text-primary)] mb-3 text-sm uppercase tracking-wider">
                                        Booking For:
                                    </h4>
                                    {attendees.map((a, i) => (
                                        <div key={i} className="flex items-center gap-3 text-sm text-[var(--text-secondary)] mb-2 last:mb-0">
                                            <User size={14} />
                                            <span>{a.name}</span>
                                            <span className="text-[var(--text-muted)]">•</span>
                                            <span>{a.email}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Security badges */}
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { icon: Shield, label: '100% Secure' },
                                        { icon: Lock, label: 'SSL Encrypted' },
                                        { icon: CreditCard, label: 'Razorpay Trusted' },
                                    ].map(({ icon: Icon, label }) => (
                                        <div
                                            key={label}
                                            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)] text-center"
                                        >
                                            <Icon size={20} className="text-green-500" />
                                            <span className="text-xs font-medium text-[var(--text-muted)]">
                                                {label}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-between pt-4">
                                    <Button variant="secondary" className="gap-2" onClick={prevStep}>
                                        <ArrowLeft size={16} /> Back
                                    </Button>
                                    <Button
                                        variant="primary"
                                        className="gap-2 px-8 py-4 text-lg shadow-lg hover:shadow-primary-500/25"
                                        onClick={onPay}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            'Processing...'
                                        ) : (
                                            <>
                                                <Lock size={18} /> Pay {formatCurrency(finalTotal)}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Column: Order Summary (sticky) */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 space-y-6">
                        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-primary)] shadow-lg overflow-hidden">
                            <div className="h-1.5 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]" />
                            <div className="p-6 space-y-5">
                                <h3 className="text-xl font-bold text-[var(--text-primary)]">Order Summary</h3>

                                <div className="space-y-3">
                                    {items.map((item) => (
                                        <div
                                            key={`${item.eventId}-${item.tierId}`}
                                            className="flex justify-between items-start text-sm"
                                        >
                                            <div className="min-w-0">
                                                <p className="font-medium text-[var(--text-primary)] truncate">
                                                    {item.eventTitle}
                                                </p>
                                                <p className="text-[var(--text-muted)] text-xs">
                                                    {item.tierName} × {item.quantity}
                                                </p>
                                            </div>
                                            <span className="font-medium text-[var(--text-primary)] whitespace-nowrap ml-2">
                                                {formatCurrency(item.price * item.quantity)}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-2 pt-4 border-t border-[var(--border-primary)]">
                                    <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                                        <span>Subtotal</span>
                                        <span>{formatCurrency(totalPrice)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                                        <span>Service Fee</span>
                                        <span>{formatCurrency(serviceFee)}</span>
                                    </div>
                                    {taxAmount > 0 && (
                                        <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                                            <span>Tax</span>
                                            <span>{formatCurrency(taxAmount)}</span>
                                        </div>
                                    )}
                                    {discount > 0 && (
                                        <div className="flex justify-between text-sm text-green-500 font-medium">
                                            <span>Discount {appliedPromo?.code ? `(${appliedPromo.code})` : ''}</span>
                                            <span>-{formatCurrency(discount)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Promo Code */}
                                <div className="pt-2">
                                    <PromoCodeInput
                                        onApply={handlePromoApply}
                                        isLoading={promoLoading}
                                        appliedCode={appliedPromo?.code}
                                        discountAmount={discount}
                                    />
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t border-[var(--border-primary)]">
                                    <span className="text-lg font-bold text-[var(--text-primary)]">Total</span>
                                    <span className="text-2xl font-black text-[var(--color-primary)]">
                                        {formatCurrency(finalTotal)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-muted)] pt-2">
                                    <Shield size={14} className="text-green-500" />
                                    <span>Secure checkout powered by Razorpay</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Checkout;

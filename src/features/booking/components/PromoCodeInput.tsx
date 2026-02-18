import { useState } from 'react';
import { Tag, X } from 'lucide-react';
import Button from '@/components/common/Button';

interface PromoCodeInputProps {
    onApply: (code: string) => Promise<void>;
    onRemove?: () => void;
    isLoading?: boolean;
    appliedCode?: string;
    discountAmount?: number;
}

function PromoCodeInput({ onApply, onRemove, isLoading, appliedCode, discountAmount }: PromoCodeInputProps) {
    const [code, setCode] = useState('');

    const handleApply = () => {
        if (!code.trim()) return;
        onApply(code.trim());
        setCode('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleApply();
    };

    return (
        <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <Tag size={12} /> Promo Code
            </label>
            {appliedCode ? (
                <div className="flex items-center justify-between text-sm bg-green-500/10 text-green-600 px-4 py-3 rounded-xl border border-green-500/20">
                    <div>
                        <span className="font-bold">Applied: {appliedCode}</span>
                        {discountAmount !== undefined && discountAmount > 0 && (
                            <span className="ml-2 text-green-500/80">
                                (-₹{discountAmount.toLocaleString()})
                            </span>
                        )}
                    </div>
                    {onRemove && (
                        <button
                            onClick={onRemove}
                            className="p-1 rounded-lg hover:bg-green-500/20 transition-colors"
                            aria-label="Remove promo code"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            ) : (
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        onKeyDown={handleKeyDown}
                        placeholder="ENTER CODE"
                        className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-[var(--bg-base)] border border-[var(--border-primary)] focus:border-[var(--color-primary)] outline-none transition-all text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                        disabled={isLoading}
                    />
                    <Button variant="secondary" size="sm" onClick={handleApply} disabled={!code.trim() || isLoading}>
                        {isLoading ? '...' : 'Apply'}
                    </Button>
                </div>
            )}
        </div>
    );
}

export default PromoCodeInput;

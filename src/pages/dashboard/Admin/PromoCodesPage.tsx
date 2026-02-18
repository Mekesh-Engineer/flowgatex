import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Trash2, Ticket, Calendar, DollarSign, Percent, Globe, CalendarRange } from 'lucide-react';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Badge from '@/components/common/Badge';
import DataTable, { Column } from '@/components/common/DataTable';
import { showError, showSuccess } from '@/components/common/Toast';
import { useAuthStore } from '@/store/zustand/stores';
import { PromoCode } from '@/features/booking/types/promo.types';
import { 
  getAllPromoCodes, 
  createPromoCode, 
  deletePromoCode, 
  togglePromoCodeStatus 
} from '@/features/booking/services/promoService';
import { eventService } from '@/features/events/services/eventService';
import Toggle from '@/components/common/Toggle';
import { Timestamp } from 'firebase/firestore';

interface PromoFormData {
  code: string;
  discountType: 'percentage' | 'flat';
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  validFrom?: string;
  expiryDate: string;
  usageLimit?: number;
  scope: 'global' | 'event';
  applicableEvents?: string[]; // Multi-select not fully implemented in UI for now, just single select or global
  specificEventId?: string; // Helper for form
}

export default function PromoCodesPage() {
  const { user } = useAuthStore();
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState<{id: string, title: string}[]>([]);
  
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<PromoFormData>({
    defaultValues: {
      discountType: 'percentage',
      scope: 'global',
      value: 0
    }
  });

  const discountType = watch('discountType');
  const scope = watch('scope');

  useEffect(() => {
    fetchPromos();
    fetchEvents();
  }, []);

  const fetchPromos = async () => {
    try {
      setLoading(true);
      const data = await getAllPromoCodes();
      setPromos(data);
    } catch (error) {
      console.error(error);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      showError(`Failed to fetch promo codes: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const data = await eventService.getEvents(100);
      setEvents(data.map(e => ({ id: e.id, title: e.title })));
    } catch (error) {
      console.error('Failed to fetch events', error);
    }
  };

  const onSubmit = async (data: PromoFormData) => {
    try {
      // Validate dates
      if (data.validFrom && new Date(data.validFrom) > new Date(data.expiryDate)) {
        showError('Valid From date cannot be after Expiry Date');
        return;
      }

      const payload: Omit<PromoCode, 'id' | 'usedCount' | 'createdAt'> = {
        code: data.code.toUpperCase(),
        discountType: data.discountType,
        value: Number(data.value),
        minOrderValue: data.minOrderValue ? Number(data.minOrderValue) : undefined,
        maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : undefined,
        validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
        expiryDate: new Date(data.expiryDate),
        usageLimit: data.usageLimit ? Number(data.usageLimit) : undefined,
        isActive: true,
        scope: data.scope,
        applicableEvents: data.scope === 'event' && data.specificEventId ? [data.specificEventId] : [],
        createdBy: user?.uid
      };

      await createPromoCode(payload);
      showSuccess('Promo code created successfully');
      setIsModalOpen(false);
      reset();
      fetchPromos();
    } catch (error: any) {
      showError(error.message || 'Failed to create promo code');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this promo code?')) return;
    try {
      await deletePromoCode(id);
      showSuccess('Promo code deleted');
      setPromos(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      showError('Failed to delete promo code');
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      await togglePromoCodeStatus(id, !currentStatus);
      setPromos(prev => prev.map(p => p.id === id ? { ...p, isActive: !currentStatus } : p));
    } catch (error) {
      showError('Failed to update status');
    }
  };

  const columns: Column<PromoCode>[] = [
    {
      key: 'code',
      header: 'Code',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-mono font-bold text-primary-600">{row.code}</span>
          <span className="text-xs text-gray-500">{row.scope === 'global' ? 'Global' : 'Event Specific'}</span>
        </div>
      )
    },
    {
      key: 'value',
      header: 'Discount',
      render: (row) => (
        <Badge variant="info">
          {row.discountType === 'percentage' ? `${row.value}% OFF` : `₹${row.value} FLAT`}
        </Badge>
      )
    },
    {
      key: 'usedCount',
      header: 'Usage',
      render: (row) => (
        <div className="text-sm">
          <span className="font-medium">{row.usedCount}</span>
          <span className="text-gray-400"> / {row.usageLimit || '∞'}</span>
        </div>
      )
    },
    {
      key: 'validFrom', // Dummy key
      header: 'Validity',
      render: (row) => {
        const expiry = row.expiryDate instanceof Timestamp ? row.expiryDate.toDate() : new Date(row.expiryDate);
        const isExpired = new Date() > expiry;
        return (
          <div className={`text-xs ${isExpired ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
            {isExpired ? 'Expired' : `Expires: ${expiry.toLocaleDateString()}`}
          </div>
        );
      }
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => (
        <Toggle 
          checked={row.isActive} 
          onChange={() => handleToggle(row.id!, row.isActive)} 
          label={row.isActive ? 'Active' : 'Inactive'}
        />
      )
    },
    {
      key: 'id',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => handleDelete(row.id!)}
          className="text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 size={16} />
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Promo Codes</h1>
          <p className="text-gray-500 dark:text-neutral-400 mt-1">Manage global and event-specific discount codes</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} className="mr-2" /> Create Promo Code
        </Button>
      </div>

      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 shadow-sm overflow-hidden">
        <DataTable 
          columns={columns as any} 
          data={promos as any}
          loading={loading}
          keyExtractor={(row) => (row as any).id || (row as any).code}
          emptyMessage="No promo codes found"
          striped
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Promo Code" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Code & Type */}
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">Code Name</label>
              <div className="relative">
                <Ticket className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input 
                  type="text" 
                  {...register('code', { required: 'Code is required', pattern: { value: /^[A-Z0-9_-]+$/i, message: 'Alphanumeric only' } })}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-primary-500 uppercase font-mono"
                  placeholder="SUMMER2026"
                />
              </div>
              {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>}
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">Discount Type</label>
              <select 
                {...register('discountType')} 
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-primary-500"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Fixed Amount (Flat)</option>
              </select>
            </div>

            {/* Value & Max Discount */}
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                Discount Value {discountType === 'percentage' ? '(%)' : '(Amount)'}
              </label>
              <div className="relative">
                {discountType === 'percentage' ? (
                  <Percent className="absolute left-3 top-2.5 text-gray-400" size={16} />
                ) : (
                  <DollarSign className="absolute left-3 top-2.5 text-gray-400" size={16} />
                )}
                <input 
                  type="number" 
                  {...register('value', { required: true, min: 1 })}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-primary-500"
                  placeholder="10"
                />
              </div>
            </div>

            {discountType === 'percentage' && (
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">Max Discount Amount (Optional)</label>
                <input 
                  type="number" 
                  {...register('maxDiscount')}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-primary-500"
                  placeholder="500"
                />
              </div>
            )}

            {/* Min Order & Usage Limit */}
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">Min Order Value (Optional)</label>
              <input 
                type="number" 
                {...register('minOrderValue')}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-primary-500"
                placeholder="1000"
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">Usage Limit (Optional)</label>
              <input 
                type="number" 
                {...register('usageLimit')}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-primary-500"
                placeholder="100"
              />
              <p className="text-xs text-gray-400 mt-1">Leave empty for unlimited</p>
            </div>

            {/* Dates */}
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">Valid From (Optional)</label>
              <div className="relative">
                 <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                 <input 
                  type="datetime-local" 
                  {...register('validFrom')}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">Expiry Date</label>
              <div className="relative">
                 <CalendarRange className="absolute left-3 top-2.5 text-gray-400" size={16} />
                 <input 
                  type="datetime-local" 
                  {...register('expiryDate', { required: 'Expiry date is required' })}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-primary-500"
                />
              </div>
               {errors.expiryDate && <p className="text-red-500 text-xs mt-1">{errors.expiryDate.message}</p>}
            </div>

            {/* Scope */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">Scope</label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${scope === 'global' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-neutral-700'}`}>
                  <input type="radio" value="global" {...register('scope')} className="text-primary-600 focus:ring-primary-500" />
                  <Globe size={18} className={scope === 'global' ? 'text-primary-600' : 'text-gray-400'} />
                  <div>
                    <span className="block font-medium text-sm">Global</span>
                    <span className="text-xs text-gray-500">Applies to all events</span>
                  </div>
                </label>
                <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${scope === 'event' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-neutral-700'}`}>
                  <input type="radio" value="event" {...register('scope')} className="text-primary-600 focus:ring-primary-500" />
                  <Ticket size={18} className={scope === 'event' ? 'text-primary-600' : 'text-gray-400'} />
                  <div>
                    <span className="block font-medium text-sm">Event Specific</span>
                    <span className="text-xs text-gray-500">Restricted to one event</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Event Selection */}
            {scope === 'event' && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">Select Event</label>
                <select 
                  {...register('specificEventId', { required: scope === 'event' })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">-- Choose an event --</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>{event.title}</option>
                  ))}
                </select>
                {errors.specificEventId && <p className="text-red-500 text-xs mt-1">Please select an event</p>}
              </div>
            )}

          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-neutral-700">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create Promo Code</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Plus,
    Search,
    Grid3X3,
    List,
    MoreVertical,
    Edit,
    Eye,
    Users,
    BarChart3,
    Copy,
    Download,
    Archive,
    Trash2,
    Calendar,
    MapPin,
    Ticket,
    DollarSign,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import { Tabs } from '@/components/common/Tabs';
import ProgressBar from '@/components/common/ProgressBar';
import EmptyState from '@/components/common/EmptyState';
import { SkeletonCard } from '@/components/common/Skeleton';
import Pagination from '@/components/common/Pagination';
import Modal from '@/components/common/Modal';
import StatsCard from '@/components/common/StatsCard';
import { EventStatus } from '@/lib/constants';

// =============================================================================
// TYPES & MOCK DATA
// =============================================================================

interface OrgEvent {
    id: string;
    title: string;
    image: string;
    date: string;
    time: string;
    venue: string;
    status: string;
    ticketsSold: number;
    ticketsTotal: number;
    revenue: number;
    category: string;
}

const MOCK_EVENTS: OrgEvent[] = Array.from({ length: 16 }, (_, i) => ({
    id: `evt-${i + 1}`,
    title: [
        'Tech Summit 2026', 'Jazz Night Live', 'AI Innovators Conference', 'Summer Music Festival',
        'Design Thinking Workshop', 'Startup Pitch Day', 'Food & Wine Expo', 'Marathon City Run',
        'Photography Masterclass', 'Blockchain Summit', 'Open Mic Night', 'Art Gallery Opening',
        'Yoga Retreat Weekend', 'Game Dev Meetup', 'Cybersecurity Forum', 'Culinary Masterclass',
    ][i],
    image: `https://images.unsplash.com/photo-${1492684223066 + i * 555}-81342ee5ff30?auto=format&fit=crop&q=80&w=800`,
    date: `${['Mar', 'Apr', 'May', 'Jun'][i % 4]} ${3 + i * 2}, 2026`,
    time: `${9 + (i % 9)}:00 AM`,
    venue: ['Convention Center, SF', 'Blue Note, NY', 'Moscone Hall, SF', 'Central Park, NY'][i % 4],
    status: i < 6 ? EventStatus.PUBLISHED : i < 10 ? EventStatus.DRAFT : i < 13 ? EventStatus.COMPLETED : EventStatus.CANCELLED,
    ticketsSold: Math.floor(Math.random() * 300) + 20,
    ticketsTotal: 300 + i * 20,
    revenue: Math.floor(Math.random() * 15000) + 500,
    category: ['Tech', 'Music', 'Business', 'Food', 'Arts', 'Sports'][i % 6],
}));

const statusVariant = (s: string) => {
    switch (s) {
        case EventStatus.PUBLISHED: return 'success';
        case EventStatus.DRAFT: return 'warning';
        case EventStatus.COMPLETED: return 'info';
        case EventStatus.CANCELLED: return 'error';
        default: return 'default';
    }
};

const ITEMS_PER_PAGE = 6;

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 22 } } };

// =============================================================================
// COMPONENT
// =============================================================================

export default function MyEventsPage() {
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('all');
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<'recent' | 'alpha' | 'date'>('recent');
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [actionMenuId, setActionMenuId] = useState<string | null>(null);
    const [quickView, setQuickView] = useState<OrgEvent | null>(null);

    useEffect(() => { const t = setTimeout(() => setLoading(false), 600); return () => clearTimeout(t); }, []);

    const filtered = useMemo(() => {
        let list = MOCK_EVENTS;
        if (tab !== 'all') list = list.filter(e => e.status === tab);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(e => e.title.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q));
        }
        if (sort === 'alpha') list = [...list].sort((a, b) => a.title.localeCompare(b.title));
        else if (sort === 'date') list = [...list].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return list;
    }, [tab, search, sort]);

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const toggleSelect = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const tabs = [
        { id: 'all', label: 'All', badge: String(MOCK_EVENTS.length) },
        { id: EventStatus.PUBLISHED, label: 'Published' },
        { id: EventStatus.DRAFT, label: 'Draft' },
        { id: EventStatus.COMPLETED, label: 'Ended' },
        { id: EventStatus.CANCELLED, label: 'Cancelled' },
    ];

    const stats = {
        total: MOCK_EVENTS.length,
        published: MOCK_EVENTS.filter(e => e.status === EventStatus.PUBLISHED).length,
        totalRevenue: MOCK_EVENTS.reduce((s, e) => s + e.revenue, 0),
        totalSold: MOCK_EVENTS.reduce((s, e) => s + e.ticketsSold, 0),
    };

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard label="Total Events" value={stats.total} icon={<Calendar size={20} />} trend={`${stats.published} live`} trendUp />
                <StatsCard label="Published" value={stats.published} icon={<Eye size={20} />} color="text-green-600 dark:text-green-400" bgColor="bg-green-50 dark:bg-green-500/10" borderColor="border-green-100 dark:border-green-500/20" />
                <StatsCard label="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={<DollarSign size={20} />} color="text-emerald-600 dark:text-emerald-400" bgColor="bg-emerald-50 dark:bg-emerald-500/10" borderColor="border-emerald-100 dark:border-emerald-500/20" />
                <StatsCard label="Tickets Sold" value={stats.totalSold.toLocaleString()} icon={<Ticket size={20} />} color="text-violet-600 dark:text-violet-400" bgColor="bg-violet-50 dark:bg-violet-500/10" borderColor="border-violet-100 dark:border-violet-500/20" />
            </div>

            {/* Header + Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <Tabs items={tabs} activeTab={tab} onChange={(id) => { setTab(id); setPage(1); }} variant="pills" size="sm" />
                <div className="flex items-center gap-2">
                    {selected.size > 0 && (
                        <div className="flex items-center gap-2 mr-2">
                            <Badge variant="primary">{selected.size} selected</Badge>
                            <Button variant="ghost" size="sm"><Download size={14} className="mr-1" /> Export</Button>
                            <Button variant="ghost" size="sm" className="text-red-500"><Trash2 size={14} className="mr-1" /> Cancel</Button>
                        </div>
                    )}
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search events..." className="w-44 pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white placeholder:text-gray-400" />
                    </div>
                    <select value={sort} onChange={(e) => setSort(e.target.value as 'recent' | 'alpha' | 'date')} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500" aria-label="Sort">
                        <option value="recent">Recent</option>
                        <option value="alpha">A–Z</option>
                        <option value="date">By Date</option>
                    </select>
                    <div className="flex bg-gray-100 dark:bg-neutral-700 rounded-xl p-1">
                        <button onClick={() => setView('grid')} className={cn('p-2 rounded-lg transition-colors', view === 'grid' ? 'bg-white dark:bg-neutral-600 shadow-sm text-primary-600' : 'text-gray-500')} aria-label="Grid view"><Grid3X3 size={16} /></button>
                        <button onClick={() => setView('list')} className={cn('p-2 rounded-lg transition-colors', view === 'list' ? 'bg-white dark:bg-neutral-600 shadow-sm text-primary-600' : 'text-gray-500')} aria-label="List view"><List size={16} /></button>
                    </div>
                    <Link to="/organizer/events/create">
                        <Button variant="primary" size="sm"><Plus size={14} className="mr-1.5" /> New Event</Button>
                    </Link>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className={cn(view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4')}>
                    {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} className={view === 'grid' ? 'h-72' : 'h-28'} />)}
                </div>
            ) : paginated.length === 0 ? (
                <EmptyState
                    variant={search ? 'search' : 'default'}
                    title={search ? 'No events found' : 'No events yet'}
                    description={search ? 'Try different search terms.' : 'Create your first event and start selling tickets!'}
                    action={!search ? <Link to="/organizer/events/create"><Button variant="primary"><Plus size={14} className="mr-1.5" /> Create Event</Button></Link> : undefined}
                />
            ) : view === 'grid' ? (
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {paginated.map((event) => (
                        <motion.div key={event.id} variants={itemVariants}>
                            <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 overflow-hidden shadow-sm hover:shadow-lg transition-all group relative">
                                {/* Select checkbox */}
                                <div className="absolute top-3 left-3 z-10">
                                    <input type="checkbox" checked={selected.has(event.id)} onChange={() => toggleSelect(event.id)} className="w-4 h-4 rounded border-gray-300 dark:border-neutral-600 text-primary-600 focus:ring-primary-500" />
                                </div>
                                <div className="h-40 overflow-hidden relative">
                                    <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800'; }} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                    <Badge variant={statusVariant(event.status) as 'success' | 'warning' | 'info' | 'error'} className="absolute top-3 right-3">{event.status}</Badge>
                                </div>
                                <div className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors line-clamp-1">{event.title}</h3>
                                            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-neutral-400">
                                                <span className="flex items-center gap-1"><Calendar size={12} /> {event.date}</span>
                                                <span className="flex items-center gap-1"><MapPin size={12} /> {event.venue.split(',')[0]}</span>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <button onClick={() => setActionMenuId(actionMenuId === event.id ? null : event.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors" aria-label="More actions"><MoreVertical size={16} className="text-gray-400" /></button>
                                            {actionMenuId === event.id && <ActionMenu event={event} onClose={() => setActionMenuId(null)} onQuickView={() => { setQuickView(event); setActionMenuId(null); }} />}
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <div className="flex justify-between text-xs text-gray-500 dark:text-neutral-400 mb-1">
                                            <span>{event.ticketsSold}/{event.ticketsTotal} sold</span>
                                            <span>{Math.round((event.ticketsSold / event.ticketsTotal) * 100)}%</span>
                                        </div>
                                        <ProgressBar value={(event.ticketsSold / event.ticketsTotal) * 100} size="sm" />
                                    </div>
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-neutral-700">
                                        <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(event.revenue)}</span>
                                        <span className="flex items-center gap-1 text-xs text-gray-500"><Users size={12} /> {event.ticketsSold}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
                    {paginated.map((event) => (
                        <motion.div key={event.id} variants={itemVariants}>
                            <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 shadow-sm hover:shadow-md transition-all flex overflow-hidden">
                                <div className="flex items-center px-3">
                                    <input type="checkbox" checked={selected.has(event.id)} onChange={() => toggleSelect(event.id)} className="w-4 h-4 rounded border-gray-300 dark:border-neutral-600 text-primary-600 focus:ring-primary-500" />
                                </div>
                                <div className="w-28 h-24 flex-shrink-0 overflow-hidden">
                                    <img src={event.image} alt={event.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=400'; }} />
                                </div>
                                <div className="flex-1 px-4 py-3 flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{event.title}</h3>
                                            <Badge variant={statusVariant(event.status) as 'success' | 'warning' | 'info' | 'error'} className="flex-shrink-0">{event.status}</Badge>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-neutral-400">
                                            <span>{event.date}</span>
                                            <span>{event.ticketsSold}/{event.ticketsTotal} sold</span>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(event.revenue)}</p>
                                        <p className="text-xs text-gray-400">{event.ticketsSold} attendees</p>
                                    </div>
                                    <div className="relative">
                                        <button onClick={() => setActionMenuId(actionMenuId === event.id ? null : event.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700" aria-label="More actions"><MoreVertical size={16} className="text-gray-400" /></button>
                                        {actionMenuId === event.id && <ActionMenu event={event} onClose={() => setActionMenuId(null)} onQuickView={() => { setQuickView(event); setActionMenuId(null); }} />}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} className="mt-6" />

            {/* Quick View Modal */}
            <Modal isOpen={!!quickView} onClose={() => setQuickView(null)} title="Event Overview" size="lg">
                {quickView && (
                    <div className="space-y-5">
                        <div className="flex gap-4">
                            <img src={quickView.image} alt="" className="w-24 h-24 rounded-xl object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=400'; }} />
                            <div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{quickView.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-neutral-400">{quickView.date} • {quickView.time}</p>
                                <p className="text-sm text-gray-500 dark:text-neutral-400">{quickView.venue}</p>
                                <Badge variant={statusVariant(quickView.status) as 'success' | 'warning' | 'info' | 'error'} className="mt-1">{quickView.status}</Badge>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 bg-gray-50 dark:bg-neutral-700/40 rounded-xl p-4">
                            <div><p className="text-xs text-gray-400">Revenue</p><p className="font-bold text-gray-900 dark:text-white">{formatCurrency(quickView.revenue)}</p></div>
                            <div><p className="text-xs text-gray-400">Tickets Sold</p><p className="font-bold text-gray-900 dark:text-white">{quickView.ticketsSold}/{quickView.ticketsTotal}</p></div>
                            <div><p className="text-xs text-gray-400">Sell Rate</p><p className="font-bold text-gray-900 dark:text-white">{Math.round((quickView.ticketsSold / quickView.ticketsTotal) * 100)}%</p></div>
                        </div>
                        <div className="flex gap-3">
                            <Link to={`/organizer/events/${quickView.id}/analytics`} className="flex-1"><Button variant="primary" className="w-full"><BarChart3 size={15} className="mr-1.5" /> Analytics</Button></Link>
                            <Link to={`/organizer/events/${quickView.id}/attendees`} className="flex-1"><Button variant="ghost" className="w-full"><Users size={15} className="mr-1.5" /> Attendees</Button></Link>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

// =============================================================================
// ACTION MENU
// =============================================================================

function ActionMenu({ event, onClose, onQuickView }: { event: OrgEvent; onClose: () => void; onQuickView: () => void }) {
    return (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 shadow-xl z-30 py-1">
            <button onClick={onQuickView} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700"><Eye size={14} /> Quick View</button>
            <Link to={`/organizer/events/${event.id}/edit`} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700" onClick={onClose}><Edit size={14} /> Edit Event</Link>
            <Link to={`/organizer/events/${event.id}/attendees`} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700" onClick={onClose}><Users size={14} /> Manage Attendees</Link>
            <Link to={`/organizer/events/${event.id}/analytics`} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700" onClick={onClose}><BarChart3 size={14} /> View Analytics</Link>
            <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700"><Copy size={14} /> Duplicate</button>
            <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700"><Download size={14} /> Export Data</button>
            <hr className="my-1 border-gray-100 dark:border-neutral-700" />
            <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"><Archive size={14} /> Archive Event</button>
        </div>
    );
}

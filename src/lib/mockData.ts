// Mock event data types are defined inline

// ============================================================================
// MOCK EVENT DATA
// ============================================================================
// Sample events for frontend development

export const MOCK_EVENTS: any[] = [
  {
    id: 'event-001',
    title: 'Tech Conference 2026',
    description: 'Annual technology conference featuring the latest innovations in AI, Web3, and Cloud Computing. Join industry leaders and innovators for three days of learning and networking.',
    organizerId: 'mock-organizer-001',
    organizerName: 'Event Organizer',
    category: 'Technology',
    type: 'Conference',
    venue: {
      name: 'Convention Center',
      address: '123 Main Street, Downtown',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      zipCode: '94102',
      coordinates: { lat: 37.7749, lng: -122.4194 },
    },
    startDate: new Date('2026-06-15T09:00:00'),
    endDate: new Date('2026-06-17T18:00:00'),
    capacity: 500,
    ticketsSold: 342,
    ticketsAvailable: 158,
    pricing: {
      general: 299,
      vip: 599,
      student: 149,
    },
    images: [
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800',
    ],
    tags: ['Technology', 'AI', 'Networking', 'Innovation'],
    status: 'published',
    featured: true,
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-02-01'),
  },
  {
    id: 'event-002',
    title: 'Summer Music Festival',
    description: 'Experience the best of summer with live performances from top artists across multiple genres. Food trucks, art installations, and unforgettable memories await!',
    organizerId: 'mock-organizer-001',
    organizerName: 'Event Organizer',
    category: 'Music',
    type: 'Festival',
    venue: {
      name: 'Riverside Park',
      address: '456 Park Avenue',
      city: 'Austin',
      state: 'TX',
      country: 'USA',
      zipCode: '78701',
      coordinates: { lat: 30.2672, lng: -97.7431 },
    },
    startDate: new Date('2026-07-20T14:00:00'),
    endDate: new Date('2026-07-22T23:00:00'),
    capacity: 2000,
    ticketsSold: 1456,
    ticketsAvailable: 544,
    pricing: {
      general: 89,
      vip: 249,
      earlyBird: 69,
    },
    images: [
      'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800',
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
    ],
    tags: ['Music', 'Festival', 'Outdoor', 'Summer'],
    status: 'published',
    featured: true,
    createdAt: new Date('2026-01-20'),
    updatedAt: new Date('2026-02-03'),
  },
  {
    id: 'event-003',
    title: 'Business Leadership Summit',
    description: 'Connect with C-suite executives and thought leaders. Gain insights into leadership strategies, business transformation, and future trends.',
    organizerId: 'mock-organizer-001',
    organizerName: 'Event Organizer',
    category: 'Business',
    type: 'Summit',
    venue: {
      name: 'Grand Hotel Ballroom',
      address: '789 Business Blvd',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      zipCode: '10001',
      coordinates: { lat: 40.7128, lng: -74.0060 },
    },
    startDate: new Date('2026-05-10T08:00:00'),
    endDate: new Date('2026-05-11T17:00:00'),
    capacity: 300,
    ticketsSold: 187,
    ticketsAvailable: 113,
    pricing: {
      general: 499,
      premium: 899,
    },
    images: [
      'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
      'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800',
    ],
    tags: ['Business', 'Leadership', 'Networking', 'Professional'],
    status: 'published',
    featured: false,
    createdAt: new Date('2026-01-25'),
    updatedAt: new Date('2026-02-02'),
  },
  {
    id: 'event-004',
    title: 'Art & Design Expo',
    description: 'Explore contemporary art and innovative design from emerging and established artists. Interactive installations, workshops, and gallery talks.',
    organizerId: 'mock-organizer-001',
    organizerName: 'Event Organizer',
    category: 'Art',
    type: 'Exhibition',
    venue: {
      name: 'Modern Art Museum',
      address: '321 Gallery Street',
      city: 'Los Angeles',
      state: 'CA',
      country: 'USA',
      zipCode: '90012',
      coordinates: { lat: 34.0522, lng: -118.2437 },
    },
    startDate: new Date('2026-08-05T10:00:00'),
    endDate: new Date('2026-08-07T20:00:00'),
    capacity: 800,
    ticketsSold: 423,
    ticketsAvailable: 377,
    pricing: {
      general: 45,
      student: 25,
      family: 120,
    },
    images: [
      'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=800',
      'https://images.unsplash.com/photo-1577083552431-6e5fd01988ec?w=800',
    ],
    tags: ['Art', 'Design', 'Exhibition', 'Culture'],
    status: 'published',
    featured: false,
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-02-04'),
  },
  {
    id: 'event-005',
    title: 'Startup Pitch Night',
    description: 'Watch innovative startups pitch their ideas to top investors. Network with entrepreneurs, VCs, and industry experts.',
    organizerId: 'mock-organizer-001',
    organizerName: 'Event Organizer',
    category: 'Business',
    type: 'Networking',
    venue: {
      name: 'Innovation Hub',
      address: '555 Startup Lane',
      city: 'Seattle',
      state: 'WA',
      country: 'USA',
      zipCode: '98101',
      coordinates: { lat: 47.6062, lng: -122.3321 },
    },
    startDate: new Date('2026-04-18T18:00:00'),
    endDate: new Date('2026-04-18T22:00:00'),
    capacity: 150,
    ticketsSold: 98,
    ticketsAvailable: 52,
    pricing: {
      general: 50,
      investor: 100,
    },
    images: [
      'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800',
    ],
    tags: ['Startup', 'Networking', 'Investment', 'Innovation'],
    status: 'published',
    featured: true,
    createdAt: new Date('2026-02-03'),
    updatedAt: new Date('2026-02-05'),
  },
];

// Helper functions for mock data
export const getMockEventById = (id: string): any | undefined => {
  return MOCK_EVENTS.find((event) => event.id === id);
};

export const getMockEventsByCategory = (category: string): any[] => {
  return MOCK_EVENTS.filter((event) => event.category === category);
};

export const getMockFeaturedEvents = (): any[] => {
  return MOCK_EVENTS.filter((event) => event.featured);
};

export const searchMockEvents = (query: string): any[] => {
  const lowerQuery = query.toLowerCase();
  return MOCK_EVENTS.filter(
    (event) =>
      event.title.toLowerCase().includes(lowerQuery) ||
      event.description.toLowerCase().includes(lowerQuery) ||
      event.tags.some((tag: string) => tag.toLowerCase().includes(lowerQuery))
  );
};

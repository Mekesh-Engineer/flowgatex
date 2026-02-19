// =============================================================================
// AUDIT SERVICE — Audit log reads and writes for Admin actions
// =============================================================================

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
  type QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { getDb } from './firebase';
import { logger } from '@/lib/logger';
import type { AuditLogEntry, AuditLogFilters } from '@/types/admin.types';

const PAGE_SIZE = 100;

function docToAuditEntry(snap: QueryDocumentSnapshot<DocumentData>): AuditLogEntry {
  const data = snap.data();
  return {
    id: snap.id,
    action: data.action || '',
    resource: data.resource || '',
    resourceType: data.resourceType || 'user',
    performedBy: data.performedBy || '',
    performedByEmail: data.performedByEmail || '',
    performedByRole: data.performedByRole || 'admin',
    bypassedViaRole: data.bypassedViaRole || null,
    details: data.details || {},
    severity: data.severity || 'info',
    ipAddress: data.ipAddress || '',
    sessionId: data.sessionId || '',
    timestamp: data.timestamp || Timestamp.now(),
  };
}

// =============================================================================
// SUBSCRIPTIONS
// =============================================================================

export function subscribeToAuditLogs(
  filters: AuditLogFilters,
  callback: (logs: AuditLogEntry[]) => void
): Unsubscribe {
  try {
    const db = getDb();
    let q = query(
      collection(db, 'audit_logs'),
      orderBy('timestamp', 'desc'),
      limit(PAGE_SIZE)
    );

    if (filters.actionType) q = query(q, where('action', '==', filters.actionType));
    if (filters.resourceType) q = query(q, where('resourceType', '==', filters.resourceType));
    if (filters.severity) q = query(q, where('severity', '==', filters.severity));
    if (filters.dateFrom) q = query(q, where('timestamp', '>=', Timestamp.fromDate(filters.dateFrom)));
    if (filters.dateTo) q = query(q, where('timestamp', '<=', Timestamp.fromDate(filters.dateTo)));

    return onSnapshot(q, (snap) => {
      let logs = snap.docs.map(docToAuditEntry);
      if (filters.actor) {
        const search = filters.actor.toLowerCase();
        logs = logs.filter(
          (log) =>
            log.performedBy.toLowerCase().includes(search) ||
            (log.performedByEmail && log.performedByEmail.toLowerCase().includes(search))
        );
      }
      callback(logs);
    }, (error) => {
      logger.error('Error subscribing to audit logs', error);
      callback([]);
    });
  } catch {
    callback([]);
    return () => {};
  }
}

export function subscribeToRecentActivity(
  callback: (logs: AuditLogEntry[]) => void,
  count = 20
): Unsubscribe {
  try {
    const db = getDb();
    const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(count));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(docToAuditEntry));
    }, (error) => {
      logger.error('Error subscribing to recent activity', error);
      callback([]);
    });
  } catch {
    callback([]);
    return () => {};
  }
}

// =============================================================================
// WRITE OPERATIONS
// =============================================================================

export async function logAdminAction(
  action: string,
  resource: string,
  options: {
    resourceType?: AuditLogEntry['resourceType'];
    details?: AuditLogEntry['details'];
    severity?: AuditLogEntry['severity'];
    performedBy?: string;
    performedByEmail?: string;
    performedByRole?: 'admin' | 'super_admin';
  } = {}
): Promise<void> {
  try {
    const db = getDb();
    await addDoc(collection(db, 'audit_logs'), {
      action,
      resource,
      resourceType: options.resourceType || 'user',
      performedBy: options.performedBy || 'system',
      performedByEmail: options.performedByEmail || '',
      performedByRole: options.performedByRole || 'admin',
      bypassedViaRole: null,
      details: options.details || {},
      severity: options.severity || 'info',
      ipAddress: '',
      sessionId: '',
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    logger.error('Failed to write audit log', error);
  }
}

// =============================================================================
// EXPORT UTILITIES
// =============================================================================

export function formatAuditLogForExport(logs: AuditLogEntry[]) {
  return logs.map((log) => ({
    timestamp: log.timestamp?.toDate?.()?.toISOString?.() || '',
    action: log.action,
    resource: log.resource,
    resourceType: log.resourceType,
    performedBy: log.performedByEmail || log.performedBy,
    severity: log.severity,
    reason: log.details?.reason || '',
  }));
}

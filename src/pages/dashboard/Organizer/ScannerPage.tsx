// =============================================================================
// ScannerPage — Slim orchestrator
// =============================================================================
// Composes modular scanner sub-components.  All logic lives in useScanner hook
// and scanner service.  This file is only responsible for layout assembly.
// =============================================================================

import { useNavigate } from 'react-router-dom';
import { useOrganizerStore } from '@/store/zustand/organizerStore';
import { useScanner } from '@/features/scanner/hooks/useScanner';
import { useScannerKeyboard } from '@/features/scanner/hooks/useScannerKeyboard';
import { ScannerHeader } from '@/features/scanner/components/ScannerHeader';
import { ScannerViewport } from '@/features/scanner/components/ScannerViewport';
import { ScannerLeftPanel } from '@/features/scanner/components/ScannerLeftPanel';
import { ScannerRightPanel } from '@/features/scanner/components/ScannerRightPanel';
import {
    MobileStatsBar,
    MobileControls,
    MobileValidationOverlay,
    ManualEntryModal,
    OverrideModal,
    SettingsModal,
    HistoryDrawer,
} from '@/features/scanner/components/ScannerModals';

import '@/styles/features/qr-scanner.css';

// ═════════════════════════════════════════════════════════════════════════════
// Component
// ═════════════════════════════════════════════════════════════════════════════

export default function ScannerPage() {
    const navigate = useNavigate();
    const s = useScanner();
    const store = useOrganizerStore();

    // Keyboard shortcuts
    useScannerKeyboard({
        scannerState: s.scannerState,
        onStartScanning: s.handleStartScanning,
        onStopScanning: s.handleStopScanning,
        onOpenManual: () => s.setIsManualModalOpen(true),
        onToggleFlashlight: () => s.setFlashlightOn(!s.flashlightOn),
        onOpenSettings: () => s.setIsSettingsModalOpen(true),
        onTriggerUpload: () => s.fileInputRef.current?.click(),
        onCloseAllModals: () => {
            s.setIsOverrideModalOpen(false);
            s.setIsSettingsModalOpen(false);
            s.setIsHistoryDrawerOpen(false);
        },
    });

    // ═════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═════════════════════════════════════════════════════════════════════════
    return (
        <div className="scanner-page">
            {/* ── Header Bar (Desktop & Tablet) ── */}
            <ScannerHeader
                stats={store.scanStats}
                capacityPercent={s.capacityPercent}
                isOnline={store.isOnline}
                onlineDevices={s.onlineDevices}
                onBack={() => navigate(-1)}
                onOpenSettings={() => s.setIsSettingsModalOpen(true)}
            />

            {/* ── Mobile Compact Stats Bar ── */}
            <MobileStatsBar
                total={store.scanStats.total}
                capacity={store.scanStats.capacity}
                valid={store.scanStats.valid}
                invalid={store.scanStats.invalid}
                duplicates={store.scanStats.duplicates}
                isOnline={store.isOnline}
            />

            {/* ── Main Grid ── */}
            <main className="scanner-main">
                {/* ── LEFT PANEL ── */}
                <ScannerLeftPanel
                    stats={store.scanStats}
                    statPercents={s.statPercents}
                    filteredScans={s.filteredScans}
                    settings={store.scannerSettings}
                    searchTerm={s.searchTerm}
                    onSearchChange={s.setSearchTerm}
                    onClearHistory={s.handleClearHistory}
                    onSettingsChange={store.updateScannerSettings}
                    onExport={s.handleExport}
                    onSelectScan={s.selectScan}
                />

                {/* ── CENTER PANEL: Camera Viewport ── */}
                <ScannerViewport
                    scannerState={s.scannerState}
                    videoRef={s.videoRef}
                    fileInputRef={s.fileInputRef}
                    flashlightOn={s.flashlightOn}
                    onToggleFlashlight={() => s.setFlashlightOn(!s.flashlightOn)}
                    onStartScanning={s.handleStartScanning}
                    onStopScanning={s.handleStopScanning}
                    onOpenManual={() => s.setIsManualModalOpen(true)}
                    onImageUpload={s.handleImageUpload}
                />

                {/* ── RIGHT PANEL ── */}
                <ScannerRightPanel
                    scannerState={s.scannerState}
                    currentScan={s.currentScan}
                    recentScans={store.recentScans}
                    logs={store.logs}
                    isLogExpanded={s.isLogExpanded}
                    showSystemLog={store.scannerSettings.showSystemLog}
                    logContainerRef={s.logContainerRef}
                    onToggleLogExpanded={() => s.setIsLogExpanded(!s.isLogExpanded)}
                    onClearLogs={store.clearLogs}
                    onStartScanning={s.handleStartScanning}
                    onOpenOverride={() => s.setIsOverrideModalOpen(true)}
                    onSelectScan={s.selectScan}
                />
            </main>

            {/* ── Mobile Bottom Control Bar ── */}
            <MobileControls
                scannerState={s.scannerState}
                flashlightOn={s.flashlightOn}
                onToggleFlashlight={() => s.setFlashlightOn(!s.flashlightOn)}
                onStartScanning={s.handleStartScanning}
                onStopScanning={s.handleStopScanning}
                onOpenManual={() => s.setIsManualModalOpen(true)}
                onOpenSettings={() => s.setIsSettingsModalOpen(true)}
                onOpenHistory={() => s.setIsHistoryDrawerOpen(true)}
            />

            {/* ── Mobile Validation Overlay ── */}
            <MobileValidationOverlay
                scannerState={s.scannerState}
                currentScan={s.currentScan}
                onOpenOverride={() => s.setIsOverrideModalOpen(true)}
            />

            {/* ── Manual Entry Modal ── */}
            <ManualEntryModal
                isOpen={s.isManualModalOpen}
                onClose={() => s.setIsManualModalOpen(false)}
                ticketId={s.manualTicketId}
                onTicketIdChange={s.setManualTicketId}
                onSubmit={s.handleManualSubmit}
            />

            {/* ── Override Modal ── */}
            <OverrideModal
                isOpen={s.isOverrideModalOpen}
                onClose={() => s.setIsOverrideModalOpen(false)}
                attendeeName={s.currentScan?.name ?? 'Unknown'}
                category={s.overrideCategory}
                onCategoryChange={s.setOverrideCategory}
                reason={s.overrideReason}
                onReasonChange={s.setOverrideReason}
                onSubmit={s.handleOverride}
            />

            {/* ── Settings Modal ── */}
            <SettingsModal
                isOpen={s.isSettingsModalOpen}
                onClose={() => s.setIsSettingsModalOpen(false)}
                settings={store.scannerSettings}
                onSettingsChange={store.updateScannerSettings}
                iotDevices={store.iotDevices}
                onExport={s.handleExport}
            />

            {/* ── History Drawer (Mobile) ── */}
            <HistoryDrawer
                isOpen={s.isHistoryDrawerOpen}
                onClose={() => s.setIsHistoryDrawerOpen(false)}
                filteredScans={s.filteredScans}
                searchTerm={s.searchTerm}
                onSearchChange={s.setSearchTerm}
                onSelectScan={s.selectScan}
            />
        </div>
    );
}

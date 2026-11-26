import React from 'react';
import {
  Bike,
  Building2,
  Calendar,
  Camera,
  ChevronLeft,
  Landmark,
  MapPin,
  MessageCircle,
  Trophy,
  X,
} from 'lucide-react';
import { formatRp, SLOT_LABELS } from '../data/catalog';
import type { GameAction } from '../engine/gameEngine';
import type { GameState, MapSpotId, PhoneAppId } from '../types/game';
import { GallerySceneArt } from './ChibiPortrait';
import { BankApp } from './phone/BankApp';
import { GaleriApp, KalenderApp, MisiApp, PetaGangApp } from './phone/OtherApps';
import { PesanApp } from './phone/PesanApp';
import { PropertiApp } from './phone/PropertiApp';
import { RentalApp } from './phone/RentalApp';

interface PhoneUIProps {
  state: GameState;
  activeApp: PhoneAppId;
  setActiveApp: (app: PhoneAppId) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  dispatch: (action: GameAction) => void;
  onWalkTo: (spotId: MapSpotId) => void;
  onOpenWarungRush: () => void;
}

export const PhoneUI: React.FC<PhoneUIProps> = ({
  state,
  activeApp,
  setActiveApp,
  mobileOpen,
  onCloseMobile,
  dispatch,
  onWalkTo,
  onOpenWarungRush,
}) => {
  const unreadChat = state.chats.reduce((s, c) => s + c.unread, 0);
  const pendingClaims = state.claims.filter(
    (c) => c.status === 'menunggu_verifikasi' || c.status === 'bayar_sebagian'
  ).length;
  const openIssues = state.issues.filter((i) => !i.resolved).length;
  const openIncidents = state.rental.incidents.filter((i) => !i.resolved).length;
  const activeMissions = state.missions.filter((m) => m.status === 'aktif').length;

  const wallpaperPhoto = state.janda.wallpaperPhotoId
    ? state.gallery.find((p) => p.id === state.janda.wallpaperPhotoId)
    : null;

  const apps: {
    id: Exclude<PhoneAppId, 'home'>;
    label: string;
    color: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    { id: 'pesan', label: 'Pesan', color: '#2b7a53', icon: <MessageCircle size={25} />, badge: unreadChat },
    { id: 'bank', label: 'Bank', color: '#1d4e38', icon: <Landmark size={25} />, badge: pendingClaims },
    { id: 'properti', label: 'Properti', color: '#c75a38', icon: <Building2 size={25} />, badge: openIssues },
    { id: 'rental', label: 'Rental', color: '#3b5c72', icon: <Bike size={25} />, badge: openIncidents },
    { id: 'kalender', label: 'Kalender', color: '#c48324', icon: <Calendar size={25} /> },
    { id: 'peta', label: 'Peta Gang', color: '#3b7359', icon: <MapPin size={25} /> },
    { id: 'galeri', label: 'Galeri', color: '#a14d3d', icon: <Camera size={25} /> },
    { id: 'misi', label: 'Misi', color: '#b57b1b', icon: <Trophy size={25} />, badge: activeMissions > 0 ? undefined : 0 },
  ];

  const appTitleMap: Record<PhoneAppId, string> = {
    home: 'HP Owner · Kost Texas',
    pesan: 'Pesan',
    bank: 'Bank Texas',
    properti: 'Properti & Usaha',
    rental: 'Rental Motor',
    kalender: 'Kalender Gang',
    peta: 'Peta Gang & Relasi',
    galeri: 'Galeri Foto',
    misi: 'Daftar Misi',
  };

  return (
    <aside className={`phone-sidebar ${mobileOpen ? 'mobile-open' : ''}`} aria-label="HP Owner Kost Texas">
      <div className="phone-frame">
        {/* Status Bar */}
        <div className="phone-status-bar">
          <span>Hari {state.day} · {SLOT_LABELS[state.slot].split(' ')[0]}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>★ {state.reputation.toFixed(1)}</span>
            <button
              className="btn-xs"
              style={{
                color: '#fff',
                padding: '2px 6px',
                borderRadius: 6,
                background: 'rgba(255,255,255,0.16)',
                display: mobileOpen ? 'inline-flex' : 'none',
                alignItems: 'center',
                gap: 3,
              }}
              onClick={onCloseMobile}
              aria-label="Tutup HP"
            >
              <X size={14} /> Peta
            </button>
          </div>
        </div>

        {/* App Header when inside an app */}
        {activeApp !== 'home' && (
          <div className="phone-app-header">
            <button
              className="btn btn-xs btn-soft"
              onClick={() => setActiveApp('home')}
              aria-label="Kembali ke Home HP"
            >
              <ChevronLeft size={16} /> Home
            </button>
            <strong style={{ fontSize: 14.5, flex: 1 }}>{appTitleMap[activeApp]}</strong>
            {mobileOpen && (
              <button className="btn btn-xs btn-outline" onClick={onCloseMobile}>
                Ke Peta
              </button>
            )}
          </div>
        )}

        {/* Body */}
        {activeApp === 'home' ? (
          <div
            className="phone-body"
            style={{
              background:
                'linear-gradient(165deg, #1d4e38 0%, #2f694d 52%, #b75a3a 100%)',
              color: '#fffdf8',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Wallpaper / Status Widget */}
              <div
                style={{
                  background: 'rgba(255, 253, 248, 0.16)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 18,
                  padding: 12,
                  border: '1px solid rgba(255,255,255,0.22)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 11, opacity: 0.85 }}>Halo, Bos {state.owner.name}</div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{formatRp(state.accounts.usaha)}</div>
                    <div style={{ fontSize: 11, opacity: 0.85 }}>
                      Pribadi: {formatRp(state.accounts.pribadi)} · Kamar terisi:{' '}
                      {state.rooms.filter((r) => r.status === 'terisi').length}/{state.rooms.length}
                    </div>
                  </div>
                  <span className="badge badge-amber">Lt.{state.buildingStage}</span>
                </div>

                {wallpaperPhoto && (
                  <div style={{ marginTop: 10 }}>
                    <GallerySceneArt sceneKey={wallpaperPhoto.sceneKey} owner={state.owner} compact />
                    <div style={{ fontSize: 10.5, marginTop: 4, opacity: 0.9 }}>
                      Wallpaper: {wallpaperPhoto.title}
                    </div>
                  </div>
                )}
              </div>

              {/* 8 App Icons Grid */}
              <div className="phone-home-grid">
                {apps.map((app) => (
                  <button
                    key={app.id}
                    className="phone-app-icon-btn"
                    onClick={() => setActiveApp(app.id)}
                  >
                    <div className="phone-app-tile" style={{ background: app.color }}>
                      {app.icon}
                      {app.badge && app.badge > 0 ? (
                        <span className="notif-badge">{app.badge}</span>
                      ) : null}
                    </div>
                    <span className="phone-app-label">{app.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Notifications Feed on Home Screen */}
            <div
              style={{
                background: 'rgba(255, 253, 248, 0.94)',
                color: 'var(--ink)',
                borderRadius: 16,
                padding: 11,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--green-dark)' }}>
                🔔 Ringkasan Cepat
              </div>
              {unreadChat > 0 && (
                <button
                  className="btn btn-xs btn-soft"
                  style={{ justifyContent: 'space-between' }}
                  onClick={() => setActiveApp('pesan')}
                >
                  <span>💬 {unreadChat} pesan chat belum dibaca</span>
                  <span>Buka →</span>
                </button>
              )}
              {pendingClaims > 0 && (
                <button
                  className="btn btn-xs btn-amber"
                  style={{ justifyContent: 'space-between' }}
                  onClick={() => setActiveApp('bank')}
                >
                  <span>🏦 {pendingClaims} bukti transfer perlu verifikasi</span>
                  <span>Cek →</span>
                </button>
              )}
              {openIssues > 0 && (
                <button
                  className="btn btn-xs btn-terracotta"
                  style={{ justifyContent: 'space-between' }}
                  onClick={() => setActiveApp('properti')}
                >
                  <span>🔧 {openIssues} keluhan kos menunggu</span>
                  <span>Atasi →</span>
                </button>
              )}
              {unreadChat === 0 && pendingClaims === 0 && openIssues === 0 && (
                <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                  Semua notifikasi aman terkendali! Cek <strong>Misi</strong> atau keliling gang bersama Janda.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="phone-body">
            {activeApp === 'pesan' && (
              <PesanApp
                state={state}
                dispatch={dispatch}
                onWalkTo={(spot) => {
                  onWalkTo(spot);
                  onCloseMobile();
                }}
                onOpenApp={(a) => setActiveApp(a)}
              />
            )}
            {activeApp === 'bank' && <BankApp state={state} dispatch={dispatch} />}
            {activeApp === 'properti' && (
              <PropertiApp
                state={state}
                dispatch={dispatch}
                onOpenWarungRush={onOpenWarungRush}
              />
            )}
            {activeApp === 'rental' && (
              <RentalApp
                state={state}
                dispatch={dispatch}
                onOpenBankVerify={() => setActiveApp('bank')}
              />
            )}
            {activeApp === 'kalender' && <KalenderApp state={state} />}
            {activeApp === 'peta' && (
              <PetaGangApp
                state={state}
                dispatch={dispatch}
                onWalkTo={(spot) => {
                  onWalkTo(spot);
                  onCloseMobile();
                }}
              />
            )}
            {activeApp === 'galeri' && <GaleriApp state={state} dispatch={dispatch} />}
            {activeApp === 'misi' && (
              <MisiApp
                state={state}
                dispatch={dispatch}
                onWalkTo={(spot) => {
                  onWalkTo(spot);
                  onCloseMobile();
                }}
              />
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

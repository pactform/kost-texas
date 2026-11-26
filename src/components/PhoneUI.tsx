import React from 'react';
import {
  Bike,
  Building2,
  CalendarDays,
  ChevronLeft,
  Image as ImageIcon,
  Landmark,
  MapPin,
  MessageCircle,
  Target,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { SLOT_LABELS } from '../data/catalog';
import { soundEngine } from '../engine/audio';
import type { GameAction } from '../engine/store';
import type { GameState, PhoneAppId } from '../types/game';
import { PhotoSnapshotSvg } from './ChibiPortrait';
import { BankApp, ChatApp } from './apps/ChatAndBankApps';
import { AlleyMapApp, CalendarApp, GalleryApp, MissionApp } from './apps/LifestyleApps';
import { PropertyApp, RentalApp, WarungApp } from './apps/PropertyAndBusinessApps';

interface PhoneUIProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const APP_TITLES: Record<PhoneAppId, string> = {
  home: 'HP Owner · Kost Texas',
  chat: 'Pesan',
  bank: 'Bank Texas',
  properti: 'Properti & Kos',
  rental: 'Rental Motor',
  warung: 'Warung Gang',
  kalender: 'Kalender',
  peta: 'Peta Gang',
  galeri: 'Galeri Foto',
  misi: 'Misi & Hadiah',
};

export const PhoneUI: React.FC<PhoneUIProps> = ({ state, dispatch }) => {
  const unreadChat = state.chats.reduce((s, c) => s + c.unread, 0);
  const pendingClaims = state.transferClaims.filter((c) => c.status === 'menunggu_verifikasi').length;
  const propAlert =
    state.applicants.filter((a) => a.status === 'pending').length +
    state.issues.filter((i) => !i.resolved).length;
  const rentalAlert =
    state.breakdowns.filter((b) => !b.resolved).length +
    state.bookings.filter((b) => b.status === 'pending').length;
  const warungAlert =
    state.warung.dailyOrders.filter((o) => o.status === 'pending').length +
    (state.warung.campusOrderActive && !state.warung.campusOrderResolved ? 1 : 0);
  const activeMissions = state.missions.filter((m) => m.status === 'active').length;

  const wallpaperPhoto = state.wallpaperPhotoId
    ? state.photos.find((p) => p.id === state.wallpaperPhotoId)
    : null;

  const openApp = (app: PhoneAppId) => {
    soundEngine.playClick();
    dispatch({ type: 'SET_PHONE_OPEN', open: true, app, chatThreadId: null });
  };

  const apps: {
    id: PhoneAppId;
    label: string;
    icon: React.ReactNode;
    color: string;
    badge: number;
  }[] = [
    { id: 'chat', label: 'Pesan', icon: <MessageCircle size={22} />, color: '#2E7D5B', badge: unreadChat },
    { id: 'bank', label: 'Bank', icon: <Landmark size={22} />, color: '#244B3A', badge: pendingClaims },
    { id: 'properti', label: 'Properti', icon: <Building2 size={22} />, color: '#C85A32', badge: propAlert },
    { id: 'rental', label: 'Rental', icon: <Bike size={22} />, color: '#3B657A', badge: rentalAlert },
    { id: 'warung', label: 'Warung', icon: <UtensilsCrossed size={22} />, color: '#D48C2E', badge: warungAlert },
    { id: 'kalender', label: 'Kalender', icon: <CalendarDays size={22} />, color: '#8C4D3B', badge: 0 },
    { id: 'peta', label: 'Peta Gang', icon: <MapPin size={22} />, color: '#3E7A5A', badge: 0 },
    { id: 'galeri', label: 'Galeri', icon: <ImageIcon size={22} />, color: '#A35C44', badge: 0 },
    { id: 'misi', label: 'Misi', icon: <Target size={22} />, color: '#B87A24', badge: activeMissions },
  ];

  return (
    <aside className={`phone-shell ${state.phoneOpen ? 'mobile-open' : ''}`} aria-label="HP Owner Kost Texas">
      {/* Status Bar */}
      <div className="phone-statusbar">
        <span>
          Hari #{state.day} · {SLOT_LABELS[state.slot]}
        </span>
        <span>📶 4G · 🔋 94%</span>
      </div>

      {/* App Header Bar */}
      <div className="phone-topbar">
        {state.activePhoneApp !== 'home' ? (
          <button
            id="btn-phone-back"
            className="phone-back-btn"
            onClick={() => openApp('home')}
          >
            <ChevronLeft size={18} />
            <span>Kembali</span>
          </button>
        ) : (
          <span className="phone-title-home">📱 HP {state.owner.name}</span>
        )}
        {state.activePhoneApp !== 'home' && (
          <strong className="phone-app-title">{APP_TITLES[state.activePhoneApp]}</strong>
        )}
        <button
          id="btn-phone-close-mobile"
          className="phone-close-mobile"
          onClick={() => dispatch({ type: 'SET_PHONE_OPEN', open: false })}
          aria-label="Tutup HP"
        >
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="phone-body">
        {state.activePhoneApp === 'home' && (
          <div className="phone-homescreen">
            {/* Optional Janda Wallpaper Banner! */}
            <div className="phone-wallpaper-banner">
              {wallpaperPhoto ? (
                <div className="wallpaper-preview">
                  <PhotoSnapshotSvg photo={wallpaperPhoto} owner={state.owner} />
                  <span className="wallpaper-caption">🐾 {wallpaperPhoto.title}</span>
                </div>
              ) : (
                <div className="wallpaper-default">
                  <strong>KOST TEXAS</strong>
                  <small>Kos Bebas Dewasa · Akses 24 Jam · Gang Tropis</small>
                </div>
              )}
            </div>

            <div className="app-icon-grid">
              {apps.map((app) => (
                <button
                  key={app.id}
                  id={`app-icon-${app.id}`}
                  className="phone-app-tile"
                  onClick={() => openApp(app.id)}
                >
                  <div className="app-icon-circle" style={{ background: app.color }}>
                    {app.icon}
                    {app.badge > 0 && <span className="app-badge">{app.badge}</span>}
                  </div>
                  <span>{app.label}</span>
                </button>
              ))}
            </div>

            <div className="phone-quick-shortcuts">
              <button
                id="btn-phone-wardrobe"
                className="btn-secondary mini"
                onClick={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'wardrobe' } })}
              >
                👕 Ganti Outfit
              </button>
              <button
                id="btn-phone-janda"
                className="btn-secondary mini"
                onClick={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'janda_interact' } })}
              >
                🐾 Rawat Janda
              </button>
            </div>
          </div>
        )}

        {state.activePhoneApp === 'chat' && <ChatApp state={state} dispatch={dispatch} />}
        {state.activePhoneApp === 'bank' && <BankApp state={state} dispatch={dispatch} />}
        {state.activePhoneApp === 'properti' && <PropertyApp state={state} dispatch={dispatch} />}
        {state.activePhoneApp === 'rental' && <RentalApp state={state} dispatch={dispatch} />}
        {state.activePhoneApp === 'warung' && <WarungApp state={state} dispatch={dispatch} />}
        {state.activePhoneApp === 'kalender' && <CalendarApp state={state} />}
        {state.activePhoneApp === 'peta' && <AlleyMapApp state={state} dispatch={dispatch} />}
        {state.activePhoneApp === 'galeri' && <GalleryApp state={state} dispatch={dispatch} />}
        {state.activePhoneApp === 'misi' && <MissionApp state={state} dispatch={dispatch} />}
      </div>
    </aside>
  );
};

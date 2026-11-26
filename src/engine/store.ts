import {
  ALLEY_SCHEDULE,
  FACILITIES,
  FURNITURE_CATALOG,
  INITIAL_WARUNG_MENU,
  JANDA_PHOTO_THEMES,
  MOTORBIKE_MARKET,
  OUTFITS,
  ROOM_BUILD_COSTS,
  createInitialMissions,
  createInitialPartnerships,
  createInitialRelationships,
  createInitialRooms,
  createInitialStaff,
  createInitialTenants,
  formatRp,
} from '../data/catalog';
import { soundEngine } from './audio';
import type {
  AccountType,
  ActiveProject,
  Applicant,
  BikeInspection,
  BuildingIssue,
  ChatAction,
  ChatMessage,
  ChatThread,
  ClaimScenario,
  DebtRecord,
  FacilityId,
  FloorNumber,
  FurnitureType,
  GameState,
  InitialPlan,
  OwnerAppearance,
  PhoneAppId,
  PhotoItem,
  PlacedFurniture,
  TimeSlot,
  Transaction,
  TransferClaim,
  WeatherType,
  WorldNpcEntity,
} from '../types/game';

export const SAVE_KEY = 'kost_texas_save_v1';

const SLOT_ORDER: TimeSlot[] = ['pagi', 'siang', 'sore', 'malam'];

let uidCounter = 1;
export function nextUid(prefix: string): string {
  uidCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${uidCounter}`;
}

export function createInitialState(hasPlayedBefore = false, skipOpeningNext = false): GameState {
  const facilities = {} as Record<FacilityId, boolean>;
  for (const f of FACILITIES) {
    facilities[f.id] = false;
  }

  const openingPhoto: PhotoItem = {
    id: 'photo_opening_mangga',
    title: 'Foto Pertama di Bangku Mangga',
    caption: 'Hari pertama di tanah peninggalan orang tua. Janda langsung naik ke pangkuan.',
    day: 1,
    category: 'janda',
    sceneKey: 'opening_mangga',
    jandaLocation: 'Bangku Pohon Mangga',
    sentToAdik: false,
    displayedInRoom: false,
  };

  const initialChats: ChatThread[] = [
    {
      id: 'chat_raka',
      npcId: 'raka',
      npcName: 'Raka (Adik)',
      roleTag: 'Adik · Kuliah Luar Kota',
      avatarHairStyle: 'pendek',
      avatarHairColor: '#231F20',
      avatarSkinTone: '#DFAA82',
      avatarOutfitId: 'genz_hoodie',
      unread: 1,
      messages: [
        {
          id: 'msg_raka_1',
          sender: 'npc',
          senderName: 'Raka',
          text: 'Kak, udah sampai? Kirim foto dong. Aku udah lupa pohon mangganya segede apa.',
          day: 1,
          slot: 'pagi',
          actions: [
            {
              id: 'act_raka_send_mango',
              label: 'Kirim Foto Bangku Mangga + Janda',
              actionType: 'SEND_PHOTO_TO_ADIK',
              payload: { photoId: 'photo_opening_mangga' },
            },
          ],
        },
      ],
    },
    {
      id: 'chat_busari',
      npcId: 'busari',
      npcName: 'Bu Sari',
      roleTag: 'Tetangga Gang',
      avatarHairStyle: 'cepol',
      avatarHairColor: '#363230',
      avatarSkinTone: '#C2855C',
      avatarOutfitId: 'millennial_linen',
      unread: 0,
      messages: [
        {
          id: 'msg_busari_1',
          sender: 'npc',
          senderName: 'Bu Sari',
          text: 'Selamat datang lagi di gang, Nak! Anak kampus di sini banyak yang cari kos bebas 24 jam. Kang Budi udah siap bantu bangun kapan aja.',
          day: 1,
          slot: 'pagi',
        },
      ],
    },
    {
      id: 'chat_kangbudi',
      npcId: 'kangbudi',
      npcName: 'Kang Budi',
      roleTag: 'Kepala Tukang',
      avatarHairStyle: 'pendek',
      avatarHairColor: '#3B3633',
      avatarSkinTone: '#9D6442',
      avatarOutfitId: 'aktivitas_kos',
      unread: 0,
      messages: [
        {
          id: 'msg_budi_1',
          sender: 'npc',
          senderName: 'Kang Budi',
          text: 'Siap Bos! Begitu papan KOST TEXAS terpasang, tim saya langsung ngebut pasang dinding & utilitas kamar pertamanya.',
          day: 1,
          slot: 'pagi',
        },
      ],
    },
  ];

  const baseState: GameState = {
    version: 1,
    screen: 'title',
    hasPlayedBefore,
    skipOpeningNext,

    day: 1,
    slot: 'pagi',
    weather: 'cerah',
    powerOutageActive: false,
    competitorOpen: false,
    alleyBazaarActive: false,
    agustusanActive: false,
    firstNightGuestsGreeted: false,
    day30ReportShown: false,
    day30ReportOpen: false,

    owner: {
      name: 'Rani',
      hairStyle: 'bob',
      hairColor: '#231F20',
      skinTone: '#DFAA82',
      outfitId: 'genz_oversized',
      unlockedOutfits: ['genz_oversized', 'millennial_linen', 'aktivitas_kos'],
    },
    ownerPos: { x: 7, y: 8, floor: 1 },
    ownerEnergy: 100,
    ateToday: false,
    initialPlan: null,
    signboardPlaced: false,
    activeTourApplicantId: null,

    activeFloor: 1,
    cutaway: false,
    muted: false,
    reducedMotion: false,
    wallpaperPhotoId: null,
    pinnedMissionId: 'main_mulai',
    phoneOpen: false,
    activePhoneApp: 'home',
    activeChatThreadId: null,

    businessBalance: 35000000,
    personalBalance: 1000000,
    depositEscrow: 0,
    transactions: [],
    debts: [],
    transferClaims: [],

    rooms: createInitialRooms(),
    facilities,
    activeProjects: [],
    issues: [],
    reputation: 4.5,
    reviews: [],
    packages: [],

    tenants: createInitialTenants(),
    contracts: [],
    applicants: [],
    relationships: createInitialRelationships(),
    worldNpcs: [],

    rentalUnlocked: false,
    bikes: [],
    bookings: [],
    breakdowns: [],
    warung: {
      unlocked: false,
      level: 1,
      isOpenToday: false,
      tables: 2,
      menu: INITIAL_WARUNG_MENU.map((m) => ({ ...m })),
      raraConsignmentStage: 0,
      dailyOrders: [],
      campusOrderActive: false,
      campusOrderResolved: false,
      campusRepeatClient: false,
      revenueToday: 0,
      wasteToday: 0,
    },
    kontrakan: {
      unlocked: false,
      owned: false,
      repaired: false,
      adActive: false,
      monthlyRent: 2800000,
      upkeepDaily: 35000,
      tenantFamilyName: null,
      contractStartDay: null,
      nextDueDay: null,
      depositHeld: 0,
      condition: 55,
      applicants: [],
    },
    staff: createInitialStaff(),
    partnerships: createInitialPartnerships(),

    chats: initialChats,
    promises: [],
    calendar: ALLEY_SCHEDULE.slice(0, 6).map((e) => ({
      id: `cal_alley_${e.day}`,
      day: e.day,
      title: e.title,
      category: 'gang' as const,
      description: e.desc,
    })),
    photos: [openingPhoto],
    missions: createInitialMissions(),
    janda: {
      x: 5,
      y: 8.5,
      floor: 1,
      pose: 'duduk',
      mood: 85,
      hunger: 80,
      fedToday: false,
      waterRefilledToday: false,
      pettedToday: false,
      bowlPlaced: false,
      bowlSpot: null,
      cardboardPlaced: false,
      cardboardSpot: null,
      favoriteSpots: ['Bangku Pohon Mangga'],
      kejarTaliWins: 0,
      jandaDimanaWins: 0,
      fotoPasWins: 0,
      hidingActive: false,
      hidingSpotId: null,
      hidingClues: [],
      weeklyThemeIndex: 0,
      weeklyCompletedWeek: 0,
      tuxedoPillowUnlocked: false,
      photoFrameUnlocked: false,
    },

    dailySummary: null,
    toasts: [],
    activeModal: null,
  };

  baseState.worldNpcs = rebuildWorldNpcs(baseState);
  return baseState;
}

export function loadSavedState(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed || typeof parsed.day !== 'number' || !Array.isArray(parsed.rooms)) return null;
    // Restore transient UI fields safely
    return {
      ...parsed,
      toasts: [],
      activeModal: null,
      dailySummary: null,
    };
  } catch {
    return null;
  }
}

export function saveGameState(state: GameState) {
  if (state.screen === 'title') return;
  try {
    const toStore: GameState = {
      ...state,
      toasts: [],
      activeModal: null,
      dailySummary: null,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(toStore));
  } catch {
    // ignore quota issues
  }
}

export function clearSavedState() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
}

// === Helper Mutations ===

function addToast(state: GameState, text: string, tone: 'info' | 'success' | 'warning' | 'money' = 'info'): GameState {
  const notice = { id: nextUid('toast'), text, tone, createdAt: Date.now() };
  return { ...state, toasts: [...state.toasts.slice(-3), notice] };
}

function recordTx(
  state: GameState,
  params: {
    account: AccountType;
    type: 'in' | 'out';
    category: Transaction['category'];
    amount: number;
    title: string;
    counterparty: string;
    referenceCode?: string;
    matchedClaimId?: string;
  }
): { state: GameState; tx: Transaction } {
  const amt = Math.max(0, Math.round(params.amount));
  const beforeBalance = params.account === 'usaha' ? state.businessBalance : state.personalBalance;
  const afterBalance = params.type === 'in' ? beforeBalance + amt : beforeBalance - amt;
  const tx: Transaction = {
    id: nextUid('tx'),
    day: state.day,
    slot: state.slot,
    account: params.account,
    type: params.type,
    category: params.category,
    amount: amt,
    beforeBalance,
    afterBalance,
    title: params.title,
    counterparty: params.counterparty,
    referenceCode: params.referenceCode ?? `KTX-${state.day}${Math.floor(1000 + Math.random() * 9000)}`,
    matchedClaimId: params.matchedClaimId,
  };
  const nextState: GameState = {
    ...state,
    businessBalance: params.account === 'usaha' ? afterBalance : state.businessBalance,
    personalBalance: params.account === 'pribadi' ? afterBalance : state.personalBalance,
    transactions: [tx, ...state.transactions].slice(0, 250),
  };
  return { state: nextState, tx };
}

function pushChatMessage(
  state: GameState,
  npcInfo: {
    npcId: string;
    npcName: string;
    roleTag: string;
    hairStyle?: OwnerAppearance['hairStyle'];
    hairColor?: string;
    skinTone?: string;
    outfitId?: string;
  },
  msg: Omit<ChatMessage, 'id' | 'day' | 'slot'>
): GameState {
  const fullMsg: ChatMessage = {
    ...msg,
    id: nextUid('msg'),
    day: state.day,
    slot: state.slot,
  };
  const threadId = `chat_${npcInfo.npcId}`;
  const existing = state.chats.find((c) => c.id === threadId);
  let nextChats: ChatThread[];
  if (existing) {
    nextChats = state.chats.map((c) =>
      c.id === threadId
        ? {
            ...c,
            unread: msg.sender === 'npc' ? c.unread + 1 : c.unread,
            messages: [...c.messages, fullMsg],
          }
        : c
    );
    // Bring updated thread to top
    const updated = nextChats.find((c) => c.id === threadId)!;
    nextChats = [updated, ...nextChats.filter((c) => c.id !== threadId)];
  } else {
    const newThread: ChatThread = {
      id: threadId,
      npcId: npcInfo.npcId,
      npcName: npcInfo.npcName,
      roleTag: npcInfo.roleTag,
      avatarHairStyle: npcInfo.hairStyle ?? 'pendek',
      avatarHairColor: npcInfo.hairColor ?? '#231F20',
      avatarSkinTone: npcInfo.skinTone ?? '#DFAA82',
      avatarOutfitId: npcInfo.outfitId ?? 'millennial_linen',
      unread: msg.sender === 'npc' ? 1 : 0,
      messages: [fullMsg],
    };
    nextChats = [newThread, ...state.chats];
  }
  if (msg.sender === 'npc') soundEngine.playChatPing();
  return { ...state, chats: nextChats };
}

/**
 * Atomically completes a mission and pays its bonus exactly ONCE!
 */
function completeMission(state: GameState, missionId: string): GameState {
  const mission = state.missions.find((m) => m.id === missionId);
  if (!mission || mission.claimed) return state;

  const updatedMissions = state.missions.map((m) => {
    if (m.id === missionId) {
      return {
        ...m,
        progress: m.target,
        status: 'completed' as const,
        claimed: true,
        completedDay: state.day,
      };
    }
    return m;
  });

  // Unlock next main mission sequentially
  const mainOrder = [
    'main_mulai',
    'main_kamar_pertama',
    'main_malam_pertama',
    'main_chat_dibalas',
    'main_usaha_berikutnya',
    'main_lantai_dua',
    'main_hari_30',
  ];
  const idx = mainOrder.indexOf(missionId);
  const nextMainId = idx >= 0 && idx + 1 < mainOrder.length ? mainOrder[idx + 1] : null;

  const finalMissions = updatedMissions.map((m) =>
    nextMainId && m.id === nextMainId && m.status === 'locked'
      ? { ...m, status: 'active' as const }
      : m
  );

  let next: GameState = {
    ...state,
    missions: finalMissions,
    pinnedMissionId:
      state.pinnedMissionId === missionId ? nextMainId ?? null : state.pinnedMissionId,
  };

  const { state: paidState } = recordTx(next, {
    account: mission.account,
    type: 'in',
    category: 'misi',
    amount: mission.reward,
    title: `Bonus Misi: ${mission.title}`,
    counterparty: 'Hadiah Misi Kost Texas',
  });

  soundEngine.playMoney();
  const acctLabel = mission.account === 'usaha' ? 'rekening usaha' : 'rekening pribadi';
  next = addToast(
    paidState,
    `Misi selesai · +${formatRp(mission.reward)} ke ${acctLabel} (${mission.title})`,
    'money'
  );
  return next;
}

function checkAlbumBosKos(state: GameState): GameState {
  const jandaLocs = new Set(
    state.photos
      .filter((p) => p.category === 'janda' && p.jandaLocation)
      .map((p) => p.jandaLocation!)
  );
  const count = jandaLocs.size;
  let next: GameState = {
    ...state,
    missions: state.missions.map((m) =>
      m.id === 'janda_album_bos' ? { ...m, progress: Math.min(m.target, count) } : m
    ),
  };
  if (count >= 4) {
    const m = next.missions.find((x) => x.id === 'janda_album_bos');
    if (m && !m.claimed) {
      next = completeMission(next, 'janda_album_bos');
      next = {
        ...next,
        janda: {
          ...next.janda,
          tuxedoPillowUnlocked: true,
          photoFrameUnlocked: true,
        },
      };
    }
  }
  return next;
}

function updateRoomStatsFromWorld(state: GameState): GameState {
  const hasWifi = state.facilities.wifi_dasar;
  const hasRepeater = state.facilities.wifi_repeater;
  const hasPump = state.facilities.pompa_listrik;
  const hasDamper = state.facilities.peredam_suara;
  const hasMovedBench = state.facilities.bangku_geser;

  const rooms = state.rooms.map((room) => {
    let wifi = hasWifi ? (room.id === '103' || room.floor > 1 ? 65 : 85) : 45;
    if (hasRepeater) wifi = 96;
    const water = hasPump ? 96 : room.floor > 1 ? 65 : 75;
    let noise = room.floor === 1 ? 38 : 22;
    if (hasMovedBench) noise -= 12;
    if (hasDamper) noise -= 14;
    if (room.furniture.some((f) => f.type === 'tirai_blackout')) noise -= 4;
    noise = Math.max(8, noise);

    return {
      ...room,
      wifiStrength: wifi,
      waterPressure: water,
      noiseLevel: noise,
    };
  });

  return { ...state, rooms };
}

export function rebuildWorldNpcs(state: GameState): WorldNpcEntity[] {
  const npcs: WorldNpcEntity[] = [];
  const isRaining = state.weather === 'hujan' || state.weather === 'hujan_deras';

  // Active construction worker Kang Budi
  if (state.activeProjects.length > 0 && state.slot !== 'malam') {
    npcs.push({
      id: 'npc_kangbudi',
      name: 'Kang Budi',
      role: 'tukang',
      x: 5,
      y: 5,
      floor: 1,
      targetX: 6,
      targetY: 5,
      facing: 'right',
      anim: isRaining ? 'umbrella' : 'idle',
      hairStyle: 'pendek',
      hairColor: '#3B3633',
      skinTone: '#9D6442',
      outfitId: 'aktivitas_kos',
      speech: 'Lagi ngebut beresin proyek, Bos!',
    });
  }

  // Neighbor Bu Sari
  if (state.slot === 'pagi' || state.slot === 'sore') {
    npcs.push({
      id: 'npc_busari',
      name: 'Bu Sari',
      role: 'neighbor',
      x: 13.5,
      y: 11.5,
      floor: 1,
      targetX: 13.5,
      targetY: 11.5,
      facing: 'left',
      anim: isRaining ? 'umbrella' : 'idle',
      hairStyle: 'cepol',
      hairColor: '#363230',
      skinTone: '#C2855C',
      outfitId: 'millennial_linen',
    });
  }

  // Romanceable NPCs on alley
  (['arka', 'mila', 'damar'] as const).forEach((rid) => {
    const rel = state.relationships[rid];
    if (rel && rel.availableSlots.includes(state.slot)) {
      npcs.push({
        id: `npc_${rid}`,
        name: rel.name,
        role: 'romance',
        x: rel.mapLocation.x,
        y: rel.mapLocation.y,
        floor: rel.mapLocation.floor,
        targetX: rel.mapLocation.x,
        targetY: rel.mapLocation.y,
        facing: 'right',
        anim: isRaining ? 'umbrella' : 'idle',
        hairStyle: rel.hairStyle,
        hairColor: rel.hairColor,
        skinTone: rel.skinTone,
        outfitId: rel.outfitId,
      });
    }
  });

  // Adik Raka visits on holiday (Day 8 or every 14 days after)
  if (state.day === 8 || (state.day > 8 && (state.day - 8) % 14 === 0)) {
    const raka = state.relationships.raka;
    if (state.slot !== 'malam') {
      npcs.push({
        id: 'npc_raka',
        name: 'Raka (Adik)',
        role: 'adik',
        x: 8,
        y: 10.5,
        floor: 1,
        targetX: 8,
        targetY: 10.5,
        facing: 'right',
        anim: isRaining ? 'umbrella' : 'idle',
        hairStyle: raka.hairStyle,
        hairColor: raka.hairColor,
        skinTone: raka.skinTone,
        outfitId: raka.outfitId,
        speech: 'Wah Kak, Kost Texas keren banget sekarang!',
      });
    }
  }

  // Hired Staff on map
  state.staff.forEach((st) => {
    if (!st.hired) return;
    if (st.role === 'kebersihan' && (state.slot === 'pagi' || state.slot === 'siang')) {
      npcs.push({
        id: `npc_${st.id}`,
        name: st.name,
        role: 'staff',
        x: 9,
        y: 6.5,
        floor: 1,
        targetX: 9,
        targetY: 6.5,
        facing: 'left',
        anim: 'idle',
        hairStyle: 'pendek',
        hairColor: '#4E5459',
        skinTone: '#9D6442',
        outfitId: 'aktivitas_kos',
        speech: 'Teras & kamar udah bersih, Bos!',
      });
    } else if (st.role === 'warung' && state.warung.unlocked && state.slot !== 'pagi') {
      npcs.push({
        id: `npc_${st.id}`,
        name: st.name,
        role: 'staff',
        x: 6,
        y: 12.6,
        floor: 1,
        targetX: 6,
        targetY: 12.6,
        facing: 'right',
        anim: 'idle',
        hairStyle: 'cepol',
        hairColor: '#231F20',
        skinTone: '#DFAA82',
        outfitId: 'millennial_linen',
      });
    } else if (st.role === 'rental' && state.rentalUnlocked && (state.slot === 'siang' || state.slot === 'sore')) {
      npcs.push({
        id: `npc_${st.id}`,
        name: st.name,
        role: 'staff',
        x: 11.5,
        y: 8,
        floor: 1,
        targetX: 11.5,
        targetY: 8,
        facing: 'left',
        anim: 'idle',
        hairStyle: 'belah_tengah',
        hairColor: '#231F20',
        skinTone: '#C2855C',
        outfitId: 'aktivitas_helm',
      });
    }
  });

  // Active Tour Applicant follows owner!
  if (state.activeTourApplicantId) {
    const app = state.applicants.find((a) => a.id === state.activeTourApplicantId);
    const prof = app ? state.tenants[app.tenantId] : null;
    if (prof) {
      npcs.push({
        id: `tour_${prof.id}`,
        name: `${prof.name} (Tur)`,
        role: 'tenant',
        x: Math.max(2, state.ownerPos.x - 1),
        y: state.ownerPos.y,
        floor: state.ownerPos.floor,
        targetX: Math.max(2, state.ownerPos.x - 1),
        targetY: state.ownerPos.y,
        facing: 'right',
        anim: 'walk',
        hairStyle: prof.hairStyle,
        hairColor: prof.hairColor,
        skinTone: prof.skinTone,
        outfitId: prof.outfitDay,
        speech: 'Kamarnya boleh dilihat, Kak?',
      });
    }
  }

  // Occupied Tenants + Kos Bebas Guests!
  state.contracts
    .filter((c) => c.status === 'active')
    .forEach((contract, index) => {
      const t = state.tenants[contract.tenantId];
      const room = state.rooms.find((r) => r.id === contract.roomId);
      if (!t || !room) return;

      // Power outage brings everyone out to the terrace!
      if (state.powerOutageActive) {
        npcs.push({
          id: `tenant_${t.id}`,
          name: t.name,
          role: 'tenant',
          x: 4 + (index % 4) * 1.4,
          y: 7.2,
          floor: 1,
          targetX: 4 + (index % 4) * 1.4,
          targetY: 7.2,
          facing: 'right',
          anim: 'sit',
          hairStyle: t.hairStyle,
          hairColor: t.hairColor,
          skinTone: t.skinTone,
          outfitId: t.outfitRest,
          speech: 'Mati lampu ya, adem di teras dulu!',
          roomId: room.id,
        });
        return;
      }

      // Malam Pertama / Kos Bebas: Tenant returns at night with partner & hangs out near gate/terrace!
      if (state.slot === 'malam') {
        if (index === 0 || t.partnerVisitsOften) {
          const baseX = 5.0 + (index % 3) * 2.5;
          npcs.push({
            id: `tenant_${t.id}`,
            name: t.name,
            role: 'tenant',
            x: baseX,
            y: 8.3,
            floor: 1,
            targetX: baseX,
            targetY: 8.3,
            facing: 'right',
            anim: isRaining ? 'umbrella' : 'idle',
            hairStyle: t.hairStyle,
            hairColor: t.hairColor,
            skinTone: t.skinTone,
            outfitId: t.outfitDay,
            speech:
              !state.firstNightGuestsGreeted && index === 0
                ? `Malam Kak! ${t.partnerName ?? 'Pasanganku'} ikut nginep ya.`
                : undefined,
            roomId: room.id,
          });
          if (t.partnerName) {
            npcs.push({
              id: `guest_${t.id}`,
              name: `${t.partnerName} (Tamu ${t.name})`,
              role: 'guest',
              x: baseX + 1.1,
              y: 8.9,
              floor: 1,
              targetX: baseX + 1.1,
              targetY: 8.9,
              facing: 'left',
              anim: isRaining ? 'umbrella' : 'carry',
              hairStyle: 'belah_tengah',
              hairColor: '#3A2820',
              skinTone: '#DFAA82',
              outfitId: 'aktivitas_ngopi',
              speech: index === 0 ? 'Bawa martabak nih!' : undefined,
              roomId: room.id,
            });
          }
        }
      } else if (state.slot === 'pagi') {
        // Partner saying goodbye in the morning after staying overnight!
        if (room.guestOvernight && t.partnerName) {
          npcs.push({
            id: `guest_morning_${t.id}`,
            name: `${t.partnerName} (Pamit)`,
            role: 'guest',
            x: 8.2,
            y: 9.6,
            floor: 1,
            targetX: 8.2,
            targetY: 11,
            facing: 'right',
            anim: 'walk',
            hairStyle: 'belah_tengah',
            hairColor: '#3A2820',
            skinTone: '#DFAA82',
            outfitId: 'aktivitas_ngopi',
            speech: 'Pamit pulang dulu ya Kak!',
          });
        }
        // Shift worker Dimas returns early morning!
        if (t.shiftWorker) {
          npcs.push({
            id: `tenant_${t.id}`,
            name: t.name,
            role: 'tenant',
            x: room.doorX,
            y: room.doorY + 0.4,
            floor: room.floor,
            targetX: room.doorX,
            targetY: room.doorY + 0.4,
            facing: 'left',
            anim: 'idle',
            hairStyle: t.hairStyle,
            hairColor: t.hairColor,
            skinTone: t.skinTone,
            outfitId: t.outfitDay,
            speech: 'Baru pulang shift subuh nih, Kak!',
            roomId: room.id,
          });
        } else if (index % 2 === 0) {
          npcs.push({
            id: `tenant_${t.id}`,
            name: t.name,
            role: 'tenant',
            x: 5 + (index % 3) * 1.8,
            y: 7.4,
            floor: 1,
            targetX: 5 + (index % 3) * 1.8,
            targetY: 7.4,
            facing: 'right',
            anim: 'idle',
            hairStyle: t.hairStyle,
            hairColor: t.hairColor,
            skinTone: t.skinTone,
            outfitId: t.outfitDay,
            roomId: room.id,
          });
        }
      } else if (state.slot === 'sore') {
        // Hang out on terrace / grab packages
        npcs.push({
          id: `tenant_${t.id}`,
          name: t.name,
          role: 'tenant',
          x: room.floor === 1 ? 4.5 + (index % 4) * 1.6 : room.doorX,
          y: room.floor === 1 ? 7.3 : room.doorY + 0.5,
          floor: room.floor,
          targetX: room.floor === 1 ? 4.5 + (index % 4) * 1.6 : room.doorX,
          targetY: room.floor === 1 ? 7.3 : room.doorY + 0.5,
          facing: 'right',
          anim: index === 0 ? 'sit' : 'idle',
          hairStyle: t.hairStyle,
          hairColor: t.hairColor,
          skinTone: t.skinTone,
          outfitId: t.outfitRest,
          roomId: room.id,
        });
      }
    });

  return npcs;
}

function updateRoomPrivacyAndLights(state: GameState): GameState {
  const rooms = state.rooms.map((room) => {
    if (room.status !== 'occupied' || !room.tenantId) {
      return {
        ...room,
        lightOn: false,
        privacyStatus: room.status === 'constructing' ? 'Sedang dibangun' : room.status === 'renovating' ? 'Sedang direnovasi' : 'Kosong',
        guestPresent: false,
        guestName: null,
        guestOvernight: false,
      };
    }
    const t = state.tenants[room.tenantId];
    if (state.powerOutageActive) {
      return { ...room, lightOn: false, privacyStatus: 'Di teras (listrik padam)' };
    }
    if (state.slot === 'malam') {
      const hasPartner = Boolean(t?.partnerName && (t.partnerVisitsOften || state.day % 2 === 0));
      return {
        ...room,
        lightOn: true,
        guestPresent: hasPartner,
        guestName: hasPartner ? t.partnerName! : null,
        guestOvernight: hasPartner,
        privacyStatus: hasPartner
          ? `Ada ${t.partnerName} menginap · Privasi terjaga`
          : t?.shiftWorker
            ? 'Berangkat kerja shift malam'
            : 'Sedang istirahat',
      };
    }
    if (state.slot === 'siang' && t?.shiftWorker) {
      return {
        ...room,
        lightOn: false,
        privacyStatus: 'Sedang tidur siang (shift malam)',
      };
    }
    if (state.slot === 'pagi') {
      return {
        ...room,
        lightOn: false,
        privacyStatus: room.guestOvernight
          ? `${room.guestName} pamit pulang pagi`
          : t?.shiftWorker
            ? 'Baru pulang shift'
            : 'Persiapan kuliah/kerja',
      };
    }
    return {
      ...room,
      lightOn: state.slot === 'sore',
      privacyStatus: t?.wantsBigDesk ? 'Kerja / nugas dari kamar' : 'Santai di kamar',
    };
  });
  return { ...state, rooms };
}

function updateJandaPosition(state: GameState): GameState {
  const isRain = state.weather === 'hujan' || state.weather === 'hujan_deras';
  let x = 5;
  let y = 8.4;
  let floor: FloorNumber = 1;
  let pose = state.janda.pose;

  if (isRain) {
    // Hides under terrace chair or shoe rack when raining!
    x = state.facilities.kanopi_teras ? 4.8 : 6.2;
    y = 6.5;
    pose = 'tidur';
  } else if (state.facilities.kamar_owner && state.slot === 'malam') {
    x = 2.2;
    y = 7.4;
    pose = 'tidur';
  } else if (state.janda.cardboardPlaced && state.slot === 'siang') {
    x = 8.8;
    y = 8.5;
    pose = 'duduk';
  } else if (state.facilities.pondasi_lantai2 && state.slot === 'sore' && state.day % 2 === 0) {
    floor = 2;
    x = 5.5;
    y = 5.2;
    pose = 'stretch';
  } else {
    x = 5.2;
    y = 8.5;
    pose = state.slot === 'malam' ? 'tidur' : 'duduk';
  }

  return {
    ...state,
    janda: { ...state.janda, x, y, floor, pose },
  };
}

// === Action Union ===

export type GameAction =
  | { type: 'START_NEW_GAME'; skipOpening?: boolean }
  | { type: 'CONTINUE_GAME'; saved: GameState }
  | { type: 'RESET_GAME' }
  | { type: 'COMPLETE_OPENING'; appearance: OwnerAppearance; plan: InitialPlan; sentPhotoToAdik: boolean }
  | { type: 'SET_OWNER_POS'; x: number; y: number; floor?: FloorNumber }
  | { type: 'SET_FLOOR'; floor: FloorNumber }
  | { type: 'TOGGLE_CUTAWAY' }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'TOGGLE_REDUCED_MOTION' }
  | { type: 'TOGGLE_SKIP_OPENING_NEXT' }
  | { type: 'SET_PHONE_OPEN'; open: boolean; app?: PhoneAppId; chatThreadId?: string | null }
  | { type: 'OPEN_MODAL'; modal: GameState['activeModal'] }
  | { type: 'DISMISS_TOAST'; id: string }
  | { type: 'DISMISS_DAILY_SUMMARY' }
  | { type: 'CLOSE_DAY30_REPORT' }
  | { type: 'PIN_MISSION'; missionId: string | null }
  | { type: 'ADVANCE_SLOT'; slots?: number }
  | { type: 'ADVANCE_DAY'; expectedDay: number }
  | { type: 'GREET_FIRST_NIGHT_GUESTS' }
  // Outfits & Owner Room
  | { type: 'EQUIP_OR_BUY_OUTFIT'; outfitId: string }
  | { type: 'OWNER_EAT' }
  // Rooms, Facilities, Renovation
  | { type: 'START_FACILITY_PROJECT'; facilityId: FacilityId }
  | { type: 'START_ROOM_BUILD'; roomId: string }
  | { type: 'UPDATE_ROOM_AD'; roomId: string; listedRent: number; adActive: boolean; adNote: string }
  | { type: 'SAVE_ROOM_FURNITURE'; roomId: string; furniture: PlacedFurniture[]; totalCost: number; scheduleWithTenant?: boolean }
  | { type: 'RESOLVE_ISSUE'; issueId: string; mode: 'inspect' | 'temp' | 'full' }
  // Tenants & Applicants
  | { type: 'START_ROOM_TOUR'; applicantId: string }
  | { type: 'COMPLETE_ROOM_TOUR'; applicantId: string }
  | { type: 'ACCEPT_APPLICANT'; applicantId: string }
  | { type: 'REJECT_APPLICANT'; applicantId: string }
  | { type: 'APPROVE_JOINT_CONTRACT'; contractId: string; newRoomId?: string }
  | { type: 'RENEW_CONTRACT'; contractId: string }
  | { type: 'COMPLETE_CHECKOUT'; contractId: string; damageDeduction: number; note: string }
  | { type: 'DELIVER_PACKAGE'; packageId: string }
  // Chat & Promises
  | { type: 'MARK_CHAT_READ'; threadId: string }
  | { type: 'EXECUTE_CHAT_ACTION'; threadId: string; messageId: string; action: ChatAction }
  // Bank, Debts, Transfers, Verification
  | { type: 'INTERNAL_TRANSFER'; from: AccountType; to: AccountType; amount: number; note: string }
  | { type: 'COLLECT_OR_REMIND_DEBT'; debtId: string; action: 'remind' | 'extend' | 'receive_partial' | 'pay_debt' }
  | { type: 'RESOLVE_TRANSFER_CLAIM'; claimId: string; decision: 'match' | 'hold' | 'recheck' | 'trust'; mutationId?: string }
  // Rental & Bengkel
  | { type: 'BUY_MOTORBIKE'; marketIndex: number }
  | { type: 'COMPLETE_BIKE_INSPECTION'; bikeId: string; bookingId?: string; inspection: BikeInspection; scratchFee?: number }
  | { type: 'APPROVE_RENTAL_BOOKING'; bookingId: string }
  | { type: 'RETURN_RENTAL_BIKE'; bookingId: string; scratchDetected: boolean; damageFee: number }
  | { type: 'SERVICE_BIKE'; bikeId: string; serviceType: 'reguler' | 'ekspres' }
  | { type: 'RESOLVE_BREAKDOWN'; incidentId: string; mode: 'mekanik' | 'pengganti' | 'jemput_refund' }
  // Warung, Kontrakan, Staff, Partnerships
  | { type: 'UNLOCK_WARUNG' }
  | { type: 'UPGRADE_WARUNG_RESTAURANT' }
  | { type: 'BUY_WARUNG_STOCK'; itemId: string; qty: number }
  | { type: 'SET_WARUNG_PRICE'; itemId: string; price: number }
  | { type: 'TOGGLE_WARUNG_OPEN' }
  | { type: 'HANDLE_WARUNG_ORDER'; orderId: string; mode: 'serve' | 'substitute' | 'decline' }
  | { type: 'HANDLE_CAMPUS_CATERING'; mode: 'accept_15' | 'buy_extra' | 'split_neighbor' }
  | { type: 'SET_RARA_CONSIGNMENT'; mode: 'accept' | 'preorder' }
  | { type: 'BUY_KONTRAKAN' }
  | { type: 'REPAIR_KONTRAKAN' }
  | { type: 'TOGGLE_KONTRAKAN_AD' }
  | { type: 'ACCEPT_KONTRAKAN_TENANT'; applicantId: string }
  | { type: 'TOGGLE_HIRE_STAFF'; staffId: string }
  | { type: 'JOIN_PARTNERSHIP'; partnershipId: string }
  // Relationships & Adik
  | { type: 'INTERACT_NPC'; npcId: string; activity: 'sapa' | 'ngopi' | 'makan' | 'jalan_sore' | 'undang_kamar' | 'jadwalkan' }
  | { type: 'SEND_PHOTO_TO_ADIK'; photoId: string }
  | { type: 'SET_WALLPAPER'; photoId: string | null }
  | { type: 'DISPLAY_PHOTO_IN_ROOM'; photoId: string }
  // Janda & Mini-Games
  | { type: 'JANDA_CARE'; action: 'makan' | 'air' | 'elus' | 'taruh_mangkuk' | 'taruh_kardus'; spot?: string }
  | { type: 'COMPLETE_JANDA_MINIGAME'; game: 'kejar_tali' | 'janda_dimana' | 'foto_pas'; won: boolean; themeTitle?: string; locationName?: string };

// === Helper: Spawn Applicants & Daily Events ===

function spawnApplicantsForVacantRooms(state: GameState): GameState {
  const vacantRooms = state.rooms.filter((r) => r.status === 'vacant' && r.adActive);
  if (vacantRooms.length === 0) return state;

  const occupiedIds = new Set(state.contracts.filter((c) => c.status === 'active').map((c) => c.tenantId));
  const pendingIds = new Set(state.applicants.filter((a) => a.status === 'pending' || a.status === 'touring').map((a) => a.tenantId));

  // Prioritize Naya, Dimas, Rara, Fajar early so player experiences rich storylines immediately!
  const priorityOrder = ['naya', 'dimas', 'rara', 'fajar', 'bagas', 'sinta', 'tania', 'rendi', 'vina'];
  let next = state;

  for (const room of vacantRooms) {
    const alreadyForRoom = next.applicants.filter((a) => a.targetRoomId === room.id && (a.status === 'pending' || a.status === 'touring'));
    if (alreadyForRoom.length >= 2) continue;

    for (const tid of priorityOrder) {
      if (occupiedIds.has(tid) || pendingIds.has(tid)) continue;
      const prof = next.tenants[tid];
      if (!prof) continue;
      if (tid === 'vina' && next.day < 10) continue; // Vina referred by Naya later
      if (room.listedRent > prof.budgetMax + 250000) continue;

      const app: Applicant = {
        id: nextUid('app'),
        tenantId: tid,
        targetRoomId: room.id,
        offeredRent: room.listedRent,
        message: prof.chatGreeting,
        appliedDay: next.day,
        toured: false,
        wantsBikeBundle: (tid === 'rendi' || tid === 'dimas') && next.rentalUnlocked && next.bikes.some((b) => b.status === 'tersedia'),
        status: 'pending',
      };
      pendingIds.add(tid);
      next = { ...next, applicants: [...next.applicants, app] };
      next = pushChatMessage(
        next,
        {
          npcId: prof.id,
          npcName: prof.name,
          roleTag: `Pelamar · ${prof.occupation}`,
          hairStyle: prof.hairStyle,
          hairColor: prof.hairColor,
          skinTone: prof.skinTone,
          outfitId: prof.outfitDay,
        },
        {
          sender: 'npc',
          senderName: prof.name,
          text: `${prof.chatGreeting} (Minat ${room.name} · ${formatRp(room.listedRent)}/bln)`,
          gotoLocation: { label: `Lihat ${room.name}`, x: room.doorX, y: room.doorY, floor: room.floor },
          actions: [
            {
              id: nextUid('act'),
              label: `Ajak Tur ${room.name}`,
              actionType: 'START_TOUR_FROM_CHAT',
              payload: { applicantId: app.id },
            },
          ],
        }
      );
      break;
    }
  }
  return next;
}

function advanceDayPipeline(state: GameState): GameState {
  const finishedDay = state.day;
  const newDay = finishedDay + 1;
  const highlights: string[] = [];
  let incomeTotal = 0;
  let expenseTotal = 0;

  // Determine weather for new day
  const scheduleEvent = ALLEY_SCHEDULE.find((e) => e.day === newDay);
  let weather: WeatherType = 'cerah';
  if (scheduleEvent?.kind === 'hujan' || newDay % 6 === 5) {
    weather = newDay % 12 === 5 ? 'hujan_deras' : 'hujan';
  } else if (newDay % 4 === 2) {
    weather = 'berawan';
  }

  let next: GameState = {
    ...state,
    day: newDay,
    slot: 'pagi',
    weather,
    ownerEnergy: 100,
    ateToday: false,
    powerOutageActive: false,
    alleyBazaarActive: scheduleEvent?.kind === 'bazar',
    agustusanActive: scheduleEvent?.kind === 'agustusan',
    competitorOpen: state.competitorOpen || scheduleEvent?.kind === 'saingan',
    warung: {
      ...state.warung,
      isOpenToday: false,
      revenueToday: 0,
      wasteToday: 0,
      dailyOrders: [],
    },
    janda: {
      ...state.janda,
      fedToday: false,
      waterRefilledToday: false,
      pettedToday: false,
      hunger: Math.max(30, state.janda.hunger - 25),
      mood: Math.max(45, state.janda.mood - 8),
    },
  };

  // Reset weekly Janda challenge every 7 days
  const currentWeek = Math.floor((newDay - 1) / 7) + 1;
  next = {
    ...next,
    missions: next.missions.map((m) => {
      if (m.id === 'janda_mingguan' && (m.weekIndex ?? 1) < currentWeek) {
        return {
          ...m,
          progress: 0,
          status: 'active',
          claimed: false,
          weekIndex: currentWeek,
          nextStep: `Tantangan Minggu #${currentWeek}: Mainkan Foto Pas! atau Janda di Mana?`,
        };
      }
      if (m.id === 'main_hari_30') {
        return { ...m, progress: Math.min(30, newDay) };
      }
      return m;
    }),
    janda: {
      ...next.janda,
      weeklyThemeIndex: (currentWeek - 1) % JANDA_PHOTO_THEMES.length,
    },
  };

  // Reset metToday on relationships
  const resetRels = { ...next.relationships };
  Object.keys(resetRels).forEach((k) => {
    resetRels[k] = { ...resetRels[k], metToday: false };
  });
  next = { ...next, relationships: resetRels };

  // Reset remindedToday on debts
  next = {
    ...next,
    debts: next.debts.map((d) => ({ ...d, remindedToday: false })),
  };

  // 1. Complete "Malam Pertama di Kost Texas" if player had occupied room & went through night!
  const mMalam = next.missions.find((m) => m.id === 'main_malam_pertama');
  if (
    mMalam &&
    mMalam.status === 'active' &&
    !mMalam.claimed &&
    next.contracts.some((c) => c.status === 'active') &&
    (state.firstNightGuestsGreeted || state.slot === 'malam')
  ) {
    next = completeMission(next, 'main_malam_pertama');
    highlights.push('Malam pertama kos bebas berjalan hangat! Tamu pamit pagi dengan ramah.');
  }

  // 2. Progress Active Construction Projects
  const remainingProjects: ActiveProject[] = [];
  for (const proj of next.activeProjects) {
    const left = proj.daysLeft - 1;
    if (left <= 0) {
      if (proj.kind === 'room') {
        next = {
          ...next,
          rooms: next.rooms.map((r) =>
            r.id === proj.targetId
              ? { ...r, status: 'vacant', constructionDaysLeft: 0, condition: 100, cleanliness: 100 }
              : r
          ),
        };
        highlights.push(`${proj.title} selesai dibangun dan siap disewakan!`);
        // Progress "Kamar Pertama, Kunci Pertama"
        next = {
          ...next,
          missions: next.missions.map((m) =>
            m.id === 'main_kamar_pertama' && m.progress < 1
              ? { ...m, progress: 1, nextStep: 'Terima pelamar di Properti & ajak tur kamar!' }
              : m
          ),
        };
      } else if (proj.kind === 'facility') {
        const fid = proj.targetId as FacilityId;
        next = {
          ...next,
          facilities: { ...next.facilities, [fid]: true },
        };
        highlights.push(`Fasilitas selesai: ${proj.title}!`);

        if (fid === 'rak_preloved_teras') {
          next = completeMission(next, 'side_meja_naya');
          next = pushChatMessage(
            next,
            {
              npcId: 'naya',
              npcName: 'Naya',
              roleTag: 'Penghuni · Mahasiswa Desain',
              hairStyle: 'bob',
              hairColor: '#3B2820',
              skinTone: '#F3C8A2',
              outfitId: 'genz_oversized',
            },
            {
              sender: 'npc',
              senderName: 'Naya',
              text: 'Waaah rak preloved di teras udah jadi!! Makasih banyak Kak, weekend ini aku gelar lapak ya!',
            }
          );
        }
        if (fid === 'pondasi_lantai2') {
          // Unlock room 201 immediately ready as part of Floor 2 completion, and 202/203 buildable!
          next = {
            ...next,
            rooms: next.rooms.map((r) =>
              r.id === '201'
                ? {
                    ...r,
                    status: 'vacant',
                    furniture: [
                      { uid: nextUid('f'), type: 'kasur_standar', gx: 0, gy: 0 },
                      { uid: nextUid('f'), type: 'meja_kecil', gx: 3, gy: 0 },
                      { uid: nextUid('f'), type: 'lemari', gx: 0, gy: 2 },
                    ],
                  }
                : r
            ),
            photos: [
              ...next.photos,
              {
                id: nextUid('photo'),
                title: 'Lantai Dua Kost Texas Selesai!',
                caption: 'Dari tanah kosong, sekarang Kost Texas sudah punya dua lantai.',
                day: newDay,
                category: 'kos',
                sceneKey: 'kos_lt2',
              },
            ],
          };
          next = completeMission(next, 'main_lantai_dua');
          // Trigger Janda Teman Baru di Lantai Dua!
          next = pushChatMessage(
            next,
            {
              npcId: 'naya',
              npcName: 'Naya',
              roleTag: 'Penghuni',
              hairStyle: 'bob',
              hairColor: '#3B2820',
              skinTone: '#F3C8A2',
              outfitId: 'genz_oversized',
            },
            {
              sender: 'npc',
              senderName: 'Naya',
              text: 'Kak!! Lihat siapa yang naik tangga ke Lantai 2 buat kenalan sama kamar baru 😆 Aku fotoin Janda ya!',
              photoId: 'photo_janda_lt2',
            }
          );
          if (!next.photos.some((p) => p.id === 'photo_janda_lt2')) {
            next = {
              ...next,
              photos: [
                ...next.photos,
                {
                  id: 'photo_janda_lt2',
                  title: 'Janda Inspeksi Lantai Dua',
                  caption: 'Kiriman foto dari tenant saat Janda naik ke koridor lantai dua.',
                  day: newDay,
                  category: 'janda',
                  sceneKey: 'janda_lt2',
                  jandaLocation: 'Koridor Lantai Dua',
                },
              ],
            };
          }
          next = completeMission(next, 'janda_teman_lt2');
          next = checkAlbumBosKos(next);
        }
        if (fid === 'lantai3_lounge') {
          next = {
            ...next,
            rooms: next.rooms.map((r) =>
              r.id === '301'
                ? {
                    ...r,
                    status: 'vacant',
                    furniture: [
                      { uid: nextUid('f'), type: 'kasur_queen', gx: 0, gy: 0 },
                      { uid: nextUid('f'), type: 'meja_besar', gx: 3, gy: 0 },
                      { uid: nextUid('f'), type: 'ac', gx: 4, gy: 2 },
                    ],
                  }
                : r
            ),
          };
          highlights.push('Lantai Tiga & Ruang Bersama siap! Kamar 301 Rooftop terbuka.');
        }
        if (fid === 'petak_motor') {
          next = {
            ...next,
            issues: next.issues.map((i) => (i.kind === 'parkir_penuh' ? { ...i, resolved: true } : i)),
          };
        }
        if (fid === 'bangku_geser' || fid === 'peredam_suara') {
          next = {
            ...next,
            issues: next.issues.map((i) => (i.kind === 'suara_teras' ? { ...i, resolved: true } : i)),
          };
        }
      } else if (proj.kind === 'kontrakan_repair') {
        next = {
          ...next,
          kontrakan: {
            ...next.kontrakan,
            repaired: true,
            condition: 95,
            adActive: true,
            applicants: [
              {
                id: 'kapp_1',
                familyName: 'Keluarga Pak Hendra (3 orang)',
                members: 3,
                offer: 2800000,
                bio: 'Dosen baru di kampus sebelah, cari rumah kontrakan rapi jangka panjang.',
              },
              {
                id: 'kapp_2',
                familyName: 'Grup 3 Mahasiswi Akhir',
                members: 3,
                offer: 3000000,
                bio: 'Butuh rumah tenang buat skripsian bareng & akses dekat kampus.',
              },
            ],
          },
        };
        highlights.push('Renovasi Rumah Kontrakan selesai! Sudah ada 2 calon penyewa.');
      }
    } else {
      remainingProjects.push({ ...proj, daysLeft: left });
      if (proj.kind === 'room') {
        next = {
          ...next,
          rooms: next.rooms.map((r) => (r.id === proj.targetId ? { ...r, constructionDaysLeft: left } : r)),
        };
      }
    }
  }
  next = { ...next, activeProjects: remainingProjects };
  next = updateRoomStatsFromWorld(next);

  // Unlock Rental & Warung automatically once any room is built (Day 2+)
  const hasBuiltRoom = next.rooms.some((r) => r.status === 'vacant' || r.status === 'occupied');
  if (hasBuiltRoom && !next.rentalUnlocked) {
    next = { ...next, rentalUnlocked: true };
    highlights.push('Bisnis baru terbuka: Kamu sekarang bisa mulai Rental Motor & Warung Gang!');
  }
  if (newDay >= 6 && !next.kontrakan.unlocked) {
    next = { ...next, kontrakan: { ...next.kontrakan, unlocked: true } };
    highlights.push('Info Bu Sari: Rumah kontrakan di ujung gang sedang dijual & bisa kamu kelola!');
  }

  // 3. Process Staff Wages & Automated Staff Duties
  for (const st of next.staff) {
    if (!st.hired) continue;
    const { state: sPaid } = recordTx(next, {
      account: 'usaha',
      type: 'out',
      category: 'gaji',
      amount: st.dailyWage,
      title: `Upah Harian ${st.name} (${st.roleLabel})`,
      counterparty: st.name,
    });
    next = sPaid;
    expenseTotal += st.dailyWage;

    if (st.role === 'kebersihan') {
      next = {
        ...next,
        rooms: next.rooms.map((r) =>
          r.status === 'vacant' || r.status === 'occupied' ? { ...r, cleanliness: 100 } : r
        ),
        staff: next.staff.map((x) =>
          x.id === st.id ? { ...x, lastActionLog: `Hari ${newDay}: Bersih-bersih teras & seluruh kamar.` } : x
        ),
      };
      highlights.push('Pak Joko membersihkan teras & kamar pagi ini.');
    } else if (st.role === 'warung' && next.warung.unlocked) {
      const autoSales = 145000 + (next.warung.level === 2 ? 95000 : 0);
      const { state: wPaid } = recordTx(next, {
        account: 'usaha',
        type: 'in',
        category: 'warung',
        amount: autoSales,
        title: 'Penjualan Harian Warung (Mbak Dewi)',
        counterparty: 'Pelanggan Gang',
      });
      next = wPaid;
      incomeTotal += autoSales;
      next = {
        ...next,
        warung: { ...next.warung, isOpenToday: true, revenueToday: autoSales },
        staff: next.staff.map((x) =>
          x.id === st.id ? { ...x, lastActionLog: `Hari ${newDay}: Warung buka & catat omzet ${formatRp(autoSales)}.` } : x
        ),
      };
      highlights.push(`Mbak Dewi jaga warung · Omzet +${formatRp(autoSales)}.`);
    } else if (st.role === 'rental' && next.bikes.length > 0) {
      next = {
        ...next,
        bikes: next.bikes.map((b) =>
          b.status === 'tersedia'
            ? { ...b, tireHealth: Math.min(100, b.tireHealth + 4), batteryHealth: Math.min(100, b.batteryHealth + 4) }
            : b
        ),
        staff: next.staff.map((x) =>
          x.id === st.id ? { ...x, lastActionLog: `Hari ${newDay}: Cek ban & aki harian armada motor.` } : x
        ),
      };
    }
  }

  // Laundry partnership passive daily commission
  if (next.partnerships.some((p) => p.id === 'partner_laundry' && p.active) && next.contracts.length > 0) {
    const comm = 35000 * next.contracts.filter((c) => c.status === 'active').length;
    const { state: lPaid } = recordTx(next, {
      account: 'usaha',
      type: 'in',
      category: 'warung',
      amount: comm,
      title: 'Komisi Kerja Sama Laundry Bu Tin',
      counterparty: 'Laundry Bu Tin',
    });
    next = lPaid;
    incomeTotal += comm;
  }

  // 4. Bike servicing completion & Rental bookings check
  next = {
    ...next,
    bikes: next.bikes.map((b) => {
      if (b.status === 'bengkel' && b.serviceDoneDay && b.serviceDoneDay <= newDay) {
        highlights.push(`${b.name} selesai diservis di Bengkel Mas Eko!`);
        return {
          ...b,
          status: 'tersedia',
          tireHealth: 100,
          bodyHealth: 100,
          batteryHealth: 100,
          serviceDoneDay: undefined,
        };
      }
      return b;
    }),
  };

  // Generate new rental booking / transfer claim when rental has available bike!
  const availBike = next.bikes.find((b) => b.status === 'tersedia');
  if (availBike && next.bookings.filter((b) => b.status === 'pending').length === 0 && newDay % 2 === 1) {
    const scenarios: ClaimScenario[] = ['valid', 'fake', 'underpaid', 'delayed', 'wrong_account'];
    const scenarioIdx = next.transferClaims.length % scenarios.length;
    const scenario = scenarios[scenarioIdx];
    const custNames = ['Andi (Mhs Teknik)', 'Riko (Eksternal)', 'Dhea (Mhs Ekonomi)', 'Gerry (Tamu Gang)', 'Budi (Karyawan)'];
    const custName = custNames[next.transferClaims.length % custNames.length];
    const daysRent = 2;
    const totalPrice = availBike.dailyRate * daysRent;
    const bookingId = nextUid('bk');
    const claimId = nextUid('clm');
    const refCode = `TRF-${newDay}${Math.floor(1000 + Math.random() * 8999)}`;

    let mutationId: string | undefined;
    if (scenario === 'valid') {
      const res = recordTx(next, {
        account: 'usaha',
        type: 'in',
        category: 'rental',
        amount: totalPrice,
        title: `Transfer Masuk (${custName})`,
        counterparty: custName,
        referenceCode: refCode,
      });
      next = res.state;
      mutationId = res.tx.id;
      incomeTotal += totalPrice;
    } else if (scenario === 'underpaid') {
      const shortAmt = totalPrice - 35000;
      const res = recordTx(next, {
        account: 'usaha',
        type: 'in',
        category: 'rental',
        amount: shortAmt,
        title: `Transfer Masuk (${custName})`,
        counterparty: custName,
        referenceCode: refCode,
      });
      next = res.state;
      mutationId = res.tx.id;
      incomeTotal += shortAmt;
    } else if (scenario === 'wrong_account') {
      const res = recordTx(next, {
        account: 'pribadi',
        type: 'in',
        category: 'rental',
        amount: totalPrice,
        title: `Transfer Salah Rekening (${custName})`,
        counterparty: custName,
        referenceCode: refCode,
      });
      next = res.state;
      mutationId = res.tx.id;
      incomeTotal += totalPrice;
    }

    const claim: TransferClaim = {
      id: claimId,
      bookingId,
      customerName: custName,
      expectedAmount: totalPrice,
      claimedAmount: totalPrice,
      claimedRef: refCode,
      claimedAccount: 'usaha',
      actualScenario: scenario,
      actualMutationId: mutationId,
      actualArrivesOnSlot: scenario === 'delayed' ? { day: newDay, slot: 'siang' } : undefined,
      status: 'menunggu_verifikasi',
      dayCreated: newDay,
      note:
        scenario === 'fake'
          ? 'Customer mengirim screenshot bukti transfer yang terlihat janggal. Wajib cek mutasi Bank!'
          : 'Customer mengklaim sudah transfer dan minta kunci motor segera diserahkan.',
    };

    next = {
      ...next,
      bookings: [
        ...next.bookings,
        {
          id: bookingId,
          bikeId: availBike.id,
          customerName: custName,
          rateType: 'harian',
          startDay: newDay,
          endDay: newDay + daysRent,
          totalPrice,
          deposit: 100000,
          paidAmount: 0,
          status: 'pending',
          handoverInspected: false,
          returnInspected: false,
          claimId,
        },
      ],
      transferClaims: [claim, ...next.transferClaims],
    };

    next = pushChatMessage(
      next,
      {
        npcId: `cust_${custName.split(' ')[0].toLowerCase()}`,
        npcName: custName,
        roleTag: 'Customer Rental Motor',
        hairStyle: 'pendek',
        hairColor: '#231F20',
        skinTone: '#C2855C',
        outfitId: 'genz_hoodie',
      },
      {
        sender: 'npc',
        senderName: custName,
        text: `Halo Kak, aku udah transfer ${formatRp(totalPrice)} (Ref: ${refCode}) untuk sewa ${availBike.name} ${daysRent} hari. Boleh ambil motornya sekarang?`,
        verifyClaimId: claimId,
      }
    );
    highlights.push(`Ada booking rental baru dari ${custName} (cek verifikasi transfer!).`);
  }

  // Trigger a Breakdown Incident on an active rental bike periodically
  const activeBooking = next.bookings.find((b) => b.status === 'active');
  if (activeBooking && !next.breakdowns.some((br) => !br.resolved)) {
    const bike = next.bikes.find((b) => b.id === activeBooking.bikeId);
    if (bike && (bike.tireHealth < 75 || bike.batteryHealth < 75 || newDay % 4 === 0)) {
      const incId = nextUid('brk');
      const inc = {
        id: incId,
        bookingId: activeBooking.id,
        bikeId: bike.id,
        customerName: activeBooking.customerName,
        kind: (bike.batteryHealth < 75 ? 'aki_tekor' : 'mogok') as 'aki_tekor' | 'mogok',
        location: 'Dekat Gerbang Kampus',
        message: 'Kak, motornya mati deket kampus. Aku ada kelas jam 2, bisa dibantu?',
        day: newDay,
        slot: 'siang' as TimeSlot,
        resolved: false,
      };
      next = {
        ...next,
        bikes: next.bikes.map((b) => (b.id === bike.id ? { ...b, status: 'mogok' } : b)),
        breakdowns: [inc, ...next.breakdowns],
      };
      next = pushChatMessage(
        next,
        {
          npcId: `cust_${activeBooking.customerName.split(' ')[0].toLowerCase()}`,
          npcName: activeBooking.customerName,
          roleTag: 'Customer Rental',
          hairStyle: 'pendek',
          hairColor: '#231F20',
          skinTone: '#DFAA82',
          outfitId: 'genz_oversized',
        },
        {
          sender: 'npc',
          senderName: activeBooking.customerName,
          text: inc.message,
          actions: [
            {
              id: nextUid('act'),
              label: 'Aku kirim mekanik (Rp95.000)',
              actionType: 'BREAKDOWN_FROM_CHAT',
              payload: { incidentId: incId, mode: 'mekanik' },
              moneyCost: 95000,
              account: 'usaha',
            },
            {
              id: nextUid('act'),
              label: 'Antar motor pengganti (+1 slot)',
              actionType: 'BREAKDOWN_FROM_CHAT',
              payload: { incidentId: incId, mode: 'pengganti' },
              timeCost: 1,
            },
            {
              id: nextUid('act'),
              label: 'Jemput motor & refund sebagian (Rp40.000)',
              actionType: 'BREAKDOWN_FROM_CHAT',
              payload: { incidentId: incId, mode: 'jemput_refund' },
              timeCost: 1,
              moneyCost: 40000,
              account: 'usaha',
            },
          ],
        }
      );
      highlights.push(`Darurat Rental: ${bike.name} mogok dekat kampus!`);
    }
  }

  // 5. Rent Due / Installments & Kontrakan Upkeep
  if (next.kontrakan.owned) {
    if (!next.kontrakan.tenantFamilyName) {
      const { state: kUp } = recordTx(next, {
        account: 'usaha',
        type: 'out',
        category: 'kontrakan',
        amount: next.kontrakan.upkeepDaily,
        title: 'Biaya Perawatan Rumah Kontrakan Kosong',
        counterparty: 'Perawatan Properti',
      });
      next = kUp;
      expenseTotal += next.kontrakan.upkeepDaily;
    } else if (next.kontrakan.nextDueDay && newDay >= next.kontrakan.nextDueDay) {
      const { state: kRent } = recordTx(next, {
        account: 'usaha',
        type: 'in',
        category: 'kontrakan',
        amount: next.kontrakan.monthlyRent,
        title: `Sewa Bulanan Rumah Kontrakan (${next.kontrakan.tenantFamilyName})`,
        counterparty: next.kontrakan.tenantFamilyName,
      });
      next = {
        ...kRent,
        kontrakan: { ...kRent.kontrakan, nextDueDay: newDay + 30 },
      };
      incomeTotal += next.kontrakan.monthlyRent;
      highlights.push(`Sewa Rumah Kontrakan cair +${formatRp(next.kontrakan.monthlyRent)}!`);
    }
  }

  // Tenant rent billing & auto-collect reliable debts
  for (const contract of next.contracts) {
    if (contract.status !== 'active') continue;
    const t = next.tenants[contract.tenantId];
    if (!t) continue;
    if (newDay >= contract.nextDueDay) {
      if (t.reliability === 'minta_cicil') {
        const half = Math.round(contract.monthlyRent / 2);
        const { state: halfPaid } = recordTx(next, {
          account: 'usaha',
          type: 'in',
          category: 'sewa',
          amount: half,
          title: `Cicilan Awal Sewa ${t.name} (Kamar ${contract.roomId})`,
          counterparty: t.name,
        });
        next = halfPaid;
        incomeTotal += half;
        const debt: DebtRecord = {
          id: nextUid('debt'),
          kind: 'cicilan_sewa',
          direction: 'piutang',
          account: 'usaha',
          counterpartyId: t.id,
          counterpartyName: t.name,
          title: `Sisa Sewa Kamar ${contract.roomId} (${t.name})`,
          initialAmount: contract.monthlyRent,
          paidAmount: half,
          remainingAmount: contract.monthlyRent - half,
          promisedDay: newDay + 3,
          reliability: 'butuh_ingat',
          remindedToday: false,
          status: 'partial',
          history: [{ day: newDay, amount: half, note: 'Bayar separuh awal saat jatuh tempo' }],
          relatedContractId: contract.id,
        };
        next = {
          ...next,
          debts: [debt, ...next.debts],
          contracts: next.contracts.map((c) =>
            c.id === contract.id ? { ...c, nextDueDay: newDay + 30, monthsStayed: c.monthsStayed + 1, hasInstallment: true } : c
          ),
        };
        highlights.push(`${t.name} bayar separuh sewa, sisa dicicil hingga Hari ${newDay + 3}.`);
      } else {
        const { state: rPaid } = recordTx(next, {
          account: 'usaha',
          type: 'in',
          category: 'sewa',
          amount: contract.monthlyRent,
          title: `Sewa Bulanan Kamar ${contract.roomId} (${t.name})`,
          counterparty: t.name,
        });
        next = {
          ...rPaid,
          contracts: rPaid.contracts.map((c) =>
            c.id === contract.id ? { ...c, nextDueDay: newDay + 30, monthsStayed: c.monthsStayed + 1 } : c
          ),
        };
        incomeTotal += contract.monthlyRent;
        highlights.push(`Sewa Kamar ${contract.roomId} (${t.name}) masuk +${formatRp(contract.monthlyRent)}.`);
      }
    }
  }

  // Trigger early installment chat ("Nunggu Gajian") on Day 4 so player can experience installments early!
  const firstActiveContract = next.contracts.find((c) => c.status === 'active');
  if (newDay === 4 && firstActiveContract && !next.debts.some((d) => d.kind === 'cicilan_sewa')) {
    const t = next.tenants[firstActiveContract.tenantId];
    if (t) {
      next = pushChatMessage(
        next,
        {
          npcId: t.id,
          npcName: t.name,
          roleTag: `Penghuni Kamar ${firstActiveContract.roomId}`,
          hairStyle: t.hairStyle,
          hairColor: t.hairColor,
          skinTone: t.skinTone,
          outfitId: t.outfitDay,
        },
        {
          sender: 'npc',
          senderName: t.name,
          text: 'Kak, iuran utilitas & tambahan fasilitas Rp400.000 boleh aku bayar separuh dulu? Sisanya pas gajian lusa aku lunasi.',
          actions: [
            {
              id: nextUid('act'),
              label: 'Boleh bayar separuh dulu (Cicilan Rp200rb)',
              actionType: 'CREATE_INSTALLMENT_AGREEMENT',
              payload: { tenantId: t.id, tenantName: t.name, total: 400000, paidNow: 200000, contractId: firstActiveContract.id },
            },
          ],
        }
      );
    }
  }

  // 6. Trigger Building Complaints (Chat yang Perlu Dibalas!) on Day 3 or during rain
  if (newDay === 3 && firstActiveContract && next.issues.length === 0) {
    const t = next.tenants[firstActiveContract.tenantId];
    const issueId = nextUid('iss');
    const issue: BuildingIssue = {
      id: issueId,
      kind: 'wifi_lemah',
      roomId: firstActiveContract.roomId,
      title: `Wi-Fi Lemah di Kamar ${firstActiveContract.roomId}`,
      description: 'Sinyal sering putus pas lagi upload tugas & meeting.',
      rootCause: 'Router utama belum dioptimalkan dan jarak ke kamar cukup jauh.',
      reportedBy: t?.name ?? 'Penghuni',
      reportedDay: newDay,
      inspected: false,
      resolved: false,
      tempFixUsed: false,
      tempFixCost: 120000,
      fullFixCost: 350000,
    };
    next = { ...next, issues: [issue, ...next.issues] };
    next = pushChatMessage(
      next,
      {
        npcId: t?.id ?? 'naya',
        npcName: t?.name ?? 'Naya',
        roleTag: `Penghuni Kamar ${firstActiveContract.roomId}`,
        hairStyle: t?.hairStyle,
        hairColor: t?.hairColor,
        skinTone: t?.skinTone,
        outfitId: t?.outfitDay,
      },
      {
        sender: 'npc',
        senderName: t?.name ?? 'Naya',
        text: 'Kak, sinyal Wi-Fi di kamarku agak putus-putus nih buat upload tugas. Bisa dicek nggak ya?',
        gotoLocation: { label: 'Cek Router Koridor', x: 7, y: 5, floor: 1 },
        actions: [
          {
            id: nextUid('act'),
            label: 'Besok pagi aku cek (Buat Janji & Inspeksi)',
            actionType: 'PROMISE_INSPECT_ISSUE',
            payload: { issueId, npcId: t?.id ?? 'naya', npcName: t?.name ?? 'Naya' },
          },
        ],
      }
    );
    highlights.push('Keluhan pertama masuk lewat Chat! Balas dan tangani janji perbaikanmu.');
  }

  // Rain roof leak or parking/terrace complaint
  if ((weather === 'hujan' || weather === 'hujan_deras') && newDay >= 5 && !next.issues.some((i) => i.kind === 'atap_bocor' && !i.resolved)) {
    const occRoom = next.rooms.find((r) => r.status === 'occupied');
    if (occRoom) {
      const issue: BuildingIssue = {
        id: nextUid('iss'),
        kind: 'atap_bocor',
        roomId: occRoom.id,
        title: `Rembesan Atap Saat Hujan (${occRoom.name})`,
        description: 'Hujan deras memperparah genteng geser di sudut plafon.',
        rootCause: 'Talang air penuh daun mangga & genteng bergeser.',
        reportedBy: 'Penghuni',
        reportedDay: newDay,
        inspected: false,
        resolved: false,
        tempFixUsed: false,
        tempFixCost: 180000,
        fullFixCost: 520000,
      };
      next = { ...next, issues: [issue, ...next.issues] };
      highlights.push(`Hujan memicu rembesan atap di ${occRoom.name}. Cek menu Properti.`);
    }
  }

  // 7. Packages & "Paket Nyasar" side mission
  if (newDay >= 3 && firstActiveContract && !next.packages.some((p) => !p.delivered)) {
    const t = next.tenants[firstActiveContract.tenantId];
    if (t) {
      next = {
        ...next,
        packages: [
          ...next.packages,
          {
            id: nextUid('pkg'),
            recipientTenantId: t.id,
            recipientName: t.name,
            description: t.id === 'rara' ? 'Paket Bahan Kue & Cokelat' : 'Paket Kurir (Salah Alamat Blok)',
            isMisdelivered: true,
            delivered: false,
            dayArrived: newDay,
          },
        ],
      };
      highlights.push(`Ada paket kurir untuk ${t.name} di dekat gerbang/rak paket!`);
    }
  }

  // 8. Tenant Storylines (Dimas Joint Contract, Rara Dessert Consignment, Naya Preloved)
  const dimasContract = next.contracts.find((c) => c.status === 'active' && c.tenantId === 'dimas');
  if (dimasContract && !dimasContract.isJointContract && newDay >= dimasContract.startDay + 3) {
    next = pushChatMessage(
      next,
      {
        npcId: 'dimas',
        npcName: 'Dimas',
        roleTag: `Penghuni Kamar ${dimasContract.roomId}`,
        hairStyle: 'pendek',
        hairColor: '#231F20',
        skinTone: '#C2855C',
        outfitId: 'millennial_linen',
      },
      {
        sender: 'npc',
        senderName: 'Dimas',
        text: 'Kak, Lina makin sering nginep dan sekarang mau sekalian menetap bareng. Boleh kita ubah ke Kontrak Bersama (+Rp350.000/bln)?',
        actions: [
          {
            id: nextUid('act'),
            label: 'Setujui Kontrak Bersama Dimas & Lina',
            actionType: 'APPROVE_JOINT_FROM_CHAT',
            payload: { contractId: dimasContract.id },
          },
        ],
      }
    );
  }

  if (next.warung.unlocked && next.warung.raraConsignmentStage === 0) {
    next = { ...next, warung: { ...next.warung, raraConsignmentStage: 1 } };
    next = pushChatMessage(
      next,
      {
        npcId: 'rara',
        npcName: 'Rara',
        roleTag: 'Home Baker & Tenant',
        hairStyle: 'bergelombang',
        hairColor: '#5B3422',
        skinTone: '#DFAA82',
        outfitId: 'genz_hoodie',
      },
      {
        sender: 'npc',
        senderName: 'Rara',
        text: 'Kak, warungnya udah buka ya! Aku boleh titip jual Puding Karamel & Brownies Lumer? Bagi hasil 70/30 atau nanti bisa sistem pre-order!',
        actions: [
          {
            id: nextUid('act'),
            label: 'Terima Titip Jual Rara (Stok 10 porsi)',
            actionType: 'ACCEPT_RARA_CONSIGNMENT',
            payload: { mode: 'accept' },
          },
        ],
      }
    );
  }

  // 9. Adik Raka Messages (Praktikum Transfer & Holiday Visit)
  if (newDay === 5) {
    next = pushChatMessage(
      next,
      {
        npcId: 'raka',
        npcName: 'Raka (Adik)',
        roleTag: 'Adik · Kuliah Luar Kota',
        hairStyle: 'pendek',
        hairColor: '#231F20',
        skinTone: '#DFAA82',
        outfitId: 'genz_hoodie',
      },
      {
        sender: 'npc',
        senderName: 'Raka',
        text: 'Kak, minggu ini ada biaya praktikum lab Rp350.000. Boleh minta bantu dulu dari rekening pribadi? Atau separuh dulu juga nggak apa-apa.',
        actions: [
          {
            id: nextUid('act'),
            label: 'Transfer Penuh Rp350.000',
            actionType: 'TRANSFER_TO_ADIK',
            payload: { amount: 350000, mode: 'penuh' },
            moneyCost: 350000,
            account: 'pribadi',
          },
          {
            id: nextUid('act'),
            label: 'Bantu Separuh Rp175.000',
            actionType: 'TRANSFER_TO_ADIK',
            payload: { amount: 175000, mode: 'sebagian' },
            moneyCost: 175000,
            account: 'pribadi',
          },
          {
            id: nextUid('act'),
            label: 'Sepakati Kirim Minggu Depan',
            actionType: 'TRANSFER_TO_ADIK',
            payload: { amount: 0, mode: 'tunda' },
          },
        ],
      }
    );
    highlights.push('Raka kirim chat soal biaya praktikum kuliahnya.');
  }

  // 10. Alley Schedule Specific Events
  let alleyEventTitle: string | undefined;
  let alleyEventDesc: string | undefined;
  if (scheduleEvent) {
    alleyEventTitle = scheduleEvent.title;
    alleyEventDesc = scheduleEvent.desc;
    highlights.push(`Kabar Gang: ${scheduleEvent.title}`);

    if (scheduleEvent.kind === 'padam') {
      next = { ...next, powerOutageActive: true };
      next = pushChatMessage(
        next,
        {
          npcId: 'busari',
          npcName: 'Bu Sari',
          roleTag: 'Tetangga Gang',
          hairStyle: 'cepol',
          hairColor: '#363230',
          skinTone: '#C2855C',
          outfitId: 'millennial_linen',
        },
        {
          sender: 'npc',
          senderName: 'Bu Sari',
          text: 'Nak, gardu gang lagi pemadaman sementara. Anak-anak kos pada ngumpul ngobrol santai di teras nih.',
        }
      );
    }
    if (scheduleEvent.kind === 'panitia' && next.warung.unlocked) {
      next = { ...next, warung: { ...next.warung, campusOrderActive: true } };
      next = pushChatMessage(
        next,
        {
          npcId: 'panitia',
          npcName: 'Panitia Kampus',
          roleTag: 'Pesanan Rombongan',
          hairStyle: 'pendek',
          hairColor: '#231F20',
          skinTone: '#DFAA82',
          outfitId: 'genz_oversized',
        },
        {
          sender: 'npc',
          senderName: 'Panitia Kampus',
          text: 'Halo Warung Kost Texas! Kami mau pesan 25 kotak makan siang untuk acara kampus hari ini (stokmu cukup untuk 15). Mau ditangani gimana Kak?',
          actions: [
            {
              id: nextUid('act'),
              label: 'Terima 15 kotak sesuai stok (+Rp255.000)',
              actionType: 'CAMPUS_CATERING',
              payload: { mode: 'accept_15' },
            },
            {
              id: nextUid('act'),
              label: 'Belanja stok tambahan Rp120rb → Penuhi 25 (+Rp450.000)',
              actionType: 'CAMPUS_CATERING',
              payload: { mode: 'buy_extra' },
              moneyCost: 120000,
              account: 'usaha',
            },
            {
              id: nextUid('act'),
              label: 'Bagi pesanan dengan Warung Bu Sari (+Rp310.000 & repeat order!)',
              actionType: 'CAMPUS_CATERING',
              payload: { mode: 'split_neighbor' },
            },
          ],
        }
      );
    }
    if (scheduleEvent.kind === 'libur_adik') {
      next = pushChatMessage(
        next,
        {
          npcId: 'raka',
          npcName: 'Raka (Adik)',
          roleTag: 'Adik · Kuliah Luar Kota',
          hairStyle: 'pendek',
          hairColor: '#231F20',
          skinTone: '#DFAA82',
          outfitId: 'genz_hoodie',
        },
        {
          sender: 'npc',
          senderName: 'Raka',
          text: 'Kak!! Aku udah sampai di depan gerbang Kost Texas nih! Keluar dong, aku pengen lihat kosnya & ketemu Janda!',
          gotoLocation: { label: 'Temui Raka di Gerbang', x: 8, y: 10.5, floor: 1 },
        }
      );
    }
  }

  // 11. Spawn Applicants for Vacant Rooms
  next = spawnApplicantsForVacantRooms(next);

  // 12. Day 30 Milestone!
  if (newDay >= 30 && !next.day30ReportShown) {
    next = {
      ...next,
      day30ReportShown: true,
      day30ReportOpen: true,
    };
    const m30 = next.missions.find((m) => m.id === 'main_hari_30');
    if (m30 && !m30.claimed) {
      // Unlock & complete Day 30 mission atomically
      next = {
        ...next,
        missions: next.missions.map((m) => (m.id === 'main_hari_30' ? { ...m, status: 'active' } : m)),
      };
      next = completeMission(next, 'main_hari_30');
    }
  }

  // 13. Refresh room lights/privacy, Janda position, and NPC world entities
  next = updateRoomPrivacyAndLights(next);
  next = updateJandaPosition(next);
  next = {
    ...next,
    worldNpcs: rebuildWorldNpcs(next),
    dailySummary: {
      dayFinished: finishedDay,
      newDay,
      weather,
      incomeTotal,
      expenseTotal,
      highlights: highlights.length > 0 ? highlights : ['Hari baru yang tenang di gang Kost Texas.'],
      alleyEventTitle,
      alleyEventDesc,
    },
  };

  soundEngine.syncAmbience(next.slot, next.weather);
  return next;
}

// === Main Reducer ===

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_NEW_GAME': {
      const fresh = createInitialState(state.hasPlayedBefore, state.skipOpeningNext);
      if (action.skipOpening) {
        // Quick start skipping opening with default Dua Standar plan
        return gameReducer(
          { ...fresh, screen: 'opening' },
          {
            type: 'COMPLETE_OPENING',
            appearance: fresh.owner,
            plan: 'dua_standar',
            sentPhotoToAdik: true,
          }
        );
      }
      return { ...fresh, screen: 'opening' };
    }

    case 'CONTINUE_GAME': {
      const restored = { ...action.saved, screen: 'playing' as const };
      soundEngine.setMuted(restored.muted);
      soundEngine.syncAmbience(restored.slot, restored.weather);
      return { ...restored, worldNpcs: rebuildWorldNpcs(restored) };
    }

    case 'RESET_GAME': {
      clearSavedState();
      return createInitialState(true, state.skipOpeningNext);
    }

    case 'COMPLETE_OPENING': {
      const { appearance, plan, sentPhotoToAdik } = action;
      const planCost = plan === 'dua_standar' ? 18000000 : 22000000;
      const planTitle =
        plan === 'dua_standar'
          ? 'Bangun Denah Awal: 2 Kamar Standar + Utilitas Dasar'
          : 'Bangun Denah Awal: 1 Kamar Premium KM Dalam + Utilitas Dasar';

      let next: GameState = {
        ...state,
        screen: 'playing',
        hasPlayedBefore: true,
        owner: appearance,
        initialPlan: plan,
        signboardPlaced: true,
        slot: 'siang',
        ownerPos: { x: 7, y: 8, floor: 1 },
      };

      const { state: afterBuildCost } = recordTx(next, {
        account: 'usaha',
        type: 'out',
        category: 'renovasi',
        amount: planCost,
        title: planTitle,
        counterparty: 'Tim Tukang Kang Budi',
      });
      next = afterBuildCost;

      // Mark initial rooms as constructing (1 day!) with starter furniture
      const projects: ActiveProject[] = [];
      const updatedRooms = next.rooms.map((r) => {
        if (plan === 'dua_standar' && (r.id === '101' || r.id === '102')) {
          projects.push({
            id: nextUid('proj'),
            kind: 'room',
            targetId: r.id,
            title: `${r.name} (Standar)`,
            cost: 9000000,
            daysLeft: 1,
            totalDays: 1,
            startedDay: 1,
            scheduleMode: 'normal',
          });
          return {
            ...r,
            status: 'constructing' as const,
            constructionDaysLeft: 1,
            constructionTotalDays: 1,
            furniture: [
              { uid: nextUid('f'), type: 'kasur_standar' as FurnitureType, gx: 0, gy: 0 },
              { uid: nextUid('f'), type: 'meja_kecil' as FurnitureType, gx: 3, gy: 0 },
              { uid: nextUid('f'), type: 'lemari' as FurnitureType, gx: 0, gy: 2 },
              { uid: nextUid('f'), type: 'gorden_biasa' as FurnitureType, gx: 4, gy: 1 },
            ],
          };
        }
        if (plan === 'satu_premium' && r.id === '104') {
          projects.push({
            id: nextUid('proj'),
            kind: 'room',
            targetId: r.id,
            title: `${r.name}`,
            cost: 22000000,
            daysLeft: 1,
            totalDays: 1,
            startedDay: 1,
            scheduleMode: 'normal',
          });
          return {
            ...r,
            status: 'constructing' as const,
            constructionDaysLeft: 1,
            constructionTotalDays: 1,
            furniture: [
              { uid: nextUid('f'), type: 'kasur_queen' as FurnitureType, gx: 0, gy: 0 },
              { uid: nextUid('f'), type: 'meja_besar' as FurnitureType, gx: 3, gy: 0 },
              { uid: nextUid('f'), type: 'lemari' as FurnitureType, gx: 0, gy: 2 },
              { uid: nextUid('f'), type: 'tirai_blackout' as FurnitureType, gx: 4, gy: 1 },
              { uid: nextUid('f'), type: 'ac' as FurnitureType, gx: 4, gy: 2 },
            ],
          };
        }
        return r;
      });

      next = {
        ...next,
        rooms: updatedRooms,
        activeProjects: projects,
        photos: [
          ...next.photos.map((p) =>
            p.id === 'photo_opening_mangga' ? { ...p, sentToAdik: sentPhotoToAdik } : p
          ),
          {
            id: 'photo_papan_kost',
            title: 'Papan KOST TEXAS Terpasang!',
            caption: 'Langkah pertama meneruskan tanah peninggalan orang tua.',
            day: 1,
            category: 'kos',
            sceneKey: 'kos_papan',
          },
        ],
      };

      if (sentPhotoToAdik) {
        next = {
          ...next,
          chats: next.chats.map((c) =>
            c.id === 'chat_raka'
              ? {
                  ...c,
                  unread: 0,
                  messages: c.messages.map((m) =>
                    m.id === 'msg_raka_1'
                      ? { ...m, actions: m.actions?.map((a) => ({ ...a, used: true })) }
                      : m
                  ),
                }
              : c
          ),
        };
        next = pushChatMessage(
          next,
          { npcId: 'raka', npcName: 'Raka (Adik)', roleTag: 'Adik · Kuliah Luar Kota' },
          {
            sender: 'npc',
            senderName: 'Raka',
            text: 'Waaah pohon mangganya masih rimbun banget! Janda juga kelihatan betah di pangkuanmu. Semangat bangun Kost Texas, Kak!',
          }
        );
      }

      // Complete first main mission "Mulai dari Sini" (+Rp100.000 usaha)
      next = completeMission(next, 'main_mulai');
      next = updateRoomStatsFromWorld(next);
      next = updateRoomPrivacyAndLights(next);
      next = updateJandaPosition(next);
      next = { ...next, worldNpcs: rebuildWorldNpcs(next) };
      soundEngine.syncAmbience(next.slot, next.weather);
      return next;
    }

    case 'SET_OWNER_POS': {
      const floor = action.floor ?? state.ownerPos.floor;
      const next: GameState = {
        ...state,
        ownerPos: { x: action.x, y: action.y, floor },
        activeFloor: floor,
      };
      if (state.activeTourApplicantId) {
        return { ...next, worldNpcs: rebuildWorldNpcs(next) };
      }
      return next;
    }

    case 'SET_FLOOR': {
      if (action.floor === 2 && !state.facilities.pondasi_lantai2) {
        return addToast(state, 'Lantai 2 belum dibangun. Cek menu Properti → Fasilitas.', 'warning');
      }
      if (action.floor === 3 && !state.facilities.lantai3_lounge) {
        return addToast(state, 'Lantai 3 belum dibangun. Cek menu Properti → Ekspansi.', 'warning');
      }
      const next: GameState = {
        ...state,
        activeFloor: action.floor,
        ownerPos: {
          x: action.floor === 1 ? 12.5 : 12.5,
          y: 5,
          floor: action.floor,
        },
      };
      return { ...next, worldNpcs: rebuildWorldNpcs(next) };
    }

    case 'TOGGLE_CUTAWAY':
      return { ...state, cutaway: !state.cutaway };

    case 'TOGGLE_MUTE': {
      const muted = !state.muted;
      soundEngine.setMuted(muted);
      return { ...state, muted };
    }

    case 'TOGGLE_REDUCED_MOTION':
      return { ...state, reducedMotion: !state.reducedMotion };

    case 'TOGGLE_SKIP_OPENING_NEXT':
      return { ...state, skipOpeningNext: !state.skipOpeningNext };

    case 'SET_PHONE_OPEN': {
      const nextChats =
        action.chatThreadId
          ? state.chats.map((c) => (c.id === action.chatThreadId ? { ...c, unread: 0 } : c))
          : state.chats;
      return {
        ...state,
        phoneOpen: action.open,
        activePhoneApp: action.app ?? state.activePhoneApp,
        activeChatThreadId: action.chatThreadId !== undefined ? action.chatThreadId : state.activeChatThreadId,
        chats: nextChats,
      };
    }

    case 'OPEN_MODAL':
      return { ...state, activeModal: action.modal };

    case 'DISMISS_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };

    case 'DISMISS_DAILY_SUMMARY':
      return { ...state, dailySummary: null };

    case 'CLOSE_DAY30_REPORT':
      return { ...state, day30ReportOpen: false };

    case 'PIN_MISSION':
      return { ...state, pinnedMissionId: action.missionId };

    case 'ADVANCE_SLOT': {
      const steps = action.slots ?? 1;
      const currIdx = SLOT_ORDER.indexOf(state.slot);
      if (currIdx + steps >= SLOT_ORDER.length) {
        // Reaching past malam transitions cleanly via unified advanceDay!
        return advanceDayPipeline(state);
      }
      const nextSlot = SLOT_ORDER[currIdx + steps];
      let next: GameState = {
        ...state,
        slot: nextSlot,
        powerOutageActive: state.powerOutageActive && nextSlot === 'sore',
      };

      // Deliver any delayed bank transfers scheduled for this slot!
      for (const claim of next.transferClaims) {
        if (
          claim.actualScenario === 'delayed' &&
          !claim.actualMutationId &&
          claim.actualArrivesOnSlot &&
          claim.actualArrivesOnSlot.day === next.day &&
          SLOT_ORDER.indexOf(nextSlot) >= SLOT_ORDER.indexOf(claim.actualArrivesOnSlot.slot)
        ) {
          const res = recordTx(next, {
            account: 'usaha',
            type: 'in',
            category: 'rental',
            amount: claim.expectedAmount,
            title: `Transfer Tertunda Masuk (${claim.customerName})`,
            counterparty: claim.customerName,
            referenceCode: claim.claimedRef,
          });
          next = {
            ...res.state,
            transferClaims: res.state.transferClaims.map((c) =>
              c.id === claim.id ? { ...c, actualMutationId: res.tx.id, note: 'Dana transfer tertunda akhirnya masuk di mutasi Bank!' } : c
            ),
          };
          next = addToast(next, `Mutasi masuk: Transfer tertunda ${claim.customerName} (+${formatRp(claim.expectedAmount)})`, 'money');
        }
      }

      // First night Kos Bebas cue when entering Malam with an active tenant!
      if (nextSlot === 'malam' && next.contracts.some((c) => c.status === 'active') && !next.firstNightGuestsGreeted) {
        next = addToast(
          next,
          'Malam di Kost Texas: Penghuni pulang bersama pasangannya! Sapa mereka di teras atau lanjut tidur.',
          'info'
        );
      }

      next = updateRoomPrivacyAndLights(next);
      next = updateJandaPosition(next);
      next = { ...next, worldNpcs: rebuildWorldNpcs(next) };
      soundEngine.syncAmbience(next.slot, next.weather);
      return next;
    }

    case 'ADVANCE_DAY': {
      // Atomic guard: ignore duplicate rapid clicks targeting an already-finished day!
      if (action.expectedDay !== state.day) {
        return state;
      }
      return advanceDayPipeline(state);
    }

    case 'GREET_FIRST_NIGHT_GUESTS': {
      let next: GameState = {
        ...state,
        firstNightGuestsGreeted: true,
        missions: state.missions.map((m) =>
          m.id === 'main_malam_pertama' && m.progress < 1
            ? { ...m, progress: 1, nextStep: 'Tutup malam pertama dengan memilih Tidur / Lanjut Hari.' }
            : m
        ),
      };
      next = addToast(
        next,
        'Kamu menyapa ramah penghuni & pasangannya di teras. Mereka merasa nyaman dengan privasi kos bebas Kost Texas!',
        'success'
      );
      return { ...next, worldNpcs: rebuildWorldNpcs(next) };
    }

    case 'EQUIP_OR_BUY_OUTFIT': {
      const outfit = OUTFITS.find((o) => o.id === action.outfitId);
      if (!outfit) return state;
      if (state.owner.unlockedOutfits.includes(outfit.id)) {
        return addToast(
          { ...state, owner: { ...state.owner, outfitId: outfit.id } },
          `Ganti outfit ke "${outfit.name}"!`,
          'success'
        );
      }
      if (state.personalBalance < outfit.price) {
        return addToast(state, `Saldo pribadi kurang (${formatRp(outfit.price)} dibutuhkan). Transfer dulu di Bank!`, 'warning');
      }
      const { state: paid } = recordTx(state, {
        account: 'pribadi',
        type: 'out',
        category: 'pribadi',
        amount: outfit.price,
        title: `Beli Outfit: ${outfit.name}`,
        counterparty: 'Butik Gang',
      });
      return addToast(
        {
          ...paid,
          owner: {
            ...paid.owner,
            outfitId: outfit.id,
            unlockedOutfits: [...paid.owner.unlockedOutfits, outfit.id],
          },
        },
        `Berhasil beli & pakai "${outfit.name}"!`,
        'success'
      );
    }

    case 'OWNER_EAT': {
      if (state.personalBalance < 22000) {
        return addToast(state, 'Saldo pribadi kurang untuk makan (Rp22.000).', 'warning');
      }
      const { state: paid } = recordTx(state, {
        account: 'pribadi',
        type: 'out',
        category: 'pribadi',
        amount: 22000,
        title: 'Makan Hangat Owner',
        counterparty: 'Warung Gang',
      });
      return addToast(
        { ...paid, ownerEnergy: 100, ateToday: true },
        'Makan enak! Energi owner kembali penuh 100%.',
        'success'
      );
    }

    case 'START_FACILITY_PROJECT': {
      const fac = FACILITIES.find((f) => f.id === action.facilityId);
      if (!fac) return state;
      if (state.facilities[fac.id]) return addToast(state, 'Fasilitas ini sudah terpasang.', 'info');
      if (state.activeProjects.some((p) => p.kind === 'facility' && p.targetId === fac.id)) {
        return addToast(state, 'Proyek fasilitas ini sedang dikerjakan.', 'info');
      }
      for (const req of fac.prereqs) {
        if (!state.facilities[req]) {
          const reqDef = FACILITIES.find((x) => x.id === req);
          return addToast(state, `Prasyarat belum terpenuhi: bangun "${reqDef?.name ?? req}" terlebih dahulu.`, 'warning');
        }
      }
      if (state.businessBalance < fac.cost) {
        return addToast(state, `Saldo rekening usaha kurang (${formatRp(fac.cost)} dibutuhkan).`, 'warning');
      }
      const { state: paid } = recordTx(state, {
        account: 'usaha',
        type: 'out',
        category: 'renovasi',
        amount: fac.cost,
        title: `Proyek Fasilitas: ${fac.name}`,
        counterparty: 'Tim Tukang Kang Budi',
      });
      const proj: ActiveProject = {
        id: nextUid('proj'),
        kind: 'facility',
        targetId: fac.id,
        title: fac.name,
        cost: fac.cost,
        daysLeft: fac.days,
        totalDays: fac.days,
        startedDay: state.day,
        scheduleMode: 'normal',
      };
      const next: GameState = {
        ...paid,
        activeProjects: [...paid.activeProjects, proj],
        calendar: [
          ...paid.calendar,
          {
            id: nextUid('cal'),
            day: state.day + fac.days,
            title: `Selesai: ${fac.name}`,
            category: 'proyek',
            description: fac.effect,
          },
        ],
      };
      return addToast(
        { ...next, worldNpcs: rebuildWorldNpcs(next) },
        `Proyek "${fac.name}" dimulai (${fac.days} hari)!`,
        'success'
      );
    }

    case 'START_ROOM_BUILD': {
      const room = state.rooms.find((r) => r.id === action.roomId);
      const spec = ROOM_BUILD_COSTS[action.roomId];
      if (!room || !spec || room.status !== 'locked') return state;
      if (spec.prereq && !state.facilities[spec.prereq]) {
        return addToast(state, 'Bangun struktur lantai terlebih dahulu di tab Fasilitas.', 'warning');
      }
      if (state.businessBalance < spec.cost) {
        return addToast(state, `Saldo usaha kurang (${formatRp(spec.cost)} dibutuhkan).`, 'warning');
      }
      const { state: paid } = recordTx(state, {
        account: 'usaha',
        type: 'out',
        category: 'renovasi',
        amount: spec.cost,
        title: `Bangun ${room.name}`,
        counterparty: 'Tim Tukang Kang Budi',
      });
      const starterFurn: PlacedFurniture[] =
        spec.tier === 'premium'
          ? [
              { uid: nextUid('f'), type: 'kasur_queen', gx: 0, gy: 0 },
              { uid: nextUid('f'), type: 'meja_besar', gx: 3, gy: 0 },
              { uid: nextUid('f'), type: 'lemari', gx: 0, gy: 2 },
              { uid: nextUid('f'), type: 'tirai_blackout', gx: 4, gy: 1 },
            ]
          : [
              { uid: nextUid('f'), type: 'kasur_standar', gx: 0, gy: 0 },
              { uid: nextUid('f'), type: 'meja_kecil', gx: 3, gy: 0 },
              { uid: nextUid('f'), type: 'lemari', gx: 0, gy: 2 },
            ];
      const proj: ActiveProject = {
        id: nextUid('proj'),
        kind: 'room',
        targetId: room.id,
        title: room.name,
        cost: spec.cost,
        daysLeft: spec.days,
        totalDays: spec.days,
        startedDay: state.day,
        scheduleMode: 'normal',
      };
      const next: GameState = {
        ...paid,
        rooms: paid.rooms.map((r) =>
          r.id === room.id
            ? {
                ...r,
                status: 'constructing',
                constructionDaysLeft: spec.days,
                constructionTotalDays: spec.days,
                furniture: starterFurn,
              }
            : r
        ),
        activeProjects: [...paid.activeProjects, proj],
      };
      return addToast(
        { ...next, worldNpcs: rebuildWorldNpcs(next) },
        `Pembangunan ${room.name} dimulai (${spec.days} hari)!`,
        'success'
      );
    }

    case 'UPDATE_ROOM_AD': {
      const next: GameState = {
        ...state,
        rooms: state.rooms.map((r) =>
          r.id === action.roomId
            ? { ...r, listedRent: action.listedRent, adActive: action.adActive, adNote: action.adNote }
            : r
        ),
      };
      return addToast(spawnApplicantsForVacantRooms(next), `Iklan & harga Kamar ${action.roomId} diperbarui.`, 'success');
    }

    case 'SAVE_ROOM_FURNITURE': {
      const room = state.rooms.find((r) => r.id === action.roomId);
      if (!room) return state;
      if (action.totalCost > 0 && state.businessBalance < action.totalCost) {
        return addToast(state, `Saldo usaha kurang (${formatRp(action.totalCost)}).`, 'warning');
      }
      let next = state;
      if (action.totalCost > 0) {
        const res = recordTx(next, {
          account: 'usaha',
          type: 'out',
          category: 'renovasi',
          amount: action.totalCost,
          title: `Perabot & Renovasi ${room.name}`,
          counterparty: 'Toko Furnitur Gang',
        });
        next = res.state;
      }
      const rentBonus = action.furniture.reduce((sum, f) => sum + (FURNITURE_CATALOG[f.type]?.rentBonus ?? 0), 0);
      const suggestedRent = room.baseRent + Math.round(rentBonus * 0.65);

      next = {
        ...next,
        rooms: next.rooms.map((r) =>
          r.id === room.id
            ? {
                ...r,
                furniture: action.furniture,
                listedRent: r.status === 'vacant' ? Math.max(r.listedRent, suggestedRent) : r.listedRent,
                renovationNote: action.scheduleWithTenant ? 'Jadwal pemasangan disepakati dengan penghuni' : undefined,
              }
            : r
        ),
        activeModal: null,
      };
      next = updateRoomStatsFromWorld(next);
      return addToast(next, `Tata ruang ${room.name} tersimpan! Nilai & kenyamanan kamar meningkat.`, 'success');
    }

    case 'RESOLVE_ISSUE': {
      const issue = state.issues.find((i) => i.id === action.issueId);
      if (!issue || issue.resolved) return state;

      const tukangPartner = state.partnerships.some((p) => p.id === 'partner_tukang' && p.active);
      const fullCost = tukangPartner ? Math.round(issue.fullFixCost * 0.8) : issue.fullFixCost;

      if (action.mode === 'inspect') {
        return addToast(
          {
            ...state,
            issues: state.issues.map((i) => (i.id === issue.id ? { ...i, inspected: true } : i)),
          },
          `Inspeksi selesai! Penyebab: ${issue.rootCause}`,
          'info'
        );
      }

      const cost = action.mode === 'temp' ? issue.tempFixCost : fullCost;
      if (state.businessBalance < cost) {
        return addToast(state, `Saldo usaha tidak cukup (${formatRp(cost)} dibutuhkan).`, 'warning');
      }

      const { state: paid } = recordTx(state, {
        account: 'usaha',
        type: 'out',
        category: 'renovasi',
        amount: cost,
        title: `${action.mode === 'temp' ? 'Perbaikan Sementara' : 'Perbaikan Penuh'}: ${issue.title}`,
        counterparty: 'Tim Tukang / Teknisi',
      });

      let next: GameState = {
        ...paid,
        reputation: Math.min(5, Number((paid.reputation + (action.mode === 'full' ? 0.15 : 0.05)).toFixed(2))),
        issues: paid.issues.map((i) =>
          i.id === issue.id
            ? { ...i, inspected: true, resolved: true, tempFixUsed: action.mode === 'temp', promiseKept: true }
            : i
        ),
        promises: paid.promises.map((p) =>
          p.relatedIssueId === issue.id ? { ...p, status: 'kept' } : p
        ),
        chats: paid.chats.map((c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.actions
              ? {
                  ...m,
                  actions: m.actions.map((a) =>
                    a.actionType === 'PROMISE_INSPECT_ISSUE' && a.payload?.issueId === issue.id
                      ? { ...a, used: true }
                      : a
                  ),
                }
              : m
          ),
        })),
      };

      // Complete main mission "Chat yang Perlu Dibalas"
      const mChat = next.missions.find((m) => m.id === 'main_chat_dibalas');
      if (mChat && !mChat.claimed) {
        next = {
          ...next,
          missions: next.missions.map((m) => (m.id === 'main_chat_dibalas' ? { ...m, status: 'active' } : m)),
        };
        next = completeMission(next, 'main_chat_dibalas');
      }
      return addToast(
        next,
        `${issue.title} berhasil ditangani (${action.mode === 'full' ? 'perbaikan permanen' : 'perbaikan sementara'})!`,
        'success'
      );
    }

    case 'START_ROOM_TOUR': {
      const app = state.applicants.find((a) => a.id === action.applicantId);
      if (!app) return state;
      const room = state.rooms.find((r) => r.id === app.targetRoomId);
      if (!room || room.status !== 'vacant') {
        return addToast(state, 'Kamar tujuan sedang tidak kosong.', 'warning');
      }
      const next: GameState = {
        ...state,
        activeTourApplicantId: app.id,
        activeFloor: room.floor,
        ownerPos: { x: room.doorX, y: room.doorY + 1, floor: room.floor },
        phoneOpen: false,
        applicants: state.applicants.map((a) => (a.id === app.id ? { ...a, status: 'touring' } : a)),
      };
      return addToast(
        { ...next, worldNpcs: rebuildWorldNpcs(next) },
        `Tur kamar dimulai! Ajak pelamar lihat ${room.name}, lalu klik pintu kamar atau selesai tur.`,
        'info'
      );
    }

    case 'COMPLETE_ROOM_TOUR': {
      const app = state.applicants.find((a) => a.id === action.applicantId);
      if (!app) return state;
      const prof = state.tenants[app.tenantId];
      let next: GameState = {
        ...state,
        activeTourApplicantId: null,
        applicants: state.applicants.map((a) => (a.id === app.id ? { ...a, toured: true, status: 'pending' } : a)),
        missions: state.missions.map((m) =>
          m.id === 'main_kamar_pertama' && m.progress < 2
            ? { ...m, progress: 2, nextStep: `Buat kontrak & check-in untuk ${prof?.name ?? 'pelamar'} di Properti.` }
            : m
        ),
      };
      next = addToast(
        { ...next, worldNpcs: rebuildWorldNpcs(next) },
        `${prof?.name} puas dengan tur kamar & siap tanda tangan kontrak!`,
        'success'
      );
      return next;
    }

    case 'ACCEPT_APPLICANT': {
      const app = state.applicants.find((a) => a.id === action.applicantId);
      if (!app) return state;
      const room = state.rooms.find((r) => r.id === app.targetRoomId);
      const prof = state.tenants[app.tenantId];
      if (!room || !prof || room.status !== 'vacant') {
        return addToast(state, 'Kamar sudah ditempati atau sedang direnovasi.', 'warning');
      }

      const deposit = Math.round(app.offeredRent * 0.5);
      const firstRent = app.offeredRent;
      const contractId = nextUid('ctr');

      // Record first month rent to business balance
      let { state: next } = recordTx(state, {
        account: 'usaha',
        type: 'in',
        category: 'sewa',
        amount: firstRent,
        title: `Sewa Bulan Pertama ${room.name} (${prof.name})`,
        counterparty: prof.name,
      });

      // Deposit held in escrow (tracked separately!)
      const depTx: Transaction = {
        id: nextUid('tx'),
        day: next.day,
        slot: next.slot,
        account: 'usaha',
        type: 'in',
        category: 'deposit',
        amount: deposit,
        beforeBalance: next.businessBalance,
        afterBalance: next.businessBalance, // Escrow separate from usable business cash!
        title: `Dana Titipan Deposit ${room.name} (${prof.name})`,
        counterparty: prof.name,
        referenceCode: `DEP-${next.day}${Math.floor(100 + Math.random() * 899)}`,
      };

      next = {
        ...next,
        depositEscrow: next.depositEscrow + deposit,
        transactions: [depTx, ...next.transactions],
        activeTourApplicantId: next.activeTourApplicantId === app.id ? null : next.activeTourApplicantId,
        rooms: next.rooms.map((r) =>
          r.id === room.id
            ? { ...r, status: 'occupied', tenantId: prof.id, adActive: false }
            : r
        ),
        contracts: [
          ...next.contracts,
          {
            id: contractId,
            tenantId: prof.id,
            roomId: room.id,
            monthlyRent: firstRent,
            depositHeld: deposit,
            startDay: next.day,
            nextDueDay: next.day + 30,
            isJointContract: false,
            status: 'active',
            rentPaidThisCycle: true,
            hasInstallment: false,
            monthsStayed: 1,
          },
        ],
        applicants: next.applicants.map((a) =>
          a.id === app.id
            ? { ...a, status: 'accepted' }
            : a.targetRoomId === room.id && a.status === 'pending'
              ? { ...a, status: 'rejected' }
              : a
        ),
        chats: next.chats.map((c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.actions
              ? {
                  ...m,
                  actions: m.actions.map((a) =>
                    a.actionType === 'START_TOUR_FROM_CHAT' && a.payload?.applicantId === app.id
                      ? { ...a, used: true }
                      : a
                  ),
                }
              : m
          ),
        })),
        calendar: [
          ...next.calendar,
          {
            id: nextUid('cal'),
            day: next.day + 30,
            title: `Jatuh Tempo Sewa ${room.name} (${prof.name})`,
            category: 'sewa',
            description: `Tagihan bulanan ${formatRp(firstRent)}`,
          },
        ],
      };

      // Send check-in welcome chat
      next = pushChatMessage(
        next,
        {
          npcId: prof.id,
          npcName: prof.name,
          roleTag: `Penghuni ${room.name}`,
          hairStyle: prof.hairStyle,
          hairColor: prof.hairColor,
          skinTone: prof.skinTone,
          outfitId: prof.outfitDay,
        },
        {
          sender: 'npc',
          senderName: prof.name,
          text: `Yeay makasih Kak! Aku udah beres-beres koper di ${room.name}. Nanti malam ${prof.partnerName ?? 'temanku'} mungkin mampir sekalian bawa makanan ya!`,
        }
      );

      // Complete "Kamar Pertama, Kunci Pertama"!
      const mFirst = next.missions.find((m) => m.id === 'main_kamar_pertama');
      if (mFirst && !mFirst.claimed) {
        next = {
          ...next,
          missions: next.missions.map((m) => (m.id === 'main_kamar_pertama' ? { ...m, status: 'active' } : m)),
        };
        next = completeMission(next, 'main_kamar_pertama');
      }

      next = updateRoomPrivacyAndLights(next);
      next = { ...next, worldNpcs: rebuildWorldNpcs(next) };
      soundEngine.playMoney();
      return addToast(
        next,
        `${prof.name} resmi check-in ke ${room.name}! Sewa +${formatRp(firstRent)} & Deposit titipan ${formatRp(deposit)}.`,
        'money'
      );
    }

    case 'REJECT_APPLICANT':
      return {
        ...state,
        applicants: state.applicants.map((a) => (a.id === action.applicantId ? { ...a, status: 'rejected' } : a)),
      };

    case 'APPROVE_JOINT_CONTRACT': {
      const ctr = state.contracts.find((c) => c.id === action.contractId);
      if (!ctr || ctr.isJointContract) return state;
      const t = state.tenants[ctr.tenantId];
      const partner = t?.partnerName ?? 'Pasangan';
      const bonusRent = 350000;
      const next: GameState = {
        ...state,
        contracts: state.contracts.map((c) =>
          c.id === ctr.id
            ? { ...c, isJointContract: true, coTenantName: partner, monthlyRent: c.monthlyRent + bonusRent }
            : c
        ),
        rooms: state.rooms.map((r) =>
          r.id === ctr.roomId ? { ...r, coTenantName: partner } : r
        ),
      };
      return addToast(
        next,
        `Kontrak Bersama ${t?.name} & ${partner} disetujui! Sewa menjadi ${formatRp(ctr.monthlyRent + bonusRent)}/bln.`,
        'success'
      );
    }

    case 'RENEW_CONTRACT': {
      const ctr = state.contracts.find((c) => c.id === action.contractId);
      if (!ctr) return state;
      const t = state.tenants[ctr.tenantId];
      const { state: paid } = recordTx(state, {
        account: 'usaha',
        type: 'in',
        category: 'sewa',
        amount: ctr.monthlyRent,
        title: `Perpanjangan Sewa Kamar ${ctr.roomId} (${t?.name})`,
        counterparty: t?.name ?? 'Penghuni',
      });
      return addToast(
        {
          ...paid,
          contracts: paid.contracts.map((c) =>
            c.id === ctr.id ? { ...c, nextDueDay: c.nextDueDay + 30, monthsStayed: c.monthsStayed + 1 } : c
          ),
        },
        `Kontrak ${t?.name} diperpanjang 30 hari (+${formatRp(ctr.monthlyRent)})!`,
        'money'
      );
    }

    case 'COMPLETE_CHECKOUT': {
      const ctr = state.contracts.find((c) => c.id === action.contractId);
      if (!ctr || ctr.status !== 'active') return state;
      const t = state.tenants[ctr.tenantId];
      const deduction = Math.min(ctr.depositHeld, Math.max(0, action.damageDeduction));
      const refundToTenant = ctr.depositHeld - deduction;

      let next: GameState = {
        ...state,
        depositEscrow: Math.max(0, state.depositEscrow - ctr.depositHeld),
      };

      if (deduction > 0) {
        const res = recordTx(next, {
          account: 'usaha',
          type: 'in',
          category: 'deposit',
          amount: deduction,
          title: `Potongan Deposit Checkout Kamar ${ctr.roomId} (${action.note || 'Kebersihan/Perbaikan'})`,
          counterparty: t?.name ?? 'Mantan Penghuni',
        });
        next = res.state;
      }

      const refundLog: Transaction = {
        id: nextUid('tx'),
        day: next.day,
        slot: next.slot,
        account: 'usaha',
        type: 'out',
        category: 'refund',
        amount: refundToTenant,
        beforeBalance: next.businessBalance,
        afterBalance: next.businessBalance, // Paid out from escrow
        title: `Pengembalian Deposit Escrow ke ${t?.name ?? 'Penghuni'}`,
        counterparty: t?.name ?? 'Mantan Penghuni',
        referenceCode: `RFD-${next.day}${Math.floor(100 + Math.random() * 899)}`,
      };

      next = {
        ...next,
        transactions: [refundLog, ...next.transactions],
        contracts: next.contracts.map((c) => (c.id === ctr.id ? { ...c, status: 'ended' } : c)),
        rooms: next.rooms.map((r) =>
          r.id === ctr.roomId
            ? { ...r, status: 'vacant', tenantId: null, coTenantName: null, adActive: true, cleanliness: 75 }
            : r
        ),
        activeModal: null,
      };

      next = pushChatMessage(
        next,
        {
          npcId: t?.id ?? 'ex_tenant',
          npcName: t?.name ?? 'Mantan Tenant',
          roleTag: 'Mantan Penghuni',
          hairStyle: t?.hairStyle,
          hairColor: t?.hairColor,
          skinTone: t?.skinTone,
          outfitId: t?.outfitDay,
        },
        {
          sender: 'npc',
          senderName: t?.name ?? 'Penghuni',
          text:
            t?.id === 'naya'
              ? 'Makasih banyak udah jadi owner paling baik, Kak! Aku tinggalin kartu ucapan di meja & udah rekomen Kost Texas ke adik tingkatku Vina ya!'
              : 'Makasih banyak selama ini di Kost Texas, Kak! Kapan-kapan aku mampir jajan di warung & main sama Janda.',
        }
      );

      next = spawnApplicantsForVacantRooms(next);
      next = updateRoomPrivacyAndLights(next);
      return addToast(
        { ...next, worldNpcs: rebuildWorldNpcs(next) },
        `Checkout ${t?.name} selesai! Deposit dikembalikan ${formatRp(refundToTenant)}${deduction > 0 ? `, potongan masuk usaha ${formatRp(deduction)}` : ''}.`,
        'success'
      );
    }

    case 'DELIVER_PACKAGE': {
      const pkg = state.packages.find((p) => p.id === action.packageId && !p.delivered);
      if (!pkg) return state;
      let next: GameState = {
        ...state,
        packages: state.packages.map((p) => (p.id === pkg.id ? { ...p, delivered: true } : p)),
      };
      next = pushChatMessage(
        next,
        { npcId: pkg.recipientTenantId, npcName: pkg.recipientName, roleTag: 'Penghuni' },
        {
          sender: 'npc',
          senderName: pkg.recipientName,
          text: `Makasih banyak Kak udah anterin ${pkg.description}! Untung nggak nyasar jauh.`,
        }
      );
      next = completeMission(next, 'side_paket_nyasar');
      return addToast(next, `Paket untuk ${pkg.recipientName} berhasil diserahkan!`, 'success');
    }

    case 'MARK_CHAT_READ':
      return {
        ...state,
        chats: state.chats.map((c) => (c.id === action.threadId ? { ...c, unread: 0 } : c)),
      };

    case 'EXECUTE_CHAT_ACTION': {
      const { threadId, messageId, action: chatAct } = action;
      if (chatAct.used) return state;

      // Mark button used first
      let next: GameState = {
        ...state,
        chats: state.chats.map((c) =>
          c.id === threadId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === messageId
                    ? { ...m, actions: m.actions?.map((a) => (a.id === chatAct.id ? { ...a, used: true } : a)) }
                    : m
                ),
              }
            : c
        ),
      };

      const thread = next.chats.find((c) => c.id === threadId);
      const replyOwner = (text: string) => {
        if (!thread) return;
        next = pushChatMessage(
          next,
          { npcId: thread.npcId, npcName: thread.npcName, roleTag: thread.roleTag },
          { sender: 'owner', senderName: next.owner.name, text }
        );
      };

      const p = chatAct.payload ?? {};

      if (chatAct.actionType === 'SEND_PHOTO_TO_ADIK') {
        replyOwner('Ini fotonya ya Ka! Pohon mangganya masih rindang, Janda juga langsung nyaman di pangkuan.');
        next = gameReducer(next, { type: 'SEND_PHOTO_TO_ADIK', photoId: String(p.photoId ?? 'photo_opening_mangga') });
      } else if (chatAct.actionType === 'START_TOUR_FROM_CHAT') {
        replyOwner('Boleh banget! Yuk langsung kutunjukin kamarnya sekarang.');
        next = gameReducer(next, { type: 'START_ROOM_TOUR', applicantId: String(p.applicantId) });
      } else if (chatAct.actionType === 'PROMISE_INSPECT_ISSUE') {
        replyOwner('Siap, besok pagi (atau sekarang) aku cek langsung ya!');
        const issueId = String(p.issueId);
        next = {
          ...next,
          promises: [
            ...next.promises,
            {
              id: nextUid('prm'),
              npcId: String(p.npcId),
              npcName: String(p.npcName),
              description: 'Cek & tangani keluhan bangunan',
              dueDay: next.day + 1,
              status: 'open',
              relatedIssueId: issueId,
            },
          ],
          calendar: [
            ...next.calendar,
            {
              id: nextUid('cal'),
              day: next.day,
              title: `Inspeksi Keluhan (${String(p.npcName)})`,
              category: 'janji',
              description: 'Janji dari chat untuk mengecek keluhan kamar.',
            },
          ],
        };
        next = addToast(next, 'Janji inspeksi tercatat di Kalender! Selesaikan perbaikan di aplikasi Properti.', 'info');
      } else if (chatAct.actionType === 'CREATE_INSTALLMENT_AGREEMENT') {
        const total = Number(p.total ?? 400000);
        const paidNow = Number(p.paidNow ?? 200000);
        const tenantName = String(p.tenantName ?? 'Penghuni');
        const tenantId = String(p.tenantId ?? 'naya');
        replyOwner(`Boleh bayar separuh dulu (${formatRp(paidNow)}), sisanya pas gajian ya.`);
        const res = recordTx(next, {
          account: 'usaha',
          type: 'in',
          category: 'cicilan',
          amount: paidNow,
          title: `Cicilan 1/2 (${tenantName})`,
          counterparty: tenantName,
        });
        next = res.state;
        const debt: DebtRecord = {
          id: nextUid('debt'),
          kind: 'cicilan_sewa',
          direction: 'piutang',
          account: 'usaha',
          counterpartyId: tenantId,
          counterpartyName: tenantName,
          title: `Cicilan Tagihan ${tenantName}`,
          initialAmount: total,
          paidAmount: paidNow,
          remainingAmount: total - paidNow,
          promisedDay: next.day + 2,
          reliability: 'butuh_ingat',
          remindedToday: false,
          status: 'partial',
          history: [{ day: next.day, amount: paidNow, note: 'Pembayaran separuh awal disepakati di chat' }],
          relatedContractId: p.contractId ? String(p.contractId) : undefined,
        };
        next = { ...next, debts: [debt, ...next.debts] };
        next = addToast(next, `Kesepakatan cicilan tercatat di Bank! Masuk +${formatRp(paidNow)}.`, 'money');
      } else if (chatAct.actionType === 'TRANSFER_TO_ADIK') {
        const amount = Number(p.amount ?? 0);
        const mode = String(p.mode ?? 'penuh');
        if (amount > 0) {
          if (next.personalBalance < amount) {
            return addToast(state, `Saldo pribadi kurang (${formatRp(amount)}). Transfer dulu dari rekening usaha di Bank!`, 'warning');
          }
          const res = recordTx(next, {
            account: 'pribadi',
            type: 'out',
            category: 'adik',
            amount,
            title: `Transfer Biaya Praktikum Raka (${mode})`,
            counterparty: 'Raka (Adik)',
          });
          next = res.state;
          replyOwner(`Sudah aku transfer ${formatRp(amount)} ya Ka, semangat praktikumnya!`);
          next = pushChatMessage(
            next,
            { npcId: 'raka', npcName: 'Raka (Adik)', roleTag: 'Adik' },
            {
              sender: 'npc',
              senderName: 'Raka',
              text:
                mode === 'penuh'
                  ? 'Makasih banyak Kak!! Sudah masuk rekeningku. Nanti libur aku pulang bawain oleh-oleh!'
                  : 'Makasih Kak bantuannya! Ini udah nutup setengahnya, sisanya aman kok.',
            }
          );
          next = {
            ...next,
            relationships: {
              ...next.relationships,
              raka: {
                ...next.relationships.raka,
                affection: Math.min(100, next.relationships.raka.affection + (mode === 'penuh' ? 12 : 7)),
              },
            },
          };
          next = addToast(next, `Transfer ke Raka berhasil (-${formatRp(amount)} rekening pribadi).`, 'success');
        } else {
          replyOwner('Minggu depan pas kas udah longgar aku kirim ya Ka, catat di kalender dulu.');
          next = {
            ...next,
            calendar: [
              ...next.calendar,
              {
                id: nextUid('cal'),
                day: next.day + 4,
                title: 'Janji Transfer Praktikum Raka',
                category: 'adik',
                description: 'Kirim uang praktikum kuliah Raka Rp350.000.',
              },
            ],
          };
          next = pushChatMessage(
            next,
            { npcId: 'raka', npcName: 'Raka (Adik)', roleTag: 'Adik' },
            { sender: 'npc', senderName: 'Raka', text: 'Siap Kak, tenang aja deadline lab masih minggu depan kok!' }
          );
        }
      } else if (chatAct.actionType === 'BREAKDOWN_FROM_CHAT') {
        const mode = String(p.mode) as 'mekanik' | 'pengganti' | 'jemput_refund';
        const replyMap = {
          mekanik: 'Aku kirim mekanik Mas Eko ke sana sekarang ya, tunggu sebentar!',
          pengganti: 'Aku langsung antar motor pengganti ke kampus sekarang!',
          jemput_refund: 'Aku jemput motornya dan kasih refund sebagian ya, maaf bikin repot.',
        };
        replyOwner(replyMap[mode]);
        next = gameReducer(next, { type: 'RESOLVE_BREAKDOWN', incidentId: String(p.incidentId), mode });
      } else if (chatAct.actionType === 'APPROVE_JOINT_FROM_CHAT') {
        replyOwner('Boleh banget Dimas! Selamat ya buat kamu sama Lina, kontrak bersama langsung aku aktifkan.');
        next = gameReducer(next, { type: 'APPROVE_JOINT_CONTRACT', contractId: String(p.contractId) });
      } else if (chatAct.actionType === 'ACCEPT_RARA_CONSIGNMENT') {
        replyOwner('Gas Rara! Titip 10 porsi dulu di warung ya, bagi hasil 70/30.');
        next = gameReducer(next, { type: 'SET_RARA_CONSIGNMENT', mode: 'accept' });
      } else if (chatAct.actionType === 'CAMPUS_CATERING') {
        const mode = String(p.mode) as 'accept_15' | 'buy_extra' | 'split_neighbor';
        replyOwner('Siap kak panitia, pesanannya langsung aku proses sesuai kesepakatan!');
        next = gameReducer(next, { type: 'HANDLE_CAMPUS_CATERING', mode });
      }

      return next;
    }

    case 'INTERNAL_TRANSFER': {
      const amt = Math.round(action.amount);
      if (amt <= 0 || action.from === action.to) return state;
      const srcBal = action.from === 'usaha' ? state.businessBalance : state.personalBalance;
      if (srcBal < amt) {
        return addToast(state, `Saldo rekening ${action.from} tidak mencukupi.`, 'warning');
      }
      const ref = `INT-${state.day}${Math.floor(100 + Math.random() * 899)}`;
      const outRes = recordTx(state, {
        account: action.from,
        type: 'out',
        category: 'transfer_antar',
        amount: amt,
        title: `Transfer ke Rekening ${action.to === 'usaha' ? 'Usaha' : 'Pribadi'} (${action.note || 'Internal'})`,
        counterparty: `Rekening ${action.to === 'usaha' ? 'Usaha' : 'Pribadi'}`,
        referenceCode: ref,
      });
      const inRes = recordTx(outRes.state, {
        account: action.to,
        type: 'in',
        category: 'transfer_antar',
        amount: amt,
        title: `Terima dari Rekening ${action.from === 'usaha' ? 'Usaha' : 'Pribadi'} (${action.note || 'Internal'})`,
        counterparty: `Rekening ${action.from === 'usaha' ? 'Usaha' : 'Pribadi'}`,
        referenceCode: ref,
      });
      soundEngine.playMoney();
      return addToast(inRes.state, `Transfer internal ${formatRp(amt)} tercatat di kedua rekening!`, 'money');
    }

    case 'COLLECT_OR_REMIND_DEBT': {
      const debt = state.debts.find((d) => d.id === action.debtId);
      if (!debt || debt.status === 'paid') return state;

      if (action.action === 'extend') {
        return addToast(
          {
            ...state,
            debts: state.debts.map((d) =>
              d.id === debt.id ? { ...d, promisedDay: d.promisedDay + 3, remindedToday: true } : d
            ),
          },
          `Tenggat cicilan ${debt.counterpartyName} diperpanjang ke Hari ${debt.promisedDay + 3}.`,
          'info'
        );
      }

      if (action.action === 'remind' || action.action === 'receive_partial') {
        // Simulates customer paying remaining balance when reminded or settling!
        const payNow = action.action === 'receive_partial' ? Math.min(debt.remainingAmount, Math.ceil(debt.remainingAmount / 2)) : debt.remainingAmount;
        const { state: paid } = recordTx(state, {
          account: debt.account,
          type: 'in',
          category: 'cicilan',
          amount: payNow,
          title: `Pelunasan Cicilan: ${debt.title}`,
          counterparty: debt.counterpartyName,
        });
        const newRem = debt.remainingAmount - payNow;
        let next: GameState = {
          ...paid,
          debts: paid.debts.map((d) =>
            d.id === debt.id
              ? {
                  ...d,
                  paidAmount: d.paidAmount + payNow,
                  remainingAmount: newRem,
                  status: newRem <= 0 ? 'paid' : 'partial',
                  remindedToday: true,
                  history: [...d.history, { day: paid.day, amount: payNow, note: newRem <= 0 ? 'Lunas' : 'Cicilan sebagian' }],
                }
              : d
          ),
        };
        soundEngine.playMoney();
        if (newRem <= 0 && debt.kind === 'cicilan_sewa') {
          // Separate ledger entry for mission reward!
          next = completeMission(next, 'side_nunggu_gajian');
        }
        return addToast(
          next,
          `${debt.counterpartyName} membayar ${formatRp(payNow)}${newRem <= 0 ? ' — LUNAS!' : ` (sisa ${formatRp(newRem)})`}`,
          'money'
        );
      }
      return state;
    }

    case 'RESOLVE_TRANSFER_CLAIM': {
      const claim = state.transferClaims.find((c) => c.id === action.claimId);
      if (!claim) return state;
      const booking = state.bookings.find((b) => b.id === claim.bookingId);
      if (!booking) return state;

      if (action.decision === 'hold') {
        return addToast(
          {
            ...state,
            transferClaims: state.transferClaims.map((c) =>
              c.id === claim.id ? { ...c, status: 'menunggu_verifikasi', note: 'Booking ditahan menunggu dana masuk di mutasi.' } : c
            ),
          },
          `Booking ${claim.customerName} ditahan sampai mutasi sesuai.`,
          'info'
        );
      }

      if (action.decision === 'recheck') {
        const isFake = claim.actualScenario === 'fake';
        const replyText = isFake
          ? 'Waduh... maaf Kak ternyata tadi belum kekirim beneran, batal dulu deh ya 🙏'
          : claim.actualScenario === 'underpaid'
            ? 'Oh iya Kak kurang Rp35.000 ya! Ini aku susulin kekurangannya ya.'
            : claim.actualScenario === 'wrong_account'
              ? 'Ya ampun maaf Kak aku malah kirim ke rekening pribadimu! Coba cek mutasi pribadi ya.'
              : 'Siap Kak aku cek ulang m-bankingku, biasanya agak delay sebentar.';

        let next: GameState = {
          ...state,
          transferClaims: state.transferClaims.map((c) =>
            c.id === claim.id
              ? { ...c, status: isFake ? 'ditolak' : 'menunggu_verifikasi', note: isFake ? 'Bukti transfer palsu terdeteksi & booking dibatalkan!' : 'Diminta cek ulang oleh owner.' }
              : c
          ),
          bookings: isFake
            ? state.bookings.map((b) => (b.id === booking.id ? { ...b, status: 'cancelled' } : b))
            : state.bookings,
        };
        next = pushChatMessage(
          next,
          { npcId: `cust_${claim.customerName.split(' ')[0].toLowerCase()}`, npcName: claim.customerName, roleTag: 'Customer Rental' },
          { sender: 'npc', senderName: claim.customerName, text: replyText }
        );
        return addToast(
          next,
          isFake
            ? `Mantap! Bukti transfer palsu ${claim.customerName} berhasil dicegah & booking dibatalkan.`
            : `Pesan cek ulang terkirim ke ${claim.customerName}.`,
          isFake ? 'success' : 'info'
        );
      }

      if (action.decision === 'trust') {
        // Release bike on trust — bike becomes active, invoice stays open as unpaid debt!
        const bike = state.bikes.find((b) => b.id === booking.bikeId);
        if (!bike || bike.status !== 'tersedia') {
          return addToast(state, 'Motor sedang dipakai atau di bengkel — tidak bisa diserahkan.', 'warning');
        }
        const openDebt: DebtRecord = {
          id: nextUid('debt'),
          kind: 'pinjaman_teman',
          direction: 'piutang',
          account: 'usaha',
          counterpartyId: claim.id,
          counterpartyName: claim.customerName,
          title: `Tagihan Rental Terbuka (${claim.customerName})`,
          initialAmount: claim.expectedAmount,
          paidAmount: 0,
          remainingAmount: claim.expectedAmount,
          promisedDay: state.day + 1,
          reliability: claim.actualScenario === 'fake' ? 'minta_tenggat' : 'butuh_ingat',
          remindedToday: false,
          status: 'open',
          history: [],
        };
        return addToast(
          {
            ...state,
            bikes: state.bikes.map((b) => (b.id === bike.id ? { ...b, status: 'dipakai', currentBookingId: booking.id } : b)),
            bookings: state.bookings.map((b) => (b.id === booking.id ? { ...b, status: 'active', releasedOnTrust: true } : b)),
            transferClaims: state.transferClaims.map((c) =>
              c.id === claim.id ? { ...c, status: 'serah_percaya', note: 'Motor diserahkan atas kepercayaan; tagihan masih terbuka di Bank.' } : c
            ),
            debts: [openDebt, ...state.debts],
          },
          `Motor diserahkan ke ${claim.customerName} atas kepercayaan. Tagihan ${formatRp(claim.expectedAmount)} tercatat terbuka!`,
          'warning'
        );
      }

      if (action.decision === 'match' && action.mutationId) {
        const tx = state.transactions.find((t) => t.id === action.mutationId);
        if (!tx || tx.type !== 'in') {
          return addToast(state, 'Mutasi masuk tidak valid.', 'warning');
        }
        if (tx.matchedClaimId) {
          return addToast(state, 'Mutasi ini sudah dipakai untuk pencocokan pembayaran lain!', 'warning');
        }
        const isPartial = tx.amount < claim.expectedAmount;
        const newStatus = isPartial ? 'bayar_sebagian' : 'lunas';

        let next: GameState = {
          ...state,
          transactions: state.transactions.map((t) =>
            t.id === tx.id ? { ...t, matchedClaimId: claim.id } : t
          ),
          transferClaims: state.transferClaims.map((c) =>
            c.id === claim.id
              ? {
                  ...c,
                  status: newStatus,
                  note: isPartial
                    ? `Cocok sebagian (${formatRp(tx.amount)} dari ${formatRp(claim.expectedAmount)}). Sisa dicatat sebagai tagihan.`
                    : `Terverifikasi lunas dengan mutasi ${tx.referenceCode}!`,
                }
              : c
          ),
          bookings: state.bookings.map((b) =>
            b.id === booking.id ? { ...b, paidAmount: b.paidAmount + tx.amount } : b
          ),
        };

        if (isPartial) {
          const diff = claim.expectedAmount - tx.amount;
          next = {
            ...next,
            debts: [
              {
                id: nextUid('debt'),
                kind: 'cicilan_sewa',
                direction: 'piutang',
                account: 'usaha',
                counterpartyId: claim.id,
                counterpartyName: claim.customerName,
                title: `Kekurangan Bayar Rental (${claim.customerName})`,
                initialAmount: claim.expectedAmount,
                paidAmount: tx.amount,
                remainingAmount: diff,
                promisedDay: next.day + 1,
                reliability: 'butuh_ingat',
                remindedToday: false,
                status: 'partial',
                history: [{ day: next.day, amount: tx.amount, note: 'Pembayaran awal terverifikasi' }],
              },
              ...next.debts,
            ],
          };
        }

        return addToast(
          next,
          isPartial
            ? `Pencocokan selesai: Bayar Sebagian (${formatRp(tx.amount)}). Sisa dicatat di Piutang.`
            : `Pembayaran ${claim.customerName} LUNAS terverifikasi! Lanjut inspeksi & serah terima di aplikasi Rental.`,
          'success'
        );
      }
      return state;
    }

    case 'BUY_MOTORBIKE': {
      const model = MOTORBIKE_MARKET[action.marketIndex];
      if (!model) return state;
      if (state.bikes.some((b) => b.plate === model.plate)) {
        return addToast(state, 'Unit motor ini sudah dimiliki.', 'info');
      }
      if (state.businessBalance < model.purchasePrice) {
        return addToast(state, `Saldo usaha kurang (${formatRp(model.purchasePrice)} dibutuhkan).`, 'warning');
      }
      const { state: paid } = recordTx(state, {
        account: 'usaha',
        type: 'out',
        category: 'rental',
        amount: model.purchasePrice,
        title: `Beli Armada Rental: ${model.name}`,
        counterparty: 'Showroom Motor Bekas',
      });
      const newBike = {
        ...model,
        id: nextUid('bike'),
        odometer: 14200 + action.marketIndex * 3100,
        tireHealth: action.marketIndex === 0 ? 78 : 92,
        bodyHealth: action.marketIndex === 0 ? 85 : 95,
        batteryHealth: action.marketIndex === 0 ? 74 : 94,
        status: 'tersedia' as const,
      };
      let next: GameState = {
        ...paid,
        rentalUnlocked: true,
        bikes: [...paid.bikes, newBike],
      };

      // Also create an immediate first rental booking so player can immediately try the rental cycle!
      if (next.bikes.length === 1) {
        const bkId = nextUid('bk');
        const clmId = nextUid('clm');
        const ref = `TRF-${next.day}8821`;
        const total = newBike.dailyRate * 2;
        const txRes = recordTx(next, {
          account: 'usaha',
          type: 'in',
          category: 'rental',
          amount: total,
          title: 'Transfer Masuk Sewa Motor (Dimas / Kampus)',
          counterparty: 'Andi (Mhs Teknik)',
          referenceCode: ref,
        });
        next = txRes.state;
        next = {
          ...next,
          bookings: [
            ...next.bookings,
            {
              id: bkId,
              bikeId: newBike.id,
              customerName: 'Andi (Mhs Teknik)',
              rateType: 'harian',
              startDay: next.day,
              endDay: next.day + 2,
              totalPrice: total,
              deposit: 100000,
              paidAmount: 0,
              status: 'pending',
              handoverInspected: false,
              returnInspected: false,
              claimId: clmId,
            },
          ],
          transferClaims: [
            {
              id: clmId,
              bookingId: bkId,
              customerName: 'Andi (Mhs Teknik)',
              expectedAmount: total,
              claimedAmount: total,
              claimedRef: ref,
              claimedAccount: 'usaha',
              actualScenario: 'valid',
              actualMutationId: txRes.tx.id,
              status: 'menunggu_verifikasi',
              dayCreated: next.day,
              note: 'Booking pertama! Cocokkan di Bank lalu lakukan inspeksi motor.',
            },
            ...next.transferClaims,
          ],
        };
      }

      // Complete "Usaha Berikutnya" main mission!
      const mUsaha = next.missions.find((m) => m.id === 'main_usaha_berikutnya');
      if (mUsaha && !mUsaha.claimed) {
        next = {
          ...next,
          missions: next.missions.map((m) => (m.id === 'main_usaha_berikutnya' ? { ...m, status: 'active' } : m)),
        };
        next = completeMission(next, 'main_usaha_berikutnya');
      }
      return addToast(next, `${model.name} siap beroperasi di parkiran Kost Texas!`, 'success');
    }

    case 'COMPLETE_BIKE_INSPECTION': {
      const { bikeId, bookingId, inspection, scratchFee = 0 } = action;
      let next: GameState = {
        ...state,
        bikes: state.bikes.map((b) => (b.id === bikeId ? { ...b, lastInspection: inspection } : b)),
        activeModal: null,
      };
      if (bookingId && inspection.kind === 'awal') {
        next = {
          ...next,
          bookings: next.bookings.map((bk) => (bk.id === bookingId ? { ...bk, handoverInspected: true } : bk)),
        };
        return addToast(next, 'Inspeksi awal motor tersimpan! Siap serah terima kunci.', 'success');
      }
      if (bookingId && inspection.kind === 'akhir') {
        return gameReducer(next, {
          type: 'RETURN_RENTAL_BIKE',
          bookingId,
          scratchDetected: !inspection.bodyOk,
          damageFee: scratchFee,
        });
      }
      return addToast(next, 'Catatan inspeksi motor berhasil disimpan.', 'success');
    }

    case 'APPROVE_RENTAL_BOOKING': {
      const booking = state.bookings.find((b) => b.id === action.bookingId);
      if (!booking || booking.status !== 'pending') return state;
      const bike = state.bikes.find((b) => b.id === booking.bikeId);
      if (!bike) return state;

      // Conflict prevention!
      if (bike.status !== 'tersedia') {
        return addToast(
          state,
          `Bentrok jadwal! ${bike.name} sedang "${bike.status}" dan tidak bisa dialokasikan.`,
          'warning'
        );
      }
      const overlapping = state.bookings.some(
        (b) =>
          b.id !== booking.id &&
          b.bikeId === bike.id &&
          b.status === 'active' &&
          b.startDay <= booking.endDay &&
          b.endDay >= booking.startDay
      );
      if (overlapping) {
        return addToast(state, 'Jadwal booking bentrok dengan penyewaan aktif lain!', 'warning');
      }

      return addToast(
        {
          ...state,
          bikes: state.bikes.map((b) => (b.id === bike.id ? { ...b, status: 'dipakai', currentBookingId: booking.id } : b)),
          bookings: state.bookings.map((b) => (b.id === booking.id ? { ...b, status: 'active' } : b)),
        },
        `Serah terima ${bike.name} ke ${booking.customerName} selesai!`,
        'success'
      );
    }

    case 'RETURN_RENTAL_BIKE': {
      const booking = state.bookings.find((b) => b.id === action.bookingId);
      if (!booking || booking.status !== 'active') return state;
      let next = state;
      if (action.scratchDetected && action.damageFee > 0) {
        const res = recordTx(next, {
          account: 'usaha',
          type: 'in',
          category: 'rental',
          amount: action.damageFee,
          title: `Biaya Lecet Bodi Motor (${booking.customerName})`,
          counterparty: booking.customerName,
        });
        next = res.state;
      }
      next = {
        ...next,
        bikes: next.bikes.map((b) =>
          b.id === booking.bikeId
            ? {
                ...b,
                status: 'tersedia',
                currentBookingId: undefined,
                odometer: b.odometer + 85,
                tireHealth: Math.max(30, b.tireHealth - 10),
                batteryHealth: Math.max(30, b.batteryHealth - 8),
                bodyHealth: action.scratchDetected ? Math.max(50, b.bodyHealth - 12) : b.bodyHealth,
              }
            : b
        ),
        bookings: next.bookings.map((b) =>
          b.id === booking.id
            ? { ...b, status: 'returned', returnInspected: true, scratchDetected: action.scratchDetected }
            : b
        ),
      };
      return addToast(
        next,
        `Pengembalian motor dari ${booking.customerName} selesai!${action.damageFee > 0 ? ` Ganti rugi lecet +${formatRp(action.damageFee)}.` : ''}`,
        'success'
      );
    }

    case 'SERVICE_BIKE': {
      const bike = state.bikes.find((b) => b.id === action.bikeId);
      if (!bike) return state;
      if (bike.status === 'dipakai') {
        return addToast(state, 'Motor masih dipakai penyewa, tunggu kembali dulu.', 'warning');
      }
      const partner = state.partnerships.some((p) => p.id === 'partner_bengkel' && p.active);
      const baseCost = action.serviceType === 'ekspres' ? 195000 : 120000;
      const cost = partner ? Math.round(baseCost * 0.75) : baseCost;
      if (state.businessBalance < cost) {
        return addToast(state, `Saldo usaha kurang (${formatRp(cost)}).`, 'warning');
      }
      const { state: paid } = recordTx(state, {
        account: 'usaha',
        type: 'out',
        category: 'servis',
        amount: cost,
        title: `Servis ${action.serviceType === 'ekspres' ? 'Ekspres' : 'Reguler'} ${bike.name}`,
        counterparty: 'Bengkel Mas Eko',
      });
      const doneToday = action.serviceType === 'ekspres';
      const next: GameState = {
        ...paid,
        bikes: paid.bikes.map((b) =>
          b.id === bike.id
            ? {
                ...b,
                status: doneToday ? 'tersedia' : 'bengkel',
                tireHealth: doneToday ? 100 : b.tireHealth,
                bodyHealth: doneToday ? 100 : b.bodyHealth,
                batteryHealth: doneToday ? 100 : b.batteryHealth,
                serviceDoneDay: doneToday ? undefined : paid.day + 1,
                serviceType: action.serviceType,
              }
            : b
        ),
        calendar: [
          ...paid.calendar,
          {
            id: nextUid('cal'),
            day: doneToday ? paid.day : paid.day + 1,
            title: `Servis Selesai: ${bike.name}`,
            category: 'serah_terima',
            description: `Bengkel Mas Eko (${action.serviceType})`,
          },
        ],
      };
      return addToast(
        next,
        doneToday
          ? `Servis Ekspres selesai hari ini! ${bike.name} kembali prima 100%.`
          : `${bike.name} masuk Bengkel Mas Eko (antrean reguler, selesai besok).`,
        'success'
      );
    }

    case 'RESOLVE_BREAKDOWN': {
      const inc = state.breakdowns.find((i) => i.id === action.incidentId && !i.resolved);
      if (!inc) return state;
      const partner = state.partnerships.some((p) => p.id === 'partner_bengkel' && p.active);

      let next = state;
      if (action.mode === 'mekanik') {
        const cost = partner ? 70000 : 95000;
        if (next.businessBalance < cost) return addToast(state, `Saldo usaha kurang (${formatRp(cost)}).`, 'warning');
        const res = recordTx(next, {
          account: 'usaha',
          type: 'out',
          category: 'servis',
          amount: cost,
          title: `Mekanik Darurat (${inc.location})`,
          counterparty: 'Bengkel Mas Eko',
        });
        next = {
          ...res.state,
          bikes: res.state.bikes.map((b) =>
            b.id === inc.bikeId ? { ...b, status: 'dipakai', batteryHealth: 95, tireHealth: 95 } : b
          ),
          breakdowns: res.state.breakdowns.map((i) =>
            i.id === inc.id ? { ...i, resolved: true, resolution: 'Mekanik Mas Eko memperbaiki langsung di lokasi.' } : i
          ),
        };
        return addToast(next, `Mekanik dikirim! ${inc.customerName} bisa lanjut ke kampus tepat waktu.`, 'success');
      }

      if (action.mode === 'pengganti') {
        const spare = next.bikes.find((b) => b.id !== inc.bikeId && b.status === 'tersedia');
        if (!spare) {
          return addToast(state, 'Tidak ada unit pengganti yang tersedia. Pilih kirim mekanik atau jemput + refund.', 'warning');
        }
        next = {
          ...next,
          bikes: next.bikes.map((b) =>
            b.id === inc.bikeId
              ? { ...b, status: 'bengkel', serviceDoneDay: next.day + 1 }
              : b.id === spare.id
                ? { ...b, status: 'dipakai', currentBookingId: inc.bookingId }
                : b
          ),
          bookings: next.bookings.map((bk) => (bk.id === inc.bookingId ? { ...bk, bikeId: spare.id } : bk)),
          breakdowns: next.breakdowns.map((i) =>
            i.id === inc.id ? { ...i, resolved: true, resolution: `Unit pengganti ${spare.name} diantar owner.` } : i
          ),
        };
        return addToast(gameReducer(next, { type: 'ADVANCE_SLOT', slots: 1 }), `Unit pengganti ${spare.name} diantar! Motor lama masuk bengkel.`, 'success');
      }

      // jemput_refund
      const refund = 40000;
      const res = recordTx(next, {
        account: 'usaha',
        type: 'out',
        category: 'refund',
        amount: refund,
        title: `Refund Sebagian Insiden Mogok (${inc.customerName})`,
        counterparty: inc.customerName,
      });
      next = {
        ...res.state,
        bikes: res.state.bikes.map((b) =>
          b.id === inc.bikeId ? { ...b, status: 'bengkel', currentBookingId: undefined, serviceDoneDay: next.day + 1 } : b
        ),
        bookings: res.state.bookings.map((bk) => (bk.id === inc.bookingId ? { ...bk, status: 'returned' } : bk)),
        breakdowns: res.state.breakdowns.map((i) =>
          i.id === inc.id ? { ...i, resolved: true, resolution: `Motor dijemput & refund ${formatRp(refund)}.` } : i
        ),
      };
      return addToast(next, `Motor dijemput ke bengkel & refund ${formatRp(refund)} tercatat di Bank.`, 'info');
    }

    case 'UNLOCK_WARUNG': {
      const cost = 3500000;
      if (state.warung.unlocked) return state;
      if (state.businessBalance < cost) {
        return addToast(state, `Saldo usaha kurang (${formatRp(cost)} untuk buka Warung Gang).`, 'warning');
      }
      const { state: paid } = recordTx(state, {
        account: 'usaha',
        type: 'out',
        category: 'warung',
        amount: cost,
        title: 'Buka Usaha Warung Gang Kost Texas',
        counterparty: 'Perlengkapan Warung',
      });
      let next: GameState = {
        ...paid,
        warung: {
          ...paid.warung,
          unlocked: true,
          isOpenToday: true,
          dailyOrders: [
            { id: nextUid('ord'), customerName: 'Sinta (Penghuni)', itemId: 'nasi_goreng', qty: 2, isRush: true, status: 'pending', reward: 34000 },
            { id: nextUid('ord'), customerName: 'Tamu Gang', itemId: 'kopi_susu', qty: 3, isRush: true, status: 'pending', reward: 42000 },
            { id: nextUid('ord'), customerName: 'Mahasiswa Kampus', itemId: 'ayam_geprek', qty: 2, isRush: true, status: 'pending', reward: 40000 },
          ],
        },
      };
      const mUsaha = next.missions.find((m) => m.id === 'main_usaha_berikutnya');
      if (mUsaha && !mUsaha.claimed) {
        next = {
          ...next,
          missions: next.missions.map((m) => (m.id === 'main_usaha_berikutnya' ? { ...m, status: 'active' } : m)),
        };
        next = completeMission(next, 'main_usaha_berikutnya');
      }
      return addToast(next, 'Warung Gang Kost Texas resmi buka! Layani pesanan jam ramai sekarang.', 'success');
    }

    case 'UPGRADE_WARUNG_RESTAURANT': {
      const cost = 5500000;
      if (!state.warung.unlocked || state.warung.level === 2) return state;
      if (state.businessBalance < cost) return addToast(state, `Saldo usaha kurang (${formatRp(cost)}).`, 'warning');
      const { state: paid } = recordTx(state, {
        account: 'usaha',
        type: 'out',
        category: 'warung',
        amount: cost,
        title: 'Upgrade Warung menjadi Restoran Kecil (+4 Meja)',
        counterparty: 'Tim Tukang Kang Budi',
      });
      return addToast(
        { ...paid, warung: { ...paid.warung, level: 2, tables: 6 } },
        'Warung berhasil naik kelas menjadi Restoran Kecil! Kapasitas & omzet meningkat.',
        'success'
      );
    }

    case 'BUY_WARUNG_STOCK': {
      const item = state.warung.menu.find((m) => m.id === action.itemId);
      if (!item || action.qty <= 0) return state;
      const cost = item.costPerUnit * action.qty;
      if (state.businessBalance < cost) return addToast(state, `Saldo usaha kurang (${formatRp(cost)}).`, 'warning');
      const { state: paid } = recordTx(state, {
        account: 'usaha',
        type: 'out',
        category: 'warung',
        amount: cost,
        title: `Belanja Stok Warung: ${item.name} x${action.qty}`,
        counterparty: 'Pasar Pagi Gang',
      });
      return addToast(
        {
          ...paid,
          warung: {
            ...paid.warung,
            menu: paid.warung.menu.map((m) => (m.id === item.id ? { ...m, stock: m.stock + action.qty } : m)),
          },
        },
        `Stok ${item.name} +${action.qty} porsi!`,
        'success'
      );
    }

    case 'SET_WARUNG_PRICE':
      return {
        ...state,
        warung: {
          ...state.warung,
          menu: state.warung.menu.map((m) => (m.id === action.itemId ? { ...m, sellPrice: Math.max(5000, action.price) } : m)),
        },
      };

    case 'TOGGLE_WARUNG_OPEN': {
      const opening = !state.warung.isOpenToday;
      const newOrders =
        opening && state.warung.dailyOrders.length === 0
          ? [
              { id: nextUid('ord'), customerName: 'Penghuni Kos', itemId: 'nasi_goreng', qty: 2, isRush: true, status: 'pending' as const, reward: state.warung.menu[0].sellPrice * 2 },
              { id: nextUid('ord'), customerName: 'Warga Gang', itemId: 'mie_tektek', qty: 2, isRush: true, status: 'pending' as const, reward: state.warung.menu[1].sellPrice * 2 },
              { id: nextUid('ord'), customerName: 'Anak Kampus', itemId: 'kopi_susu', qty: 3, isRush: true, status: 'pending' as const, reward: state.warung.menu[3].sellPrice * 3 },
            ]
          : state.warung.dailyOrders;
      return addToast(
        { ...state, warung: { ...state.warung, isOpenToday: opening, dailyOrders: newOrders } },
        opening ? 'Warung dibuka! Pelanggan mulai antre pesanan.' : 'Warung ditutup untuk hari ini.',
        'info'
      );
    }

    case 'HANDLE_WARUNG_ORDER': {
      const order = state.warung.dailyOrders.find((o) => o.id === action.orderId && o.status === 'pending');
      if (!order) return state;
      const item = state.warung.menu.find((m) => m.id === order.itemId);
      if (!item) return state;

      if (action.mode === 'decline') {
        return {
          ...state,
          warung: {
            ...state.warung,
            dailyOrders: state.warung.dailyOrders.map((o) => (o.id === order.id ? { ...o, status: 'declined' } : o)),
          },
        };
      }

      let useItem = item;
      if (action.mode === 'serve' && item.stock < order.qty) {
        return addToast(state, `Stok ${item.name} kurang (${item.stock}/${order.qty}). Beli stok atau tawarkan menu pengganti!`, 'warning');
      }
      if (action.mode === 'substitute') {
        const alt = state.warung.menu.find((m) => m.stock >= order.qty);
        if (!alt) return addToast(state, 'Semua stok menu sedang habis. Belanja stok dulu!', 'warning');
        useItem = alt;
      }

      const revenue = useItem.sellPrice * order.qty;
      const ownerShare = useItem.fromRara ? Math.round(revenue * 0.3) : revenue;
      const { state: paid } = recordTx(state, {
        account: 'usaha',
        type: 'in',
        category: 'warung',
        amount: ownerShare,
        title: `Pesanan Warung: ${useItem.name} x${order.qty} (${order.customerName})`,
        counterparty: order.customerName,
      });
      soundEngine.playMoney();
      return addToast(
        {
          ...paid,
          warung: {
            ...paid.warung,
            revenueToday: paid.warung.revenueToday + ownerShare,
            menu: paid.warung.menu.map((m) =>
              m.id === useItem.id ? { ...m, stock: m.stock - order.qty, soldToday: m.soldToday + order.qty } : m
            ),
            dailyOrders: paid.warung.dailyOrders.map((o) =>
              o.id === order.id ? { ...o, status: action.mode === 'substitute' ? 'substituted' : 'served' } : o
            ),
          },
        },
        `Pesanan ${order.customerName} tersaji! +${formatRp(ownerShare)} ke rekening usaha.`,
        'money'
      );
    }

    case 'HANDLE_CAMPUS_CATERING': {
      if (state.warung.campusOrderResolved) return state;
      let next = state;
      let income = 255000;
      let repeat = false;
      if (action.mode === 'buy_extra') {
        if (next.businessBalance < 120000) return addToast(state, 'Saldo usaha kurang Rp120.000 untuk belanja stok tambahan.', 'warning');
        const buy = recordTx(next, {
          account: 'usaha',
          type: 'out',
          category: 'warung',
          amount: 120000,
          title: 'Belanja Stok Mendadak Pesanan Panitia Kampus',
          counterparty: 'Pemasok Pasar',
        });
        next = buy.state;
        income = 450000;
        repeat = true;
      } else if (action.mode === 'split_neighbor') {
        income = 310000;
        repeat = true;
      }
      const res = recordTx(next, {
        account: 'usaha',
        type: 'in',
        category: 'warung',
        amount: income,
        title: `Pesanan Panitia Kampus (${action.mode === 'accept_15' ? '15 kotak' : '25 kotak'})`,
        counterparty: 'Panitia Acara Kampus',
      });
      soundEngine.playMoney();
      return addToast(
        {
          ...res.state,
          warung: {
            ...res.state.warung,
            campusOrderActive: false,
            campusOrderResolved: true,
            campusRepeatClient: repeat,
            revenueToday: res.state.warung.revenueToday + income,
          },
        },
        `Pesanan panitia kampus selesai (+${formatRp(income)})!${repeat ? ' Mereka puas & bakal pesan lagi!' : ''}`,
        'money'
      );
    }

    case 'SET_RARA_CONSIGNMENT': {
      const hasDessert = state.warung.menu.some((m) => m.id === 'dessert_rara');
      const updatedMenu = hasDessert
        ? state.warung.menu.map((m) =>
            m.id === 'dessert_rara' ? { ...m, stock: m.stock + 8, isPreOrder: action.mode === 'preorder' } : m
          )
        : [
            ...state.warung.menu,
            {
              id: 'dessert_rara',
              name: 'Puding Karamel & Brownies Rara',
              costPerUnit: 0,
              sellPrice: 18000,
              stock: 10,
              soldToday: 0,
              fromRara: true,
              raraSplit: 70,
              isPreOrder: action.mode === 'preorder',
            },
          ];
      return addToast(
        {
          ...state,
          warung: {
            ...state.warung,
            raraConsignmentStage: action.mode === 'preorder' ? 3 : 2,
            menu: updatedMenu,
          },
        },
        action.mode === 'preorder'
          ? 'Sistem Pre-Order Dessert Rara aktif! Tanpa risiko sisa basi.'
          : 'Dessert buatan Rara masuk etalase Warung (10 porsi, bagi hasil 70/30)!',
        'success'
      );
    }

    case 'BUY_KONTRAKAN': {
      const cost = 12000000;
      if (state.kontrakan.owned) return state;
      if (state.businessBalance < cost) return addToast(state, `Saldo usaha kurang (${formatRp(cost)} dibutuhkan).`, 'warning');
      const { state: paid } = recordTx(state, {
        account: 'usaha',
        type: 'out',
        category: 'kontrakan',
        amount: cost,
        title: 'Akuisisi Rumah Kontrakan Ujung Gang',
        counterparty: 'Notaris & Pemilik Lama',
      });
      let next: GameState = {
        ...paid,
        kontrakan: { ...paid.kontrakan, unlocked: true, owned: true },
      };
      const mUsaha = next.missions.find((m) => m.id === 'main_usaha_berikutnya');
      if (mUsaha && !mUsaha.claimed) {
        next = {
          ...next,
          missions: next.missions.map((m) => (m.id === 'main_usaha_berikutnya' ? { ...m, status: 'active' } : m)),
        };
        next = completeMission(next, 'main_usaha_berikutnya');
      }
      return addToast(next, 'Rumah Kontrakan kini milikmu! Perbaiki dulu sebelum memasang iklan sewa.', 'success');
    }

    case 'REPAIR_KONTRAKAN': {
      const cost = 2200000;
      if (!state.kontrakan.owned || state.kontrakan.repaired) return state;
      if (state.businessBalance < cost) return addToast(state, `Saldo usaha kurang (${formatRp(cost)}).`, 'warning');
      const { state: paid } = recordTx(state, {
        account: 'usaha',
        type: 'out',
        category: 'kontrakan',
        amount: cost,
        title: 'Renovasi & Cat Ulang Rumah Kontrakan',
        counterparty: 'Tim Tukang Kang Budi',
      });
      const proj: ActiveProject = {
        id: nextUid('proj'),
        kind: 'kontrakan_repair',
        targetId: 'kontrakan',
        title: 'Renovasi Rumah Kontrakan',
        cost,
        daysLeft: 1,
        totalDays: 1,
        startedDay: state.day,
        scheduleMode: 'normal',
      };
      return addToast(
        { ...paid, activeProjects: [...paid.activeProjects, proj] },
        'Renovasi Rumah Kontrakan berjalan (selesai besok)!',
        'success'
      );
    }

    case 'TOGGLE_KONTRAKAN_AD':
      return {
        ...state,
        kontrakan: { ...state.kontrakan, adActive: !state.kontrakan.adActive },
      };

    case 'ACCEPT_KONTRAKAN_TENANT': {
      const app = state.kontrakan.applicants.find((a) => a.id === action.applicantId);
      if (!app || !state.kontrakan.repaired || state.kontrakan.tenantFamilyName) return state;
      const deposit = 1000000;
      const { state: paid } = recordTx(state, {
        account: 'usaha',
        type: 'in',
        category: 'kontrakan',
        amount: app.offer,
        title: `Sewa Bulan 1 Rumah Kontrakan (${app.familyName})`,
        counterparty: app.familyName,
      });
      soundEngine.playMoney();
      return addToast(
        {
          ...paid,
          depositEscrow: paid.depositEscrow + deposit,
          kontrakan: {
            ...paid.kontrakan,
            tenantFamilyName: app.familyName,
            monthlyRent: app.offer,
            contractStartDay: paid.day,
            nextDueDay: paid.day + 30,
            depositHeld: deposit,
            adActive: false,
            applicants: [],
          },
          calendar: [
            ...paid.calendar,
            {
              id: nextUid('cal'),
              day: paid.day + 30,
              title: `Jatuh Tempo Rumah Kontrakan (${app.familyName})`,
              category: 'sewa',
              description: `Sewa satu rumah ${formatRp(app.offer)}`,
            },
          ],
        },
        `Kontrak Rumah Kontrakan dengan ${app.familyName} aktif (+${formatRp(app.offer)})!`,
        'money'
      );
    }

    case 'TOGGLE_HIRE_STAFF': {
      const st = state.staff.find((s) => s.id === action.staffId);
      if (!st) return state;
      const hiring = !st.hired;
      const next: GameState = {
        ...state,
        staff: state.staff.map((s) => (s.id === st.id ? { ...s, hired: hiring } : s)),
      };
      return addToast(
        { ...next, worldNpcs: rebuildWorldNpcs(next) },
        hiring
          ? `${st.name} resmi direkrut sebagai ${st.roleLabel} (${formatRp(st.dailyWage)}/hari)!`
          : `Kontrak kerja ${st.name} dihentikan.`,
        'info'
      );
    }

    case 'JOIN_PARTNERSHIP': {
      const p = state.partnerships.find((x) => x.id === action.partnershipId);
      if (!p || p.active) return state;
      if (state.businessBalance < p.costToJoin) {
        return addToast(state, `Saldo usaha kurang (${formatRp(p.costToJoin)}).`, 'warning');
      }
      const { state: paid } = recordTx(state, {
        account: 'usaha',
        type: 'out',
        category: 'renovasi',
        amount: p.costToJoin,
        title: `Kerja Sama: ${p.name}`,
        counterparty: p.partnerNpc,
      });
      return addToast(
        {
          ...paid,
          partnerships: paid.partnerships.map((x) => (x.id === p.id ? { ...x, active: true } : x)),
        },
        `Kerja sama dengan ${p.name} aktif! ${p.benefit}`,
        'success'
      );
    }

    case 'INTERACT_NPC': {
      const rel = state.relationships[action.npcId];
      if (!rel) return state;
      let gain = 6;
      let cost = 0;
      let timeSlots = 0;
      let memoryText = '';
      let toastMsg = '';

      if (action.activity === 'sapa') {
        gain = rel.metToday ? 2 : 6;
        toastMsg =
          rel.isSibling
            ? 'Raka memelukmu erat di depan gerbang! "Kost Texas keren banget Kak, orang tua pasti bangga."'
            : `Ngobrol hangat sebentar dengan ${rel.name} di ${rel.favoriteSpot}.`;
      } else if (action.activity === 'ngopi') {
        cost = 45000;
        timeSlots = 1;
        gain = 14;
        memoryText = `Ngopi sore bareng di ${rel.favoriteSpot} (Hari ${state.day})`;
        toastMsg = `Asyik ngopi bareng ${rel.name}! Obrolan mengalir hangat.`;
      } else if (action.activity === 'makan') {
        cost = 85000;
        timeSlots = 1;
        gain = 18;
        memoryText = `Makan malam hangat bareng ${rel.name} (Hari ${state.day})`;
        toastMsg = `Makan malam seru bersama ${rel.name}!`;
      } else if (action.activity === 'jalan_sore') {
        timeSlots = 1;
        gain = 12;
        memoryText = `Jalan sore keliling gang & lihat pohon mangga bareng ${rel.name}`;
        toastMsg = `Jalan sore santai bareng ${rel.name} sambil melihat suasana gang.`;
      } else if (action.activity === 'undang_kamar') {
        if (!state.facilities.kamar_owner) {
          return addToast(state, 'Bangun "Ruang Pribadi Owner" dulu di Properti untuk mengundang pasangan main/menginap!', 'warning');
        }
        timeSlots = 1;
        gain = 22;
        memoryText = `Nonton bareng & santai di Ruang Owner bersama Janda (Hari ${state.day})`;
        toastMsg = `${rel.name} mampir bawa makanan ke ruang pribadimu, masak bareng, dan main sama Janda!`;
      } else if (action.activity === 'jadwalkan') {
        const next: GameState = {
          ...state,
          relationships: {
            ...state.relationships,
            [rel.id]: {
              ...rel,
              scheduledDate: { day: state.day, slot: 'sore', activity: 'Ngopi Habis Tutup Warung' },
            },
          },
          calendar: [
            ...state.calendar,
            {
              id: nextUid('cal'),
              day: state.day,
              slot: 'sore',
              title: `Janji Ngopi bareng ${rel.name}`,
              category: 'janji',
              description: `Ketemuan di ${rel.favoriteSpot}`,
            },
          ],
        };
        return addToast(next, `Janji ngopi bareng ${rel.name} masuk Kalender! Temui & pilih "Ngopi".`, 'info');
      }

      if (cost > 0 && state.personalBalance < cost) {
        return addToast(state, `Saldo pribadi kurang (${formatRp(cost)}). Transfer dulu di Bank!`, 'warning');
      }

      let next = state;
      if (cost > 0) {
        const res = recordTx(next, {
          account: 'pribadi',
          type: 'out',
          category: 'pribadi',
          amount: cost,
          title: `${action.activity === 'ngopi' ? 'Ngopi' : 'Makan'} bareng ${rel.name}`,
          counterparty: rel.name,
        });
        next = res.state;
      }

      const newAff = Math.min(100, rel.affection + gain);
      let newStatus = rel.status;
      if (!rel.isSibling && rel.romanceable) {
        if (newAff >= 75) newStatus = 'pasangan';
        else if (newAff >= 50) newStatus = 'dekat';
        else if (newAff >= 30) newStatus = 'teman';
      }

      next = {
        ...next,
        relationships: {
          ...next.relationships,
          [rel.id]: {
            ...rel,
            affection: newAff,
            status: newStatus,
            metToday: true,
            memories: memoryText ? [memoryText, ...rel.memories].slice(0, 6) : rel.memories,
            scheduledDate: action.activity === 'ngopi' ? undefined : rel.scheduledDate,
            visitedKosCount: action.activity === 'undang_kamar' ? rel.visitedKosCount + 1 : rel.visitedKosCount,
          },
        },
        activeModal: null,
      };

      // Check Side Mission "Pulang Minggu Ini" (meeting Adik Raka)
      if (rel.isSibling && (next.day === 8 || (next.day > 8 && (next.day - 8) % 14 === 0))) {
        if (!next.photos.some((p) => p.sceneKey === 'adik_kunjungan')) {
          next = {
            ...next,
            photos: [
              ...next.photos,
              {
                id: nextUid('photo'),
                title: 'Raka Pulang ke Kost Texas',
                caption: 'Foto bareng adik di bawah pohon mangga yang kini penuh penghuni.',
                day: next.day,
                category: 'keluarga',
                sceneKey: 'adik_kunjungan',
              },
            ],
          };
        }
        next = completeMission(next, 'side_pulang_minggu_ini');
      }

      // Check Side Mission "Ngopi Habis Tutup Warung"
      if (rel.romanceable && (action.activity === 'ngopi' || action.activity === 'makan' || action.activity === 'jalan_sore')) {
        next = completeMission(next, 'side_ngopi_tutup');
        if (!next.photos.some((p) => p.id === `photo_npc_${rel.id}`)) {
          next = {
            ...next,
            photos: [
              ...next.photos,
              {
                id: `photo_npc_${rel.id}`,
                title: `Momen Sore bareng ${rel.name}`,
                caption: memoryText || `Obrolan hangat bersama ${rel.name}.`,
                day: next.day,
                category: 'npc',
                sceneKey: 'npc_momen',
              },
            ],
          };
        }
      }

      next = addToast(next, toastMsg, 'success');
      if (timeSlots > 0) {
        next = gameReducer(next, { type: 'ADVANCE_SLOT', slots: timeSlots });
      }
      return next;
    }

    case 'SEND_PHOTO_TO_ADIK': {
      const photo = state.photos.find((p) => p.id === action.photoId);
      if (!photo) return state;
      let next: GameState = {
        ...state,
        photos: state.photos.map((p) => (p.id === photo.id ? { ...p, sentToAdik: true } : p)),
      };
      next = pushChatMessage(
        next,
        { npcId: 'raka', npcName: 'Raka (Adik)', roleTag: 'Adik · Kuliah Luar Kota' },
        {
          sender: 'owner',
          senderName: next.owner.name,
          text: `Nih foto "${photo.title}" buat kamu, Ka!`,
          photoId: photo.id,
        }
      );
      next = pushChatMessage(
        next,
        { npcId: 'raka', npcName: 'Raka (Adik)', roleTag: 'Adik · Kuliah Luar Kota' },
        {
          sender: 'npc',
          senderName: 'Raka',
          text:
            photo.category === 'janda'
              ? 'HAHAHA lucunya Janda!! Kaus kaki putihnya makin gemoy aja, kangen banget pengen elus!'
              : 'Keren banget progresnya Kak! Bangga banget lihat Kost Texas makin rame!',
        }
      );
      return addToast(next, `Foto "${photo.title}" terkirim ke Raka!`, 'success');
    }

    case 'SET_WALLPAPER':
      return addToast(
        { ...state, wallpaperPhotoId: action.photoId },
        action.photoId ? 'Wallpaper HP berhasil diganti!' : 'Wallpaper HP dikembalikan ke default.',
        'success'
      );

    case 'DISPLAY_PHOTO_IN_ROOM':
      return addToast(
        {
          ...state,
          photos: state.photos.map((p) =>
            p.id === action.photoId ? { ...p, displayedInRoom: !p.displayedInRoom } : p
          ),
        },
        'Status pajangan foto di ruang owner diperbarui!',
        'success'
      );

    case 'JANDA_CARE': {
      soundEngine.playMeow();
      let next = state;
      if (action.action === 'makan') {
        next = {
          ...next,
          janda: { ...next.janda, hunger: 100, mood: Math.min(100, next.janda.mood + 10), fedToday: true, pose: 'duduk' },
        };
        return addToast(next, 'Janda makan dengan lahap sambil mendengkur pelan! 🐾', 'success');
      }
      if (action.action === 'air') {
        next = {
          ...next,
          janda: { ...next.janda, mood: Math.min(100, next.janda.mood + 6), waterRefilledToday: true },
        };
        return addToast(next, 'Air minum Janda sudah diganti yang segar!', 'info');
      }
      if (action.action === 'elus') {
        next = {
          ...next,
          janda: { ...next.janda, mood: Math.min(100, next.janda.mood + 12), pettedToday: true, pose: 'pangkuan' },
        };
        return addToast(next, 'Janda menggeliat manja dan langsung naik ke pangkuanmu! Purrrr~', 'success');
      }
      if (action.action === 'taruh_mangkuk') {
        const spot = (action.spot as 'bangku_mangga' | 'teras' | 'kamar_owner') ?? 'teras';
        const spotLabel = spot === 'bangku_mangga' ? 'Bangku Mangga' : spot === 'teras' ? 'Teras Kos' : 'Ruang Owner';
        next = {
          ...next,
          janda: {
            ...next.janda,
            bowlPlaced: true,
            bowlSpot: spot,
            favoriteSpots: Array.from(new Set([...next.janda.favoriteSpots, `Dekat Mangkuk (${spotLabel})`])),
          },
          photos: next.photos.some((p) => p.id === 'photo_janda_mangkuk')
            ? next.photos
            : [
                ...next.photos,
                {
                  id: 'photo_janda_mangkuk',
                  title: 'Janda di Mangkuk Pertamanya',
                  caption: `Janda langsung mencoba mangkuk dan alas barunya di ${spotLabel}.`,
                  day: next.day,
                  category: 'janda',
                  sceneKey: 'janda_mangkuk',
                  jandaLocation: `Mangkuk ${spotLabel}`,
                },
              ],
        };
        next = completeMission(next, 'janda_tempat_pertama');
        next = checkAlbumBosKos(next);
        return addToast(next, `Mangkuk & alas Janda diletakkan di ${spotLabel}! Foto tersimpan di Galeri.`, 'success');
      }
      if (action.action === 'taruh_kardus') {
        const spot = (action.spot as 'teras' | 'rak_paket' | 'kamar_owner') ?? 'rak_paket';
        const spotLabel = spot === 'rak_paket' ? 'Rak Paket' : spot === 'teras' ? 'Teras' : 'Ruang Owner';
        next = {
          ...next,
          janda: {
            ...next.janda,
            cardboardPlaced: true,
            cardboardSpot: spot,
            favoriteSpots: Array.from(new Set([...next.janda.favoriteSpots, `Kardus di ${spotLabel}`])),
          },
          photos: next.photos.some((p) => p.id === 'photo_janda_kardus')
            ? next.photos
            : [
                ...next.photos,
                {
                  id: 'photo_janda_kardus',
                  title: 'Kardus Lebih Enak!',
                  caption: `Alas empuk kalah sama kardus paket di ${spotLabel}.`,
                  day: next.day,
                  category: 'janda',
                  sceneKey: 'janda_kardus',
                  jandaLocation: `Kardus ${spotLabel}`,
                },
              ],
        };
        next = completeMission(next, 'janda_kardus');
        next = checkAlbumBosKos(next);
        return addToast(next, `Kardus favorit Janda ditempatkan di ${spotLabel}!`, 'success');
      }
      return state;
    }

    case 'COMPLETE_JANDA_MINIGAME': {
      let next: GameState = { ...state, activeModal: null };
      if (!action.won) {
        return addToast(next, 'Janda cuma duduk memandangi mainan sambil mengibas ekor. Coba lagi kapan saja!', 'info');
      }

      soundEngine.playMeow();
      const currentWeek = Math.floor((next.day - 1) / 7) + 1;

      if (action.game === 'kejar_tali') {
        next = {
          ...next,
          janda: {
            ...next.janda,
            kejarTaliWins: next.janda.kejarTaliWins + 1,
            mood: 100,
            pose: 'kejar',
          },
        };
        if (!next.photos.some((p) => p.id === 'photo_janda_lompat')) {
          next = {
            ...next,
            photos: [
              ...next.photos,
              {
                id: 'photo_janda_lompat',
                title: 'Pose Melompat Kejar Tali!',
                caption: 'Tangkapan tiga kali berturut-turut, si tuxedo gesit banget!',
                day: next.day,
                category: 'janda',
                sceneKey: 'janda_lompat',
                jandaLocation: 'Halaman Bermain',
              },
            ],
          };
        }
        next = completeMission(next, 'janda_kejar_tali');
      } else if (action.game === 'janda_dimana') {
        const locName = action.locationName ?? 'Rak Sepatu Teras';
        next = {
          ...next,
          janda: {
            ...next.janda,
            jandaDimanaWins: next.janda.jandaDimanaWins + 1,
            mood: 100,
            favoriteSpots: Array.from(new Set([...next.janda.favoriteSpots, locName])),
          },
          photos: [
            ...next.photos,
            {
              id: nextUid('photo'),
              title: `Ketemu! Janda di ${locName}`,
              caption: `Berhasil menemukan Janda yang ngumpet manja di ${locName}.`,
              day: next.day,
              category: 'janda',
              sceneKey: 'janda_ngantuk',
              jandaLocation: locName,
            },
          ],
        };
        next = completeMission(next, 'janda_dimana');
        // Also satisfies Weekly Janda Challenge (once per week!)
        if (next.janda.weeklyCompletedWeek < currentWeek) {
          next = { ...next, janda: { ...next.janda, weeklyCompletedWeek: currentWeek } };
          next = completeMission(next, 'janda_mingguan');
        }
      } else if (action.game === 'foto_pas') {
        const themeTitle = action.themeTitle ?? 'Janda Lagi Ngantuk';
        const locName = action.locationName ?? 'Teras Kost Texas';
        const newPhotoId = nextUid('photo');
        next = {
          ...next,
          janda: {
            ...next.janda,
            fotoPasWins: next.janda.fotoPasWins + 1,
            mood: 100,
          },
          photos: [
            ...next.photos,
            {
              id: newPhotoId,
              title: themeTitle,
              caption: `Momen shutter sempurna di ${locName}!`,
              day: next.day,
              category: 'janda',
              sceneKey: themeTitle.includes('Warung') ? 'janda_warung' : themeTitle.includes('Pangkuan') ? 'janda_pangkuan' : 'janda_ngantuk',
              jandaLocation: locName,
            },
          ],
          wallpaperPhotoId: next.wallpaperPhotoId ?? newPhotoId,
        };
        next = completeMission(next, 'janda_foto_pas');
        if (next.janda.weeklyCompletedWeek < currentWeek) {
          next = { ...next, janda: { ...next.janda, weeklyCompletedWeek: currentWeek } };
          next = completeMission(next, 'janda_mingguan');
        }
      }

      next = checkAlbumBosKos(next);
      return addToast(next, 'Asyik! Momen baru bersama Janda tersimpan di Galeri HP.', 'success');
    }

    default:
      return state;
  }
}

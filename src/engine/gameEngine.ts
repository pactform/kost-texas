import {
  createInitialCalendar,
  createInitialEmployees,
  createInitialMissions,
  createInitialPartners,
  createInitialProjects,
  createInitialRelationships,
  createInitialTenants,
  formatRp,
  FURNITURE_CATALOG,
  MAP_SPOTS,
  SLOT_ORDER,
} from '../data/catalog';
import type {
  AccountType,
  BuildingIssue,
  ChatMessage,
  ChatReplyOption,
  ChatThread,
  Contract,
  DaySummary,
  DebtRecord,
  FurnitureType,
  GameState,
  GalleryPhoto,
  JandaSpotId,
  MapSpotId,
  MotorInspection,
  OwnerAppearance,
  Room,
  StarterPlan,
  Transaction,
  TransferClaim,
  WeatherType,
} from '../types/game';

export const STATE_VERSION = 1;

function nextId(state: GameState, prefix: string): string {
  state.nextIdCounter += 1;
  return `${prefix}_${state.nextIdCounter}`;
}

export function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

export function pushToast(
  state: GameState,
  text: string,
  tone: 'info' | 'success' | 'warning' | 'mission' = 'info'
) {
  state.toasts = [
    ...state.toasts.slice(-3),
    { id: nextId(state, 'toast'), text, tone },
  ];
}

export function recordTransaction(
  state: GameState,
  params: {
    account: AccountType;
    kind: 'masuk' | 'keluar';
    category: Transaction['category'];
    amount: number;
    description: string;
    missionId?: string;
    referenceCode?: string;
  }
): Transaction {
  const amt = Math.max(0, Math.round(params.amount));
  const before = state.accounts[params.account];
  const after = params.kind === 'masuk' ? before + amt : before - amt;
  state.accounts[params.account] = after;

  const tx: Transaction = {
    id: nextId(state, 'tx'),
    day: state.day,
    slot: state.slot,
    account: params.account,
    kind: params.kind,
    category: params.category,
    amount: amt,
    balanceBefore: before,
    balanceAfter: after,
    description: params.description,
    missionId: params.missionId,
    referenceCode: params.referenceCode,
  };
  state.ledger.unshift(tx);
  return tx;
}

export function getOrCreateThread(
  state: GameState,
  npc: {
    id: string;
    name: string;
    roleLabel: string;
    hair: string;
    skin: string;
    outfit: string;
    locationHint?: MapSpotId;
  }
): ChatThread {
  let thread = state.chats.find((c) => c.npcId === npc.id);
  if (!thread) {
    thread = {
      id: `chat_${npc.id}`,
      npcId: npc.id,
      npcName: npc.name,
      roleLabel: npc.roleLabel,
      avatarHair: npc.hair,
      avatarSkin: npc.skin,
      avatarOutfit: npc.outfit,
      unread: 0,
      messages: [],
      locationHint: npc.locationHint,
    };
    state.chats.unshift(thread);
  }
  return thread;
}

export function pushNpcMessage(
  state: GameState,
  npc: {
    id: string;
    name: string;
    roleLabel: string;
    hair: string;
    skin: string;
    outfit: string;
    locationHint?: MapSpotId;
  },
  text: string,
  replies?: ChatReplyOption[],
  photoId?: string
) {
  const thread = getOrCreateThread(state, npc);
  const msg: ChatMessage = {
    id: nextId(state, 'msg'),
    sender: 'npc',
    text,
    day: state.day,
    slot: state.slot,
    photoId,
    replies,
    repliesUsed: false,
  };
  thread.messages.push(msg);
  thread.unread += 1;
  // Move thread to top
  state.chats = [thread, ...state.chats.filter((c) => c.id !== thread.id)];
}

export function pushOwnerMessage(
  state: GameState,
  npcId: string,
  text: string,
  photoId?: string
) {
  const thread = state.chats.find((c) => c.npcId === npcId);
  if (!thread) return;
  thread.messages.push({
    id: nextId(state, 'msg'),
    sender: 'owner',
    text,
    day: state.day,
    slot: state.slot,
    photoId,
  });
}

export function addPhotoToGallery(
  state: GameState,
  photo: Omit<GalleryPhoto, 'id' | 'dayTaken' | 'sentToAdik' | 'displayedInRoom'> & {
    id?: string;
  }
): GalleryPhoto {
  const existing = state.gallery.find(
    (p) => p.sceneKey === photo.sceneKey && p.title === photo.title
  );
  if (existing) return existing;
  const item: GalleryPhoto = {
    id: photo.id || nextId(state, 'photo'),
    title: photo.title,
    caption: photo.caption,
    dayTaken: state.day,
    category: photo.category,
    sceneKey: photo.sceneKey,
    locationTag: photo.locationTag,
    sentToAdik: false,
    displayedInRoom: false,
  };
  state.gallery.unshift(item);
  return item;
}

export function addCalendarEvent(
  state: GameState,
  ev: {
    day: number;
    title: string;
    category: 'gang' | 'tagihan' | 'tukang' | 'servis' | 'pribadi' | 'acara';
    description: string;
    impactText?: string;
  }
) {
  state.calendar.push({
    id: nextId(state, 'cal'),
    ...ev,
  });
  state.calendar.sort((a, b) => a.day - b.day);
}

export function recalcRoomMetrics(room: Room, facilities: GameState['facilities']) {
  let comfort = room.tier === 'premium' ? 68 : 52;
  let rentBonus = 0;
  for (const f of room.furniture) {
    const cat = FURNITURE_CATALOG.find((c) => c.type === f.type);
    if (cat) {
      comfort += cat.comfortBonus;
      rentBonus += cat.rentBonus;
    }
  }
  if (facilities.wifiLevel >= 2) comfort += 6;
  if (facilities.terraceCanopy) comfort += 5;
  if (facilities.washingMachine) comfort += 5;
  if (facilities.parkingOrganized) comfort += 4;
  room.comfortScore = Math.min(100, comfort);
  const base = room.tier === 'premium' ? 1_650_000 : 850_000;
  const suggested = base + rentBonus;
  if (room.status === 'kosong' && room.monthlyRent < base) {
    room.monthlyRent = suggested;
  }
}

function makeRoom(
  id: string,
  code: string,
  floor: 1 | 2 | 3,
  tier: 'standar' | 'premium',
  constructionDays: number
): Room {
  const isPrem = tier === 'premium';
  return {
    id,
    code,
    floor,
    tier,
    status: constructionDays > 0 ? 'proyek' : 'kosong',
    monthlyRent: isPrem ? 1_650_000 : 850_000,
    depositAmount: isPrem ? 800_000 : 400_000,
    furniture: isPrem
      ? [
          { id: `${id}_f1`, type: 'kasur_queen', x: 0, y: 0 },
          { id: `${id}_f2`, type: 'meja_besar', x: 3, y: 0 },
          { id: `${id}_f3`, type: 'lemari', x: 0, y: 2 },
          { id: `${id}_f4`, type: 'ac', x: 2, y: 0 },
        ]
      : [
          { id: `${id}_f1`, type: 'kasur_standar', x: 0, y: 0 },
          { id: `${id}_f2`, type: 'meja_belajar', x: 3, y: 0 },
          { id: `${id}_f3`, type: 'lemari', x: 0, y: 2 },
        ],
    tenantId: null,
    coTenantName: null,
    guestStayingName: null,
    lightsOn: false,
    statusLabel: constructionDays > 0 ? 'Dalam pembangunan' : 'Siap huni',
    cleanliness: 95,
    comfortScore: isPrem ? 86 : 68,
    isUnderConstructionDaysLeft: constructionDays,
    renovationDaysLeft: 0,
    hasPrivateBath: isPrem,
  };
}

export function createInitialState(
  customAppearance?: Partial<OwnerAppearance>,
  skipOpening = false,
  starterPlanIfSkipped: StarterPlan = 'dua_standar'
): GameState {
  const state: GameState = {
    version: STATE_VERSION,
    phase: skipOpening ? 'playing' : 'opening',
    openingStep: 0,
    starterPlan: null,
    day: 1,
    slot: 'pagi',
    weather: 'cerah',
    buildingStage: 0,
    owner: {
      name: customAppearance?.name || 'Dira',
      hairStyle: customAppearance?.hairStyle || 'bob',
      hairColor: customAppearance?.hairColor || '#232024',
      skinTone: customAppearance?.skinTone || '#dfb089',
      outfitId: customAppearance?.outfitId || 'kaus_sandal',
    },
    ownerPos: { x: 4, y: 10, floor: 1 },
    activeFloorView: 1,
    cutawayEnabled: false,
    reputation: 4.3,
    competitorNearbyActive: false,
    gangEventActiveTitle: null,
    firstNightCompleted: false,
    firstNightGreetedTenant: false,
    firstNightGuestShown: false,
    packageWaitingForTenantId: null,
    packageDeliveredCount: 0,
    accounts: {
      usaha: 35_000_000,
      pribadi: 1_000_000,
    },
    ledger: [
      {
        id: 'tx_init_usaha',
        day: 1,
        slot: 'pagi',
        account: 'usaha',
        kind: 'masuk',
        category: 'transfer_internal',
        amount: 35_000_000,
        balanceBefore: 0,
        balanceAfter: 35_000_000,
        description: 'Modal awal usaha Kost Texas (warisan keluarga)',
      },
      {
        id: 'tx_init_pribadi',
        day: 1,
        slot: 'pagi',
        account: 'pribadi',
        kind: 'masuk',
        category: 'transfer_internal',
        amount: 1_000_000,
        balanceBefore: 0,
        balanceAfter: 1_000_000,
        description: 'Tabungan pribadi awal owner',
      },
    ],
    debts: [],
    claims: [],
    rooms: [],
    ownerRoom: {
      built: false,
      buildDaysLeft: 0,
      hasBed: true,
      hasDesk: true,
      hasWardrobe: true,
      hasJandaCorner: true,
      displayedPhotoIds: [],
      hasTuxedoPillow: false,
      hasFavoriteBoxDecor: false,
      ateToday: false,
      partnerVisitingName: null,
    },
    facilities: {
      wifiLevel: 1,
      pumpLevel: 1,
      parkingSlots: 3,
      parkingOrganized: false,
      dryingArea: false,
      terraceCanopy: false,
      terraceLights: true,
      benchPosition: 'dekat_kamar',
      terraceSoundproof: false,
      packageRack: false,
      washingMachine: false,
      commonRoomFloor3: false,
      signBoardInstalled: false,
      powerOutageActive: false,
      nayaprelovedRack: false,
    },
    issues: [],
    projects: createInitialProjects(),
    tenants: createInitialTenants(),
    contracts: [],
    chats: [],
    promises: [],
    rental: {
      unlocked: false,
      motors: [],
      bookings: [],
      incidents: [],
      bengkelBusyUntilDay: 0,
    },
    warung: {
      unlocked: false,
      level: 1,
      openToday: true,
      openHoursLabel: '07:00 – 21:00',
      tables: 2,
      menu: [
        {
          id: 'nasi_telor',
          name: 'Nasi Telor Krispi Sambal',
          price: 15_000,
          cost: 8_000,
          dailyStock: 12,
          soldToday: 0,
          leftoverYesterday: 0,
          category: 'makanan',
        },
        {
          id: 'mie_nyemek',
          name: 'Indomie Nyemek Texas',
          price: 14_000,
          cost: 7_000,
          dailyStock: 12,
          soldToday: 0,
          leftoverYesterday: 0,
          category: 'makanan',
        },
        {
          id: 'es_teh_kopi',
          name: 'Es Teh Manis / Kopi Susu',
          price: 8_000,
          cost: 3_500,
          dailyStock: 16,
          soldToday: 0,
          leftoverYesterday: 0,
          category: 'minuman',
        },
      ],
      rushHourAvailable: true,
      rushHourDoneToday: false,
      raraConsignment: 'none',
      raraBatchQty: 0,
      raraOwnerSplitPct: 25,
      campusOrder: {
        active: false,
        day: 22,
        requestedBoxes: 25,
        currentStock: 15,
        resolved: false,
        repeatCustomerUnlocked: false,
      },
      totalOrdersServed: 0,
      revenueToday: 0,
    },
    kontrakan: {
      owned: false,
      price: 14_500_000,
      condition: 55,
      renovated: false,
      advertised: false,
      monthlyRent: 2_600_000,
      upkeepPerDay: 45_000,
      tenantFamilyName: null,
      contractActive: false,
      startDay: 0,
      nextDueDay: 0,
      applicants: [
        {
          id: 'k_app_1',
          familyName: 'Keluarga Pak Hendro & Bu Dewi',
          members: 'Suami-istri + 1 anak SD',
          offerRent: 2_600_000,
          reliability: 'Tepat waktu, kerja pegawai kampus',
          note: 'Cari rumah rapi dekat gang biar gampang antar anak sekolah.',
        },
        {
          id: 'k_app_2',
          familyName: 'Grup 3 Mahasiswa S2 Teknik',
          members: '3 orang dewasa',
          offerRent: 2_850_000,
          reliability: 'Bayar patungan, sering pulang malam',
          note: 'Suka rumah yang bebas akses 24 jam dan ada teras buat parkir motor.',
        },
      ],
    },
    partners: createInitialPartners(),
    employees: createInitialEmployees(),
    adik: {
      name: 'Rani',
      city: 'Bandung',
      relation: 78,
      visitingToday: false,
      visitedCount: 0,
      pendingRequestAmount: 0,
      pendingRequestReason: null,
      promiseDay: null,
      totalTransferred: 0,
      receivedPhotoIds: [],
    },
    relationships: createInitialRelationships(),
    janda: {
      mood: 82,
      fedToday: false,
      waterFresh: true,
      pettedToday: false,
      bowlPlaced: false,
      bowlLocation: null,
      bedPlaced: false,
      boxFound: false,
      boxLocation: null,
      currentSpot: 'bangku_mangga',
      favoriteSpots: ['bangku_mangga'],
      animState: 'loaf',
      kejarTaliWins: 0,
      jandaDimanaWins: 0,
      fotoPasWins: 0,
      tenantPhotoReceived: false,
      weeklyChallenge: {
        weekNumber: 1,
        kind: 'foto',
        theme: 'Janda Lagi Ngantuk',
        completed: false,
        paidWeek: 0,
      },
      wallpaperPhotoId: null,
    },
    gallery: [],
    missions: createInitialMissions(),
    calendar: createInitialCalendar(),
    daySummary: null,
    day30Unlocked: false,
    settings: {
      muted: false,
      reducedMotion: false,
    },
    toasts: [],
    activeTourTenantId: null,
    activeTourRoomId: null,
    nextIdCounter: 100,
  };

  if (skipOpening) {
    finishOpeningIntoState(state, starterPlanIfSkipped, true);
  }

  return state;
}

export function finishOpeningIntoState(
  state: GameState,
  plan: StarterPlan,
  skipped = false
) {
  state.starterPlan = plan;
  state.phase = 'playing';
  state.buildingStage = 1;
  state.facilities.signBoardInstalled = true;

  // Save opening photo if not already saved
  const openingPhoto = addPhotoToGallery(state, {
    id: 'photo_opening_mangga',
    title: 'Hari Pertama di Bangku Mangga',
    caption: 'Duduk bareng Janda membaca surat titipan orang tua di bawah pohon mangga.',
    category: 'opening',
    sceneKey: 'opening_mangga',
    locationTag: 'Bangku Pohon Mangga',
  });
  openingPhoto.sentToAdik = true;
  if (!state.adik.receivedPhotoIds.includes(openingPhoto.id)) {
    state.adik.receivedPhotoIds.push(openingPhoto.id);
  }

  addPhotoToGallery(state, {
    id: 'photo_papan_kost',
    title: 'Papan KOST TEXAS Terpasang',
    caption: 'Langkah pertama membangun kos bebas 24 jam di ujung gang.',
    category: 'kos',
    sceneKey: 'papan_kost',
    locationTag: 'Gerbang Kost Texas',
  });

  if (plan === 'dua_standar') {
    recordTransaction(state, {
      account: 'usaha',
      kind: 'keluar',
      category: 'renovasi',
      amount: 18_000_000,
      description: 'Bangun 2 Kamar Standar + utilitas dasar (Pak Slamet)',
    });
    state.rooms = [
      makeRoom('kamar_101', '101', 1, 'standar', 1),
      makeRoom('kamar_102', '102', 1, 'standar', 1),
    ];
    const p102 = state.projects.find((p) => p.id === 'proj_kamar_102');
    if (p102) p102.status = 'selesai';
  } else {
    recordTransaction(state, {
      account: 'usaha',
      kind: 'keluar',
      category: 'renovasi',
      amount: 22_000_000,
      description: 'Bangun 1 Kamar Premium (Kamar Mandi Dalam) + utilitas dasar',
    });
    state.rooms = [makeRoom('kamar_101', '101', 1, 'premium', 1)];
    const p102 = state.projects.find((p) => p.id === 'proj_kamar_102');
    if (p102) p102.status = 'tersedia';
  }

  // Starter Chats
  pushNpcMessage(
    state,
    {
      id: 'adik',
      name: `${state.adik.name} (Adik)`,
      roleLabel: `Kuliah di ${state.adik.city}`,
      hair: '#3a2822',
      skin: state.owner.skinTone,
      outfit: 'oversized_cargo',
      locationHint: 'gerbang',
    },
    'Kak, udah sampai? Makasih banget foto pohon mangganya! Janda keliatan anteng banget di pangkuan 😍 Semangat bangun Kost Texas ya!',
    [
      {
        id: 'rep_adik_1',
        label: 'Siap Ran! Nanti pas libur main ke sini ya.',
        action: { type: 'chat_simple_reply', npcId: 'adik', text: 'Siap Ran! Nanti pas libur main ke sini ya.', followUp: 'Pasti dong Kak! Aku udah tandain kalender Hari ke-10 pulang sebentar 🙌' },
      },
    ]
  );

  pushNpcMessage(
    state,
    {
      id: 'pak_slamet',
      name: 'Pak Slamet (Tukang)',
      roleLabel: 'Kepala Tukang Gang',
      hair: '#454545',
      skin: '#b8835a',
      outfit: 'kaus_sandal',
      locationHint: 'teras',
    },
    `Siap Bos ${state.owner.name}! Papan KOST TEXAS udah kepasang cakep. Bahan bangunan udah masuk, besok pagi kamar tahap pertama sudah beres dan siap ditunjukkin ke calon penghuni.`,
    [
      {
        id: 'rep_slamet_1',
        label: 'Makasih Pak! Biar aku bantu pantau hari ini.',
        action: { type: 'chat_simple_reply', npcId: 'pak_slamet', text: 'Makasih Pak! Biar aku bantu pantau hari ini.', followUp: 'Sama-sama Bos! Sambil nunggu besok, Bos bisa kenalan sama Bu Wati, atur tempat Janda, atau cek pelamar di HP.' },
      },
    ]
  );

  pushNpcMessage(
    state,
    {
      id: 'bu_wati',
      name: 'Bu Wati (Tetangga)',
      roleLabel: 'Tetangga & Info Gang',
      hair: '#2b2420',
      skin: '#c58c63',
      outfit: 'linen_slacks',
      locationHint: 'gerbang',
    },
    'Selamat ya udah mulai dibangun! Tadi ada anak kampus dan pekerja hotel nanyain kos bebas 24 jam. Aku kasih info iklan Kost Texas ke grup mereka ya!'
  );

  evaluateMissionsAndPayouts(state);

  if (skipped) {
    pushToast(state, 'Opening dilewati. Pembangunan Kost Texas sudah berjalan!', 'info');
  } else {
    pushToast(state, 'Papan KOST TEXAS terpasang! Selamat datang di hari pertamamu.', 'success');
  }
}

export function evaluateMissionsAndPayouts(state: GameState) {
  const completeMission = (missionId: string) => {
    const m = state.missions.find((item) => item.id === missionId);
    if (!m || m.rewardPaid) return;
    m.status = 'selesai';
    m.completedDay = state.day;
    m.rewardPaid = true;
    m.pinned = false;

    recordTransaction(state, {
      account: m.rewardAccount,
      kind: 'masuk',
      category: 'bonus_misi',
      amount: m.rewardAmount,
      description: `Bonus Misi: ${m.title}`,
      missionId: m.id,
    });

    const accLabel = m.rewardAccount === 'usaha' ? 'rekening usaha' : 'rekening pribadi';
    pushToast(
      state,
      `Misi selesai · +${formatRp(m.rewardAmount)} ke ${accLabel} (${m.title})`,
      'mission'
    );
  };

  // --- MAIN MISSIONS ---
  if (state.facilities.signBoardInstalled && state.starterPlan) {
    completeMission('m_mulai_dari_sini');
  }
  if (state.contracts.some((c) => c.status === 'aktif' || c.status === 'selesai')) {
    completeMission('m_kamar_pertama');
  }
  if (state.firstNightCompleted) {
    completeMission('m_malam_pertama');
  }
  if (state.issues.some((i) => i.resolved)) {
    completeMission('m_chat_dibalas');
  }
  if (state.rental.unlocked || state.warung.unlocked || state.kontrakan.owned) {
    completeMission('m_usaha_berikutnya');
  }
  if (state.buildingStage >= 2) {
    completeMission('m_dari_satu_lantai');
  }
  if (state.day >= 30) {
    state.day30Unlocked = true;
    completeMission('m_hari_30');
  }

  // --- SIDE MISSIONS ---
  if (state.debts.some((d) => d.kind === 'cicilan_sewa' && d.status === 'lunas')) {
    completeMission('s_nunggu_gajian');
  }
  if (state.packageDeliveredCount >= 1) {
    completeMission('s_paket_nyasar');
  }
  if (state.facilities.nayaprelovedRack) {
    completeMission('s_meja_naya');
  }
  if (state.adik.visitedCount >= 1) {
    completeMission('s_pulang_minggu_ini');
  }
  if (state.relationships.some((r) => r.metCount >= 1)) {
    completeMission('s_ngopi_tutup_warung');
  }

  // --- JANDA MISSIONS ---
  if (state.janda.bowlPlaced && state.janda.bedPlaced) {
    addPhotoToGallery(state, {
      id: 'photo_janda_mangkuk',
      title: 'Janda di Mangkuk Barunya',
      caption: 'Janda langsung mengendus mangkuk dan meringkuk puas di alas barunya.',
      category: 'janda',
      sceneKey: 'janda_mangkuk',
      locationTag: state.janda.bowlLocation === 'ruang_owner' ? 'Ruang Owner' : 'Teras',
    });
    completeMission('j_tempat_pertama');
  }
  if (state.janda.boxFound && state.janda.boxLocation) {
    state.ownerRoom.hasFavoriteBoxDecor = true;
    addPhotoToGallery(state, {
      id: 'photo_janda_kardus',
      title: 'Kardus Lebih Enak',
      caption: 'Padahal sudah ada alas empuk, Janda tetap pilih duduk di kardus paket.',
      category: 'janda',
      sceneKey: 'janda_kardus',
      locationTag: 'Kardus Paket',
    });
    completeMission('j_kardus_enak');
  }
  if (state.janda.jandaDimanaWins >= 1) {
    completeMission('j_dimana');
  }
  if (state.janda.tenantPhotoReceived) {
    completeMission('j_teman_lantai_2');
  }
  if (state.janda.kejarTaliWins >= 1) {
    completeMission('j_kejar_tali');
  }
  if (state.janda.fotoPasWins >= 1) {
    completeMission('j_foto_pas');
  }

  const jandaPhotos = state.gallery.filter((p) => p.category === 'janda');
  const uniqueLocations = new Set(jandaPhotos.map((p) => p.locationTag || p.sceneKey));
  if (uniqueLocations.size >= 4 || jandaPhotos.length >= 4) {
    state.ownerRoom.hasTuxedoPillow = true;
    completeMission('j_album_bos_kos');
  }

  // Weekly Janda challenge payout (at most once per game week!)
  const wk = state.janda.weeklyChallenge;
  const weeklyMission = state.missions.find((m) => m.id === 'j_mingguan');
  if (wk.completed && wk.paidWeek < wk.weekNumber) {
    wk.paidWeek = wk.weekNumber;
    if (weeklyMission) {
      weeklyMission.status = 'selesai';
      weeklyMission.completedDay = state.day;
    }
    recordTransaction(state, {
      account: 'pribadi',
      kind: 'masuk',
      category: 'bonus_misi',
      amount: 25_000,
      description: `Bonus Misi: Tantangan Janda Mingguan (Minggu ${wk.weekNumber})`,
      missionId: `j_mingguan_w${wk.weekNumber}`,
    });
    pushToast(
      state,
      `Tantangan Janda Minggu ${wk.weekNumber} selesai · +Rp25.000 ke rekening pribadi`,
      'mission'
    );
  }

  // Auto-pin next active main mission if none pinned
  if (!state.missions.some((m) => m.pinned && m.status === 'aktif')) {
    const nextMain = state.missions.find((m) => m.group === 'utama' && m.status === 'aktif');
    if (nextMain) nextMain.pinned = true;
  }
}

export function updateRoomStatesForSlot(state: GameState) {
  const isNight = state.slot === 'malam';
  const isAfternoon = state.slot === 'siang';
  const isRain = state.weather === 'hujan' || state.weather === 'hujan_deras';

  for (const room of state.rooms) {
    if (room.status === 'proyek') {
      room.lightsOn = false;
      room.statusLabel = `Pembangunan (${room.isUnderConstructionDaysLeft} hari lagi)`;
      continue;
    }
    if (room.status === 'renovasi') {
      room.lightsOn = false;
      room.statusLabel = `Renovasi (${room.renovationDaysLeft} hari lagi)`;
      continue;
    }
    if (room.status === 'kosong') {
      room.lightsOn = false;
      room.statusLabel = 'Siap huni';
      room.guestStayingName = null;
      continue;
    }
    if (room.status === 'tur') {
      room.lightsOn = true;
      room.statusLabel = 'Sedang tur kamar';
      continue;
    }

    const tenant = state.tenants.find((t) => t.id === room.tenantId);
    if (!tenant) continue;

    // 24-hour free boarding house guest logic: guests may arrive sore/malam without owner permission
    if (isNight && tenant.partnerName && !room.guestStayingName) {
      const shouldVisit = !state.firstNightCompleted || (state.day + tenant.name.length) % 2 === 0;
      if (shouldVisit) {
        room.guestStayingName = tenant.partnerName;
        room.guestArrivedSlot = 'malam';
        if (!state.firstNightGuestShown && !state.firstNightCompleted) {
          state.firstNightGuestShown = true;
          pushToast(
            state,
            `${tenant.name} pulang bersama ${tenant.partnerName} lewat gerbang. Kos bebas 24 jam — kamu bisa sapa di teras!`,
            'info'
          );
        }
      }
    } else if (state.slot === 'pagi' && room.guestStayingName) {
      // Guest says goodbye in the morning
      room.guestStayingName = null;
    }

    const loc = tenant.routine[state.slot];
    if (state.facilities.powerOutageActive) {
      room.lightsOn = false;
      room.statusLabel = 'Keluar ke teras (mati lampu)';
    } else if (room.guestStayingName && isNight) {
      room.lightsOn = true;
      room.statusLabel = `Bersama ${room.guestStayingName} (menginap)`;
    } else if (tenant.isShiftWorker && isAfternoon) {
      room.lightsOn = false;
      room.statusLabel = 'Sedang istirahat siang';
    } else if (loc === 'kamar') {
      room.lightsOn = isNight || state.slot === 'sore';
      room.statusLabel = isNight ? 'Sedang istirahat' : 'Di dalam kamar';
    } else if (loc === 'teras') {
      room.lightsOn = false;
      room.statusLabel = isRain ? 'Teduh di teras' : 'Santai di teras';
    } else if (loc === 'warung') {
      room.lightsOn = false;
      room.statusLabel = state.warung.unlocked ? 'Makan di warung' : 'Cari makan dekat gang';
    } else if (loc === 'parkiran') {
      room.lightsOn = false;
      room.statusLabel = 'Di area parkiran';
    } else {
      room.lightsOn = false;
      room.statusLabel = tenant.isShiftWorker && isNight ? 'Kerja shift malam' : 'Sedang di luar';
    }
  }

  // Update Janda spot dynamically based on weather & unlocked areas
  if (isRain) {
    state.janda.currentSpot = state.ownerRoom.built ? 'ruang_owner' : 'rak_sepatu';
    state.janda.animState = 'sleep';
  } else if (state.slot === 'malam') {
    state.janda.currentSpot = state.ownerRoom.built ? 'ruang_owner' : 'teras';
    state.janda.animState = 'sleep';
  } else if (state.slot === 'siang' && state.warung.unlocked && state.day % 2 === 0) {
    state.janda.currentSpot = 'warung';
    state.janda.animState = 'loaf';
  } else if (state.buildingStage >= 2 && state.slot === 'sore') {
    state.janda.currentSpot = 'lantai_2';
    state.janda.animState = 'stretch';
  } else if (state.facilities.packageRack && state.slot === 'siang') {
    state.janda.currentSpot = 'kardus_paket';
    state.janda.animState = 'hide';
  } else {
    state.janda.currentSpot = state.janda.favoriteSpots[0] || 'bangku_mangga';
    state.janda.animState = 'loaf';
  }
}

export function advanceTimeSlot(state: GameState): GameState {
  const next = cloneState(state);
  const idx = SLOT_ORDER.indexOf(next.slot);
  if (idx < SLOT_ORDER.length - 1) {
    next.slot = SLOT_ORDER[idx + 1];
    // Clear power outage after sore
    if (next.facilities.powerOutageActive && next.slot === 'malam') {
      next.facilities.powerOutageActive = false;
      pushToast(next, 'Listrik gang sudah menyala kembali! Lampu kamar kembali hangat.', 'success');
    }
    // Power outage trigger on Day 19 sore
    if (next.day === 19 && next.slot === 'sore' && !next.facilities.powerOutageActive) {
      next.facilities.powerOutageActive = true;
      pushToast(next, 'Pemadaman listrik bergilir! Penghuni keluar mengobrol di teras.', 'warning');
      const occupied = next.tenants.find((t) => t.status === 'menghuni');
      if (occupied) {
        pushNpcMessage(
          next,
          {
            id: occupied.id,
            name: occupied.name,
            roleLabel: `Penghuni Kamar ${next.rooms.find((r) => r.id === occupied.roomId)?.code || ''}`,
            hair: occupied.hairColor,
            skin: occupied.skinTone,
            outfit: occupied.outfitCasual,
            locationHint: 'teras',
          },
          'Kak, mati lampu ya? Aku sama yang lain keluar duduk di teras sambil nunggu nyala lagi nih.'
        );
      }
    }
    updateRoomStatesForSlot(next);
    evaluateMissionsAndPayouts(next);
    return next;
  }
  return advanceDay(next);
}

function chooseWeatherForDay(day: number): WeatherType {
  if (day >= 7 && day <= 9) return day === 8 ? 'hujan_deras' : 'hujan';
  const mod = day % 7;
  if (mod === 3) return 'berawan';
  if (mod === 5) return 'hujan';
  if (mod === 6 && day > 12) return 'hujan_deras';
  return 'cerah';
}

export function advanceDay(state: GameState): GameState {
  const next = cloneState(state);
  const completedDay = next.day;

  const highlights: string[] = [];
  const employeeLogs: string[] = [];

  // Track today's financial totals before incrementing day
  const dayTxs = next.ledger.filter((t) => t.day === completedDay);
  const incomeUsaha = dayTxs
    .filter((t) => t.account === 'usaha' && t.kind === 'masuk')
    .reduce((s, t) => s + t.amount, 0);
  const expenseUsaha = dayTxs
    .filter((t) => t.account === 'usaha' && t.kind === 'keluar')
    .reduce((s, t) => s + t.amount, 0);
  const incomePribadi = dayTxs
    .filter((t) => t.account === 'pribadi' && t.kind === 'masuk')
    .reduce((s, t) => s + t.amount, 0);
  const expensePribadi = dayTxs
    .filter((t) => t.account === 'pribadi' && t.kind === 'keluar')
    .reduce((s, t) => s + t.amount, 0);

  // Check First Night completion if tenant occupied & owner ended night
  const hasOccupiedRoom = next.rooms.some((r) => r.status === 'terisi');
  if (hasOccupiedRoom && !next.firstNightCompleted) {
    next.firstNightCompleted = true;
    highlights.push('Malam pertama kos berpenghuni berjalan lancar dengan sistem kos bebas 24 jam.');
  }

  // Advance day & reset slot
  next.day += 1;
  next.slot = 'pagi';
  next.weather = chooseWeatherForDay(next.day);
  next.ownerRoom.ateToday = false;
  next.ownerRoom.partnerVisitingName = null;
  next.facilities.powerOutageActive = false;
  next.janda.fedToday = false;
  next.janda.pettedToday = false;
  next.janda.waterFresh = false;
  next.warung.rushHourDoneToday = false;
  next.warung.revenueToday = 0;

  // Weekly Janda challenge rotation every 7 days
  const currentWeek = Math.floor((next.day - 1) / 7) + 1;
  if (currentWeek > next.janda.weeklyChallenge.weekNumber) {
    const themes = [
      { kind: 'foto' as const, theme: 'Janda Lagi Ngantuk' },
      { kind: 'cari' as const, theme: 'Cari Janda di Kos' },
      { kind: 'foto' as const, theme: 'Janda di Pangkuan' },
      { kind: 'foto' as const, theme: 'Janda Sok Sibuk di Warung' },
    ];
    const picked = themes[(currentWeek - 1) % themes.length];
    next.janda.weeklyChallenge = {
      weekNumber: currentWeek,
      kind: picked.kind,
      theme: picked.theme,
      completed: false,
      paidWeek: next.janda.weeklyChallenge.paidWeek,
    };
    const wm = next.missions.find((m) => m.id === 'j_mingguan');
    if (wm) {
      wm.status = 'aktif';
      wm.nextStep = `Target Minggu ${currentWeek}: ${picked.theme}`;
    }
    highlights.push(`Tantangan Janda Minggu ${currentWeek} dibuka: ${picked.theme}.`);
  }

  // 1. Progress room construction & renovations
  for (const room of next.rooms) {
    if (room.status === 'proyek' && room.isUnderConstructionDaysLeft > 0) {
      room.isUnderConstructionDaysLeft -= 1;
      if (room.isUnderConstructionDaysLeft <= 0) {
        room.status = 'kosong';
        room.statusLabel = 'Siap huni';
        highlights.push(`Kamar ${room.code} selesai dibangun dan siap dipasarkan!`);
      }
    }
    if (room.status === 'renovasi' && room.renovationDaysLeft > 0) {
      room.renovationDaysLeft -= 1;
      if (room.renovationDaysLeft <= 0) {
        room.status = room.tenantId ? 'terisi' : 'kosong';
        room.comfortScore = Math.min(100, room.comfortScore + 10);
        highlights.push(`Renovasi Kamar ${room.code} selesai!`);
      }
    }
  }

  // 2. Progress Owner Room construction
  if (!next.ownerRoom.built && next.ownerRoom.buildDaysLeft > 0) {
    next.ownerRoom.buildDaysLeft -= 1;
    if (next.ownerRoom.buildDaysLeft <= 0) {
      next.ownerRoom.built = true;
      highlights.push('Ruang Pribadi Owner selesai dibangun! Sekarang kamu bisa tidur & pajang foto di kos.');
    }
  }

  // 3. Progress Projects
  for (const proj of next.projects) {
    if (proj.status === 'berjalan') {
      proj.remainingDays -= 1;
      if (proj.remainingDays === 1) {
        proj.stageLabel = 'finishing';
      } else if (proj.remainingDays === 2) {
        proj.stageLabel = 'dinding';
      }
      if (proj.remainingDays <= 0) {
        proj.status = 'selesai';
        proj.stageLabel = 'selesai';
        applyProjectCompletion(next, proj.id, highlights);
      }
    }
  }

  // 4. Progress Motor Services & Rental Bookings
  for (const motor of next.rental.motors) {
    if (motor.status === 'bengkel' && motor.serviceDaysLeft > 0) {
      motor.serviceDaysLeft -= 1;
      if (motor.serviceDaysLeft <= 0) {
        motor.status = 'tersedia';
        motor.tireHealth = 98;
        motor.batteryHealth = 98;
        motor.bodyCondition = 'mulus';
        highlights.push(`Servis ${motor.name} (${motor.plate}) selesai dari Bengkel Mas Agung.`);
      }
    }
  }

  // Check delayed transfer claims arriving today
  for (const claim of next.claims) {
    if (
      claim.kind === 'tertunda' &&
      !claim.actualMutationId &&
      claim.delayedReleaseDay &&
      next.day >= claim.delayedReleaseDay
    ) {
      const tx = recordTransaction(next, {
        account: 'usaha',
        kind: 'masuk',
        category: 'rental',
        amount: claim.expectedAmount,
        description: `Transfer masuk kliring rental ${claim.customerName} (${claim.proofRef})`,
        referenceCode: claim.proofRef,
      });
      claim.actualMutationId = tx.id;
      highlights.push(`Dana kliring tertunda dari ${claim.customerName} (${formatRp(claim.expectedAmount)}) akhirnya masuk mutasi Bank!`);
    }
  }

  // Check overdue rental bookings
  for (const b of next.rental.bookings) {
    if (b.status === 'aktif' && next.day > b.endDay) {
      b.status = 'telat';
      highlights.push(`Pengembalian motor oleh ${b.customerName} telat! Cek aplikasi Rental.`);
    }
  }

  // 5. Partner daily passive income
  for (const partner of next.partners) {
    if (!partner.active) continue;
    if (partner.id === 'laundry') {
      recordTransaction(next, {
        account: 'usaha',
        kind: 'masuk',
        category: 'warung',
        amount: 35_000,
        description: 'Komisi kerja sama Laundry Bu Ningsih',
      });
    } else if (partner.id === 'coffee_cart') {
      recordTransaction(next, {
        account: 'usaha',
        kind: 'masuk',
        category: 'warung',
        amount: 45_000,
        description: 'Bagi hasil promo Coffee Cart Bara',
      });
    }
  }

  // 6. Employees daily automation & wages
  for (const emp of next.employees) {
    if (!emp.hired) continue;
    if (next.accounts.usaha >= emp.dailyWage) {
      recordTransaction(next, {
        account: 'usaha',
        kind: 'keluar',
        category: 'gaji',
        amount: emp.dailyWage,
        description: `Upah harian ${emp.name} (${emp.roleTitle})`,
      });
      if (emp.id === 'petugas_kebersihan') {
        for (const r of next.rooms) {
          r.cleanliness = Math.min(100, r.cleanliness + 20);
        }
        employeeLogs.push(`${emp.name} membersihkan teras, koridor, & kamar kosong.`);
      } else if (emp.id === 'penjaga_warung' && next.warung.unlocked && next.warung.openToday) {
        const autoSales = next.warung.level === 2 ? 260_000 : 155_000;
        recordTransaction(next, {
          account: 'usaha',
          kind: 'masuk',
          category: 'warung',
          amount: autoSales,
          description: `Penjualan harian Warung dikelola ${emp.name}`,
        });
        next.warung.revenueToday += autoSales;
        employeeLogs.push(`${emp.name} melayani pelanggan warung (+${formatRp(autoSales)}).`);
      } else if (emp.id === 'admin_rental' && next.rental.unlocked) {
        for (const m of next.rental.motors) {
          if (m.status === 'tersedia') {
            m.tireHealth = Math.min(100, m.tireHealth + 4);
          }
        }
        employeeLogs.push(`${emp.name} cek rutin tekanan ban & jadwal serah terima rental.`);
      }
    } else {
      employeeLogs.push(`Saldo usaha ketat — ${emp.name} libur sehari menunggu kas cukup.`);
    }
  }

  // 7. Warung daily leftover & baseline sales if unlocked & open
  if (next.warung.unlocked && next.warung.openToday) {
    let dayProfit = 0;
    const isBazarOr17 = next.day === 16 || next.day === 25;
    const boost = isBazarOr17 ? 1.35 : 1;
    const occupiedCount = next.rooms.filter((r) => r.status === 'terisi').length;
    for (const item of next.warung.menu) {
      const demand = Math.min(
        item.dailyStock,
        Math.round((3 + occupiedCount * 1.6 + (next.warung.level === 2 ? 4 : 0)) * boost)
      );
      const leftover = Math.max(0, item.dailyStock - demand);
      item.soldToday = demand;
      item.leftoverYesterday = leftover;
      const rev = demand * item.price;
      const spoilLoss = Math.round(leftover * item.cost * 0.4);
      dayProfit += Math.max(0, rev - spoilLoss);
    }
    if (next.warung.raraConsignment === 'tetap' || next.warung.raraConsignment === 'uji_coba') {
      const soldDessert = Math.min(next.warung.raraBatchQty, 8 + occupiedCount * 2);
      const ownerCut = Math.round(soldDessert * 18_000 * (next.warung.raraOwnerSplitPct / 100));
      dayProfit += ownerCut;
    } else if (next.warung.raraConsignment === 'preorder') {
      const ownerCut = Math.round(10 * 18_000 * 0.25);
      dayProfit += ownerCut;
    }

    if (dayProfit > 0) {
      recordTransaction(next, {
        account: 'usaha',
        kind: 'masuk',
        category: 'warung',
        amount: dayProfit,
        description: `Hasil bersih Warung Kost Texas (Hari ${completedDay})`,
      });
      highlights.push(`Warung menghasilkan ${formatRp(dayProfit)} bersih (termasuk penyesuaian bahan sisa).`);
    }
  }

  // 8. Rumah Kontrakan upkeep / monthly rent
  if (next.kontrakan.owned) {
    if (!next.kontrakan.contractActive) {
      recordTransaction(next, {
        account: 'usaha',
        kind: 'keluar',
        category: 'kontrakan',
        amount: next.kontrakan.upkeepPerDay,
        description: 'Biaya perawatan rutin Rumah Kontrakan kosong',
      });
    } else if (next.day >= next.kontrakan.nextDueDay) {
      recordTransaction(next, {
        account: 'usaha',
        kind: 'masuk',
        category: 'kontrakan',
        amount: next.kontrakan.monthlyRent,
        description: `Sewa bulanan Rumah Kontrakan (${next.kontrakan.tenantFamilyName})`,
      });
      next.kontrakan.nextDueDay = next.day + 30;
      highlights.push(`Sewa Rumah Kontrakan masuk ${formatRp(next.kontrakan.monthlyRent)}!`);
    }
  }

  // 9. Rent due dates for active contracts
  for (const contract of next.contracts) {
    if (contract.status !== 'aktif') continue;
    const tenant = next.tenants.find((t) => t.id === contract.tenantId);
    const room = next.rooms.find((r) => r.id === contract.roomId);
    if (!tenant || !room) continue;

    if (next.day >= contract.nextDueDay) {
      contract.nextDueDay = next.day + 30;
      // Bima or shift tenant may request installment; others pay directly
      if (tenant.id === 'bima' && !next.debts.some((d) => d.counterpartyId === 'bima' && d.status === 'aktif')) {
        const half = Math.round(contract.monthlyRent / 2);
        recordTransaction(next, {
          account: 'usaha',
          kind: 'masuk',
          category: 'sewa',
          amount: half,
          description: `Cicilan sewa tahap 1 - ${tenant.name} (Kamar ${room.code})`,
        });
        const debt: DebtRecord = {
          id: nextId(next, 'debt'),
          counterpartyId: tenant.id,
          counterpartyName: tenant.name,
          kind: 'cicilan_sewa',
          account: 'usaha',
          direction: 'piutang',
          originalAmount: contract.monthlyRent,
          paidAmount: half,
          remainingAmount: contract.monthlyRent - half,
          promiseDay: next.day + 3,
          reliability: 'butuh_diingatkan',
          status: 'aktif',
          history: [{ day: next.day, amount: half, note: 'Bayar separuh dulu saat jatuh tempo' }],
        };
        next.debts.push(debt);
        highlights.push(`${tenant.name} bayar separuh sewa dulu (${formatRp(half)}), sisanya masuk catatan cicilan.`);
      } else {
        recordTransaction(next, {
          account: 'usaha',
          kind: 'masuk',
          category: 'sewa',
          amount: contract.monthlyRent,
          description: `Perpanjangan sewa Kamar ${room.code} - ${tenant.name}`,
        });
        highlights.push(`Sewa bulanan Kamar ${room.code} (${tenant.name}) masuk ${formatRp(contract.monthlyRent)}!`);
      }
    }
  }

  // 10. Trigger scripted & dynamic story events
  triggerDailyStoryEvents(next, highlights);

  // 11. Update room statuses & missions
  updateRoomStatesForSlot(next);
  evaluateMissionsAndPayouts(next);

  // Build Day Summary
  const summary: DaySummary = {
    dayCompleted: completedDay,
    newDay: next.day,
    weatherNewDay: next.weather,
    incomeUsaha,
    expenseUsaha,
    incomePribadi,
    expensePribadi,
    highlights:
      highlights.length > 0
        ? highlights
        : ['Suasana gang pagi ini tenang, burung berkicau di pohon mangga.'],
    employeeLogs,
  };

  if (next.day === 30) {
    const occupied = next.rooms.filter((r) => r.status === 'terisi').length;
    const totalRooms = Math.max(1, next.rooms.length);
    const totalRev = next.ledger
      .filter((t) => t.account === 'usaha' && t.kind === 'masuk' && t.category !== 'transfer_internal')
      .reduce((s, t) => s + t.amount, 0);
    summary.day30Report = {
      occupancyRate: Math.round((occupied / totalRooms) * 100),
      totalBalanceUsaha: next.accounts.usaha,
      totalBalancePribadi: next.accounts.pribadi,
      totalRevenue: totalRev,
      totalTenantsServed: next.tenants.filter((t) => t.status === 'menghuni' || t.status === 'mantan').length,
      avgReview: Number(next.reputation.toFixed(1)),
      missionsDone: next.missions.filter((m) => m.status === 'selesai').length,
      jandaPhotos: next.gallery.filter((p) => p.category === 'janda').length,
    };
  }

  next.daySummary = summary;
  return next;
}

function applyProjectCompletion(state: GameState, projectId: string, highlights: string[]) {
  switch (projectId) {
    case 'proj_kamar_102': {
      const r102 = makeRoom('kamar_102', '102', 1, 'standar', 0);
      state.rooms.push(r102);
      highlights.push('Kamar 102 selesai dibangun dan siap disewakan!');
      break;
    }
    case 'proj_fasilitas_teras': {
      state.facilities.terraceCanopy = true;
      state.facilities.terraceLights = true;
      state.facilities.packageRack = true;
      state.facilities.dryingArea = true;
      state.reputation = Math.min(5, state.reputation + 0.2);
      highlights.push('Kanopi teras, lampu hangat, rak paket, & area jemur selesai dipasang!');
      break;
    }
    case 'proj_wifi_pompa': {
      state.facilities.wifiLevel = Math.min(3, state.facilities.wifiLevel + 1);
      state.facilities.pumpLevel = Math.min(3, state.facilities.pumpLevel + 1);
      // Resolve wifi & pump issues automatically
      for (const issue of state.issues) {
        if (!issue.resolved && (issue.kind === 'wifi_lemah' || issue.kind === 'air_kecil')) {
          issue.resolved = true;
        }
      }
      highlights.push('Upgrade Wi-Fi repeater & pompa booster selesai! Sinyal dan air kini kencang.');
      break;
    }
    case 'proj_parkiran_mesincuci': {
      state.facilities.parkingSlots = 6;
      state.facilities.parkingOrganized = true;
      state.facilities.washingMachine = true;
      for (const issue of state.issues) {
        if (!issue.resolved && issue.kind === 'parkiran_penuh') issue.resolved = true;
      }
      highlights.push('Petak parkiran rapi (6 motor) & mesin cuci bersama siap digunakan!');
      break;
    }
    case 'proj_ruang_owner': {
      state.ownerRoom.built = true;
      state.ownerRoom.buildDaysLeft = 0;
      highlights.push('Ruang Pribadi Owner selesai! Bisa ganti baju, istirahat, & terima pasangan di kos.');
      break;
    }
    case 'proj_buka_rental': {
      state.rental.unlocked = true;
      if (state.rental.motors.length === 0) {
        state.rental.motors.push({
          id: 'motor_1',
          name: 'Honda Beat 2021 (Bekas)',
          plate: 'B 4120 TXS',
          dailyRate: 85_000,
          monthlyRate: 850_000,
          bundleRate: 650_000,
          km: 18_420,
          tireHealth: 76,
          batteryHealth: 72,
          bodyCondition: 'lecet_ringan',
          status: 'tersedia',
          serviceDaysLeft: 0,
          activeBookingId: null,
          inspectedInitial: false,
        });
      }
      highlights.push('Usaha Rental Motor resmi dibuka! Lakukan inspeksi awal pada motor pertama di HP > Rental.');
      break;
    }
    case 'proj_buka_warung': {
      state.warung.unlocked = true;
      state.warung.openToday = true;
      const restoProj = state.projects.find((p) => p.id === 'proj_restoran_kecil');
      if (restoProj && restoProj.status === 'terkunci') restoProj.status = 'tersedia';
      highlights.push('Warung Kost Texas resmi buka di depan gerbang!');
      // Trigger Rara dessert consignment chat if Rara exists
      if (state.warung.raraConsignment === 'none') {
        state.warung.raraConsignment = 'ditawarkan';
        pushNpcMessage(
          state,
          {
            id: 'rara',
            name: 'Rara',
            roleLabel: 'Baker Rumahan',
            hair: '#5c3728',
            skin: '#dfb089',
            outfit: 'cardigan_sling',
            locationHint: 'warung',
          },
          'Kak! Keren banget warungnya udah buka 🍮 Aku suka bikin dessert box, boleh titip jual di etalase nggak? Kita bisa mulai dari 10 cup dulu bagi hasil 25% buat warung!',
          [
            {
              id: 'rara_yes_10',
              label: 'Boleh banget! Mulai 10 cup, bagi hasil 25%.',
              action: { type: 'rara_consignment', mode: 'uji_coba', qty: 10, split: 25 },
            },
            {
              id: 'rara_preorder',
              label: 'Sistem pre-order aja biar nggak ada sisa.',
              action: { type: 'rara_consignment', mode: 'preorder', qty: 10, split: 25 },
            },
          ]
        );
      }
      break;
    }
    case 'proj_restoran_kecil': {
      state.warung.level = 2;
      state.warung.tables = 5;
      state.warung.menu.push({
        id: 'ayam_geprek_texas',
        name: 'Paket Ayam Bakar Madu',
        price: 26_000,
        cost: 13_000,
        dailyStock: 14,
        soldToday: 0,
        leftoverYesterday: 0,
        category: 'makanan',
      });
      highlights.push('Warung resmi naik kelas jadi Restoran Kecil Kost Texas!');
      break;
    }
    case 'proj_lantai_2': {
      state.buildingStage = 2;
      state.rooms.push(
        makeRoom('kamar_201', '201', 2, 'standar', 0),
        makeRoom('kamar_202', '202', 2, 'premium', 0)
      );
      const p3 = state.projects.find((p) => p.id === 'proj_lantai_3');
      if (p3 && p3.status === 'terkunci') p3.status = 'tersedia';
      addPhotoToGallery(state, {
        id: 'photo_kos_lantai2',
        title: 'Kost Texas Jadi Dua Lantai!',
        caption: 'Tangga kokoh dan dua kamar baru di lantai dua resmi beroperasi.',
        category: 'kos',
        sceneKey: 'kos_lantai2',
        locationTag: 'Lantai 2 Kost Texas',
      });
      highlights.push('Lantai Dua selesai dibangun! Kamar 201 & 202 siap diisi.');
      break;
    }
    case 'proj_lantai_3': {
      state.buildingStage = 3;
      state.facilities.commonRoomFloor3 = true;
      state.rooms.push(
        makeRoom('kamar_301', '301', 3, 'premium', 0),
        makeRoom('kamar_302', '302', 3, 'premium', 0)
      );
      highlights.push('Lantai Tiga selesai! Dua kamar premium + ruang bersama rooftop terbuka.');
      break;
    }
  }
}

function triggerDailyStoryEvents(state: GameState, highlights: string[]) {
  const occupiedTenants = state.tenants.filter((t) => t.status === 'menghuni');

  // Day 2: First rooms finish + applicants message!
  if (state.day === 2) {
    pushNpcMessage(
      state,
      {
        id: 'naya',
        name: 'Naya',
        roleLabel: 'Calon Penghuni (DKV)',
        hair: '#3a2621',
        skin: '#f1c7a5',
        outfit: 'oversized_cargo',
        locationHint: 'gerbang',
      },
      'Halo Kak! Aku lihat iklan Kost Texas yang kos bebas 24 jam. Kamar udah bisa dilihat hari ini? Aku lagi cari kamar yang Wi-Fi stabil sama meja enak buat nugas desain.',
      [
        {
          id: 'naya_tour',
          label: 'Boleh banget Nay! Ayo langsung lihat kamar.',
          action: { type: 'start_room_tour', tenantId: 'naya' },
        },
        {
          id: 'naya_later',
          label: 'Bisa banget, cek detail kamar dulu di Properti ya.',
          action: { type: 'chat_simple_reply', npcId: 'naya', text: 'Bisa banget, aku siapin kamarnya dulu ya.', followUp: 'Oke Kak, kabarin aja lewat menu Properti kalau udah siap tur!' },
        },
      ]
    );
    pushNpcMessage(
      state,
      {
        id: 'dimas',
        name: 'Dimas',
        roleLabel: 'Calon Penghuni (Shift Hotel)',
        hair: '#1f1f24',
        skin: '#c58c63',
        outfit: 'linen_slacks',
        locationHint: 'gerbang',
      },
      'Siang Kak, saya Dimas kerja shift hotel. Beneran di Kost Texas bebas pulang dini hari & pacar boleh mampir menginap tanpa izin ribet? Kalau iya, saya minat banget survei kamar!'
    );
    highlights.push('Pelamar pertama (Naya & Dimas) mulai menghubungi lewat HP > Pesan!');
  }

  // Day 3 or when first tenant moved in: Package delivery + First Complaint
  if (occupiedTenants.length > 0 && !state.issues.some((i) => i.kind === 'wifi_lemah')) {
    const t = occupiedTenants[0];
    const room = state.rooms.find((r) => r.id === t.roomId);
    const issue: BuildingIssue = {
      id: nextId(state, 'issue'),
      kind: 'wifi_lemah',
      roomId: room?.id,
      title: `Wi-Fi Lemah di Kamar ${room?.code || '101'}`,
      cause: 'Posisi router terlalu jauh dari kamar ujung dan belum ada repeater.',
      severity: 'sedang',
      dayCreated: state.day,
      inspected: false,
      tempFixed: false,
      resolved: false,
      tempCost: 120_000,
      fullCost: 480_000,
      reportedByTenantId: t.id,
    };
    state.issues.push(issue);
    pushNpcMessage(
      state,
      {
        id: t.id,
        name: t.name,
        roleLabel: `Penghuni Kamar ${room?.code || ''}`,
        hair: t.hairColor,
        skin: t.skinTone,
        outfit: t.outfitCasual,
        locationHint: 'router',
      },
      `Kak, sinyal Wi-Fi di Kamar ${room?.code || '101'} agak putus-nyambung pas upload file nih. Bisa dibantu cek router?`,
      [
        {
          id: 'wifi_promise',
          label: 'Besok pagi aku cek & beresin ya! (Buat janji)',
          action: {
            type: 'make_promise',
            npcId: t.id,
            npcName: t.name,
            kind: 'inspeksi',
            description: `Cek & perbaiki Wi-Fi Kamar ${room?.code || '101'}`,
            dueDay: state.day + 1,
            replyText: 'Siap, aku catat jadwal inspeksi router. Bakal aku beresin segera!',
            followUp: 'Makasih banyak Kak! Aku tunggu kabarnya ya.',
          },
        },
        {
          id: 'wifi_fix_now',
          label: 'Aku langsung pasang penguat sinyal penuh sekarang (-Rp480.000)',
          moneyCost: 480_000,
          account: 'usaha',
          action: { type: 'resolve_issue', issueId: issue.id, mode: 'full' },
        },
      ]
    );
  }

  // Package arrival event for side mission "Paket Nyasar"
  if (occupiedTenants.length > 0 && !state.packageWaitingForTenantId && state.day >= 3 && state.packageDeliveredCount === 0) {
    const target = occupiedTenants.find((t) => t.id === 'rara') || occupiedTenants[0];
    state.packageWaitingForTenantId = target.id;
    highlights.push(`Ada paket kurir di depan gerbang/rak paket untuk ${target.name}.`);
  }

  // Day 4: Adik asks for college practicum support + Janda cardboard box discovery
  if (state.day === 4) {
    state.adik.pendingRequestAmount = 350_000;
    state.adik.pendingRequestReason = 'Uang praktikum & bahan tugas semester ini';
    pushNpcMessage(
      state,
      {
        id: 'adik',
        name: `${state.adik.name} (Adik)`,
        roleLabel: `Kuliah di ${state.adik.city}`,
        hair: '#3a2822',
        skin: state.owner.skinTone,
        outfit: 'oversized_cargo',
      },
      'Kak, maaf ngerepotin... minggu ini ada biaya praktikum Rp350.000. Kalau lagi longgar boleh minta bantu transfer? Separuh dulu atau minggu depan juga nggak apa-apa kok!',
      [
        {
          id: 'adik_full',
          label: 'Kirim penuh Rp350.000 sekarang (Rek. Pribadi)',
          moneyCost: 350_000,
          account: 'pribadi',
          action: { type: 'transfer_adik', amount: 350_000, mode: 'full' },
        },
        {
          id: 'adik_half',
          label: 'Kirim separuh dulu Rp175.000',
          moneyCost: 175_000,
          account: 'pribadi',
          action: { type: 'transfer_adik', amount: 175_000, mode: 'partial' },
        },
        {
          id: 'adik_promise',
          label: 'Nanti Hari ke-7 aku kirim ya (Catat Kalender)',
          action: {
            type: 'make_promise',
            npcId: 'adik',
            npcName: state.adik.name,
            kind: 'adik',
            description: 'Transfer uang praktikum Rani Rp350.000',
            dueDay: state.day + 3,
            replyText: 'Bentar ya Ran, aku jadwalkan kirim di Hari ke-7!',
            followUp: 'Oke Kak, makasih banyak! Semangat ngurus Kost Texas ❤️',
          },
        },
      ]
    );

    if (!state.janda.boxFound) {
      state.janda.currentSpot = 'kardus_paket';
      highlights.push('Janda ketahuan duduk santai di dalam kardus paket dekat teras!');
    }
  }

  // Day 5: Tenant installment request for "Nunggu Gajian" + Terrace noise / parking feedback
  if (state.day === 5 && occupiedTenants.length > 0 && !state.debts.some((d) => d.kind === 'cicilan_sewa')) {
    const t = occupiedTenants[0];
    const debtAmount = 400_000;
    pushNpcMessage(
      state,
      {
        id: t.id,
        name: t.name,
        roleLabel: 'Penghuni',
        hair: t.hairColor,
        skin: t.skinTone,
        outfit: t.outfitCasual,
      },
      `Kak, boleh nggak tagihan tambahan utilitas & deposit Rp400.000 aku cicil 2x? Separuh hari ini, sisanya pas gajian lusa.`,
      [
        {
          id: 'cicil_ok',
          label: 'Boleh bayar separuh dulu, sisanya dicatat di Bank.',
          action: { type: 'create_tenant_installment', tenantId: t.id, total: debtAmount },
        },
      ]
    );
  }

  // Day 6: Naya preloved story OR Bara coffee hangout invite
  if (state.day === 6) {
    const naya = state.tenants.find((t) => t.id === 'naya');
    if (naya && naya.status === 'menghuni' && !state.facilities.nayaprelovedRack) {
      pushNpcMessage(
        state,
        {
          id: 'naya',
          name: 'Naya',
          roleLabel: 'Penghuni',
          hair: naya.hairColor,
          skin: naya.skinTone,
          outfit: naya.outfitCasual,
          locationHint: 'teras',
        },
        'Kak, akhir pekan ini aku mau gelar preloved baju & tote bag kecil-kecilan di teras. Boleh pinjam/pasang rak pajang biar rapi nggak?',
        [
          {
            id: 'naya_rack_buy',
            label: 'Gas! Aku pasangin rak preloved di teras (-Rp250.000)',
            moneyCost: 250_000,
            account: 'usaha',
            action: { type: 'install_naya_rack' },
          },
        ]
      );
    }

    pushNpcMessage(
      state,
      {
        id: 'bara',
        name: 'Bara (Coffee Cart)',
        roleLabel: 'Pemilik Coffee Cart Gang',
        hair: '#2c231e',
        skin: '#c58c63',
        outfit: 'baju_ngopi',
        locationHint: 'coffee_cart',
      },
      'Halo tetangga baru! Sore ini mampir ngopi yuk ke gerobakku di depan gang, ada seduhan baru pas banget buat ngobrol santai habis ngurus kos.',
      [
        {
          id: 'bara_meet',
          label: 'Yuk! Aku catat jadwal ngopi sore ini.',
          action: { type: 'schedule_npc_hangout', npcId: 'bara', place: 'Coffee Cart Gang' },
        },
      ]
    );
  }

  // Day 7-8 Rain: Roof leak issue
  if (state.day === 8 && !state.issues.some((i) => i.kind === 'atap_bocor')) {
    const leak: BuildingIssue = {
      id: nextId(state, 'issue'),
      kind: 'atap_bocor',
      roomId: state.rooms[0]?.id,
      title: 'Atap Rembes Saat Hujan Deras',
      cause: 'Hujan beruntun memperparah genteng bergeser di sisi teras & kamar depan.',
      severity: 'parah',
      dayCreated: state.day,
      inspected: false,
      tempFixed: false,
      resolved: false,
      tempCost: 180_000,
      fullCost: 650_000,
    };
    state.issues.push(leak);
    highlights.push('Hujan deras bikin atap rembes! Segera cek di HP > Properti > Keluhan.');
  }

  // Day 9: Dimas couple contract story (if Dimas is a tenant)
  if (state.day === 9) {
    const dimas = state.tenants.find((t) => t.id === 'dimas' && t.status === 'menghuni');
    if (dimas && !dimas.hasCoupleContract) {
      pushNpcMessage(
        state,
        {
          id: 'dimas',
          name: 'Dimas',
          roleLabel: 'Penghuni',
          hair: dimas.hairColor,
          skin: dimas.skinTone,
          outfit: dimas.outfitWork,
        },
        'Kak, Alya kan udah sering mampir menginap. Kami kepikiran sekalian ajukan kontrak bersama biar dia resmi ikut menetap (+Rp250.000/bulan). Gimana Kak?',
        [
          {
            id: 'dimas_couple_ok',
            label: 'Boleh banget! Aku ubah jadi kontrak bersama (+Rp250.000/bln).',
            action: { type: 'approve_couple_contract', tenantId: 'dimas', partnerName: 'Alya', extraRent: 250_000 },
          },
        ]
      );
    }
  }

  // Day 10: Adik visits at Gate!
  if (state.day === 10) {
    state.adik.visitingToday = true;
    pushNpcMessage(
      state,
      {
        id: 'adik',
        name: `${state.adik.name} (Adik)`,
        roleLabel: `Kuliah di ${state.adik.city}`,
        hair: '#3a2822',
        skin: state.owner.skinTone,
        outfit: 'oversized_cargo',
        locationHint: 'gerbang',
      },
      'Kak!! Aku udah sampai di depan gerbang Kost Texas nih! Wah bangunannya udah beda banget dibanding foto hari pertama 😭 Sini keluar gerbang yuk!'
    );
    highlights.push(`${state.adik.name} (Adik) datang berkunjung di Gerbang Kost Texas!`);
  } else {
    state.adik.visitingToday = false;
  }

  // Day 13: Competitor kos opens across the alley
  if (state.day === 13) {
    state.competitorNearbyActive = true;
    highlights.push('Kos baru buka di seberang gang! Perkuat fasilitas atau tawarkan paket kamar + motor.');
  }

  // Day 15: Tenant sends cute Janda photo (especially after Floor 2 or close relationship)
  if (state.day >= 12 && !state.janda.tenantPhotoReceived && occupiedTenants.length > 0) {
    const sender = occupiedTenants[0];
    state.janda.tenantPhotoReceived = true;
    const p = addPhotoToGallery(state, {
      id: 'photo_janda_tenant',
      title: `Janda Main Bareng ${sender.name}`,
      caption: `${sender.name} memotret Janda yang santai keliling koridor kos.`,
      category: 'janda',
      sceneKey: 'janda_lantai2',
      locationTag: state.buildingStage >= 2 ? 'Lantai 2' : 'Koridor Kos',
    });
    pushNpcMessage(
      state,
      {
        id: sender.id,
        name: sender.name,
        roleLabel: 'Penghuni',
        hair: sender.hairColor,
        skin: sender.skinTone,
        outfit: sender.outfitCasual,
      },
      'Kak, lihat deh siapa yang mampir depan kamarku terus tidur melingkar 😂 Aku fotoin buat galeri Kakak ya!',
      undefined,
      p.id
    );
    highlights.push(`${sender.name} mengirim foto gemas Janda lewat chat!`);
  }

  // Day 22: 25-box campus order if Warung unlocked
  if (state.day === 22 && state.warung.unlocked && !state.warung.campusOrder.resolved) {
    state.warung.campusOrder.active = true;
    pushNpcMessage(
      state,
      {
        id: 'panitia_kampus',
        name: 'Fikri (Panitia Kampus)',
        roleLabel: 'BEM Kampus Sebelah',
        hair: '#222',
        skin: '#dfb089',
        outfit: 'hoodie_tote',
        locationHint: 'warung',
      },
      'Halo Kak! Besok ada acara kampus, kami butuh pesan 25 kotak nasi dari Warung Kost Texas. Stok dapur sekarang cukup atau mau dibagi gimana Kak?',
      [
        {
          id: 'order_15',
          label: 'Terima 15 kotak sesuai stok dapur (+Rp240.000)',
          action: { type: 'resolve_campus_order', choice: 'terima_15' },
        },
        {
          id: 'order_buy',
          label: 'Belanja stok tambahan & kerjakan semua 25 kotak (Modal Rp150rb → +Rp450rb)',
          moneyCost: 150_000,
          account: 'usaha',
          action: { type: 'resolve_campus_order', choice: 'beli_stok' },
        },
        {
          id: 'order_split',
          label: 'Bagi pesanan dengan warung sebelah (Semua beres, +Rp290.000 & relasi gang naik)',
          action: { type: 'resolve_campus_order', choice: 'bagi_tetangga' },
        },
      ]
    );
    highlights.push('Panitia kampus pesan 25 kotak makanan! Cek HP > Pesan atau Warung.');
  }

  // Rental dynamic incident & transfer claim generator when rental is active
  if (state.rental.unlocked) {
    const activeBooking = state.rental.bookings.find((b) => b.status === 'aktif');
    if (activeBooking && !state.rental.incidents.some((inc) => !inc.resolved) && state.day % 4 === 0) {
      const motor = state.rental.motors.find((m) => m.id === activeBooking.motorId);
      if (motor) {
        motor.status = 'mogok';
        motor.batteryHealth = Math.max(15, motor.batteryHealth - 35);
        const incidentId = nextId(state, 'inc');
        state.rental.incidents.push({
          id: incidentId,
          bookingId: activeBooking.id,
          motorId: motor.id,
          customerName: activeBooking.customerName,
          kind: 'mogok',
          locationText: 'Dekat Gerbang Kampus',
          day: state.day,
          resolved: false,
        });
        pushNpcMessage(
          state,
          {
            id: `rental_${activeBooking.id}`,
            name: `${activeBooking.customerName} (Rental)`,
            roleLabel: `Penyewa ${motor.name}`,
            hair: '#2a2625',
            skin: '#c58c63',
            outfit: 'helm_riding',
            locationHint: 'bengkel',
          },
          'Kak, motornya mati deket kampus. Aku ada kelas jam 2, bisa dibantu?',
          [
            {
              id: 'inc_mech',
              label: 'Aku kirim mekanik Mas Agung (-Rp95.000)',
              moneyCost: 95_000,
              account: 'usaha',
              action: { type: 'resolve_rental_incident', incidentId, mode: 'mekanik' },
            },
            {
              id: 'inc_swap',
              label: 'Antar unit pengganti (1 slot waktu)',
              timeCost: 1,
              action: { type: 'resolve_rental_incident', incidentId, mode: 'pengganti' },
            },
            {
              id: 'inc_refund',
              label: 'Jemput motor & refund sebagian Rp40.000',
              moneyCost: 40_000,
              account: 'usaha',
              action: { type: 'resolve_rental_incident', incidentId, mode: 'refund' },
            },
          ]
        );
        highlights.push(`Darurat Rental: Motor ${motor.name} mogok dekat kampus!`);
      }
    }
  }

  // Post Day-30 endless dynamic gang calendar events
  if (state.day > 30 && state.day % 5 === 0) {
    const endlessPool = [
      {
        title: 'Bazar Kuliner Mahasiswa',
        desc: 'Mahasiswa bikin bazar di ujung gang. Omzet warung & permintaan rental motor naik!',
      },
      {
        title: 'Gelombang Magang Baru',
        desc: 'Banyak pekerja muda cari kamar bebas 24 jam & paket kos + motor.',
      },
      {
        title: 'Kerja Bakti Gang Tropis',
        desc: 'Warga gang bersih-bersih bareng, reputasi Kost Texas naik.',
      },
    ];
    const pick = endlessPool[state.day % endlessPool.length];
    addCalendarEvent(state, {
      day: state.day,
      title: pick.title,
      category: 'acara',
      description: pick.desc,
    });
    highlights.push(`Kabar Gang Hari ${state.day}: ${pick.title}`);
  }
}

export type GameAction =
  | { type: 'clear_toast'; id: string }
  | { type: 'dismiss_day_summary' }
  | { type: 'toggle_mute' }
  | { type: 'toggle_reduced_motion' }
  | { type: 'set_floor_view'; floor: 1 | 2 | 3 }
  | { type: 'toggle_cutaway' }
  | { type: 'move_owner'; x: number; y: number; floor?: 1 | 2 | 3 }
  | { type: 'change_outfit'; outfitId: string }
  | { type: 'update_appearance'; patch: Partial<OwnerAppearance> }
  | { type: 'mark_thread_read'; threadId: string }
  | { type: 'pin_mission'; missionId: string }
  | { type: 'advance_slot' }
  | { type: 'advance_day' }
  | { type: 'chat_reply'; threadId: string; messageId: string; replyId: string }
  | { type: 'start_project'; projectId: string }
  | { type: 'start_room_tour'; tenantId: string; roomId?: string }
  | { type: 'checkin_tenant'; tenantId: string; roomId: string; monthlyRent: number; bundleMotorId?: string }
  | { type: 'checkout_tenant'; roomId: string; damageDeduction: number }
  | { type: 'set_room_rent'; roomId: string; rent: number }
  | { type: 'place_furniture'; roomId: string; furnitureType: FurnitureType; x: number; y: number }
  | { type: 'remove_furniture'; roomId: string; furnitureId: string }
  | { type: 'inspect_issue'; issueId: string }
  | { type: 'resolve_issue'; issueId: string; mode: 'temp' | 'full' }
  | { type: 'move_bench'; position: 'dekat_kamar' | 'tengah' | 'dekat_gerbang' }
  | { type: 'organize_parking' }
  | { type: 'install_soundproof' }
  | { type: 'deliver_package' }
  | { type: 'greet_first_night' }
  | { type: 'greet_adik' }
  | { type: 'bank_transfer_internal'; from: AccountType; to: AccountType; amount: number }
  | { type: 'transfer_adik'; amount: number; mode?: 'full' | 'partial' | 'gift' }
  | { type: 'record_debt_payment'; debtId: string; amount: number }
  | { type: 'remind_debt'; debtId: string }
  | { type: 'create_rental_booking'; customerName: string; motorId: string; days: number; rateType: 'harian' | 'bulanan'; claimKind: TransferClaim['kind'] }
  | { type: 'inspect_motor'; motorId: string; inspection: MotorInspection }
  | { type: 'match_transfer_claim'; claimId: string; mutationId: string }
  | { type: 'handle_transfer_claim'; claimId: string; decision: 'tahan' | 'cek_ulang' | 'percaya' | 'tolak' }
  | { type: 'complete_rental_return'; bookingId: string; newScratchCharge: number }
  | { type: 'send_motor_service'; motorId: string; tier: 'reguler' | 'cepat' }
  | { type: 'buy_second_motor' }
  | { type: 'resolve_rental_incident'; incidentId: string; mode: 'mekanik' | 'pengganti' | 'refund' }
  | { type: 'warung_toggle_open' }
  | { type: 'warung_update_stock'; itemId: string; delta: number }
  | { type: 'warung_update_price'; itemId: string; price: number }
  | { type: 'warung_complete_rush_hour'; ordersCompleted: number; revenue: number }
  | { type: 'rara_consignment'; mode: 'uji_coba' | 'tetap' | 'preorder'; qty: number; split: number }
  | { type: 'resolve_campus_order'; choice: 'terima_15' | 'beli_stok' | 'bagi_tetangga' }
  | { type: 'kontrakan_buy' }
  | { type: 'kontrakan_renovate' }
  | { type: 'kontrakan_advertise' }
  | { type: 'kontrakan_accept_applicant'; applicantId: string }
  | { type: 'toggle_partner'; partnerId: 'bengkel' | 'laundry' | 'tukang' | 'coffee_cart' | 'pemasok' }
  | { type: 'toggle_employee'; employeeId: 'penjaga_warung' | 'petugas_kebersihan' | 'admin_rental' }
  | { type: 'meet_relationship_npc'; npcId: 'bara' | 'laras' | 'kei'; activity: string; romantic?: boolean }
  | { type: 'owner_room_action'; action: 'eat' | 'invite_partner' }
  | { type: 'janda_care'; care: 'place_bowl_bed' | 'feed' | 'water' | 'pet' | 'place_box'; location?: 'teras' | 'ruang_owner' }
  | { type: 'janda_minigame_complete'; game: 'kejar_tali' | 'janda_dimana' | 'foto_pas'; theme?: string; spotFound?: JandaSpotId }
  | { type: 'gallery_send_adik'; photoId: string }
  | { type: 'gallery_set_wallpaper'; photoId: string }
  | { type: 'gallery_toggle_display'; photoId: string };

export function applyAction(state: GameState, action: GameAction): GameState {
  if (action.type === 'advance_slot') return advanceTimeSlot(state);
  if (action.type === 'advance_day') return advanceDay(state);

  const next = cloneState(state);

  switch (action.type) {
    case 'clear_toast':
      next.toasts = next.toasts.filter((t) => t.id !== action.id);
      return next;

    case 'dismiss_day_summary':
      next.daySummary = null;
      return next;

    case 'toggle_mute':
      next.settings.muted = !next.settings.muted;
      return next;

    case 'toggle_reduced_motion':
      next.settings.reducedMotion = !next.settings.reducedMotion;
      return next;

    case 'set_floor_view':
      if (action.floor <= Math.max(1, next.buildingStage)) {
        next.activeFloorView = action.floor;
        next.ownerPos.floor = action.floor;
      }
      return next;

    case 'toggle_cutaway':
      next.cutawayEnabled = !next.cutawayEnabled;
      return next;

    case 'move_owner':
      next.ownerPos.x = action.x;
      next.ownerPos.y = action.y;
      if (action.floor) {
        next.ownerPos.floor = action.floor;
        next.activeFloorView = action.floor;
      }
      return next;

    case 'change_outfit':
      next.owner.outfitId = action.outfitId;
      pushToast(next, 'Outfit diganti! Tampilan di peta & chat ikut berubah.', 'info');
      return next;

    case 'update_appearance':
      next.owner = { ...next.owner, ...action.patch };
      return next;

    case 'mark_thread_read': {
      const th = next.chats.find((c) => c.id === action.threadId);
      if (th) th.unread = 0;
      return next;
    }

    case 'pin_mission':
      for (const m of next.missions) {
        m.pinned = m.id === action.missionId ? !m.pinned : false;
      }
      return next;

    case 'chat_reply': {
      const th = next.chats.find((c) => c.id === action.threadId);
      const msg = th?.messages.find((m) => m.id === action.messageId);
      const rep = msg?.replies?.find((r) => r.id === action.replyId);
      if (!th || !msg || !rep || msg.repliesUsed) return next;

      if (rep.moneyCost && rep.account && next.accounts[rep.account] < rep.moneyCost) {
        pushToast(next, `Saldo rekening ${rep.account} belum cukup (${formatRp(rep.moneyCost)}).`, 'warning');
        return next;
      }

      msg.repliesUsed = true;
      pushOwnerMessage(next, th.npcId, rep.label);

      const act = rep.action;
      if (act.type === 'chat_simple_reply') {
        if (typeof act.followUp === 'string') {
          th.messages.push({
            id: nextId(next, 'msg'),
            sender: 'npc',
            text: act.followUp,
            day: next.day,
            slot: next.slot,
          });
        }
      } else if (act.type === 'make_promise') {
        next.promises.push({
          id: nextId(next, 'prom'),
          npcId: String(act.npcId),
          npcName: String(act.npcName),
          description: String(act.description),
          dueDay: Number(act.dueDay),
          fulfilled: false,
          missed: false,
          kind: act.kind as GameState['promises'][number]['kind'],
        });
        addCalendarEvent(next, {
          day: Number(act.dueDay),
          title: `Janji: ${String(act.description)}`,
          category: act.kind === 'adik' ? 'pribadi' : 'tukang',
          description: `Kesepakatan chat bersama ${String(act.npcName)}.`,
        });
        if (typeof act.followUp === 'string') {
          th.messages.push({
            id: nextId(next, 'msg'),
            sender: 'npc',
            text: act.followUp,
            day: next.day,
            slot: next.slot,
          });
        }
        pushToast(next, `Janji dicatat di Kalender (Hari ${String(act.dueDay)}).`, 'success');
      } else if (act.type === 'start_room_tour') {
        return applyAction(next, { type: 'start_room_tour', tenantId: String(act.tenantId) });
      } else if (act.type === 'resolve_issue') {
        return applyAction(next, {
          type: 'resolve_issue',
          issueId: String(act.issueId),
          mode: act.mode as 'temp' | 'full',
        });
      } else if (act.type === 'transfer_adik') {
        return applyAction(next, {
          type: 'transfer_adik',
          amount: Number(act.amount),
          mode: act.mode as 'full' | 'partial',
        });
      } else if (act.type === 'create_tenant_installment') {
        const tenant = next.tenants.find((t) => t.id === act.tenantId);
        const total = Number(act.total);
        const half = Math.round(total / 2);
        if (tenant) {
          recordTransaction(next, {
            account: 'usaha',
            kind: 'masuk',
            category: 'cicilan',
            amount: half,
            description: `Cicilan tahap 1 - ${tenant.name}`,
          });
          next.debts.push({
            id: nextId(next, 'debt'),
            counterpartyId: tenant.id,
            counterpartyName: tenant.name,
            kind: 'cicilan_sewa',
            account: 'usaha',
            direction: 'piutang',
            originalAmount: total,
            paidAmount: half,
            remainingAmount: total - half,
            promiseDay: next.day + 2,
            reliability: 'tepat',
            status: 'aktif',
            history: [{ day: next.day, amount: half, note: 'DP cicilan tahap 1' }],
          });
          th.messages.push({
            id: nextId(next, 'msg'),
            sender: 'npc',
            text: `Makasih banyak Kak! Separuhnya (${formatRp(half)}) udah aku transfer ya, sisanya aku lunasin lusa!`,
            day: next.day,
            slot: next.slot,
          });
          pushToast(next, `Cicilan dicatat di Bank. DP ${formatRp(half)} masuk rekening usaha!`, 'success');
        }
      } else if (act.type === 'install_naya_rack') {
        recordTransaction(next, {
          account: 'usaha',
          kind: 'keluar',
          category: 'renovasi',
          amount: 250_000,
          description: 'Pasang rak preloved teras untuk Naya',
        });
        next.facilities.nayaprelovedRack = true;
        th.messages.push({
          id: nextId(next, 'msg'),
          sender: 'npc',
          text: 'Waaah makasih banget Kak!! Raknya cakep banget, nanti aku rekomendasikan Kost Texas ke adik tingkat juga ya ✨',
          day: next.day,
          slot: next.slot,
        });
      } else if (act.type === 'rara_consignment') {
        return applyAction(next, {
          type: 'rara_consignment',
          mode: act.mode as 'uji_coba' | 'tetap' | 'preorder',
          qty: Number(act.qty),
          split: Number(act.split),
        });
      } else if (act.type === 'approve_couple_contract') {
        const tenant = next.tenants.find((t) => t.id === act.tenantId);
        const contract = next.contracts.find((c) => c.tenantId === act.tenantId && c.status === 'aktif');
        const room = next.rooms.find((r) => r.id === contract?.roomId);
        if (tenant && contract && room) {
          tenant.hasCoupleContract = true;
          contract.isCoupleContract = true;
          contract.monthlyRent += Number(act.extraRent || 250_000);
          room.coTenantName = String(act.partnerName || 'Alya');
          room.monthlyRent = contract.monthlyRent;
          th.messages.push({
            id: nextId(next, 'msg'),
            sender: 'npc',
            text: `Mantap Kak! Makasih banyak, sekarang aku sama ${room.coTenantName} tenang deh menetap resmi di Kamar ${room.code}.`,
            day: next.day,
            slot: next.slot,
          });
          pushToast(next, `Kontrak bersama ${tenant.name} & ${room.coTenantName} aktif!`, 'success');
        }
      } else if (act.type === 'schedule_npc_hangout') {
        const npc = next.relationships.find((r) => r.id === act.npcId);
        if (npc) {
          npc.scheduledDateDay = next.day;
          npc.scheduledDateSlot = 'sore';
          npc.scheduledDatePlace = String(act.place || 'Coffee Cart');
          addCalendarEvent(next, {
            day: next.day,
            title: `Ngopi bareng ${npc.name}`,
            category: 'pribadi',
            description: `Pertemuan di ${npc.scheduledDatePlace}. Datangi lewat Peta Gang atau dekati lokasi.`,
          });
          th.messages.push({
            id: nextId(next, 'msg'),
            sender: 'npc',
            text: 'Sip! Aku tunggu di dekat Coffee Cart ya, tinggal samperin kapan aja hari ini ☕',
            day: next.day,
            slot: next.slot,
          });
        }
      } else if (act.type === 'resolve_campus_order') {
        return applyAction(next, {
          type: 'resolve_campus_order',
          choice: act.choice as 'terima_15' | 'beli_stok' | 'bagi_tetangga',
        });
      } else if (act.type === 'resolve_rental_incident') {
        return applyAction(next, {
          type: 'resolve_rental_incident',
          incidentId: String(act.incidentId),
          mode: act.mode as 'mekanik' | 'pengganti' | 'refund',
        });
      }
      break;
    }

    case 'start_project': {
      const proj = next.projects.find((p) => p.id === action.projectId);
      if (!proj || proj.status !== 'tersedia') return next;
      const tukangPartner = next.partners.find((p) => p.id === 'tukang' && p.active);
      const finalCost = tukangPartner ? Math.round(proj.cost * 0.9) : proj.cost;
      if (next.accounts.usaha < finalCost) {
        pushToast(next, `Saldo rekening usaha tidak cukup. Butuh ${formatRp(finalCost)}.`, 'warning');
        return next;
      }
      recordTransaction(next, {
        account: 'usaha',
        kind: 'keluar',
        category: 'renovasi',
        amount: finalCost,
        description: `Proyek: ${proj.title}`,
      });
      proj.status = 'berjalan';
      proj.remainingDays = proj.durationDays;
      proj.stageLabel = 'fondasi';
      if (proj.id === 'proj_ruang_owner') {
        next.ownerRoom.buildDaysLeft = proj.durationDays;
      }
      addCalendarEvent(next, {
        day: next.day + proj.durationDays,
        title: `Selesai: ${proj.title}`,
        category: 'tukang',
        description: proj.impactText,
      });
      pushToast(next, `Proyek "${proj.title}" dimulai! Estimasi ${proj.durationDays} hari.`, 'success');
      break;
    }

    case 'start_room_tour': {
      const tenant = next.tenants.find((t) => t.id === action.tenantId);
      const room = action.roomId
        ? next.rooms.find((r) => r.id === action.roomId && r.status === 'kosong')
        : next.rooms.find((r) => r.status === 'kosong');
      if (!tenant || !room) {
        pushToast(next, 'Belum ada kamar kosong siap tur. Tunggu kamar selesai dibangun dulu!', 'warning');
        return next;
      }
      room.status = 'tur';
      room.statusLabel = `Tur bersama ${tenant.name}`;
      tenant.status = 'tur';
      next.activeTourTenantId = tenant.id;
      next.activeTourRoomId = room.id;
      const spotKey = room.id as MapSpotId;
      if (MAP_SPOTS[spotKey]) {
        next.ownerPos = { ...MAP_SPOTS[spotKey] };
        next.activeFloorView = room.floor;
      }
      pushToast(next, `Kamu mengajak ${tenant.name} tur melihat Kamar ${room.code}! Sekarang bisa lanjut Check-In.`, 'info');
      break;
    }

    case 'checkin_tenant': {
      const tenant = next.tenants.find((t) => t.id === action.tenantId);
      const room = next.rooms.find((r) => r.id === action.roomId);
      if (!tenant || !room || (room.status !== 'kosong' && room.status !== 'tur')) {
        pushToast(next, 'Kamar ini sedang tidak tersedia untuk check-in.', 'warning');
        return next;
      }

      let bundleMotorId: string | null = null;
      let totalRent = action.monthlyRent;
      if (action.bundleMotorId) {
        const motor = next.rental.motors.find((m) => m.id === action.bundleMotorId && m.status === 'tersedia');
        if (motor) {
          bundleMotorId = motor.id;
          totalRent += motor.bundleRate;
          motor.status = 'dipakai';
          const bId = nextId(next, 'book');
          motor.activeBookingId = bId;
          next.rental.bookings.push({
            id: bId,
            customerName: tenant.name,
            tenantId: tenant.id,
            motorId: motor.id,
            startDay: next.day,
            endDay: next.day + 30,
            rateType: 'paket_kos',
            totalFee: motor.bundleRate,
            deposit: 0,
            paidAmount: motor.bundleRate,
            status: 'aktif',
          });
        }
      }

      room.status = 'terisi';
      room.tenantId = tenant.id;
      room.monthlyRent = totalRent;
      tenant.status = 'menghuni';
      tenant.roomId = room.id;
      tenant.bundleMotorId = bundleMotorId;
      next.activeTourTenantId = null;
      next.activeTourRoomId = null;

      const contract: Contract = {
        id: nextId(next, 'ctr'),
        tenantId: tenant.id,
        roomId: room.id,
        startDay: next.day,
        nextDueDay: next.day + 30,
        monthlyRent: totalRent,
        depositHeld: room.depositAmount,
        isCoupleContract: false,
        bundleMotorId,
        status: 'aktif',
        lateDays: 0,
      };
      next.contracts.push(contract);

      // Record rent & deposit as TWO distinct transactions!
      recordTransaction(next, {
        account: 'usaha',
        kind: 'masuk',
        category: 'sewa',
        amount: totalRent,
        description: `Sewa bulan pertama Kamar ${room.code} - ${tenant.name}${bundleMotorId ? ' (Paket + Motor)' : ''}`,
      });
      recordTransaction(next, {
        account: 'usaha',
        kind: 'masuk',
        category: 'deposit',
        amount: room.depositAmount,
        description: `Deposit titipan Kamar ${room.code} - ${tenant.name}`,
      });

      addCalendarEvent(next, {
        day: contract.nextDueDay,
        title: `Jatuh Tempo Sewa Kamar ${room.code} (${tenant.name})`,
        category: 'tagihan',
        description: `Tagihan sewa bulanan ${formatRp(totalRent)}.`,
      });

      pushNpcMessage(
        next,
        {
          id: tenant.id,
          name: tenant.name,
          roleLabel: `Penghuni Kamar ${room.code}`,
          hair: tenant.hairColor,
          skin: tenant.skinTone,
          outfit: tenant.outfitCasual,
          locationHint: room.id as MapSpotId,
        },
        `Resmi pindah ke Kamar ${room.code}! Sewa pertama + deposit udah aku transfer ya Kak. Seneng banget akhirnya dapet kos bebas 24 jam yang rapi!`
      );

      updateRoomStatesForSlot(next);
      pushToast(next, `${tenant.name} resmi check-in di Kamar ${room.code}!`, 'success');
      break;
    }

    case 'checkout_tenant': {
      const room = next.rooms.find((r) => r.id === action.roomId);
      const contract = next.contracts.find((c) => c.roomId === action.roomId && c.status === 'aktif');
      const tenant = next.tenants.find((t) => t.id === contract?.tenantId);
      if (!room || !contract || !tenant) return next;

      const deduction = Math.min(contract.depositHeld, Math.max(0, action.damageDeduction));
      const refund = contract.depositHeld - deduction;
      if (refund > 0) {
        recordTransaction(next, {
          account: 'usaha',
          kind: 'keluar',
          category: 'deposit',
          amount: refund,
          description: `Pengembalian deposit checkout ${tenant.name} (Kamar ${room.code})`,
        });
      }
      contract.status = 'selesai';
      tenant.status = 'mantan';
      tenant.roomId = null;
      tenant.movedOutDay = next.day;
      room.status = 'kosong';
      room.tenantId = null;
      room.coTenantName = null;
      room.guestStayingName = null;
      room.cleanliness = 75;
      room.statusLabel = 'Siap huni';

      pushNpcMessage(
        next,
        {
          id: tenant.id,
          name: `${tenant.name} (Eks Penghuni)`,
          roleLabel: 'Mantan Penghuni',
          hair: tenant.hairColor,
          skin: tenant.skinTone,
          outfit: tenant.outfitCasual,
        },
        `Makasih banyak selama tinggal di Kost Texas ya Kak! Deposit udah beres. Nanti kalau lewat gang aku mampir nyapa Janda deh 😊`
      );
      pushToast(next, `Checkout ${tenant.name} selesai. Deposit kembali ${formatRp(refund)}.`, 'info');
      break;
    }

    case 'set_room_rent': {
      const room = next.rooms.find((r) => r.id === action.roomId);
      if (room) {
        room.monthlyRent = Math.max(500_000, action.rent);
      }
      break;
    }

    case 'place_furniture': {
      const room = next.rooms.find((r) => r.id === action.roomId);
      const item = FURNITURE_CATALOG.find((f) => f.type === action.furnitureType);
      if (!room || !item) return next;
      // Keep doorway cell (x=2, y=3) always clear!
      if (action.x === 2 && action.y === 3) {
        pushToast(next, 'Petak pintu (C4) harus tetap kosong agar jalur masuk tidak terhalang!', 'warning');
        return next;
      }
      if (room.furniture.some((f) => f.x === action.x && f.y === action.y)) {
        pushToast(next, 'Petak tersebut sudah terisi perabot. Hapus dulu atau pilih petak lain.', 'warning');
        return next;
      }
      if (next.accounts.usaha < item.cost) {
        pushToast(next, `Saldo usaha belum cukup (${formatRp(item.cost)}).`, 'warning');
        return next;
      }
      recordTransaction(next, {
        account: 'usaha',
        kind: 'keluar',
        category: 'renovasi',
        amount: item.cost,
        description: `Beli ${item.name} untuk Kamar ${room.code}`,
      });
      room.furniture.push({
        id: nextId(next, 'furn'),
        type: item.type,
        x: action.x,
        y: action.y,
      });
      recalcRoomMetrics(room, next.facilities);
      pushToast(next, `${item.name} dipasang di Kamar ${room.code}! Kenyamanan jadi ${room.comfortScore}.`, 'success');
      break;
    }

    case 'remove_furniture': {
      const room = next.rooms.find((r) => r.id === action.roomId);
      if (!room) return next;
      room.furniture = room.furniture.filter((f) => f.id !== action.furnitureId);
      recalcRoomMetrics(room, next.facilities);
      pushToast(next, `Perabot dilepas dari Kamar ${room.code}.`, 'info');
      break;
    }

    case 'inspect_issue': {
      const issue = next.issues.find((i) => i.id === action.issueId);
      if (issue) {
        issue.inspected = true;
        pushToast(next, `Inspeksi selesai: ${issue.cause}`, 'info');
      }
      break;
    }

    case 'resolve_issue': {
      const issue = next.issues.find((i) => i.id === action.issueId);
      if (!issue || issue.resolved) return next;
      const tukangPartner = next.partners.find((p) => p.id === 'tukang' && p.active);
      const rawCost = action.mode === 'temp' ? issue.tempCost : issue.fullCost;
      const cost = tukangPartner ? Math.round(rawCost * 0.8) : rawCost;
      if (next.accounts.usaha < cost) {
        pushToast(next, `Saldo usaha kurang (${formatRp(cost)}).`, 'warning');
        return next;
      }
      recordTransaction(next, {
        account: 'usaha',
        kind: 'keluar',
        category: 'perbaikan',
        amount: cost,
        description: `${action.mode === 'temp' ? 'Perbaikan sementara' : 'Perbaikan penuh'}: ${issue.title}`,
      });
      issue.inspected = true;
      if (action.mode === 'temp') {
        issue.tempFixed = true;
        issue.resolved = true;
        pushToast(next, `Perbaikan sementara selesai (${formatRp(cost)}).`, 'info');
      } else {
        issue.resolved = true;
        next.reputation = Math.min(5, next.reputation + 0.15);
        pushToast(next, `Perbaikan penuh selesai! Kepuasan penghuni & reputasi naik.`, 'success');
      }
      // Mark related inspection promises fulfilled
      for (const p of next.promises) {
        if (!p.fulfilled && p.kind === 'inspeksi') p.fulfilled = true;
      }
      break;
    }

    case 'move_bench': {
      next.facilities.benchPosition = action.position;
      pushToast(
        next,
        `Bangku teras dipindahkan ke posisi "${action.position.replace('_', ' ')}". Arah suara obrolan ikut berubah.`,
        'success'
      );
      break;
    }

    case 'organize_parking': {
      next.facilities.parkingOrganized = true;
      pushToast(next, 'Parkiran motor ditata ulang! Motor penghuni & tamu tidak lagi saling menghalangi.', 'success');
      break;
    }

    case 'install_soundproof': {
      const cost = 450_000;
      if (next.accounts.usaha < cost) {
        pushToast(next, `Saldo usaha belum cukup (${formatRp(cost)}).`, 'warning');
        return next;
      }
      recordTransaction(next, {
        account: 'usaha',
        kind: 'keluar',
        category: 'renovasi',
        amount: cost,
        description: 'Pasang peredam suara teras ke arah kamar',
      });
      next.facilities.terraceSoundproof = true;
      pushToast(next, 'Peredam suara teras terpasang! Tamu bebas nongkrong tanpa ganggu tidur kamar.', 'success');
      break;
    }

    case 'deliver_package': {
      if (!next.packageWaitingForTenantId) return next;
      const tenant = next.tenants.find((t) => t.id === next.packageWaitingForTenantId);
      next.packageWaitingForTenantId = null;
      next.packageDeliveredCount += 1;
      if (tenant) {
        tenant.relationship = Math.min(100, tenant.relationship + 10);
        pushNpcMessage(
          next,
          {
            id: tenant.id,
            name: tenant.name,
            roleLabel: 'Penghuni',
            hair: tenant.hairColor,
            skin: tenant.skinTone,
            outfit: tenant.outfitCasual,
          },
          'Makasih banyak Kak udah antar paketku! Untung nggak nyasar lagi 😄'
        );
      }
      pushToast(next, `Paket berhasil diserahkan ke ${tenant?.name || 'penghuni'}!`, 'success');
      break;
    }

    case 'greet_first_night': {
      next.firstNightGreetedTenant = true;
      const occupied = next.tenants.find((t) => t.status === 'menghuni');
      if (occupied) {
        occupied.relationship = Math.min(100, occupied.relationship + 8);
      }
      pushToast(
        next,
        `Kamu menyapa ${occupied?.name || 'penghuni'} dan pasangannya dengan ramah. Mereka senang dengan suasana santai Kost Texas!`,
        'success'
      );
      break;
    }

    case 'greet_adik': {
      if (!next.adik.visitingToday) return next;
      next.adik.visitingToday = false;
      next.adik.visitedCount += 1;
      next.adik.relation = Math.min(100, next.adik.relation + 15);
      addPhotoToGallery(next, {
        id: 'photo_adik_visit',
        title: `${next.adik.name} Mampir ke Kost Texas`,
        caption: 'Adik takjub melihat tanah kosong orang tua kini hidup jadi kos hangat.',
        category: 'keluarga',
        sceneKey: 'adik_kunjungan',
        locationTag: 'Gerbang Kost Texas',
      });
      pushToast(next, `Kamu menyambut ${next.adik.name} di gerbang dan foto bareng Janda!`, 'success');
      break;
    }

    case 'bank_transfer_internal': {
      const amt = Math.round(action.amount);
      if (amt <= 0 || action.from === action.to) return next;
      if (next.accounts[action.from] < amt) {
        pushToast(next, `Saldo rekening ${action.from} tidak cukup.`, 'warning');
        return next;
      }
      recordTransaction(next, {
        account: action.from,
        kind: 'keluar',
        category: 'transfer_internal',
        amount: amt,
        description: `Transfer keluar ke Rekening ${action.to === 'usaha' ? 'Usaha' : 'Pribadi'}`,
      });
      recordTransaction(next, {
        account: action.to,
        kind: 'masuk',
        category: 'transfer_internal',
        amount: amt,
        description: `Transfer masuk dari Rekening ${action.from === 'usaha' ? 'Usaha' : 'Pribadi'}`,
      });
      pushToast(next, `Transfer ${formatRp(amt)} antarrekening berhasil tercatat di kedua mutasi.`, 'success');
      break;
    }

    case 'transfer_adik': {
      const amt = Math.round(action.amount);
      if (amt <= 0) return next;
      if (next.accounts.pribadi < amt) {
        pushToast(next, 'Saldo rekening pribadi tidak cukup. Pindahkan dana dari usaha dulu jika perlu.', 'warning');
        return next;
      }
      recordTransaction(next, {
        account: 'pribadi',
        kind: 'keluar',
        category: 'transfer_adik',
        amount: amt,
        description: `Transfer bantuan kuliah ke ${next.adik.name} (${next.adik.city})`,
      });
      next.adik.totalTransferred += amt;
      next.adik.relation = Math.min(100, next.adik.relation + 12);
      next.adik.pendingRequestAmount = Math.max(0, next.adik.pendingRequestAmount - amt);
      if (next.adik.pendingRequestAmount === 0) {
        next.adik.pendingRequestReason = null;
      }
      for (const p of next.promises) {
        if (!p.fulfilled && p.kind === 'adik') p.fulfilled = true;
      }
      pushNpcMessage(
        next,
        {
          id: 'adik',
          name: `${next.adik.name} (Adik)`,
          roleLabel: `Kuliah di ${next.adik.city}`,
          hair: '#3a2822',
          skin: next.owner.skinTone,
          outfit: 'oversized_cargo',
        },
        `Udah masuk ${formatRp(amt)} Kak! Makasih banyak ya, beneran ngebantu banget buat kuliah di sini 🙏❤️`
      );
      pushToast(next, `Transfer ${formatRp(amt)} ke ${next.adik.name} berhasil!`, 'success');
      break;
    }

    case 'record_debt_payment': {
      const debt = next.debts.find((d) => d.id === action.debtId && d.status === 'aktif');
      if (!debt) return next;
      const pay = Math.min(debt.remainingAmount, Math.max(0, Math.round(action.amount)));
      if (pay <= 0) return next;
      if (debt.direction === 'utang' && next.accounts[debt.account] < pay) {
        pushToast(next, 'Saldo tidak cukup untuk membayar cicilan ini.', 'warning');
        return next;
      }
      recordTransaction(next, {
        account: debt.account,
        kind: debt.direction === 'piutang' ? 'masuk' : 'keluar',
        category: 'cicilan',
        amount: pay,
        description: `${debt.direction === 'piutang' ? 'Pelunasan cicilan dari' : 'Bayar cicilan ke'} ${debt.counterpartyName}`,
      });
      debt.paidAmount += pay;
      debt.remainingAmount -= pay;
      debt.history.push({ day: next.day, amount: pay, note: 'Pembayaran diterima' });
      if (debt.remainingAmount <= 0) {
        debt.status = 'lunas';
        pushToast(next, `Cicilan ${debt.counterpartyName} LUNAS!`, 'success');
      } else {
        pushToast(next, `Pembayaran ${formatRp(pay)} tercatat. Sisa ${formatRp(debt.remainingAmount)}.`, 'info');
      }
      break;
    }

    case 'remind_debt': {
      const debt = next.debts.find((d) => d.id === action.debtId && d.status === 'aktif');
      if (!debt) return next;
      debt.remindedDay = next.day;
      // Reliable or reminded debtor pays right away
      const payNow = debt.remainingAmount;
      return applyAction(next, { type: 'record_debt_payment', debtId: debt.id, amount: payNow });
    }

    case 'inspect_motor': {
      const motor = next.rental.motors.find((m) => m.id === action.motorId);
      if (!motor) return next;
      motor.inspectedInitial = true;
      motor.lastInspection = action.inspection;
      pushToast(next, `Inspeksi ${motor.name} tersimpan (Ban: ${action.inspection.ban}, Aki: ${action.inspection.aki}).`, 'success');
      break;
    }

    case 'create_rental_booking': {
      const motor = next.rental.motors.find((m) => m.id === action.motorId);
      if (!motor) return next;
      const startDay = next.day;
      const endDay = next.day + Math.max(1, action.days);
      // STRICT conflict prevention: motor cannot be in use, in workshop, broken, or overlapping active booking!
      const hasOverlap = next.rental.bookings.some(
        (b) =>
          b.motorId === motor.id &&
          (b.status === 'aktif' || b.status === 'menunggu' || b.status === 'telat') &&
          startDay <= b.endDay &&
          endDay >= b.startDay
      );
      if (motor.status !== 'tersedia' || hasOverlap) {
        pushToast(
          next,
          `Jadwal bentrok! ${motor.name} sedang "${motor.status}" atau sudah teralokasi di tanggal tersebut.`,
          'warning'
        );
        return next;
      }

      const fee = action.rateType === 'bulanan' ? motor.monthlyRate : motor.dailyRate * action.days;
      const bookingId = nextId(next, 'book');
      const claimId = nextId(next, 'claim');
      const refCode = `TRF-${next.day}${100 + (next.nextIdCounter % 899)}`;

      let actualMutationId: string | null = null;
      let proofNote = 'Bukti transfer dikirim customer lewat chat.';
      if (action.claimKind === 'masuk_langsung') {
        const tx = recordTransaction(next, {
          account: 'usaha',
          kind: 'masuk',
          category: 'rental',
          amount: fee,
          description: `Transfer rental ${action.customerName} (${refCode})`,
          referenceCode: refCode,
        });
        actualMutationId = tx.id;
        proofNote = `Klaim transfer ${formatRp(fee)} ke Rekening Usaha (${refCode}).`;
      } else if (action.claimKind === 'kurang_nominal') {
        const shortAmt = Math.max(50_000, fee - 35_000);
        const tx = recordTransaction(next, {
          account: 'usaha',
          kind: 'masuk',
          category: 'rental',
          amount: shortAmt,
          description: `Transfer rental ${action.customerName} (${refCode})`,
          referenceCode: refCode,
        });
        actualMutationId = tx.id;
        proofNote = `Customer mengklaim lunas ${formatRp(fee)}, cek mutasi!`;
      } else if (action.claimKind === 'rekening_lain') {
        const tx = recordTransaction(next, {
          account: 'pribadi',
          kind: 'masuk',
          category: 'rental',
          amount: fee,
          description: `Transfer rental ${action.customerName} masuk ke Rek. Pribadi (${refCode})`,
          referenceCode: refCode,
        });
        actualMutationId = tx.id;
        proofNote = `Dana disebut sudah ditransfer ${formatRp(fee)}, cek kedua rekening!`;
      } else if (action.claimKind === 'tertunda') {
        proofNote = `Customer pakai bank lain (kliring tertunda, estimasi masuk besok).`;
      } else if (action.claimKind === 'bukti_palsu') {
        proofNote = `Screenshot resi ${refCode} terlihat buram & tidak ditemukan di mutasi!`;
      }

      next.rental.bookings.unshift({
        id: bookingId,
        customerName: action.customerName,
        motorId: motor.id,
        startDay,
        endDay,
        rateType: action.rateType,
        totalFee: fee,
        deposit: 100_000,
        paidAmount: 0,
        status: 'menunggu',
        inspectionBefore: motor.lastInspection,
        claimId,
      });

      const claim: TransferClaim = {
        id: claimId,
        customerName: action.customerName,
        bookingId,
        expectedAmount: fee,
        claimedAmount: fee,
        claimedAtDay: next.day,
        proofRef: refCode,
        proofNote,
        kind: action.claimKind,
        actualMutationId,
        matchedMutationId: null,
        status: 'menunggu_verifikasi',
        releasedOnTrust: false,
        delayedReleaseDay: action.claimKind === 'tertunda' ? next.day + 1 : undefined,
      };
      next.claims.unshift(claim);

      pushNpcMessage(
        next,
        {
          id: `cust_${bookingId}`,
          name: `${action.customerName} (Rental)`,
          roleLabel: 'Customer Rental Motor',
          hair: '#2a2422',
          skin: '#dfb089',
          outfit: 'helm_riding',
          locationHint: 'parkiran',
        },
        `Kak, aku udah transfer ${formatRp(fee)} (Ref: ${refCode}) buat sewa ${motor.name}. Motornya boleh langsung aku ambil sekarang?`
      );
      pushToast(next, `Klaim transfer dari ${action.customerName} masuk! Cek Bank > Verifikasi Transfer sebelum serah terima.`, 'info');
      break;
    }

    case 'match_transfer_claim': {
      const claim = next.claims.find((c) => c.id === action.claimId);
      const tx = next.ledger.find((t) => t.id === action.mutationId);
      const booking = next.rental.bookings.find((b) => b.id === claim?.bookingId);
      const motor = next.rental.motors.find((m) => m.id === booking?.motorId);
      if (!claim || !tx || !booking || !motor) return next;

      // Enforce 1 mutation can ONLY match 1 payment!
      if (tx.matchedClaimId) {
        pushToast(next, 'Mutasi ini sudah dipakai untuk pencocokan pembayaran lain!', 'warning');
        return next;
      }

      tx.matchedClaimId = claim.id;
      claim.matchedMutationId = tx.id;
      booking.paidAmount = tx.amount;

      if (tx.amount >= claim.expectedAmount) {
        claim.status = 'lunas';
        if (booking.status === 'menunggu' && motor.status === 'tersedia') {
          booking.status = 'aktif';
          motor.status = 'dipakai';
          motor.activeBookingId = booking.id;
        }
        pushToast(next, `Mutasi cocok & LUNAS (${formatRp(tx.amount)})! Motor ${motor.name} diserahkan ke ${claim.customerName}.`, 'success');
      } else {
        claim.status = 'bayar_sebagian';
        const kurang = claim.expectedAmount - tx.amount;
        pushToast(
          next,
          `Nominal kurang ${formatRp(kurang)}! Status jadi Bayar Sebagian — kamu bisa tahan motor atau minta pelunasan.`,
          'warning'
        );
      }
      break;
    }

    case 'handle_transfer_claim': {
      const claim = next.claims.find((c) => c.id === action.claimId);
      const booking = next.rental.bookings.find((b) => b.id === claim?.bookingId);
      const motor = next.rental.motors.find((m) => m.id === booking?.motorId);
      if (!claim || !booking || !motor) return next;

      if (action.decision === 'tahan') {
        claim.status = 'menunggu_verifikasi';
        pushToast(next, `Booking ${claim.customerName} ditahan sampai dana benar-benar muncul di mutasi.`, 'info');
      } else if (action.decision === 'cek_ulang') {
        if (claim.kind === 'bukti_palsu') {
          claim.status = 'ditolak';
          booking.status = 'batal';
          pushToast(next, `Ketahuan bukti palsu! ${claim.customerName} batal dan motor aman di parkiran.`, 'success');
        } else {
          pushToast(next, `Kamu meminta ${claim.customerName} cek ulang transfernya.`, 'info');
        }
      } else if (action.decision === 'percaya') {
        if (motor.status !== 'tersedia') {
          pushToast(next, 'Motor tidak tersedia saat ini.', 'warning');
          return next;
        }
        claim.releasedOnTrust = true;
        booking.status = 'aktif';
        motor.status = 'dipakai';
        motor.activeBookingId = booking.id;
        // Create open debt if unpaid!
        if (claim.status !== 'lunas') {
          const unpaid = Math.max(0, claim.expectedAmount - booking.paidAmount);
          if (unpaid > 0) {
            next.debts.push({
              id: nextId(next, 'debt'),
              counterpartyId: booking.id,
              counterpartyName: `${claim.customerName} (Rental)`,
              kind: 'pinjaman_teman',
              account: 'usaha',
              direction: 'piutang',
              originalAmount: unpaid,
              paidAmount: 0,
              remainingAmount: unpaid,
              promiseDay: next.day + 1,
              reliability: claim.kind === 'bukti_palsu' ? 'minta_tenggat' : 'butuh_diingatkan',
              status: 'aktif',
              history: [{ day: next.day, amount: 0, note: 'Motor diserahkan atas kepercayaan, tagihan masih terbuka' }],
            });
          }
        }
        pushToast(next, `Motor diserahkan atas dasar kepercayaan. Tagihan terbuka tercatat di Bank!`, 'warning');
      } else if (action.decision === 'tolak') {
        claim.status = 'ditolak';
        booking.status = 'batal';
        pushToast(next, `Klaim ${claim.customerName} ditolak & booking dibatalkan.`, 'info');
      }
      break;
    }

    case 'complete_rental_return': {
      const booking = next.rental.bookings.find((b) => b.id === action.bookingId);
      const motor = next.rental.motors.find((m) => m.id === booking?.motorId);
      if (!booking || !motor) return next;
      booking.status = 'selesai';
      motor.status = 'tersedia';
      motor.activeBookingId = null;
      motor.km += 65;
      motor.tireHealth = Math.max(20, motor.tireHealth - 8);
      motor.batteryHealth = Math.max(20, motor.batteryHealth - 6);
      if (action.newScratchCharge > 0) {
        motor.bodyCondition = 'lecet_baru';
        recordTransaction(next, {
          account: 'usaha',
          kind: 'masuk',
          category: 'rental',
          amount: action.newScratchCharge,
          description: `Biaya perbaikan lecet baru (${booking.customerName} - ${motor.plate})`,
        });
      }
      pushToast(next, `${motor.name} telah kembali & siap disewakan lagi!`, 'success');
      break;
    }

    case 'send_motor_service': {
      const motor = next.rental.motors.find((m) => m.id === action.motorId);
      if (!motor || motor.status === 'dipakai') {
        pushToast(next, 'Motor sedang dipakai, tunggu kembali dulu sebelum diservis.', 'warning');
        return next;
      }
      const bengkelPartner = next.partners.find((p) => p.id === 'bengkel' && p.active);
      const baseCost = action.tier === 'cepat' ? 240_000 : 140_000;
      const cost = bengkelPartner ? Math.round(baseCost * 0.75) : baseCost;
      if (next.accounts.usaha < cost) {
        pushToast(next, `Saldo usaha kurang (${formatRp(cost)}).`, 'warning');
        return next;
      }
      recordTransaction(next, {
        account: 'usaha',
        kind: 'keluar',
        category: 'servis',
        amount: cost,
        description: `Servis ${action.tier} ${motor.name} di Bengkel Mas Agung`,
      });
      motor.status = 'bengkel';
      motor.serviceTier = action.tier;
      motor.serviceDaysLeft = action.tier === 'cepat' ? 1 : 2;
      addCalendarEvent(next, {
        day: next.day + motor.serviceDaysLeft,
        title: `Servis Selesai: ${motor.name}`,
        category: 'servis',
        description: `Ambil motor di Bengkel Mas Agung.`,
      });
      pushToast(next, `${motor.name} masuk bengkel (${action.tier}, ${motor.serviceDaysLeft} hari).`, 'info');
      break;
    }

    case 'buy_second_motor': {
      const cost = 5_800_000;
      if (next.accounts.usaha < cost) {
        pushToast(next, `Saldo usaha butuh ${formatRp(cost)} untuk tambah armada.`, 'warning');
        return next;
      }
      recordTransaction(next, {
        account: 'usaha',
        kind: 'keluar',
        category: 'rental',
        amount: cost,
        description: 'Beli unit rental tambahan: Yamaha Fazzio Bekas',
      });
      next.rental.motors.push({
        id: nextId(next, 'motor'),
        name: `Skutik Texas #${next.rental.motors.length + 1}`,
        plate: `B ${4200 + next.rental.motors.length * 17} TXS`,
        dailyRate: 95_000,
        monthlyRate: 950_000,
        bundleRate: 720_000,
        km: 12_300,
        tireHealth: 90,
        batteryHealth: 92,
        bodyCondition: 'mulus',
        status: 'tersedia',
        serviceDaysLeft: 0,
        activeBookingId: null,
        inspectedInitial: true,
      });
      pushToast(next, 'Armada motor baru berhasil ditambahkan ke parkiran!', 'success');
      break;
    }

    case 'resolve_rental_incident': {
      const inc = next.rental.incidents.find((i) => i.id === action.incidentId && !i.resolved);
      if (!inc) return next;
      const motor = next.rental.motors.find((m) => m.id === inc.motorId);
      const booking = next.rental.bookings.find((b) => b.id === inc.bookingId);
      if (!motor || !booking) return next;

      if (action.mode === 'mekanik') {
        const bengkelPartner = next.partners.find((p) => p.id === 'bengkel' && p.active);
        const cost = bengkelPartner ? 70_000 : 95_000;
        if (next.accounts.usaha < cost) {
          pushToast(next, `Saldo usaha kurang (${formatRp(cost)}).`, 'warning');
          return next;
        }
        recordTransaction(next, {
          account: 'usaha',
          kind: 'keluar',
          category: 'servis',
          amount: cost,
          description: `Panggil mekanik darurat ${motor.name} (${inc.customerName})`,
        });
        motor.status = 'dipakai';
        motor.batteryHealth = 82;
        inc.resolved = true;
        inc.resolution = 'Mekanik Mas Agung berangkat & motor menyala kembali.';
        pushToast(next, 'Mekanik selesai menangani motor mogok! Customer bisa lanjut kuliah tepat waktu.', 'success');
      } else if (action.mode === 'pengganti') {
        const spare = next.rental.motors.find((m) => m.id !== motor.id && m.status === 'tersedia');
        if (!spare) {
          pushToast(next, 'Belum ada unit pengganti yang tersedia. Gunakan mekanik atau jemput + refund.', 'warning');
          return next;
        }
        motor.status = 'bengkel';
        motor.serviceDaysLeft = 1;
        spare.status = 'dipakai';
        spare.activeBookingId = booking.id;
        booking.motorId = spare.id;
        inc.resolved = true;
        inc.resolution = `Unit pengganti ${spare.name} diantar ke lokasi.`;
        pushToast(next, `Unit pengganti ${spare.name} berhasil diantar!`, 'success');
      } else {
        const refund = 40_000;
        recordTransaction(next, {
          account: 'usaha',
          kind: 'keluar',
          category: 'refund',
          amount: refund,
          description: `Refund sebagian motor mogok (${inc.customerName})`,
        });
        motor.status = 'bengkel';
        motor.serviceDaysLeft = 1;
        booking.status = 'selesai';
        inc.resolved = true;
        inc.resolution = `Motor dijemput ke bengkel & refund ${formatRp(refund)} dibayarkan.`;
        pushToast(next, `Motor dijemput & refund ${formatRp(refund)} tercatat di mutasi.`, 'info');
      }
      break;
    }

    case 'warung_toggle_open':
      next.warung.openToday = !next.warung.openToday;
      pushToast(next, next.warung.openToday ? 'Warung dibuka hari ini.' : 'Warung diliburkan hari ini.', 'info');
      break;

    case 'warung_update_stock': {
      const item = next.warung.menu.find((m) => m.id === action.itemId);
      if (item) {
        item.dailyStock = Math.max(0, Math.min(40, item.dailyStock + action.delta));
      }
      break;
    }

    case 'warung_update_price': {
      const item = next.warung.menu.find((m) => m.id === action.itemId);
      if (item) {
        item.price = Math.max(5_000, action.price);
      }
      break;
    }

    case 'warung_complete_rush_hour': {
      next.warung.rushHourDoneToday = true;
      next.warung.totalOrdersServed += action.ordersCompleted;
      next.warung.revenueToday += action.revenue;
      recordTransaction(next, {
        account: 'usaha',
        kind: 'masuk',
        category: 'warung',
        amount: action.revenue,
        description: `Pendapatan Jam Ramai Warung (${action.ordersCompleted} pesanan)`,
      });
      pushToast(next, `Jam ramai selesai! +${formatRp(action.revenue)} masuk rekening usaha.`, 'success');
      break;
    }

    case 'rara_consignment': {
      next.warung.raraConsignment = action.mode;
      next.warung.raraBatchQty = action.qty;
      next.warung.raraOwnerSplitPct = action.split;
      pushToast(next, `Kerja sama dessert Rara diatur ke mode "${action.mode.replace('_', ' ')}".`, 'success');
      break;
    }

    case 'resolve_campus_order': {
      const co = next.warung.campusOrder;
      if (co.resolved) return next;
      co.resolved = true;
      co.active = false;
      co.choice = action.choice;
      if (action.choice === 'terima_15') {
        recordTransaction(next, {
          account: 'usaha',
          kind: 'masuk',
          category: 'warung',
          amount: 240_000,
          description: 'Pesanan Panitia Kampus (15 kotak sesuai stok)',
        });
        pushToast(next, 'Pesanan 15 kotak selesai! +Rp240.000 masuk rekening usaha.', 'success');
      } else if (action.choice === 'beli_stok') {
        if (next.accounts.usaha < 150_000) {
          pushToast(next, 'Saldo usaha kurang Rp150.000 untuk belanja stok.', 'warning');
          co.resolved = false;
          co.active = true;
          return next;
        }
        recordTransaction(next, {
          account: 'usaha',
          kind: 'keluar',
          category: 'warung',
          amount: 150_000,
          description: 'Belanja bahan tambahan pesanan 25 kotak kampus',
        });
        recordTransaction(next, {
          account: 'usaha',
          kind: 'masuk',
          category: 'warung',
          amount: 450_000,
          description: 'Pembayaran 25 kotak Panitia Kampus',
        });
        co.repeatCustomerUnlocked = true;
        pushToast(next, 'Semua 25 kotak beres! Panitia puas dan siap repeat order (+Rp450.000).', 'success');
      } else {
        recordTransaction(next, {
          account: 'usaha',
          kind: 'masuk',
          category: 'warung',
          amount: 290_000,
          description: 'Bagi pesanan 25 kotak kampus bersama warung tetangga',
        });
        co.repeatCustomerUnlocked = true;
        next.reputation = Math.min(5, next.reputation + 0.15);
        pushToast(next, 'Kolaborasi sukses dengan warung tetangga! +Rp290.000 & reputasi gang naik.', 'success');
      }
      break;
    }

    case 'kontrakan_buy': {
      if (next.kontrakan.owned) return next;
      if (next.accounts.usaha < next.kontrakan.price) {
        pushToast(next, `Butuh ${formatRp(next.kontrakan.price)} di rekening usaha untuk membeli Rumah Kontrakan.`, 'warning');
        return next;
      }
      recordTransaction(next, {
        account: 'usaha',
        kind: 'keluar',
        category: 'kontrakan',
        amount: next.kontrakan.price,
        description: 'Beli properti terpisah: Rumah Kontrakan Gang',
      });
      next.kontrakan.owned = true;
      pushToast(next, 'Rumah Kontrakan resmi milikmu! Renovasi & pasang iklan agar cepat terisi.', 'success');
      break;
    }

    case 'kontrakan_renovate': {
      const cost = 2_400_000;
      if (!next.kontrakan.owned || next.kontrakan.renovated) return next;
      if (next.accounts.usaha < cost) {
        pushToast(next, `Butuh ${formatRp(cost)} untuk renovasi Rumah Kontrakan.`, 'warning');
        return next;
      }
      recordTransaction(next, {
        account: 'usaha',
        kind: 'keluar',
        category: 'kontrakan',
        amount: cost,
        description: 'Renovasi cat, atap, & dapur Rumah Kontrakan',
      });
      next.kontrakan.renovated = true;
      next.kontrakan.condition = 95;
      pushToast(next, 'Rumah Kontrakan selesai direnovasi dan siap diiklankan!', 'success');
      break;
    }

    case 'kontrakan_advertise': {
      if (!next.kontrakan.owned) return next;
      next.kontrakan.advertised = true;
      pushToast(next, 'Iklan Rumah Kontrakan tayang! Pilih penyewa dari daftar pelamar.', 'info');
      break;
    }

    case 'kontrakan_accept_applicant': {
      const app = next.kontrakan.applicants.find((a) => a.id === action.applicantId);
      if (!app || !next.kontrakan.owned || next.kontrakan.contractActive) return next;
      next.kontrakan.contractActive = true;
      next.kontrakan.tenantFamilyName = app.familyName;
      next.kontrakan.monthlyRent = app.offerRent;
      next.kontrakan.startDay = next.day;
      next.kontrakan.nextDueDay = next.day + 30;
      recordTransaction(next, {
        account: 'usaha',
        kind: 'masuk',
        category: 'kontrakan',
        amount: app.offerRent,
        description: `Sewa bulan pertama Rumah Kontrakan (${app.familyName})`,
      });
      addCalendarEvent(next, {
        day: next.day + 30,
        title: `Jatuh Tempo Rumah Kontrakan (${app.familyName})`,
        category: 'tagihan',
        description: `Sewa satu rumah ${formatRp(app.offerRent)}.`,
      });
      pushToast(next, `Kontrak Rumah Kontrakan disepakati dengan ${app.familyName}!`, 'success');
      break;
    }

    case 'toggle_partner': {
      const p = next.partners.find((x) => x.id === action.partnerId);
      if (!p || p.active) return next;
      if (next.accounts.usaha < p.setupCost) {
        pushToast(next, `Butuh ${formatRp(p.setupCost)} untuk kerja sama dengan ${p.name}.`, 'warning');
        return next;
      }
      recordTransaction(next, {
        account: 'usaha',
        kind: 'keluar',
        category: 'renovasi',
        amount: p.setupCost,
        description: `Kerja sama mitra: ${p.name}`,
      });
      p.active = true;
      pushToast(next, `Kerja sama dengan ${p.name} resmi aktif!`, 'success');
      break;
    }

    case 'toggle_employee': {
      const e = next.employees.find((x) => x.id === action.employeeId);
      if (!e) return next;
      e.hired = !e.hired;
      pushToast(
        next,
        e.hired
          ? `${e.name} (${e.roleTitle}) mulai bekerja! Upah ${formatRp(e.dailyWage)}/hari.`
          : `Kontrak kerja ${e.name} dihentikan sementara.`,
        'info'
      );
      break;
    }

    case 'meet_relationship_npc': {
      const npc = next.relationships.find((r) => r.id === action.npcId);
      if (!npc) return next;
      npc.metCount += 1;
      npc.affinity = Math.min(100, npc.affinity + (action.romantic ? 18 : 12));
      npc.scheduledDateDay = null;
      if (npc.affinity >= 70 && action.romantic) {
        npc.stage = 'pasangan';
      } else if (npc.affinity >= 45) {
        npc.stage = 'dekat';
      } else if (npc.affinity >= 25) {
        npc.stage = 'teman';
      }
      const moment = `${action.activity} bareng ${npc.name} di Hari ke-${next.day}`;
      if (!npc.rememberedMoments.includes(moment)) {
        npc.rememberedMoments.push(moment);
      }
      addPhotoToGallery(next, {
        title: `Momen bareng ${npc.name}`,
        caption: `${action.activity} santai di sekitar gang Kost Texas.`,
        category: 'npc',
        sceneKey: 'momen_npc',
        locationTag: npc.role,
      });
      pushNpcMessage(
        next,
        {
          id: npc.id,
          name: npc.name,
          roleLabel: npc.role,
          hair: npc.hairColor,
          skin: npc.skinTone,
          outfit: npc.outfitId,
          locationHint: npc.spotId,
        },
        npc.stage === 'pasangan'
          ? `Seru banget tadi ${action.activity.toLowerCase()}! Aku masih inget banget ${npc.rememberedMoments[0].toLowerCase()}. Kapan-kapan aku mampir bawa makanan ke ruangmu ya ❤️`
          : `Makasih ya tadi udah sempetin ${action.activity.toLowerCase()}! Kapan-kapan ngobrol lagi ya.`
      );
      pushToast(next, `${action.activity} bersama ${npc.name} selesai! Kedekatan: ${npc.affinity} (${npc.stage}).`, 'success');
      break;
    }

    case 'owner_room_action': {
      if (!next.ownerRoom.built) return next;
      if (action.action === 'eat') {
        const mealCost = 18_000;
        if (next.accounts.pribadi >= mealCost) {
          recordTransaction(next, {
            account: 'pribadi',
            kind: 'keluar',
            category: 'kebutuhan',
            amount: mealCost,
            description: 'Makan hangat di Ruang Owner',
          });
        }
        next.ownerRoom.ateToday = true;
        pushToast(next, 'Kamu makan dengan tenang di ruang pribadimu sambil ditemani Janda.', 'success');
      } else if (action.action === 'invite_partner') {
        const closeNpc =
          next.relationships.find((r) => r.stage === 'pasangan') ||
          next.relationships.find((r) => r.affinity >= 30) ||
          next.relationships[0];
        next.ownerRoom.partnerVisitingName = closeNpc.name;
        closeNpc.affinity = Math.min(100, closeNpc.affinity + 10);
        pushToast(next, `${closeNpc.name} datang bawa makanan, keliling lihat kos, & santai di Ruang Owner!`, 'success');
      }
      break;
    }

    case 'janda_care': {
      if (action.care === 'place_bowl_bed') {
        next.janda.bowlPlaced = true;
        next.janda.bedPlaced = true;
        next.janda.bowlLocation = action.location || 'teras';
        next.janda.mood = Math.min(100, next.janda.mood + 15);
        pushToast(next, `Mangkuk & alas tidur Janda ditaruh di ${next.janda.bowlLocation === 'ruang_owner' ? 'Ruang Owner' : 'Teras'}! Janda langsung mencobanya.`, 'success');
      } else if (action.care === 'feed') {
        if (!next.janda.fedToday) {
          const cost = 12_000;
          if (next.accounts.pribadi >= cost) {
            recordTransaction(next, {
              account: 'pribadi',
              kind: 'keluar',
              category: 'kebutuhan',
              amount: cost,
              description: 'Makanan kucing untuk Janda',
            });
          }
          next.janda.fedToday = true;
          next.janda.mood = Math.min(100, next.janda.mood + 10);
          next.janda.animState = 'loaf';
          pushToast(next, 'Janda lahap makan! Ekornya tegak senang.', 'success');
        } else {
          pushToast(next, 'Janda sudah kenyang hari ini 🐾', 'info');
        }
      } else if (action.care === 'water') {
        next.janda.waterFresh = true;
        next.janda.mood = Math.min(100, next.janda.mood + 5);
        pushToast(next, 'Air minum Janda diganti yang segar!', 'info');
      } else if (action.care === 'pet') {
        next.janda.pettedToday = true;
        next.janda.mood = Math.min(100, next.janda.mood + 8);
        next.janda.animState = 'lap';
        pushToast(next, 'Janda mendengkur pelan lalu naik sebentar ke pangkuanmu 🖤🤍', 'success');
      } else if (action.care === 'place_box') {
        next.janda.boxFound = true;
        next.janda.boxLocation = action.location || 'teras';
        if (!next.janda.favoriteSpots.includes('kardus_paket')) {
          next.janda.favoriteSpots.push('kardus_paket');
        }
        pushToast(next, 'Kardus favorit Janda sudah diletakkan rapi sebagai dekorasi!', 'success');
      }
      break;
    }

    case 'janda_minigame_complete': {
      next.janda.mood = Math.min(100, next.janda.mood + 15);
      if (action.game === 'kejar_tali') {
        next.janda.kejarTaliWins += 1;
        next.janda.animState = 'chase';
        addPhotoToGallery(next, {
          title: 'Janda Pose Melompat',
          caption: 'Berhasil menangkap mainan tali dengan lompatan lincah!',
          category: 'janda',
          sceneKey: 'janda_lompat',
          locationTag: 'Teras Bermain',
        });
      } else if (action.game === 'janda_dimana') {
        next.janda.jandaDimanaWins += 1;
        const spot = action.spotFound || 'rak_sepatu';
        if (!next.janda.favoriteSpots.includes(spot)) {
          next.janda.favoriteSpots.push(spot);
        }
        if (spot === 'kardus_paket') {
          next.janda.boxFound = true;
          next.janda.boxLocation = 'teras';
        }
        addPhotoToGallery(next, {
          title: `Ketemu Janda di ${spot.replace('_', ' ')}`,
          caption: 'Petunjuk tenant & ekor hitam putihnya membocorkan tempat ngumpetnya!',
          category: 'janda',
          sceneKey: spot === 'kardus_paket' ? 'janda_kardus' : 'janda_ngantuk',
          locationTag: spot,
        });
        if (next.janda.weeklyChallenge.kind === 'cari') {
          next.janda.weeklyChallenge.completed = true;
        }
      } else if (action.game === 'foto_pas') {
        next.janda.fotoPasWins += 1;
        const theme = action.theme || 'Janda Lagi Ngantuk';
        const sceneKey =
          theme.includes('Pangkuan')
            ? 'janda_pangkuan'
            : theme.includes('Warung')
              ? 'janda_warung'
              : 'janda_ngantuk';
        const photo = addPhotoToGallery(next, {
          title: theme,
          caption: `Jepretan pas saat Janda bergaya untuk tema "${theme}".`,
          category: 'janda',
          sceneKey,
          locationTag: theme,
        });
        if (!next.janda.wallpaperPhotoId) {
          next.janda.wallpaperPhotoId = photo.id;
        }
        if (next.janda.weeklyChallenge.kind === 'foto') {
          next.janda.weeklyChallenge.completed = true;
        }
      }
      break;
    }

    case 'gallery_send_adik': {
      const photo = next.gallery.find((p) => p.id === action.photoId);
      if (!photo) return next;
      photo.sentToAdik = true;
      if (!next.adik.receivedPhotoIds.includes(photo.id)) {
        next.adik.receivedPhotoIds.push(photo.id);
      }
      next.adik.relation = Math.min(100, next.adik.relation + 5);
      pushOwnerMessage(next, 'adik', `Nih Ran, foto terbaru: "${photo.title}"`, photo.id);
      pushNpcMessage(
        next,
        {
          id: 'adik',
          name: `${next.adik.name} (Adik)`,
          roleLabel: `Kuliah di ${next.adik.city}`,
          hair: '#3a2822',
          skin: next.owner.skinTone,
          outfit: 'oversized_cargo',
        },
        photo.category === 'janda'
          ? 'UWAAA JANDA GEMES BANGET!! 😭🖤🤍 Kirim lagi ya Kak kalau ada pose baru!'
          : 'Keren banget Kak update-nya! Makin nggak sabar main lagi ke Kost Texas!'
      );
      pushToast(next, `Foto "${photo.title}" dikirim ke ${next.adik.name}!`, 'success');
      break;
    }

    case 'gallery_set_wallpaper': {
      next.janda.wallpaperPhotoId = action.photoId;
      pushToast(next, 'Foto dijadikan Wallpaper Home Screen HP!', 'success');
      break;
    }

    case 'gallery_toggle_display': {
      const photo = next.gallery.find((p) => p.id === action.photoId);
      if (!photo) return next;
      photo.displayedInRoom = !photo.displayedInRoom;
      if (photo.displayedInRoom) {
        if (!next.ownerRoom.displayedPhotoIds.includes(photo.id)) {
          next.ownerRoom.displayedPhotoIds.push(photo.id);
        }
      } else {
        next.ownerRoom.displayedPhotoIds = next.ownerRoom.displayedPhotoIds.filter((id) => id !== photo.id);
      }
      pushToast(
        next,
        photo.displayedInRoom ? 'Foto dipajang di Ruang Owner!' : 'Foto diturunkan dari dinding Ruang Owner.',
        'info'
      );
      break;
    }
  }

  evaluateMissionsAndPayouts(next);
  return next;
}

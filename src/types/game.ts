export type TimeSlot = 'pagi' | 'siang' | 'sore' | 'malam';

export type WeatherType = 'cerah' | 'berawan' | 'hujan' | 'hujan_deras';

export type PhoneAppId =
  | 'home'
  | 'pesan'
  | 'bank'
  | 'properti'
  | 'rental'
  | 'kalender'
  | 'peta'
  | 'galeri'
  | 'misi';

export type AccountType = 'usaha' | 'pribadi';

export type BuildingStage = 0 | 1 | 2 | 3;

export type StarterPlan = 'dua_standar' | 'satu_premium';

export type OutfitCategory = 'genz' | 'millennial' | 'aktivitas';

export interface OutfitOption {
  id: string;
  name: string;
  category: OutfitCategory;
  topColor: string;
  bottomColor: string;
  accentColor: string;
  hatOrProp?: 'tote' | 'sling' | 'helm' | 'payung' | 'jepit' | 'jam' | 'hoodie' | 'piyama' | 'sandal';
  description: string;
}

export interface OwnerAppearance {
  name: string;
  hairStyle: 'pendek' | 'bob' | 'panjang' | 'ikal';
  hairColor: string;
  skinTone: string;
  outfitId: string;
}

export type FurnitureType =
  | 'kasur_standar'
  | 'kasur_queen'
  | 'meja_belajar'
  | 'meja_besar'
  | 'lemari'
  | 'gorden_biasa'
  | 'gorden_blackout'
  | 'lampu_hangat'
  | 'tanaman'
  | 'rak_serbaguna'
  | 'peredam_suara'
  | 'ac';

export interface FurnitureCatalogItem {
  type: FurnitureType;
  name: string;
  cost: number;
  comfortBonus: number;
  rentBonus: number;
  effectText: string;
  icon: string;
}

export interface FurniturePlacement {
  id: string;
  type: FurnitureType;
  x: number; // 0..3
  y: number; // 0..3
}

export type IssueKind =
  | 'air_kecil'
  | 'wifi_lemah'
  | 'atap_bocor'
  | 'suara_teras'
  | 'parkiran_penuh'
  | 'listrik_padam';

export interface BuildingIssue {
  id: string;
  kind: IssueKind;
  roomId?: string;
  title: string;
  cause: string;
  severity: 'ringan' | 'sedang' | 'parah';
  dayCreated: number;
  inspected: boolean;
  tempFixed: boolean;
  resolved: boolean;
  tempCost: number;
  fullCost: number;
  reportedByTenantId?: string;
}

export interface Room {
  id: string;
  code: string;
  floor: 1 | 2 | 3;
  tier: 'standar' | 'premium';
  status: 'proyek' | 'kosong' | 'tur' | 'terisi' | 'renovasi';
  monthlyRent: number;
  depositAmount: number;
  furniture: FurniturePlacement[];
  tenantId: string | null;
  coTenantName: string | null;
  guestStayingName: string | null;
  guestArrivedSlot?: TimeSlot;
  lightsOn: boolean;
  statusLabel: string;
  cleanliness: number; // 0..100
  comfortScore: number; // 0..100
  isUnderConstructionDaysLeft: number;
  renovationDaysLeft: number;
  agreedWorkSlot?: TimeSlot;
  hasPrivateBath: boolean;
}

export interface OwnerRoomState {
  built: boolean;
  buildDaysLeft: number;
  hasBed: boolean;
  hasDesk: boolean;
  hasWardrobe: boolean;
  hasJandaCorner: boolean;
  displayedPhotoIds: string[];
  hasTuxedoPillow: boolean;
  hasFavoriteBoxDecor: boolean;
  ateToday: boolean;
  partnerVisitingName: string | null;
}

export interface FacilityState {
  wifiLevel: number; // 1..3
  pumpLevel: number; // 1..3
  parkingSlots: number; // 2..8
  parkingOrganized: boolean;
  dryingArea: boolean;
  terraceCanopy: boolean;
  terraceLights: boolean;
  benchPosition: 'dekat_kamar' | 'tengah' | 'dekat_gerbang';
  terraceSoundproof: boolean;
  packageRack: boolean;
  washingMachine: boolean;
  commonRoomFloor3: boolean;
  signBoardInstalled: boolean;
  powerOutageActive: boolean;
  nayaprelovedRack: boolean;
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  category: 'bangunan' | 'fasilitas' | 'usaha' | 'owner';
  cost: number;
  durationDays: number;
  remainingDays: number;
  status: 'terkunci' | 'tersedia' | 'berjalan' | 'selesai';
  prereqText?: string;
  impactText: string;
  targetFloor?: 1 | 2 | 3;
  affectedRoomId?: string;
  stageLabel?: 'fondasi' | 'dinding' | 'finishing' | 'selesai';
}

export interface TenantRoutine {
  pagi: 'kamar' | 'teras' | 'keluar' | 'warung' | 'parkiran';
  siang: 'kamar' | 'teras' | 'keluar' | 'warung' | 'parkiran';
  sore: 'kamar' | 'teras' | 'keluar' | 'warung' | 'parkiran';
  malam: 'kamar' | 'teras' | 'keluar' | 'warung' | 'parkiran';
}

export interface TenantProfile {
  id: string;
  name: string;
  age: number;
  occupation: string;
  budget: number;
  needs: string[];
  prefersTier: 'standar' | 'premium' | 'bebas';
  isShiftWorker?: boolean;
  partnerName?: string;
  chatStyle: string;
  bio: string;
  hairColor: string;
  skinTone: string;
  outfitWork: string;
  outfitCasual: string;
  outfitRain: string;
  outfitRest: string;
  routine: TenantRoutine;
  status: 'pelamar' | 'tur' | 'menghuni' | 'mantan' | 'ditolak';
  roomId: string | null;
  relationship: number; // 0..100
  satisfaction: number; // 0..100
  reviewScore: number; // 1..5
  reviewText?: string;
  storyStage: number;
  hasCoupleContract?: boolean;
  bundleMotorId?: string | null;
  lastVisitDay?: number;
  movedOutDay?: number;
}

export interface Contract {
  id: string;
  tenantId: string;
  roomId: string;
  startDay: number;
  nextDueDay: number;
  monthlyRent: number;
  depositHeld: number;
  isCoupleContract: boolean;
  bundleMotorId?: string | null;
  status: 'aktif' | 'checkout_pending' | 'selesai';
  lateDays: number;
}

export interface ChatActionPayload {
  type: string;
  [key: string]: unknown;
}

export interface ChatReplyOption {
  id: string;
  label: string;
  timeCost?: number; // 0 or 1 slot
  moneyCost?: number;
  account?: AccountType;
  action: ChatActionPayload;
}

export interface ChatMessage {
  id: string;
  sender: 'npc' | 'owner' | 'system';
  text: string;
  day: number;
  slot: TimeSlot;
  photoId?: string;
  replies?: ChatReplyOption[];
  repliesUsed?: boolean;
}

export interface ChatThread {
  id: string;
  npcId: string;
  npcName: string;
  roleLabel: string;
  avatarHair: string;
  avatarSkin: string;
  avatarOutfit: string;
  unread: number;
  messages: ChatMessage[];
  locationHint?: MapSpotId;
}

export interface PromiseRecord {
  id: string;
  npcId: string;
  npcName: string;
  description: string;
  dueDay: number;
  fulfilled: boolean;
  missed: boolean;
  kind: 'inspeksi' | 'mekanik' | 'cicilan' | 'adik' | 'kencan' | 'tukang' | 'paket';
}

export interface Transaction {
  id: string;
  day: number;
  slot: TimeSlot;
  account: AccountType;
  kind: 'masuk' | 'keluar';
  category:
    | 'sewa'
    | 'deposit'
    | 'cicilan'
    | 'rental'
    | 'warung'
    | 'kontrakan'
    | 'renovasi'
    | 'perbaikan'
    | 'servis'
    | 'gaji'
    | 'transfer_internal'
    | 'transfer_adik'
    | 'pinjaman'
    | 'refund'
    | 'bonus_misi'
    | 'kebutuhan';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  missionId?: string;
  matchedClaimId?: string;
  referenceCode?: string;
}

export interface DebtRecord {
  id: string;
  counterpartyId: string;
  counterpartyName: string;
  kind: 'cicilan_sewa' | 'bon_warung' | 'pinjaman_teman' | 'cicilan_pemasok';
  account: AccountType;
  direction: 'piutang' | 'utang'; // piutang = owed to player, utang = player owes
  originalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  promiseDay: number;
  reliability: 'tepat' | 'butuh_diingatkan' | 'minta_tenggat';
  remindedDay?: number;
  status: 'aktif' | 'lunas';
  history: { day: number; amount: number; note: string }[];
}

export interface TransferClaim {
  id: string;
  customerName: string;
  bookingId: string;
  expectedAmount: number;
  claimedAmount: number;
  claimedAtDay: number;
  proofRef: string;
  proofNote: string;
  kind: 'masuk_langsung' | 'tertunda' | 'kurang_nominal' | 'rekening_lain' | 'bukti_palsu';
  actualMutationId: string | null;
  matchedMutationId: string | null;
  status: 'klaim_diterima' | 'menunggu_verifikasi' | 'bayar_sebagian' | 'lunas' | 'ditolak';
  releasedOnTrust: boolean;
  delayedReleaseDay?: number;
}

export interface MotorInspection {
  day: number;
  ban: 'bagus' | 'tipis' | 'bocor';
  bodi: 'mulus' | 'lecet_ringan' | 'lecet_baru';
  aki: 'normal' | 'lemah' | 'tekor';
  notes: string;
}

export interface MotorUnit {
  id: string;
  name: string;
  plate: string;
  dailyRate: number;
  monthlyRate: number;
  bundleRate: number;
  km: number;
  tireHealth: number; // 0..100
  batteryHealth: number; // 0..100
  bodyCondition: 'mulus' | 'lecet_ringan' | 'lecet_baru';
  status: 'tersedia' | 'dipakai' | 'bengkel' | 'mogok';
  serviceDaysLeft: number;
  serviceTier?: 'reguler' | 'cepat';
  activeBookingId: string | null;
  inspectedInitial: boolean;
  lastInspection?: MotorInspection;
}

export interface RentalBooking {
  id: string;
  customerName: string;
  tenantId?: string;
  motorId: string;
  startDay: number;
  endDay: number;
  rateType: 'harian' | 'bulanan' | 'paket_kos';
  totalFee: number;
  deposit: number;
  paidAmount: number;
  status: 'menunggu' | 'aktif' | 'selesai' | 'batal' | 'telat';
  inspectionBefore?: MotorInspection;
  inspectionAfter?: MotorInspection;
  claimId?: string;
  damageNote?: string;
}

export interface RentalIncident {
  id: string;
  bookingId: string;
  motorId: string;
  customerName: string;
  kind: 'ban_bocor' | 'aki_tekor' | 'mogok' | 'telat_kembali';
  locationText: string;
  day: number;
  resolved: boolean;
  resolution?: string;
}

export interface RentalSystem {
  unlocked: boolean;
  motors: MotorUnit[];
  bookings: RentalBooking[];
  incidents: RentalIncident[];
  bengkelBusyUntilDay: number;
}

export interface WarungMenuItem {
  id: string;
  name: string;
  price: number;
  cost: number;
  dailyStock: number;
  soldToday: number;
  leftoverYesterday: number;
  category: 'makanan' | 'minuman' | 'dessert';
}

export interface CampusOrderEvent {
  active: boolean;
  day: number;
  requestedBoxes: number;
  currentStock: number;
  resolved: boolean;
  choice?: 'terima_15' | 'beli_stok' | 'bagi_tetangga';
  repeatCustomerUnlocked: boolean;
}

export interface WarungSystem {
  unlocked: boolean;
  level: 1 | 2; // 1: Warung Sederhana, 2: Restoran Kecil
  openToday: boolean;
  openHoursLabel: string;
  tables: number;
  menu: WarungMenuItem[];
  rushHourAvailable: boolean;
  rushHourDoneToday: boolean;
  raraConsignment: 'none' | 'ditawarkan' | 'uji_coba' | 'tetap' | 'preorder';
  raraBatchQty: number;
  raraOwnerSplitPct: number;
  campusOrder: CampusOrderEvent;
  totalOrdersServed: number;
  revenueToday: number;
}

export interface KontrakanApplicant {
  id: string;
  familyName: string;
  members: string;
  offerRent: number;
  reliability: string;
  note: string;
}

export interface KontrakanSystem {
  owned: boolean;
  price: number;
  condition: number; // 0..100
  renovated: boolean;
  advertised: boolean;
  monthlyRent: number;
  upkeepPerDay: number;
  tenantFamilyName: string | null;
  contractActive: boolean;
  startDay: number;
  nextDueDay: number;
  applicants: KontrakanApplicant[];
}

export interface PartnerItem {
  id: 'bengkel' | 'laundry' | 'tukang' | 'coffee_cart' | 'pemasok';
  name: string;
  npcName: string;
  description: string;
  active: boolean;
  setupCost: number;
  benefitText: string;
}

export interface EmployeeItem {
  id: 'penjaga_warung' | 'petugas_kebersihan' | 'admin_rental';
  name: string;
  roleTitle: string;
  dailyWage: number;
  workSlots: TimeSlot[];
  hired: boolean;
  tasksSummary: string;
  hairColor: string;
  skinTone: string;
  outfitId: string;
}

export interface AdikState {
  name: string;
  city: string;
  relation: number;
  visitingToday: boolean;
  visitedCount: number;
  pendingRequestAmount: number;
  pendingRequestReason: string | null;
  promiseDay: number | null;
  totalTransferred: number;
  receivedPhotoIds: string[];
}

export interface RelationshipNPC {
  id: 'bara' | 'laras' | 'kei';
  name: string;
  role: string;
  hobby: string;
  bio: string;
  hairColor: string;
  skinTone: string;
  outfitId: string;
  availableSlots: TimeSlot[];
  spotId: MapSpotId;
  affinity: number; // 0..100
  stage: 'kenalan' | 'teman' | 'dekat' | 'pasangan';
  rememberedMoments: string[];
  scheduledDateDay: number | null;
  scheduledDateSlot: TimeSlot | null;
  scheduledDatePlace: string | null;
  metCount: number;
}

export type JandaSpotId =
  | 'bangku_mangga'
  | 'teras'
  | 'rak_sepatu'
  | 'kardus_paket'
  | 'ruang_owner'
  | 'lantai_2'
  | 'warung';

export type JandaAnimState = 'walk' | 'stretch' | 'loaf' | 'sleep' | 'chase' | 'lap' | 'hide';

export interface JandaState {
  mood: number; // 0..100
  fedToday: boolean;
  waterFresh: boolean;
  pettedToday: boolean;
  bowlPlaced: boolean;
  bowlLocation: 'teras' | 'ruang_owner' | 'bangku_mangga' | null;
  bedPlaced: boolean;
  boxFound: boolean;
  boxLocation: 'teras' | 'ruang_owner' | null;
  currentSpot: JandaSpotId;
  favoriteSpots: JandaSpotId[];
  animState: JandaAnimState;
  kejarTaliWins: number;
  jandaDimanaWins: number;
  fotoPasWins: number;
  tenantPhotoReceived: boolean;
  weeklyChallenge: {
    weekNumber: number;
    kind: 'foto' | 'cari';
    theme: string;
    completed: boolean;
    paidWeek: number;
  };
  wallpaperPhotoId: string | null;
}

export interface GalleryPhoto {
  id: string;
  title: string;
  caption: string;
  dayTaken: number;
  category: 'opening' | 'kos' | 'janda' | 'keluarga' | 'npc';
  sceneKey:
    | 'opening_mangga'
    | 'papan_kost'
    | 'janda_mangkuk'
    | 'janda_lompat'
    | 'janda_ngantuk'
    | 'janda_pangkuan'
    | 'janda_warung'
    | 'janda_kardus'
    | 'janda_lantai2'
    | 'kos_lantai2'
    | 'adik_kunjungan'
    | 'momen_npc';
  locationTag?: string;
  sentToAdik: boolean;
  displayedInRoom: boolean;
}

export interface MissionItem {
  id: string;
  group: 'utama' | 'sampingan' | 'janda';
  title: string;
  description: string;
  nextStep: string;
  rewardAmount: number;
  rewardAccount: AccountType;
  extraRewardText?: string;
  status: 'terkunci' | 'aktif' | 'selesai' | 'terlewat';
  rewardPaid: boolean;
  completedDay?: number;
  deadlineDay?: number;
  pinned: boolean;
  targetSpot?: MapSpotId;
  repeatableWeekly?: boolean;
}

export interface CalendarEvent {
  id: string;
  day: number;
  title: string;
  category: 'gang' | 'tagihan' | 'tukang' | 'servis' | 'pribadi' | 'acara';
  description: string;
  impactText?: string;
  resolved?: boolean;
}

export interface DaySummary {
  dayCompleted: number;
  newDay: number;
  weatherNewDay: WeatherType;
  incomeUsaha: number;
  expenseUsaha: number;
  incomePribadi: number;
  expensePribadi: number;
  highlights: string[];
  employeeLogs: string[];
  day30Report?: {
    occupancyRate: number;
    totalBalanceUsaha: number;
    totalBalancePribadi: number;
    totalRevenue: number;
    totalTenantsServed: number;
    avgReview: number;
    missionsDone: number;
    jandaPhotos: number;
  };
}

export type MapSpotId =
  | 'gerbang'
  | 'bangku_mangga'
  | 'parkiran'
  | 'teras'
  | 'rak_paket'
  | 'router'
  | 'tangga'
  | 'kamar_101'
  | 'kamar_102'
  | 'kamar_201'
  | 'kamar_202'
  | 'kamar_301'
  | 'kamar_302'
  | 'ruang_owner'
  | 'warung'
  | 'bengkel'
  | 'coffee_cart'
  | 'kontrakan';

export interface WorldPoint {
  x: number;
  y: number;
  floor: 1 | 2 | 3;
}

export interface ToastNotice {
  id: string;
  text: string;
  tone?: 'info' | 'success' | 'warning' | 'mission';
}

export interface GameSettings {
  muted: boolean;
  reducedMotion: boolean;
}

export interface GameState {
  version: number;
  phase: 'title' | 'opening' | 'playing';
  openingStep: number;
  starterPlan: StarterPlan | null;
  day: number;
  slot: TimeSlot;
  weather: WeatherType;
  buildingStage: BuildingStage;
  owner: OwnerAppearance;
  ownerPos: WorldPoint;
  activeFloorView: 1 | 2 | 3;
  cutawayEnabled: boolean;
  reputation: number; // 1.0 .. 5.0
  competitorNearbyActive: boolean;
  gangEventActiveTitle: string | null;
  firstNightCompleted: boolean;
  firstNightGreetedTenant: boolean;
  firstNightGuestShown: boolean;
  packageWaitingForTenantId: string | null;
  packageDeliveredCount: number;
  accounts: {
    usaha: number;
    pribadi: number;
  };
  ledger: Transaction[];
  debts: DebtRecord[];
  claims: TransferClaim[];
  rooms: Room[];
  ownerRoom: OwnerRoomState;
  facilities: FacilityState;
  issues: BuildingIssue[];
  projects: ProjectItem[];
  tenants: TenantProfile[];
  contracts: Contract[];
  chats: ChatThread[];
  promises: PromiseRecord[];
  rental: RentalSystem;
  warung: WarungSystem;
  kontrakan: KontrakanSystem;
  partners: PartnerItem[];
  employees: EmployeeItem[];
  adik: AdikState;
  relationships: RelationshipNPC[];
  janda: JandaState;
  gallery: GalleryPhoto[];
  missions: MissionItem[];
  calendar: CalendarEvent[];
  daySummary: DaySummary | null;
  day30Unlocked: boolean;
  settings: GameSettings;
  toasts: ToastNotice[];
  activeTourTenantId: string | null;
  activeTourRoomId: string | null;
  nextIdCounter: number;
}

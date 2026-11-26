export type TimeSlot = 'pagi' | 'siang' | 'sore' | 'malam';
export type WeatherType = 'cerah' | 'berawan' | 'hujan' | 'hujan_deras';
export type AccountType = 'usaha' | 'pribadi';
export type FloorNumber = 1 | 2 | 3;

export type ScreenMode = 'title' | 'opening' | 'playing';
export type PhoneAppId =
  | 'home'
  | 'chat'
  | 'bank'
  | 'properti'
  | 'rental'
  | 'warung'
  | 'kalender'
  | 'peta'
  | 'galeri'
  | 'misi';

export type OutfitCategory = 'genz' | 'millennial' | 'aktivitas';

export interface OutfitDef {
  id: string;
  name: string;
  category: OutfitCategory;
  description: string;
  topColor: string;
  bottomColor: string;
  accentColor: string;
  style: 'oversized' | 'hoodie' | 'linen' | 'cardigan' | 'kos' | 'piyama' | 'hujan' | 'ngopi';
  accessory?: 'totebag' | 'slingbag' | 'helm' | 'payung' | 'jepit' | 'jam';
  price: number;
}

export interface OwnerAppearance {
  name: string;
  hairStyle: 'pendek' | 'bob' | 'bergelombang' | 'belah_tengah' | 'cepol';
  hairColor: string;
  skinTone: string;
  outfitId: string;
  unlockedOutfits: string[];
}

export type InitialPlan = 'dua_standar' | 'satu_premium';

export type FurnitureType =
  | 'kasur_standar'
  | 'kasur_queen'
  | 'meja_kecil'
  | 'meja_besar'
  | 'lemari'
  | 'gorden_biasa'
  | 'tirai_blackout'
  | 'lampu_hangat'
  | 'tanaman'
  | 'rak_preloved'
  | 'ac';

export interface FurnitureCatalogItem {
  id: FurnitureType;
  name: string;
  cost: number;
  width: number;
  height: number;
  effectText: string;
  appealBonus: number;
  rentBonus: number;
  color: string;
  accent: string;
}

export interface PlacedFurniture {
  uid: string;
  type: FurnitureType;
  gx: number; // 0..4 inside 5x4 room grid
  gy: number; // 0..3 inside 5x4 room grid
}

export type RoomStatus =
  | 'locked'
  | 'constructing'
  | 'vacant'
  | 'occupied'
  | 'renovating';

export type RoomTier = 'standar' | 'premium';

export interface Room {
  id: string; // e.g. '101', '102', '103', '104', '201', '202', '203', '301', '302'
  name: string;
  floor: FloorNumber;
  tier: RoomTier;
  status: RoomStatus;
  baseRent: number;
  listedRent: number;
  adActive: boolean;
  adNote: string;
  furniture: PlacedFurniture[];
  condition: number; // 0..100
  cleanliness: number; // 0..100
  wifiStrength: number; // 0..100
  waterPressure: number; // 0..100
  noiseLevel: number; // 0..100 (lower is quieter)
  hasPrivateBath: boolean;
  tenantId: string | null;
  coTenantName: string | null; // Partner who signed Kontrak Bersama
  lightOn: boolean;
  privacyStatus: string; // e.g. 'Kosong', 'Sedang istirahat', 'Kerja dari kamar', 'Ada tamu menginap'
  guestPresent: boolean;
  guestName: string | null;
  guestOvernight: boolean;
  mapX: number;
  mapY: number;
  doorX: number;
  doorY: number;
  constructionDaysLeft: number;
  constructionTotalDays: number;
  renovationNote?: string;
}

export type FacilityId =
  | 'wifi_dasar'
  | 'wifi_repeater'
  | 'petak_motor'
  | 'area_jemur'
  | 'kanopi_teras'
  | 'rak_paket'
  | 'mesin_cuci'
  | 'kamar_owner'
  | 'pondasi_lantai2'
  | 'pompa_listrik'
  | 'lantai3_lounge'
  | 'peredam_suara'
  | 'bangku_geser'
  | 'rak_preloved_teras';

export interface FacilityDef {
  id: FacilityId;
  name: string;
  cost: number;
  days: number;
  floor: FloorNumber;
  prereqs: FacilityId[];
  description: string;
  effect: string;
  category: 'utilitas' | 'teras' | 'ekspansi' | 'pribadi';
}

export interface ActiveProject {
  id: string;
  kind: 'room' | 'facility' | 'kontrakan_repair';
  targetId: string;
  title: string;
  cost: number;
  daysLeft: number;
  totalDays: number;
  startedDay: number;
  scheduleMode: 'normal' | 'siang_sore'; // Adjusted if Dimas sleeps midday
}

export type IssueKind = 'wifi_lemah' | 'air_kecil' | 'atap_bocor' | 'parkir_penuh' | 'suara_teras' | 'antrean_cuci' | 'listrik_padam';

export interface BuildingIssue {
  id: string;
  kind: IssueKind;
  roomId?: string;
  title: string;
  description: string;
  rootCause: string;
  reportedBy: string;
  reportedDay: number;
  inspected: boolean;
  resolved: boolean;
  tempFixUsed: boolean;
  tempFixCost: number;
  fullFixCost: number;
  scheduledDay?: number;
  promiseKept?: boolean;
}

export interface TenantProfile {
  id: string;
  name: string;
  age: number;
  occupation: string;
  bio: string;
  budgetMin: number;
  budgetMax: number;
  preferredTier: RoomTier | 'any';
  wantsBigDesk?: boolean;
  wantsBlackout?: boolean;
  wantsFastWifi?: boolean;
  shiftWorker?: boolean;
  partnerName?: string;
  partnerVisitsOften?: boolean;
  hairStyle: OwnerAppearance['hairStyle'];
  hairColor: string;
  skinTone: string;
  outfitDay: string;
  outfitRest: string;
  reliability: 'tepat_waktu' | 'butuh_ingat' | 'minta_cicil';
  storyArc?: 'naya' | 'dimas' | 'rara' | 'fajar' | 'vina';
  storyStage: number;
  relationship: number; // 0..100
  chatGreeting: string;
  referredBy?: string;
}

export interface TenantContract {
  id: string;
  tenantId: string;
  roomId: string;
  monthlyRent: number;
  depositHeld: number;
  startDay: number;
  nextDueDay: number;
  isJointContract: boolean;
  coTenantName?: string;
  includesBikeId?: string;
  status: 'active' | 'ended';
  rentPaidThisCycle: boolean;
  hasInstallment: boolean;
  checkoutPending?: boolean;
  monthsStayed: number;
}

export interface Applicant {
  id: string;
  tenantId: string;
  targetRoomId: string;
  offeredRent: number;
  message: string;
  appliedDay: number;
  toured: boolean;
  wantsBikeBundle?: boolean;
  status: 'pending' | 'touring' | 'accepted' | 'rejected';
}

export interface Transaction {
  id: string;
  day: number;
  slot: TimeSlot;
  account: AccountType;
  type: 'in' | 'out';
  category:
    | 'sewa'
    | 'deposit'
    | 'cicilan'
    | 'misi'
    | 'renovasi'
    | 'rental'
    | 'servis'
    | 'warung'
    | 'kontrakan'
    | 'gaji'
    | 'adik'
    | 'transfer_antar'
    | 'pribadi'
    | 'refund'
    | 'utang';
  amount: number;
  beforeBalance: number;
  afterBalance: number;
  title: string;
  counterparty: string;
  referenceCode: string;
  matchedClaimId?: string; // Ensures one bank mutation can only match one claim!
}

export type DebtKind = 'cicilan_sewa' | 'bon_warung' | 'pinjaman_teman' | 'bayar_pemasok';

export interface DebtRecord {
  id: string;
  kind: DebtKind;
  direction: 'piutang' | 'utang'; // piutang = owed to owner, utang = owner owes
  account: AccountType;
  counterpartyId: string;
  counterpartyName: string;
  title: string;
  initialAmount: number;
  paidAmount: number;
  remainingAmount: number;
  promisedDay: number;
  reliability: 'tepat_waktu' | 'butuh_ingat' | 'minta_tenggat';
  remindedToday: boolean;
  status: 'open' | 'partial' | 'paid';
  history: { day: number; amount: number; note: string }[];
  relatedContractId?: string;
}

export type ClaimScenario = 'valid' | 'delayed' | 'underpaid' | 'wrong_account' | 'fake';
export type ClaimStatus = 'klaim_diterima' | 'menunggu_verifikasi' | 'bayar_sebagian' | 'lunas' | 'ditolak' | 'serah_percaya';

export interface TransferClaim {
  id: string;
  bookingId: string;
  customerName: string;
  expectedAmount: number;
  claimedAmount: number;
  claimedRef: string;
  claimedAccount: AccountType;
  actualScenario: ClaimScenario;
  actualMutationId?: string;
  actualArrivesOnSlot?: { day: number; slot: TimeSlot };
  status: ClaimStatus;
  dayCreated: number;
  note: string;
}

export interface BikeInspection {
  day: number;
  kind: 'awal' | 'akhir';
  tireOk: boolean;
  bodyOk: boolean;
  batteryOk: boolean;
  odometer: number;
  notes: string;
}

export interface Motorbike {
  id: string;
  name: string;
  plate: string;
  color: string;
  purchasePrice: number;
  dailyRate: number;
  monthlyRate: number;
  odometer: number;
  tireHealth: number; // 0..100
  bodyHealth: number; // 0..100
  batteryHealth: number; // 0..100
  status: 'tersedia' | 'dipakai' | 'bengkel' | 'mogok';
  serviceDoneDay?: number;
  serviceType?: 'reguler' | 'ekspres';
  lastInspection?: BikeInspection;
  currentBookingId?: string;
}

export interface RentalBooking {
  id: string;
  bikeId: string;
  customerName: string;
  tenantId?: string;
  rateType: 'harian' | 'bulanan' | 'paket_kamar';
  startDay: number;
  endDay: number;
  totalPrice: number;
  deposit: number;
  paidAmount: number;
  status: 'pending' | 'active' | 'returned' | 'cancelled';
  handoverInspected: boolean;
  returnInspected: boolean;
  scratchDetected?: boolean;
  claimId?: string;
  releasedOnTrust?: boolean;
}

export interface BreakdownIncident {
  id: string;
  bookingId: string;
  bikeId: string;
  customerName: string;
  kind: 'ban_bocor' | 'aki_tekor' | 'mogok' | 'telat_kembali';
  location: string;
  message: string;
  day: number;
  slot: TimeSlot;
  resolved: boolean;
  resolution?: string;
  clashesWithDateId?: string;
}

export interface WarungMenuItem {
  id: string;
  name: string;
  costPerUnit: number;
  sellPrice: number;
  stock: number;
  soldToday: number;
  fromRara?: boolean;
  raraSplit?: number; // percentage for Rara
  isPreOrder?: boolean;
}

export interface WarungOrder {
  id: string;
  customerName: string;
  itemId: string;
  qty: number;
  isRush: boolean;
  isCampusCatering?: boolean;
  status: 'pending' | 'served' | 'substituted' | 'declined' | 'split';
  reward: number;
}

export interface WarungState {
  unlocked: boolean;
  level: 1 | 2; // 1 = Warung sederhana, 2 = Restoran kecil
  isOpenToday: boolean;
  tables: number;
  menu: WarungMenuItem[];
  raraConsignmentStage: 0 | 1 | 2 | 3; // 0 none, 1 offered, 2 active, 3 permanent/preorder
  dailyOrders: WarungOrder[];
  campusOrderActive: boolean;
  campusOrderResolved: boolean;
  campusRepeatClient: boolean;
  revenueToday: number;
  wasteToday: number;
}

export interface KontrakanState {
  unlocked: boolean;
  owned: boolean;
  repaired: boolean;
  adActive: boolean;
  monthlyRent: number;
  upkeepDaily: number;
  tenantFamilyName: string | null;
  contractStartDay: number | null;
  nextDueDay: number | null;
  depositHeld: number;
  condition: number;
  applicants: { id: string; familyName: string; members: number; offer: number; bio: string }[];
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'warung' | 'kebersihan' | 'rental';
  roleLabel: string;
  dailyWage: number;
  workHours: string;
  hired: boolean;
  dutyDescription: string;
  lastActionLog?: string;
}

export interface Partnership {
  id: string;
  name: string;
  partnerNpc: string;
  benefit: string;
  active: boolean;
  costToJoin: number;
}

export interface ChatAction {
  id: string;
  label: string;
  actionType: string;
  payload?: Record<string, unknown>;
  timeCost?: number; // slots
  moneyCost?: number;
  account?: AccountType;
  used?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'owner' | 'npc' | 'system';
  senderName: string;
  text: string;
  day: number;
  slot: TimeSlot;
  photoId?: string;
  actions?: ChatAction[];
  gotoLocation?: { label: string; x: number; y: number; floor: FloorNumber };
  verifyClaimId?: string;
}

export interface ChatThread {
  id: string;
  npcId: string;
  npcName: string;
  roleTag: string;
  avatarHairStyle: OwnerAppearance['hairStyle'];
  avatarHairColor: string;
  avatarSkinTone: string;
  avatarOutfitId: string;
  unread: number;
  messages: ChatMessage[];
}

export interface PromiseRecord {
  id: string;
  npcId: string;
  npcName: string;
  description: string;
  dueDay: number;
  status: 'open' | 'kept' | 'missed';
  relatedIssueId?: string;
  relatedDateId?: string;
}

export interface CalendarEvent {
  id: string;
  day: number;
  slot?: TimeSlot;
  title: string;
  category: 'sewa' | 'proyek' | 'gang' | 'serah_terima' | 'janji' | 'adik';
  description: string;
  completed?: boolean;
}

export interface PhotoItem {
  id: string;
  title: string;
  caption: string;
  day: number;
  category: 'opening' | 'kos' | 'janda' | 'keluarga' | 'npc';
  sceneKey: string;
  jandaLocation?: string;
  sentToAdik?: boolean;
  displayedInRoom?: boolean;
}

export type MissionCategory = 'utama' | 'sampingan' | 'janda' | 'mingguan';

export interface Mission {
  id: string;
  title: string;
  category: MissionCategory;
  description: string;
  nextStep: string;
  progress: number;
  target: number;
  reward: number;
  account: AccountType;
  extraRewardText?: string;
  status: 'locked' | 'active' | 'completed';
  claimed: boolean; // Atomic guard: never pay twice!
  deadlineDay?: number;
  mapTarget?: { x: number; y: number; floor: FloorNumber; label: string };
  completedDay?: number;
  weekIndex?: number; // For weekly Janda mission
}

export interface NpcRelationship {
  id: string;
  name: string;
  role: string;
  romanceable: boolean;
  isSibling?: boolean;
  affection: number; // 0..100
  status: 'kenalan' | 'teman' | 'dekat' | 'pasangan' | 'keluarga';
  favoriteSpot: string;
  bio: string;
  memories: string[];
  hairStyle: OwnerAppearance['hairStyle'];
  hairColor: string;
  skinTone: string;
  outfitId: string;
  availableSlots: TimeSlot[];
  mapLocation: { x: number; y: number; floor: FloorNumber; spotName: string };
  metToday: boolean;
  scheduledDate?: { day: number; slot: TimeSlot; activity: string; done?: boolean };
  visitedKosCount: number;
}

export type JandaPose = 'jalan' | 'stretch' | 'duduk' | 'tidur' | 'kejar' | 'pangkuan';

export interface JandaState {
  x: number;
  y: number;
  floor: FloorNumber;
  pose: JandaPose;
  mood: number; // 0..100
  hunger: number; // 0..100 (100 = full)
  fedToday: boolean;
  waterRefilledToday: boolean;
  pettedToday: boolean;
  bowlPlaced: boolean;
  bowlSpot: 'bangku_mangga' | 'teras' | 'kamar_owner' | null;
  cardboardPlaced: boolean;
  cardboardSpot: 'teras' | 'rak_paket' | 'kamar_owner' | null;
  favoriteSpots: string[];
  kejarTaliWins: number;
  jandaDimanaWins: number;
  fotoPasWins: number;
  hidingActive: boolean;
  hidingSpotId: string | null;
  hidingClues: string[];
  weeklyThemeIndex: number;
  weeklyCompletedWeek: number; // Last game week index where weekly challenge paid
  tuxedoPillowUnlocked: boolean;
  photoFrameUnlocked: boolean;
}

export interface WorldNpcEntity {
  id: string;
  name: string;
  role: 'tenant' | 'guest' | 'tukang' | 'neighbor' | 'romance' | 'adik' | 'staff';
  x: number;
  y: number;
  floor: FloorNumber;
  targetX: number;
  targetY: number;
  facing: 'left' | 'right';
  anim: 'idle' | 'walk' | 'sit' | 'carry' | 'umbrella' | 'sleep';
  hairStyle: OwnerAppearance['hairStyle'];
  hairColor: string;
  skinTone: string;
  outfitId: string;
  speech?: string;
  roomId?: string;
}

export interface DailySummary {
  dayFinished: number;
  newDay: number;
  weather: WeatherType;
  incomeTotal: number;
  expenseTotal: number;
  highlights: string[];
  alleyEventTitle?: string;
  alleyEventDesc?: string;
}

export interface ToastNotice {
  id: string;
  text: string;
  tone: 'info' | 'success' | 'warning' | 'money';
  createdAt: number;
}

export interface PackageItem {
  id: string;
  recipientTenantId: string;
  recipientName: string;
  description: string;
  isMisdelivered?: boolean;
  delivered: boolean;
  dayArrived: number;
}

export interface GameState {
  version: number;
  screen: ScreenMode;
  hasPlayedBefore: boolean;
  skipOpeningNext: boolean;

  // Time & World
  day: number;
  slot: TimeSlot;
  weather: WeatherType;
  powerOutageActive: boolean;
  competitorOpen: boolean;
  alleyBazaarActive: boolean;
  agustusanActive: boolean;
  firstNightGuestsGreeted: boolean;
  day30ReportShown: boolean;
  day30ReportOpen: boolean;

  // Owner
  owner: OwnerAppearance;
  ownerPos: { x: number; y: number; floor: FloorNumber };
  ownerEnergy: number; // 0..100
  ateToday: boolean;
  initialPlan: InitialPlan | null;
  signboardPlaced: boolean;
  activeTourApplicantId: string | null;

  // View & Settings
  activeFloor: FloorNumber;
  cutaway: boolean;
  muted: boolean;
  reducedMotion: boolean;
  wallpaperPhotoId: string | null;
  pinnedMissionId: string | null;
  phoneOpen: boolean;
  activePhoneApp: PhoneAppId;
  activeChatThreadId: string | null;

  // Finance
  businessBalance: number;
  personalBalance: number;
  depositEscrow: number;
  transactions: Transaction[];
  debts: DebtRecord[];
  transferClaims: TransferClaim[];

  // Property & Construction
  rooms: Room[];
  facilities: Record<FacilityId, boolean>;
  activeProjects: ActiveProject[];
  issues: BuildingIssue[];
  reputation: number; // 1.0..5.0
  reviews: { id: string; author: string; rating: number; text: string; day: number }[];
  packages: PackageItem[];

  // People
  tenants: Record<string, TenantProfile>;
  contracts: TenantContract[];
  applicants: Applicant[];
  relationships: Record<string, NpcRelationship>;
  worldNpcs: WorldNpcEntity[];

  // Businesses
  rentalUnlocked: boolean;
  bikes: Motorbike[];
  bookings: RentalBooking[];
  breakdowns: BreakdownIncident[];
  warung: WarungState;
  kontrakan: KontrakanState;
  staff: StaffMember[];
  partnerships: Partnership[];

  // Comms, Calendar, Photos, Missions, Cat
  chats: ChatThread[];
  promises: PromiseRecord[];
  calendar: CalendarEvent[];
  photos: PhotoItem[];
  missions: Mission[];
  janda: JandaState;

  // Ephemeral UI overlays
  dailySummary: DailySummary | null;
  toasts: ToastNotice[];
  activeModal:
    | null
    | { type: 'room_renovate'; roomId: string }
    | { type: 'wardrobe' }
    | { type: 'janda_minigame'; game: 'kejar_tali' | 'janda_dimana' | 'foto_pas' }
    | { type: 'bike_inspect'; bikeId: string; bookingId?: string; kind: 'awal' | 'akhir' }
    | { type: 'checkout'; contractId: string }
    | { type: 'room_detail'; roomId: string }
    | { type: 'owner_room' }
    | { type: 'npc_interact'; npcId: string }
    | { type: 'janda_interact' }
    | { type: 'warung_rush' }
    | { type: 'reset_confirm' }
    | { type: 'settings' };
}

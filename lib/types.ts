export type Strategist = {
  id: string;
  name: string;
};

export type Designer = {
  id: string;
  name: string;
  dailyCapacity: number;
};

export type Editor = {
  id: string;
  name: string;
  dailyCapacity: number;
};

export type Brand = {
  id: string;
  name: string;
  statics: number;
  videos: number;
  designerIds: string[];
  editorIds: string[];
  notes?: string;
};

export type StrategistGroup = {
  id: string;
  strategistId: string | null;
  brands: Brand[];
};

export type Month = {
  id: string;
  label: string;
  groups: StrategistGroup[];
};

export type AppState = {
  version: number;
  workingDaysPerMonth: number;
  strategists: Strategist[];
  designers: Designer[];
  editors: Editor[];
  months: Record<string, Month>;
  currentMonthId: string;
};

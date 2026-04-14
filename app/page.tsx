"use client";

import { supabase } from "./lib/supabase";
import { useEffect, useMemo, useState } from "react";
import {
  Users,
  AlertTriangle,
  ClipboardCheck,
  Store,
  ChevronLeft,
  FileText,
  Bell,
  DollarSign,
  Clock3,
  LogOut,
  Shield,
  UserPlus,
  Building2,
  Upload,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Target,
} from "lucide-react";

type Role = "owner" | "gm";

type User = {
  id: string;
  name: string;
  role: Role;
  storeId: string | null;
};

type StoreType = {
  id: string;
  name: string;
};

type CheckinRating = "+" | "+/-" | "-";

type PayEntry = {
  id: string;
  title: string;
  rate: string;
  date: string;
  tipsEligible: "Yes" | "No";
  enteredBy: string;
};

type ReviewHistoryEntry = {
  id: string;
  date: string;
  manager: string;
  total: number;
  type: string;
  scores: {
    customerService: number;
    productQuality: number;
    foodSafety: number;
    productivity: number;
    communication: number;
    dependability: number;
    jobKnowledge: number;
    safety: number;
  };
};

type NoteEntry = {
  date: string;
  text: string;
  manager: string;
};

type GoalEntry = {
  id: string;
  date: string;
  goal: string;
  support: string;
  manager: string;
};

type CheckinEntry = {
  id: string;
  date: string;
  manager: string;
  ratings: {
    teamPlayer: CheckinRating | "";
    customerFocus: CheckinRating | "";
    qualityFocus: CheckinRating | "";
    integrity: CheckinRating | "";
    reliability: CheckinRating | "";
    upbeatFriendly: CheckinRating | "";
    takesInitiative: CheckinRating | "";
  };
};

type AttendanceEntry = {
  id: string;
  date: string;
  type: string;
  reason: string;
  createdBy: string;
};

type DocumentEntry = {
  id: string;
  date: string;
  name: string;
  uploadedBy: string;
  filePath: string;
  publicUrl: string;
};

type Employee = {
  id: string;
  name: string;
  title: string;
  storeId: string;
  startDate: string;
  nextReviewDue: string;
  assignedTrainer: string;
  insuranceApproved: boolean;
  adpSignedUp: boolean;
  pay: PayEntry[];
  notes: NoteEntry[];
  goals: GoalEntry[];
  checkins: CheckinEntry[];
  attendance: AttendanceEntry[];
  documents: DocumentEntry[];
  reviewHistory: ReviewHistoryEntry[];
  terminated: boolean;
  terminationReason?: string;
  terminationDate?: string;
};

type AuditEntry = {
  id: number;
  ts: string;
  user: string;
  action: string;
  target: string;
};

type ManagerRow = {
  id: number | string;
  name: string;
  email?: string | null;
  role?: string | null;
  store_id: number | string | null;
};

type StoreRow = {
  id: number | string;
  name: string;
};

type EmployeeNoteRow = {
  id: number;
  employee_id: number;
  note_date: string;
  note_text: string;
  manager_name: string | null;
};

type EmployeeGoalRow = {
  id: number;
  employee_id: number;
  goal?: string | null;
  goal_text?: string | null;
  support?: string | null;
  support_text?: string | null;
  goal_date: string;
  manager_name: string | null;
};

type EmployeeCheckinRow = {
  id: number;
  employee_id: number;
  checkin_date: string;
  manager_name: string | null;
  team_player?: string | null;
  customer_focus?: string | null;
  quality_focus?: string | null;
  integrity?: string | null;
  reliability?: string | null;
  upbeat_friendly?: string | null;
  takes_initiative?: string | null;
};

type EmployeeAttendanceRow = {
  id: number;
  employee_id: number;
  issue_date: string;
  issue_type: string;
  reason: string | null;
  created_by: string | null;
};

type EmployeeDocumentRow = {
  id: number;
  employee_id: number;
  document_date: string;
  name: string;
  file_path: string;
  public_url: string | null;
  uploaded_by: string | null;
};

type EmployeeReviewRow = {
  id: number;
  employee_id: number;
  review_date: string;
  manager_name: string | null;
  review_type: string | null;
  total_score: number | null;
  customer_service?: number | null;
  product_quality?: number | null;
  food_safety?: number | null;
  productivity?: number | null;
  communication?: number | null;
  dependability?: number | null;
  job_knowledge?: number | null;
  safety?: number | null;
};

type EmployeePayRow = {
  id: number;
  employee_id: number;
  effective_date: string;
  title: string;
  rate: string;
  tips_eligible: string | null;
  entered_by: string | null;
};

const MONTHLY_CHECKIN_ITEMS = [
  { key: "teamPlayer", label: "Team Player" },
  { key: "customerFocus", label: "Customer Focus" },
  { key: "qualityFocus", label: "Quality Focus" },
  { key: "integrity", label: "Integrity" },
  { key: "reliability", label: "Reliability" },
  { key: "upbeatFriendly", label: "Upbeat/Friendly" },
  { key: "takesInitiative", label: "Takes Initiative" },
] as const;

function emptyCheckinRatings() {
  return {
    teamPlayer: "" as CheckinRating | "",
    customerFocus: "" as CheckinRating | "",
    qualityFocus: "" as CheckinRating | "",
    integrity: "" as CheckinRating | "",
    reliability: "" as CheckinRating | "",
    upbeatFriendly: "" as CheckinRating | "",
    takesInitiative: "" as CheckinRating | "",
  };
}

function isOverdue(date: string) {
  if (!date) return false;
  return new Date(date) < new Date(new Date().toISOString().slice(0, 10));
}

function daysSince(date: string) {
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

function nowStamp() {
  return new Date().toISOString().replace("T", " ").slice(0, 16);
}

function addMonthsToToday(months: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function toStoreKey(storeId: number | string | null | undefined) {
  if (storeId === null || storeId === undefined || storeId === "") return "";
  return `s${storeId}`;
}

function fromStoreKey(storeKey: string | null | undefined) {
  if (!storeKey) return null;
  return Number(storeKey.replace("s", ""));
}

function normalizeCheckinRating(value: string | null | undefined): CheckinRating | "" {
  if (value === "+" || value === "+/-" || value === "-") return value;
  return "";
}

export default function Page() {
  const [stores, setStores] = useState<StoreType[]>([]);
  const [currentUserId, setCurrentUserId] = useState("owner");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [managers, setManagers] = useState<ManagerRow[]>([]);
  const [employeeNotes, setEmployeeNotes] = useState<EmployeeNoteRow[]>([]);
  const [employeeGoals, setEmployeeGoals] = useState<EmployeeGoalRow[]>([]);
  const [employeeCheckins, setEmployeeCheckins] = useState<EmployeeCheckinRow[]>([]);
  const [employeeAttendance, setEmployeeAttendance] = useState<EmployeeAttendanceRow[]>([]);
  const [employeeDocuments, setEmployeeDocuments] = useState<EmployeeDocumentRow[]>([]);
  const [employeeReviews, setEmployeeReviews] = useState<EmployeeReviewRow[]>([]);
  const [employeePay, setEmployeePay] = useState<EmployeePayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  const [audit, setAudit] = useState<AuditEntry[]>([
    { id: 1, ts: "2026-04-10 09:10", user: "Maria", action: "Completed review", target: "Jamie Chen" },
    { id: 2, ts: "2026-04-10 08:20", user: "Derek", action: "Added note", target: "Priya Singh" },
  ]);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "pay" | "checkins" | "review" | "notes" | "documents" | "attendance" | "term"
  >("overview");

  const [newNote, setNewNote] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [newGoalSupport, setNewGoalSupport] = useState("");

  const [attendanceType, setAttendanceType] = useState("Late");
  const [attendanceReason, setAttendanceReason] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));

  const [terminationReason, setTerminationReason] = useState("");
  const [checkinRatings, setCheckinRatings] = useState(emptyCheckinRatings());
  const [documentDate, setDocumentDate] = useState(new Date().toISOString().slice(0, 10));

  const [newPayTitle, setNewPayTitle] = useState("");
  const [newPayRate, setNewPayRate] = useState("");
  const [newPayDate, setNewPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [newTipsEligible, setNewTipsEligible] = useState<"Yes" | "No">("Yes");

  const [expandedCheckinId, setExpandedCheckinId] = useState<string | null>(null);
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);

  const [reviewScores, setReviewScores] = useState<Record<string, number>>({
    "Customer Service": 0,
    "Product Quality": 0,
    "Food Safety": 0,
    "Productivity": 0,
    "Communication": 0,
    "Dependability": 0,
    "Job Knowledge": 0,
    "Safety": 0,
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      await Promise.all([
        fetchStores(),
        fetchManagers(),
        fetchEmployeeNotes(),
        fetchEmployeeGoals(),
        fetchEmployeeCheckins(),
        fetchEmployeeAttendance(),
        fetchEmployeeDocuments(),
        fetchEmployeeReviews(),
        fetchEmployeePay(),
      ]);
      await fetchEmployees();
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchEmployees();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    employeeNotes,
    employeeGoals,
    employeeCheckins,
    employeeAttendance,
    employeeDocuments,
    employeeReviews,
    employeePay,
  ]);

  async function fetchStores() {
    const { data, error } = await supabase.from("stores").select("*").order("id");
    if (error) {
      console.error("STORES ERROR:", JSON.stringify(error, null, 2));
      return;
    }

    const mapped: StoreType[] = ((data as StoreRow[]) || []).map((row) => ({
      id: `s${row.id}`,
      name: row.name,
    }));
    setStores(mapped);
  }

  async function fetchManagers() {
    const { data, error } = await supabase.from("managers").select("*").order("id");
    if (error) {
      console.error("MANAGERS ERROR:", JSON.stringify(error, null, 2));
      return;
    }
    setManagers((data as ManagerRow[]) || []);
  }

  async function fetchEmployeeNotes() {
    const { data, error } = await supabase
      .from("employee_notes")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("EMPLOYEE NOTES ERROR:", JSON.stringify(error, null, 2));
      return;
    }
    setEmployeeNotes((data as EmployeeNoteRow[]) || []);
  }

  async function fetchEmployeeGoals() {
    const { data, error } = await supabase
      .from("employee_goals")
      .select("*")
      .order("goal_date", { ascending: false });

    if (error) {
      console.error("EMPLOYEE GOALS ERROR:", JSON.stringify(error, null, 2));
      return;
    }
    setEmployeeGoals((data as EmployeeGoalRow[]) || []);
  }

  async function fetchEmployeeCheckins() {
    const { data, error } = await supabase
      .from("employee_checkins")
      .select("*")
      .order("checkin_date", { ascending: false });

    if (error) {
      console.error("EMPLOYEE CHECKINS ERROR:", JSON.stringify(error, null, 2));
      return;
    }
    setEmployeeCheckins((data as EmployeeCheckinRow[]) || []);
  }

  async function fetchEmployeeAttendance() {
    const { data, error } = await supabase
      .from("employee_attendance")
      .select("*")
      .order("issue_date", { ascending: false });

    if (error) {
      console.error("EMPLOYEE ATTENDANCE ERROR:", JSON.stringify(error, null, 2));
      return;
    }
    setEmployeeAttendance((data as EmployeeAttendanceRow[]) || []);
  }

  async function fetchEmployeeDocuments() {
    const { data, error } = await supabase
      .from("employee_documents")
      .select("*")
      .order("document_date", { ascending: false });

    if (error) {
      console.error("EMPLOYEE DOCUMENTS ERROR:", JSON.stringify(error, null, 2));
      return;
    }
    setEmployeeDocuments((data as EmployeeDocumentRow[]) || []);
  }

  async function fetchEmployeeReviews() {
    const { data, error } = await supabase
      .from("employee_reviews")
      .select("*")
      .order("review_date", { ascending: false });

    if (error) {
      console.error("EMPLOYEE REVIEWS ERROR:", JSON.stringify(error, null, 2));
      return;
    }
    setEmployeeReviews((data as EmployeeReviewRow[]) || []);
  }

  async function fetchEmployeePay() {
    const { data, error } = await supabase
      .from("employee_pay")
      .select("*")
      .order("effective_date", { ascending: false });

    if (error) {
      console.error("EMPLOYEE PAY ERROR:", JSON.stringify(error, null, 2));
      return;
    }
    setEmployeePay((data as EmployeePayRow[]) || []);
  }

  async function fetchEmployees() {
    const { data, error } = await supabase.from("employees").select("*").order("id");

    if (error) {
      console.error("EMPLOYEES ERROR:", JSON.stringify(error, null, 2));
      return;
    }

    const mapped: Employee[] = (data || []).map((row: any) => ({
      id: String(row.id),
      name: row.name ?? "",
      title: row.title ?? "Team Member",
      storeId: toStoreKey(row.store_id),
      startDate: row.start_date ?? "",
      nextReviewDue: row.next_review_due ?? "",
      assignedTrainer: row.assigned_trainer ?? "",
      insuranceApproved: row.insurance_approved ?? false,
      adpSignedUp: row.adp_signed_up ?? false,

      pay: employeePay
        .filter((entry) => String(entry.employee_id) === String(row.id))
        .map((entry) => ({
          id: String(entry.id),
          title: entry.title,
          rate: entry.rate,
          date: entry.effective_date,
          tipsEligible: (entry.tips_eligible === "No" ? "No" : "Yes") as "Yes" | "No",
          enteredBy: entry.entered_by ?? "",
        })),

      notes: employeeNotes
        .filter((note) => String(note.employee_id) === String(row.id))
        .map((note) => ({
          date: note.note_date,
          text: note.note_text,
          manager: note.manager_name ?? "",
        })),

goals: employeeGoals
  .filter((goal) => String(goal.employee_id) === String(row.id))
  .map((goal) => ({
    id: String(goal.id),
    date: goal.goal_date,
    goal: goal.goal ?? goal.goal_text ?? "",
    support: goal.support ?? goal.support_text ?? "",
    manager: goal.manager_name ?? "",
  })),

      checkins: employeeCheckins
        .filter((checkin) => String(checkin.employee_id) === String(row.id))
        .map((checkin) => ({
          id: String(checkin.id),
          date: checkin.checkin_date,
          manager: checkin.manager_name ?? "",
          ratings: {
            teamPlayer: normalizeCheckinRating(checkin.team_player),
            customerFocus: normalizeCheckinRating(checkin.customer_focus),
            qualityFocus: normalizeCheckinRating(checkin.quality_focus),
            integrity: normalizeCheckinRating(checkin.integrity),
            reliability: normalizeCheckinRating(checkin.reliability),
            upbeatFriendly: normalizeCheckinRating(checkin.upbeat_friendly),
            takesInitiative: normalizeCheckinRating(checkin.takes_initiative),
          },
        })),

      attendance: employeeAttendance
        .filter((entry) => String(entry.employee_id) === String(row.id))
        .map((entry) => ({
          id: String(entry.id),
          date: entry.issue_date,
          type: entry.issue_type,
          reason: entry.reason ?? "",
          createdBy: entry.created_by ?? "",
        })),

      documents: employeeDocuments
        .filter((doc) => String(doc.employee_id) === String(row.id))
        .map((doc) => ({
          id: String(doc.id),
          date: doc.document_date,
          name: doc.name,
          uploadedBy: doc.uploaded_by ?? "",
          filePath: doc.file_path,
          publicUrl: doc.public_url ?? "",
        })),

      reviewHistory: employeeReviews
        .filter((review) => String(review.employee_id) === String(row.id))
        .map((review) => ({
          id: String(review.id),
          date: review.review_date,
          manager: review.manager_name ?? "",
          total: review.total_score ?? 0,
          type: review.review_type ?? "6-month",
          scores: {
            customerService: review.customer_service ?? 0,
            productQuality: review.product_quality ?? 0,
            foodSafety: review.food_safety ?? 0,
            productivity: review.productivity ?? 0,
            communication: review.communication ?? 0,
            dependability: review.dependability ?? 0,
            jobKnowledge: review.job_knowledge ?? 0,
            safety: review.safety ?? 0,
          },
        })),

      terminated: row.terminated ?? false,
      terminationReason: row.termination_reason ?? undefined,
      terminationDate: row.termination_date ?? undefined,
    }));

    setEmployees(mapped);
  }

  const dynamicUsers: User[] = useMemo(() => {
    const owner: User = {
      id: "owner",
      name: "Owner (You)",
      role: "owner",
      storeId: null,
    };

    const gmUsers: User[] = managers
      .filter((manager) => manager.role !== "owner")
      .map((manager) => ({
        id: `gm-${manager.id}`,
        name: manager.name,
        role: "gm" as Role,
        storeId: toStoreKey(manager.store_id),
      }));

    return [owner, ...gmUsers];
  }, [managers]);

  const currentUser =
    dynamicUsers.find((u) => u.id === currentUserId) ??
    dynamicUsers[0] ?? {
      id: "owner",
      name: "Owner (You)",
      role: "owner" as Role,
      storeId: null,
    };

  function storeName(storeId: string) {
    return stores.find((s) => s.id === storeId)?.name ?? "Unknown store";
  }

  function managerNameForStore(storeId: string) {
    const gm = managers.find(
      (m) => m.role === "manager" && toStoreKey(m.store_id) === storeId
    );
    return gm?.name ?? "";
  }

  const visibleEmployees = useMemo(() => {
    if (currentUser.role === "owner") return employees.filter((e) => !e.terminated);
    return employees.filter((e) => !e.terminated && e.storeId === currentUser.storeId);
  }, [employees, currentUser]);

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId) ?? null;

  const overdueReviews = visibleEmployees.filter((e) => e.nextReviewDue && isOverdue(e.nextReviewDue));

  const checkinsOverdue = visibleEmployees.filter((e) => {
    const last = e.checkins[0];
    if (!last) return true;
    return daysSince(last.date) > 30;
  });

  const attendanceAlerts = visibleEmployees.filter((e) => {
    const recent = e.attendance.filter((a) => daysSince(a.date) <= 30);
    return recent.length >= 3;
  });

  const ownerStoreRollup = stores.map((store) => {
    const list = employees.filter((e) => !e.terminated && e.storeId === store.id);
    return {
      ...store,
      employees: list.length,
      overdueReviews: list.filter((e) => e.nextReviewDue && isOverdue(e.nextReviewDue)).length,
      overdueCheckins: list.filter((e) => {
        const last = e.checkins[0];
        if (!last) return true;
        return daysSince(last.date) > 30;
      }).length,
    };
  });

  function logAudit(action: string, target: string) {
    setAudit((prev) => [
      {
        id: Date.now(),
        ts: nowStamp(),
        user: currentUser.name,
        action,
        target,
      },
      ...prev,
    ]);
  }

  function updateEmployeeLocal(id: string, patch: Partial<Employee>) {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  async function addStore() {
    if (currentUser.role !== "owner") return;

    const storeNameInput = prompt("Store name?");
    if (!storeNameInput?.trim()) return;

    const trimmedName = storeNameInput.trim();

    const exists = stores.some(
      (store) => store.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (exists) {
      alert("That store already exists.");
      return;
    }

    const { error } = await supabase.from("stores").insert([{ name: trimmedName }]);

    if (error) {
      console.error("ADD STORE ERROR:", JSON.stringify(error, null, 2));
      alert(error.message || "Could not add store.");
      return;
    }

    logAudit("Added store", trimmedName);
    await fetchStores();
  }

  async function addManager() {
    if (currentUser.role !== "owner") return;

    if (stores.length === 0) {
      alert("No stores found.");
      return;
    }

    const managerName = prompt("Manager name?");
    if (!managerName?.trim()) return;

    const managerEmail = prompt("Manager email?") ?? "";

    const options = stores.map((s) => `${s.id.replace("s", "")}: ${s.name}`).join("\n");
    const chosen = prompt(`Enter store number for this manager:\n\n${options}`, "1");
    if (!chosen) return;

    const storeIdNumber = Number(chosen);
    if (!storeIdNumber || Number.isNaN(storeIdNumber)) {
      alert("Invalid store.");
      return;
    }

    const matchingStore = stores.find((s) => s.id === `s${storeIdNumber}`);
    if (!matchingStore) {
      alert("That store does not exist.");
      return;
    }

    const { error } = await supabase.from("managers").insert([
      {
        name: managerName.trim(),
        email: managerEmail.trim() || null,
        role: "manager",
        store_id: storeIdNumber,
      },
    ]);

    if (error) {
      console.error("ADD MANAGER ERROR:", JSON.stringify(error, null, 2));
      alert(error.message || "Could not add manager.");
      return;
    }

    logAudit("Added manager", `${managerName.trim()} · ${matchingStore.name}`);
    await fetchManagers();
  }

  async function editManager(manager: ManagerRow) {
    if (currentUser.role !== "owner") return;

    const newName = prompt("Edit manager name:", manager.name);
    if (!newName?.trim()) return;

    const newEmail = prompt("Edit manager email:", manager.email ?? "") ?? "";

    const options = stores.map((s) => `${s.id.replace("s", "")}: ${s.name}`).join("\n");
    const chosenStore = prompt(
      `Enter new store number for ${newName.trim()}:\n\n${options}`,
      String(manager.store_id ?? "")
    );

    if (!chosenStore) return;

    const storeIdNumber = Number(chosenStore);
    if (!storeIdNumber || Number.isNaN(storeIdNumber)) {
      alert("Invalid store.");
      return;
    }

    const { error } = await supabase
      .from("managers")
      .update({
        name: newName.trim(),
        email: newEmail.trim() || null,
        store_id: storeIdNumber,
      })
      .eq("id", manager.id);

    if (error) {
      console.error("EDIT MANAGER ERROR:", JSON.stringify(error, null, 2));
      alert(error.message || "Could not update manager.");
      return;
    }

    logAudit("Edited manager", newName.trim());
    await fetchManagers();
  }

  async function deleteManager(manager: ManagerRow) {
    if (currentUser.role !== "owner") return;

    const confirmed = window.confirm(`Delete manager ${manager.name}?`);
    if (!confirmed) return;

    const { error } = await supabase.from("managers").delete().eq("id", manager.id);

    if (error) {
      console.error("DELETE MANAGER ERROR:", JSON.stringify(error, null, 2));
      alert(error.message || "Could not delete manager.");
      return;
    }

    logAudit("Deleted manager", manager.name);
    await fetchManagers();
  }

  async function changeManagerStore() {
    if (currentUser.role !== "owner") return;

    const managerOnly = managers.filter((m) => m.role === "manager");

    if (managerOnly.length === 0) {
      alert("No managers found.");
      return;
    }

    const managerOptions = managerOnly
      .map((m) => `${m.id}: ${m.name} (current store: ${storeName(toStoreKey(m.store_id))})`)
      .join("\n");

    const chosenManagerId = prompt(
      `Enter the manager ID you want to move:\n\n${managerOptions}`
    );

    if (!chosenManagerId) return;

    const managerToMove = managerOnly.find(
      (m) => String(m.id) === String(chosenManagerId)
    );

    if (!managerToMove) {
      alert("Manager not found.");
      return;
    }

    const storeOptions = stores
      .map((s) => `${s.id.replace("s", "")}: ${s.name}`)
      .join("\n");

    const chosenStore = prompt(
      `Enter the new store number for ${managerToMove.name}:\n\n${storeOptions}`
    );

    if (!chosenStore) return;

    const storeIdNumber = Number(chosenStore);

    if (!storeIdNumber || Number.isNaN(storeIdNumber)) {
      alert("Invalid store.");
      return;
    }

    const matchingStore = stores.find((s) => s.id === `s${storeIdNumber}`);

    if (!matchingStore) {
      alert("That store does not exist.");
      return;
    }

    const { error } = await supabase
      .from("managers")
      .update({ store_id: storeIdNumber })
      .eq("id", managerToMove.id);

    if (error) {
      console.error("CHANGE MANAGER STORE ERROR:", JSON.stringify(error, null, 2));
      alert(error.message || "Could not change manager store.");
      return;
    }

    logAudit("Changed manager store", `${managerToMove.name} → ${matchingStore.name}`);
    await fetchManagers();
  }

  async function addEmployee() {
    if (stores.length === 0) {
      alert("No stores found.");
      return;
    }

    const employeeName = prompt("Employee name?");
    if (!employeeName?.trim()) return;

    let storeIdNumber: number | null = null;

    if (currentUser.role === "gm") {
      storeIdNumber = fromStoreKey(currentUser.storeId);
    } else {
      const options = stores.map((s) => `${s.id.replace("s", "")}: ${s.name}`).join("\n");
      const chosen = prompt(`Enter store number for this employee:\n\n${options}`, "1");
      if (!chosen) return;
      storeIdNumber = Number(chosen);
    }

    if (!storeIdNumber || Number.isNaN(storeIdNumber)) {
      alert("Invalid store.");
      return;
    }

    const assignedTrainer =
      currentUser.role === "gm"
        ? currentUser.name
        : managerNameForStore(`s${storeIdNumber}`);

    const { error } = await supabase.from("employees").insert([
      {
        name: employeeName.trim(),
        title: "Team Member",
        store_id: storeIdNumber,
        start_date: new Date().toISOString().slice(0, 10),
        next_review_due: addMonthsToToday(6),
        assigned_trainer: assignedTrainer,
        insurance_approved: false,
        adp_signed_up: false,
        terminated: false,
      },
    ]);

    if (error) {
      console.error("ADD EMPLOYEE ERROR:", JSON.stringify(error, null, 2));
      alert(error.message || "Could not add employee.");
      return;
    }

    logAudit("Added employee", employeeName.trim());
    await fetchEmployees();
  }

  async function deleteEmployee(id: number, name: string) {
    const confirmed = window.confirm(`Delete ${name}?`);
    if (!confirmed) return;

    const { error } = await supabase.from("employees").delete().eq("id", id);

    if (error) {
      console.error("DELETE ERROR:", JSON.stringify(error, null, 2));
      alert(error.message || "Could not delete employee.");
      return;
    }

    logAudit("Deleted employee", name);
    await fetchEmployees();
  }

  async function addNote() {
    if (!selectedEmployee || !newNote.trim()) return;

    const { error } = await supabase.from("employee_notes").insert([
      {
        employee_id: Number(selectedEmployee.id),
        note_text: newNote.trim(),
        manager_name: currentUser.name,
      },
    ]);

    if (error) {
      console.error("ADD NOTE ERROR:", JSON.stringify(error, null, 2));
      alert(error.message || "Could not save note.");
      return;
    }

    logAudit("Added note", selectedEmployee.name);
    setNewNote("");
    await fetchEmployeeNotes();
  }

async function addGoal() {
  if (!selectedEmployee || !newGoal.trim()) return;

  const payload = {
    employee_id: Number(selectedEmployee.id),
    goal: newGoal.trim(),
    goal_text: newGoal.trim(),
    support: newGoalSupport.trim(),
    support_text: newGoalSupport.trim(),
    manager_name: currentUser.name,
  };

  const { error } = await supabase.from("employee_goals").insert([payload]);

  if (error) {
    console.error("ADD GOAL ERROR:", JSON.stringify(error, null, 2));
    alert(error.message || "Could not save goal.");
    return;
  }

  logAudit("Added goal", selectedEmployee.name);
  setNewGoal("");
  setNewGoalSupport("");
  await fetchEmployeeGoals();
}

  async function addCheckin() {
    if (!selectedEmployee) return;

    const hasAtLeastOneRating = Object.values(checkinRatings).some((value) => value !== "");

    if (!hasAtLeastOneRating) {
      alert("Please select at least one rating before saving the check-in.");
      return;
    }

    const payload = {
      employee_id: Number(selectedEmployee.id),
      manager_name: currentUser.name,
      team_player: checkinRatings.teamPlayer || null,
      customer_focus: checkinRatings.customerFocus || null,
      quality_focus: checkinRatings.qualityFocus || null,
      integrity: checkinRatings.integrity || null,
      reliability: checkinRatings.reliability || null,
      upbeat_friendly: checkinRatings.upbeatFriendly || null,
      takes_initiative: checkinRatings.takesInitiative || null,
    };

    const { error } = await supabase.from("employee_checkins").insert([payload]);

    if (error) {
      console.error("ADD CHECKIN ERROR:", JSON.stringify(error, null, 2));
      alert(error.message || "Could not save check-in.");
      return;
    }

    logAudit("Logged monthly check-in", selectedEmployee.name);
    setCheckinRatings(emptyCheckinRatings());
    await fetchEmployeeCheckins();
  }

  async function addAttendance() {
    if (!selectedEmployee || !attendanceReason.trim() || !attendanceDate) return;

    const { error } = await supabase.from("employee_attendance").insert([
      {
        employee_id: Number(selectedEmployee.id),
        issue_date: attendanceDate,
        issue_type: attendanceType,
        reason: attendanceReason.trim(),
        created_by: currentUser.name,
      },
    ]);

    if (error) {
      console.error("ADD ATTENDANCE ERROR:", JSON.stringify(error, null, 2));
      alert(error.message || "Could not save attendance issue.");
      return;
    }

    logAudit(`Logged attendance: ${attendanceType}`, selectedEmployee.name);
    setAttendanceReason("");
    setAttendanceDate(new Date().toISOString().slice(0, 10));
    await fetchEmployeeAttendance();
  }

  async function uploadDocument(file: File | null) {
    if (!selectedEmployee || !file) return;

    setUploadingDocument(true);

    try {
      const safeName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const path = `employee-${selectedEmployee.id}/${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("employee-documents")
        .upload(path, file, {
          upsert: false,
        });

      if (uploadError) {
        console.error("DOCUMENT UPLOAD ERROR:", JSON.stringify(uploadError, null, 2));
        alert(uploadError.message || "Could not upload document.");
        return;
      }

      const { data: publicData } = supabase.storage
        .from("employee-documents")
        .getPublicUrl(path);

      const { error: insertError } = await supabase.from("employee_documents").insert([
        {
          employee_id: Number(selectedEmployee.id),
          document_date: documentDate,
          name: file.name,
          file_path: path,
          public_url: publicData.publicUrl,
          uploaded_by: currentUser.name,
        },
      ]);

      if (insertError) {
        console.error("DOCUMENT RECORD ERROR:", JSON.stringify(insertError, null, 2));
        alert(insertError.message || "File uploaded, but document record could not be saved.");
        return;
      }

      logAudit("Uploaded document", `${selectedEmployee.name} · ${file.name}`);
      await fetchEmployeeDocuments();
    } finally {
      setUploadingDocument(false);
    }
  }

  async function addPayEntry() {
    if (!selectedEmployee || !newPayTitle.trim() || !newPayRate.trim() || !newPayDate) return;

    const { error } = await supabase.from("employee_pay").insert([
      {
        employee_id: Number(selectedEmployee.id),
        effective_date: newPayDate,
        title: newPayTitle.trim(),
        rate: newPayRate.trim(),
        tips_eligible: newTipsEligible,
        entered_by: currentUser.name,
      },
    ]);

    if (error) {
      console.error("ADD PAY ERROR:", JSON.stringify(error, null, 2));
      alert(error.message || "Could not save pay entry.");
      return;
    }

    logAudit("Added pay entry", `${selectedEmployee.name} · ${newPayTitle.trim()} · ${newPayRate.trim()}`);
    setNewPayTitle("");
    setNewPayRate("");
    setNewPayDate(new Date().toISOString().slice(0, 10));
    setNewTipsEligible("Yes");
    await fetchEmployeePay();
  }

  async function submitReview() {
    if (!selectedEmployee) return;

    const total = Object.values(reviewScores).reduce((sum, v) => sum + v, 0);
    const today = new Date().toISOString().slice(0, 10);
    const nextReviewDue = addMonthsToToday(6);

    const { error: reviewError } = await supabase.from("employee_reviews").insert([
      {
        employee_id: Number(selectedEmployee.id),
        review_date: today,
        manager_name: currentUser.name,
        review_type: "6-month",
        total_score: total,
        customer_service: reviewScores["Customer Service"],
        product_quality: reviewScores["Product Quality"],
        food_safety: reviewScores["Food Safety"],
        productivity: reviewScores["Productivity"],
        communication: reviewScores["Communication"],
        dependability: reviewScores["Dependability"],
        job_knowledge: reviewScores["Job Knowledge"],
        safety: reviewScores["Safety"],
      },
    ]);

    if (reviewError) {
      console.error("SAVE REVIEW ERROR:", JSON.stringify(reviewError, null, 2));
      alert(reviewError.message || "Could not save 6-month review.");
      return;
    }

    const { error: employeeError } = await supabase
      .from("employees")
      .update({ next_review_due: nextReviewDue })
      .eq("id", Number(selectedEmployee.id));

    if (employeeError) {
      console.error("UPDATE NEXT REVIEW ERROR:", JSON.stringify(employeeError, null, 2));
      alert(employeeError.message || "Review saved, but next review due date was not updated.");
      await fetchEmployeeReviews();
      return;
    }

    logAudit(`Completed 6-month review (${total}/32)`, selectedEmployee.name);

    setReviewScores({
      "Customer Service": 0,
      "Product Quality": 0,
      "Food Safety": 0,
      "Productivity": 0,
      "Communication": 0,
      "Dependability": 0,
      "Job Knowledge": 0,
      "Safety": 0,
    });

    await Promise.all([fetchEmployeeReviews(), fetchEmployees()]);
  }

  async function terminateEmployee() {
    if (!selectedEmployee || !terminationReason.trim()) return;

    const today = new Date().toISOString().slice(0, 10);

    const { error } = await supabase
      .from("employees")
      .update({
        terminated: true,
        termination_reason: terminationReason.trim(),
        termination_date: today,
      })
      .eq("id", Number(selectedEmployee.id));

    if (error) {
      console.error("TERMINATE EMPLOYEE ERROR:", JSON.stringify(error, null, 2));
      alert(error.message || "Could not terminate employee.");
      return;
    }

    logAudit("Terminated employee", selectedEmployee.name);
    setTerminationReason("");
    setSelectedEmployeeId(null);
    await fetchEmployees();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 text-stone-900 flex items-center justify-center">
        <div className="text-lg font-medium">Loading...</div>
      </div>
    );
  }

  if (selectedEmployee) {
    const tabs = [
      { id: "overview", label: "Overview", icon: <ClipboardCheck size={14} /> },
      { id: "pay", label: "Pay & Reviews", icon: <DollarSign size={14} /> },
      { id: "checkins", label: "Monthly Check-in", icon: <Bell size={14} /> },
      { id: "review", label: "6-Month Review", icon: <Shield size={14} /> },
      { id: "notes", label: "Notes & Goals", icon: <FileText size={14} /> },
      { id: "documents", label: "Documents", icon: <FileText size={14} /> },
      { id: "attendance", label: "Attendance", icon: <Clock3 size={14} /> },
      { id: "term", label: "Termination", icon: <LogOut size={14} /> },
    ] as const;

    return (
      <div className="min-h-screen bg-stone-50 text-stone-900">
        <header className="bg-black text-white px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-black tracking-tight">
            BRENZ<span className="text-red-500">.</span>
          </div>
          <div className="text-sm text-stone-300">Employee Portal</div>
        </header>

        <main className="max-w-6xl mx-auto p-6">
          <button
            onClick={() => {
              setSelectedEmployeeId(null);
              setExpandedCheckinId(null);
              setExpandedReviewId(null);
            }}
            className="flex items-center gap-1 text-sm text-stone-600 hover:text-black mb-4"
          >
            <ChevronLeft size={16} />
            Back to dashboard
          </button>

          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-black text-white p-6">
              <div className="text-xs tracking-widest text-stone-400 mb-1">EMPLOYEE PACKET</div>
              <h1 className="text-3xl font-bold">{selectedEmployee.name}</h1>
              <p className="text-stone-300 mt-1">
                {selectedEmployee.title} · Started {selectedEmployee.startDate || "—"} ·{" "}
                {storeName(selectedEmployee.storeId)}
              </p>
            </div>

            <div className="border-b border-stone-200 px-4 pt-3 flex gap-2 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 text-sm rounded-t flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-stone-100 border-b-2 border-red-500 font-semibold"
                      : "text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoCard label="Assigned Trainer" value={selectedEmployee.assignedTrainer || "—"} />
                  <InfoCard label="Next Review Due" value={selectedEmployee.nextReviewDue || "—"} />
                  <InfoCard label="Store" value={storeName(selectedEmployee.storeId)} />
                  <InfoCard label="Title" value={selectedEmployee.title || "—"} />
                  <ToggleCard
                    label="Insurance Approved"
                    value={selectedEmployee.insuranceApproved}
                    onToggle={() =>
                      updateEmployeeLocal(selectedEmployee.id, {
                        insuranceApproved: !selectedEmployee.insuranceApproved,
                      })
                    }
                  />
                  <ToggleCard
                    label="ADP Signed Up"
                    value={selectedEmployee.adpSignedUp}
                    onToggle={() =>
                      updateEmployeeLocal(selectedEmployee.id, {
                        adpSignedUp: !selectedEmployee.adpSignedUp,
                      })
                    }
                  />
                </div>
              )}

              {activeTab === "pay" && (
                <div className="space-y-6">
                  <div className="border border-stone-200 rounded-lg p-4 bg-stone-50">
                    <h3 className="font-semibold mb-3">Add Pay Entry</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input
                        value={newPayTitle}
                        onChange={(e) => setNewPayTitle(e.target.value)}
                        className="border border-stone-300 rounded-lg px-3 py-2 text-sm"
                        placeholder="Title"
                      />
                      <input
                        value={newPayRate}
                        onChange={(e) => setNewPayRate(e.target.value)}
                        className="border border-stone-300 rounded-lg px-3 py-2 text-sm"
                        placeholder="Rate"
                      />
                      <input
                        type="date"
                        value={newPayDate}
                        onChange={(e) => setNewPayDate(e.target.value)}
                        className="border border-stone-300 rounded-lg px-3 py-2 text-sm"
                      />
                      <select
                        value={newTipsEligible}
                        onChange={(e) => setNewTipsEligible(e.target.value as "Yes" | "No")}
                        className="border border-stone-300 rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="Yes">Tips Eligible: Yes</option>
                        <option value="No">Tips Eligible: No</option>
                      </select>
                    </div>

                    <button
                      onClick={addPayEntry}
                      className="mt-3 bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-800"
                    >
                      Save Pay Entry
                    </button>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Pay History</h3>
                    <div className="overflow-x-auto border border-stone-200 rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-stone-100">
                          <tr>
                            <th className="text-left p-2">Title</th>
                            <th className="text-left p-2">Rate</th>
                            <th className="text-left p-2">Date</th>
                            <th className="text-left p-2">Tips Eligible</th>
                            <th className="text-left p-2">Entered By</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedEmployee.pay.length === 0 ? (
                            <tr>
                              <td className="p-2 text-stone-500" colSpan={5}>
                                No pay history yet.
                              </td>
                            </tr>
                          ) : (
                            selectedEmployee.pay.map((p) => (
                              <tr key={p.id} className="border-t border-stone-200">
                                <td className="p-2">{p.title}</td>
                                <td className="p-2">{p.rate}</td>
                                <td className="p-2">{p.date}</td>
                                <td className="p-2">{p.tipsEligible}</td>
                                <td className="p-2">{p.enteredBy || "—"}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Review History</h3>
                    {selectedEmployee.reviewHistory.length === 0 ? (
                      <p className="text-sm text-stone-500">No reviews on file.</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedEmployee.reviewHistory.map((r) => {
                          const expanded = expandedReviewId === r.id;
                          return (
                            <div key={r.id} className="border border-stone-200 rounded-lg p-4">
                              <div className="flex items-center justify-between gap-4">
                                <div>
                                  <div className="font-semibold">{r.date}</div>
                                  <div className="text-sm text-stone-500">
                                    {r.type} · {r.manager}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-lg font-bold">{r.total}/32</div>
                                  <button
                                    onClick={() =>
                                      setExpandedReviewId(expanded ? null : r.id)
                                    }
                                    className="text-sm text-stone-600 hover:text-black flex items-center gap-1"
                                  >
                                    {expanded ? <EyeOff size={15} /> : <Eye size={15} />}
                                    {expanded ? "Hide" : "View"}
                                  </button>
                                </div>
                              </div>

                              {expanded && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-sm">
                                  <MiniScore label="Customer Service" value={r.scores.customerService} />
                                  <MiniScore label="Product Quality" value={r.scores.productQuality} />
                                  <MiniScore label="Food Safety" value={r.scores.foodSafety} />
                                  <MiniScore label="Productivity" value={r.scores.productivity} />
                                  <MiniScore label="Communication" value={r.scores.communication} />
                                  <MiniScore label="Dependability" value={r.scores.dependability} />
                                  <MiniScore label="Job Knowledge" value={r.scores.jobKnowledge} />
                                  <MiniScore label="Safety" value={r.scores.safety} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "checkins" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-2xl mb-2">New Check-in</h3>
                    <p className="text-sm text-stone-600 mb-4">
                      Rate adherence to core values. (+) most of the time, (+/-) sometimes, (-) rarely.
                    </p>

                    <div className="space-y-2">
                      {MONTHLY_CHECKIN_ITEMS.map((item) => {
                        const value = checkinRatings[item.key];
                        return (
                          <div
                            key={item.key}
                            className="border border-stone-200 rounded-lg px-3 py-2 flex items-center justify-between gap-4"
                          >
                            <div className="font-medium">{item.label}</div>

                            <div className="flex gap-1">
                              {(["+", "+/-", "-"] as CheckinRating[]).map((option) => (
                                <button
                                  key={option}
                                  onClick={() =>
                                    setCheckinRatings((prev) => ({
                                      ...prev,
                                      [item.key]: option,
                                    }))
                                  }
                                  className={`min-w-[38px] h-9 px-3 rounded-md text-sm border ${
                                    value === option
                                      ? "bg-black text-white border-black"
                                      : "bg-stone-100 text-stone-900 border-stone-200 hover:bg-stone-200"
                                  }`}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={addCheckin}
                      className="mt-4 bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-800"
                    >
                      Save Check-in
                    </button>
                  </div>

                  <div>
                    <h3 className="font-semibold text-xl mb-3">Check-in History</h3>

                    {selectedEmployee.checkins.length === 0 ? (
                      <p className="text-sm text-stone-500">No check-ins yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedEmployee.checkins.map((checkin) => {
                          const expanded = expandedCheckinId === checkin.id;
                          return (
                            <div key={checkin.id} className="border border-stone-200 rounded-lg p-4">
                              <div className="flex items-center justify-between gap-4">
                                <div>
                                  <div className="font-semibold">{checkin.date}</div>
                                  <div className="text-sm text-stone-500">{checkin.manager}</div>
                                </div>
                                <button
                                  onClick={() =>
                                    setExpandedCheckinId(expanded ? null : checkin.id)
                                  }
                                  className="text-sm text-stone-600 hover:text-black flex items-center gap-1"
                                >
                                  {expanded ? <EyeOff size={15} /> : <Eye size={15} />}
                                  {expanded ? "Hide" : "View"}
                                </button>
                              </div>

                              {expanded && (
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                  <MiniRating label="Team Player" value={checkin.ratings.teamPlayer} />
                                  <MiniRating label="Customer Focus" value={checkin.ratings.customerFocus} />
                                  <MiniRating label="Quality Focus" value={checkin.ratings.qualityFocus} />
                                  <MiniRating label="Integrity" value={checkin.ratings.integrity} />
                                  <MiniRating label="Reliability" value={checkin.ratings.reliability} />
                                  <MiniRating label="Upbeat/Friendly" value={checkin.ratings.upbeatFriendly} />
                                  <MiniRating label="Takes Initiative" value={checkin.ratings.takesInitiative} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "review" && (
                <div className="space-y-4">
                  <p className="text-sm text-stone-600">
                    Score each category from 1 to 4. Total possible score: 32.
                  </p>

                  {Object.keys(reviewScores).map((category) => (
                    <div
                      key={category}
                      className="border border-stone-200 rounded-lg p-3 flex items-center justify-between gap-4"
                    >
                      <span className="font-medium">{category}</span>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4].map((n) => (
                          <button
                            key={n}
                            onClick={() =>
                              setReviewScores((prev) => ({ ...prev, [category]: n }))
                            }
                            className={`w-9 h-9 rounded text-sm font-semibold ${
                              reviewScores[category] === n
                                ? "bg-black text-white"
                                : "bg-stone-100 hover:bg-stone-200"
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="bg-stone-100 rounded-lg p-4 flex items-center justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="text-2xl font-bold">
                      {Object.values(reviewScores).reduce((sum, v) => sum + v, 0)} / 32
                    </span>
                  </div>

                  <button
                    onClick={submitReview}
                    className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-800"
                  >
                    Submit 6-Month Review
                  </button>
                </div>
              )}

              {activeTab === "notes" && (
                <div className="space-y-8">
                  <section className="space-y-3">
                    <h3 className="font-semibold">Add Note</h3>
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      rows={4}
                      className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="Add coaching note, follow-up, or development note..."
                    />
                    <button
                      onClick={addNote}
                      className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-800"
                    >
                      Save Note
                    </button>

                    <div className="space-y-2">
                      {selectedEmployee.notes.length === 0 ? (
                        <p className="text-sm text-stone-500">No notes yet.</p>
                      ) : (
                        selectedEmployee.notes.map((note, i) => (
                          <div key={i} className="border border-stone-200 rounded-lg p-3">
                            <div className="text-xs text-stone-500 mb-1">
                              {note.date} · {note.manager}
                            </div>
                            <div className="text-sm">{note.text}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h3 className="font-semibold">Future Goals & Development</h3>
                    <input
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="Employee goal"
                    />
                    <textarea
                      value={newGoalSupport}
                      onChange={(e) => setNewGoalSupport(e.target.value)}
                      rows={3}
                      className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="How are you helping them get there?"
                    />
                    <button
                      onClick={addGoal}
                      className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-800"
                    >
                      Save Goal
                    </button>

                    <div className="space-y-2">
                      {selectedEmployee.goals.length === 0 ? (
                        <p className="text-sm text-stone-500">No goals yet.</p>
                      ) : (
                        selectedEmployee.goals.map((goal) => (
                          <div key={goal.id} className="border border-stone-200 rounded-lg p-3">
                            <div className="font-medium">{goal.goal}</div>
                            <div className="text-sm text-stone-600 mt-1">{goal.support}</div>
                            <div className="text-xs text-stone-500 mt-2">
                              {goal.date} · {goal.manager}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === "documents" && (
                <div className="space-y-4">
                  <div className="border border-stone-200 rounded-lg p-4 bg-stone-50">
                    <h3 className="font-semibold mb-3">Upload Document</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-stone-600 block mb-1">Document Date</label>
                        <input
                          type="date"
                          value={documentDate}
                          onChange={(e) => setDocumentDate(e.target.value)}
                          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-sm text-stone-600 block mb-1">Choose File</label>
                        <input
                          type="file"
                          onChange={(e) => uploadDocument(e.target.files?.[0] ?? null)}
                          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white"
                          disabled={uploadingDocument}
                        />
                      </div>
                    </div>

                    {uploadingDocument && (
                      <div className="text-sm text-stone-500 mt-3">Uploading document...</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {selectedEmployee.documents.length === 0 ? (
                      <p className="text-sm text-stone-500">No documents on file.</p>
                    ) : (
                      selectedEmployee.documents.map((doc) => (
                        <div key={doc.id} className="border border-stone-200 rounded-lg p-3">
                          <div className="font-medium">{doc.name}</div>
                          <div className="text-xs text-stone-500 mt-1">
                            {doc.date} · {doc.uploadedBy}
                          </div>
                          {doc.publicUrl && (
                            <a
                              href={doc.publicUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-2"
                            >
                              <Upload size={14} />
                              Open Document
                            </a>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === "attendance" && (
                <div className="space-y-4">
                  <div className="border border-stone-200 rounded-lg p-4 bg-stone-50">
                    <h3 className="font-semibold mb-3">Log Attendance Issue</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input
                        type="date"
                        value={attendanceDate}
                        onChange={(e) => setAttendanceDate(e.target.value)}
                        className="border border-stone-300 rounded-lg px-3 py-2 text-sm"
                      />

                      <select
                        value={attendanceType}
                        onChange={(e) => setAttendanceType(e.target.value)}
                        className="border border-stone-300 rounded-lg px-3 py-2 text-sm"
                      >
                        <option>Late</option>
                        <option>Call Off</option>
                        <option>No Call / No Show</option>
                        <option>Left Early</option>
                      </select>

                      <input
                        value={attendanceReason}
                        onChange={(e) => setAttendanceReason(e.target.value)}
                        className="md:col-span-2 border border-stone-300 rounded-lg px-3 py-2 text-sm"
                        placeholder="Reason"
                      />
                    </div>

                    <button
                      onClick={addAttendance}
                      className="mt-3 bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-800"
                    >
                      Save Attendance Entry
                    </button>
                  </div>

                  <div className="space-y-2">
                    {selectedEmployee.attendance.length === 0 ? (
                      <p className="text-sm text-stone-500">No attendance issues logged.</p>
                    ) : (
                      selectedEmployee.attendance.map((a) => (
                        <div key={a.id} className="border border-stone-200 rounded-lg p-3">
                          <div className="font-medium">{a.type}</div>
                          <div className="text-sm text-stone-600">
                            {a.date} · {a.reason}
                          </div>
                          <div className="text-xs text-stone-400 mt-1">Logged by {a.createdBy}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === "term" && (
                <div className="space-y-4">
                  <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                    <h3 className="font-semibold text-red-700 mb-2">Termination</h3>
                    <p className="text-sm text-red-700 mb-3">
                      This marks the employee as terminated and removes them from the active dashboard.
                    </p>
                    <textarea
                      value={terminationReason}
                      onChange={(e) => setTerminationReason(e.target.value)}
                      rows={4}
                      className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm bg-white"
                      placeholder="Reason for termination"
                    />
                    <button
                      onClick={terminateEmployee}
                      className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
                    >
                      Terminate Employee
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="bg-black text-white px-6 py-4 flex items-center justify-between">
        <div className="text-2xl font-black tracking-tight">
          BRENZ<span className="text-red-500">.</span>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={currentUserId}
            onChange={(e) => setCurrentUserId(e.target.value)}
            className="bg-stone-800 text-white text-sm px-3 py-2 rounded border border-stone-700"
          >
            {dynamicUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          <div className="text-xs uppercase tracking-wide bg-stone-800 px-2 py-1 rounded">
            {currentUser.role}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {currentUser.name.split(" ")[0]}</h1>
          <p className="text-stone-600 mt-1">
            {currentUser.role === "owner"
              ? "You are viewing all stores."
              : "You are viewing your assigned store only."}
          </p>
        </div>

        {(overdueReviews.length > 0 || checkinsOverdue.length > 0 || attendanceAlerts.length > 0) && (
          <section className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-lg flex items-center gap-2 mb-4 text-amber-900">
              <AlertTriangle size={18} />
              Alerts
            </h2>

            <div className="space-y-3 text-sm">
              {overdueReviews.length > 0 && (
                <div>
                  <div className="font-medium text-amber-900">Reviews overdue</div>
                  <div className="text-amber-800">
                    {overdueReviews.map((e) => `${e.name} (${storeName(e.storeId)})`).join(", ")}
                  </div>
                </div>
              )}

              {checkinsOverdue.length > 0 && (
                <div>
                  <div className="font-medium text-amber-900">Monthly check-ins overdue</div>
                  <div className="text-amber-800">
                    {checkinsOverdue.map((e) => `${e.name} (${storeName(e.storeId)})`).join(", ")}
                  </div>
                </div>
              )}

              {attendanceAlerts.length > 0 && (
                <div>
                  <div className="font-medium text-amber-900">
                    Repeated attendance issues in the last 30 days
                  </div>
                  <div className="text-amber-800">
                    {attendanceAlerts.map((e) => `${e.name} (${storeName(e.storeId)})`).join(", ")}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={addEmployee}
            className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-800 flex items-center gap-2"
          >
            <UserPlus size={16} />
            Add Employee
          </button>

          {currentUser.role === "owner" && (
            <>
              <button
                onClick={addManager}
                className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-700 flex items-center gap-2"
              >
                <Users size={16} />
                Add Manager
              </button>

              <button
                onClick={changeManagerStore}
                className="bg-stone-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-600 flex items-center gap-2"
              >
                <Store size={16} />
                Change Manager Store
              </button>

              <button
                onClick={addStore}
                className="bg-stone-200 text-stone-900 px-4 py-2 rounded-lg text-sm hover:bg-stone-300 flex items-center gap-2"
              >
                <Building2 size={16} />
                Add Store
              </button>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard icon={<Users size={18} />} label="Active Employees" value={visibleEmployees.length} />
          <KpiCard
            icon={<AlertTriangle size={18} />}
            label="Reviews Overdue"
            value={overdueReviews.length}
            danger={overdueReviews.length > 0}
          />
          <KpiCard
            icon={<Bell size={18} />}
            label="Check-ins Overdue"
            value={checkinsOverdue.length}
            danger={checkinsOverdue.length > 0}
          />
          <KpiCard
            icon={<Store size={18} />}
            label="Stores Visible"
            value={currentUser.role === "owner" ? stores.length : 1}
          />
        </div>

        {currentUser.role === "owner" && (
          <>
            <section className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
              <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
                <ClipboardCheck size={18} />
                Store Analytics
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ownerStoreRollup.map((store) => (
                  <div key={store.id} className="border border-stone-200 rounded-lg p-4">
                    <div className="font-semibold">{store.name}</div>
                    <div className="text-sm text-stone-600 mt-1">Employees: {store.employees}</div>
                    <div
                      className={`text-sm mt-1 ${
                        store.overdueReviews > 0 ? "text-red-600 font-semibold" : "text-stone-600"
                      }`}
                    >
                      Reviews Overdue: {store.overdueReviews}
                    </div>
                    <div
                      className={`text-sm mt-1 ${
                        store.overdueCheckins > 0 ? "text-red-600 font-semibold" : "text-stone-600"
                      }`}
                    >
                      Check-ins Overdue: {store.overdueCheckins}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
              <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
                <Users size={18} />
                Managers
              </h2>

              {managers.filter((m) => m.role === "manager").length === 0 ? (
                <p className="text-sm text-stone-500">No managers found.</p>
              ) : (
                <div className="space-y-3">
                  {managers
                    .filter((m) => m.role === "manager")
                    .map((manager) => (
                      <div
                        key={manager.id}
                        className="border border-stone-200 rounded-lg p-4 flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="font-medium">{manager.name}</div>
                          <div className="text-sm text-stone-500">
                            {manager.email || "No email"} · {storeName(toStoreKey(manager.store_id))}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => editManager(manager)}
                            className="bg-stone-100 hover:bg-stone-200 px-3 py-2 rounded text-sm flex items-center gap-1"
                          >
                            <Pencil size={14} />
                            Edit
                          </button>
                          <button
                            onClick={() => deleteManager(manager)}
                            className="bg-red-50 text-red-700 hover:bg-red-100 px-3 py-2 rounded text-sm flex items-center gap-1"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </section>

            <section className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
              <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
                <FileText size={18} />
                Audit Log
              </h2>
              <div className="space-y-2 text-sm">
                {audit.slice(0, 8).map((entry) => (
                  <div key={entry.id} className="border-b border-stone-100 pb-2">
                    <span className="font-medium">{entry.user}</span>
                    <span className="text-stone-600"> · {entry.action} · </span>
                    <span>{entry.target}</span>
                    <div className="text-xs text-stone-400 mt-1">{entry.ts}</div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        <section className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
            <FileText size={18} />
            Employees
          </h2>

          <div className="divide-y divide-stone-200">
            {visibleEmployees.map((employee) => (
              <div
                key={employee.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedEmployeeId(employee.id);
                  setActiveTab("overview");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setSelectedEmployeeId(employee.id);
                    setActiveTab("overview");
                  }
                }}
                className="w-full text-left py-4 hover:bg-stone-50 px-2 rounded-lg cursor-pointer"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">{employee.name}</div>
                    <div className="text-sm text-stone-500">
                      {employee.title} · {storeName(employee.storeId)}
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteEmployee(Number(employee.id), employee.name);
                      }}
                      className="text-red-600 text-xs hover:underline mb-1"
                    >
                      Delete
                    </button>

                    <div
                      className={
                        employee.nextReviewDue && isOverdue(employee.nextReviewDue)
                          ? "text-red-600 font-semibold"
                          : "text-stone-500"
                      }
                    >
                      Next review: {employee.nextReviewDue || "—"}
                    </div>

                    <div className="text-stone-400 mt-1">
                      Check-ins: {employee.checkins.length}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {visibleEmployees.length === 0 && (
              <div className="py-6 text-sm text-stone-500">No employees found.</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div
      className={`bg-white border rounded-xl p-4 shadow-sm ${
        danger ? "border-red-300" : "border-stone-200"
      }`}
    >
      <div className={`flex items-center gap-2 text-sm ${danger ? "text-red-600" : "text-stone-600"}`}>
        {icon}
        {label}
      </div>
      <div className={`text-3xl font-bold mt-2 ${danger ? "text-red-600" : ""}`}>{value}</div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-stone-200 rounded-lg p-4">
      <div className="text-xs uppercase tracking-wide text-stone-500 mb-1">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function ToggleCard({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="border border-stone-200 rounded-lg p-4 text-left hover:bg-stone-50"
    >
      <div className="text-xs uppercase tracking-wide text-stone-500 mb-1">{label}</div>
      <div className={value ? "font-medium text-green-700" : "font-medium text-stone-500"}>
        {value ? "Yes" : "No"}
      </div>
    </button>
  );
}

function MiniRating({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-stone-200 rounded-lg p-3">
      <div className="text-xs uppercase tracking-wide text-stone-500 mb-1">{label}</div>
      <div className="font-semibold">{value || "—"}</div>
    </div>
  );
}

function MiniScore({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-stone-200 rounded-lg p-3">
      <div className="text-xs uppercase tracking-wide text-stone-500 mb-1">{label}</div>
      <div className="font-semibold">{value} / 4</div>
    </div>
  );
}
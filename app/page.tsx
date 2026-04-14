"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";
import {
  AlertTriangle,
  Bell,
  Building2,
  ChevronLeft,
  ClipboardCheck,
  Clock3,
  FileText,
  LogOut,
  Paperclip,
  Shield,
  Store,
  Target,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";

type Role = "owner" | "gm";

type User = {
  id: string;
  name: string;
  role: Role;
  storeId: string | null;
};

type StoreRow = {
  id: number;
  name: string;
};

type ManagerRow = {
  id: number;
  name: string;
  email?: string | null;
  role?: string | null;
  store_id: number | null;
};

type EmployeeRow = {
  id: number;
  name: string;
  title: string | null;
  store_id: number | null;
  start_date: string | null;
  next_review_due: string | null;
  assigned_trainer: string | null;
  insurance_approved: boolean | null;
  adp_signed_up: boolean | null;
  terminated: boolean | null;
  termination_reason: string | null;
  termination_date: string | null;
};

type NoteRow = {
  id: number;
  employee_id: number;
  note_date: string;
  note_text: string;
  manager_name: string | null;
};

type GoalRow = {
  id: number;
  employee_id: number;
  goal_date: string;
  goal_text: string;
  support_text: string | null;
  manager_name: string | null;
};

type CheckinRow = {
  id: number;
  employee_id: number;
  checkin_date: string;
  manager_name: string | null;
  team_player: string | null;
  customer_focus: string | null;
  quality_focus: string | null;
  integrity: string | null;
  reliability: string | null;
  upbeat_friendly: string | null;
  takes_initiative: string | null;
  notes: string | null;
};

type DocumentRow = {
  id: number;
  employee_id: number;
  document_date: string;
  label: string | null;
  file_name: string | null;
  file_type: string | null;
  file_url: string | null;
  uploaded_by: string | null;
};

type AttendanceRow = {
  id: number;
  employee_id: number;
  incident_date: string;
  incident_type: string;
  reason: string;
  write_up: boolean | null;
};

type ReviewRow = {
  id: number;
  employee_id: number;
  review_date: string;
  review_type: string;
  manager_name: string | null;
  total_score: number | null;
  next_review_date: string | null;
};

type Employee = {
  id: string;
  dbId: number;
  name: string;
  title: string;
  storeId: string;
  startDate: string;
  nextReviewDue: string;
  assignedTrainer: string;
  insuranceApproved: boolean;
  adpSignedUp: boolean;
  terminated: boolean;
  terminationReason?: string;
  terminationDate?: string;
  notes: {
    id: number;
    date: string;
    manager: string;
    text: string;
  }[];
  goals: {
    id: number;
    date: string;
    manager: string;
    goal: string;
    support: string;
  }[];
  checkins: {
    id: number;
    date: string;
    manager: string;
    ratings: Record<string, string>;
    notes: string;
  }[];
  documents: {
    id: number;
    date: string;
    label: string;
    fileName: string;
    fileType: string;
    fileUrl: string;
    uploadedBy: string;
  }[];
  attendance: {
    id: number;
    date: string;
    type: string;
    reason: string;
    writeUp: boolean;
  }[];
  reviewHistory: {
    id: number;
    date: string;
    manager: string;
    total: number;
    type: string;
    nextReviewDate: string;
  }[];
};

type AuditEntry = {
  id: number;
  ts: string;
  user: string;
  action: string;
  target: string;
};

const CHECKIN_CATEGORIES = [
  "Team Player",
  "Customer Focus",
  "Quality Focus",
  "Integrity",
  "Reliability",
  "Upbeat/Friendly",
  "Takes Initiative",
] as const;

const REVIEW_CATEGORIES = [
  "Customer Service",
  "Product Quality",
  "Food Safety & Cleanliness",
  "Productivity / Initiative",
  "Cooperation & Communication",
  "Dependability",
  "Job Knowledge",
  "Safety & Safe Practices",
] as const;

function nowStamp() {
  return new Date().toISOString().replace("T", " ").slice(0, 16);
}

function addMonthsToToday(months: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function isOverdue(date: string) {
  if (!date) return false;
  return new Date(date) < new Date();
}

function daysSince(date: string) {
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

function toStoreKey(storeId: number | string | null | undefined) {
  if (storeId === null || storeId === undefined || storeId === "") return "";
  return `s${storeId}`;
}

function fromStoreKey(storeKey: string | null | undefined) {
  if (!storeKey) return null;
  return Number(storeKey.replace("s", ""));
}

function scoreTotal(scores: Record<string, number>) {
  return Object.values(scores).reduce((sum, n) => sum + n, 0);
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Page() {
  const [loading, setLoading] = useState(true);

  const [stores, setStores] = useState<StoreRow[]>([]);
  const [managers, setManagers] = useState<ManagerRow[]>([]);
  const [employeeRows, setEmployeeRows] = useState<EmployeeRow[]>([]);
  const [noteRows, setNoteRows] = useState<NoteRow[]>([]);
  const [goalRows, setGoalRows] = useState<GoalRow[]>([]);
  const [checkinRows, setCheckinRows] = useState<CheckinRow[]>([]);
  const [documentRows, setDocumentRows] = useState<DocumentRow[]>([]);
  const [attendanceRows, setAttendanceRows] = useState<AttendanceRow[]>([]);
  const [reviewRows, setReviewRows] = useState<ReviewRow[]>([]);

  const [currentUserId, setCurrentUserId] = useState("owner");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "pay" | "checkin" | "review6" | "notes" | "documents" | "attendance" | "term"
  >("overview");

  const [audit, setAudit] = useState<AuditEntry[]>([
    { id: 1, ts: "2026-04-10 09:10", user: "Maria", action: "Completed review", target: "Jamie Chen" },
    { id: 2, ts: "2026-04-10 08:20", user: "Derek", action: "Added note", target: "Priya Singh" },
  ]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      await Promise.all([
        fetchStores(),
        fetchManagers(),
        fetchEmployees(),
        fetchNotes(),
        fetchGoals(),
        fetchCheckins(),
        fetchDocuments(),
        fetchAttendance(),
        fetchReviews(),
      ]);
      setLoading(false);
    }
    load();
  }, []);

  async function fetchStores() {
    const { data, error } = await supabase.from("stores").select("*").order("id");
    if (error) {
      console.error("STORES ERROR:", error);
      return;
    }
    setStores((data as StoreRow[]) || []);
  }

  async function fetchManagers() {
    const { data, error } = await supabase.from("managers").select("*").order("id");
    if (error) {
      console.error("MANAGERS ERROR:", error);
      return;
    }
    setManagers((data as ManagerRow[]) || []);
  }

  async function fetchEmployees() {
    const { data, error } = await supabase.from("employees").select("*").order("id");
    if (error) {
      console.error("EMPLOYEES ERROR:", error);
      return;
    }
    setEmployeeRows((data as EmployeeRow[]) || []);
  }

  async function fetchNotes() {
    const { data, error } = await supabase
      .from("employee_notes")
      .select("*")
      .order("id", { ascending: false });
    if (error) {
      console.error("NOTES ERROR:", error);
      return;
    }
    setNoteRows((data as NoteRow[]) || []);
  }

  async function fetchGoals() {
    const { data, error } = await supabase
      .from("employee_goals")
      .select("*")
      .order("id", { ascending: false });
    if (error) {
      console.error("GOALS ERROR:", error);
      return;
    }
    setGoalRows((data as GoalRow[]) || []);
  }

  async function fetchCheckins() {
    const { data, error } = await supabase
      .from("employee_checkins")
      .select("*")
      .order("id", { ascending: false });
    if (error) {
      console.error("CHECKINS ERROR:", error);
      return;
    }
    setCheckinRows((data as CheckinRow[]) || []);
  }

  async function fetchDocuments() {
    const { data, error } = await supabase
      .from("employee_documents")
      .select("*")
      .order("id", { ascending: false });
    if (error) {
      console.error("DOCUMENTS ERROR:", error);
      return;
    }
    setDocumentRows((data as DocumentRow[]) || []);
  }

  async function fetchAttendance() {
    const { data, error } = await supabase
      .from("employee_attendance")
      .select("*")
      .order("id", { ascending: false });
    if (error) {
      console.error("ATTENDANCE ERROR:", error);
      return;
    }
    setAttendanceRows((data as AttendanceRow[]) || []);
  }

  async function fetchReviews() {
    const { data, error } = await supabase
      .from("employee_reviews")
      .select("*")
      .order("id", { ascending: false });
    if (error) {
      console.error("REVIEWS ERROR:", error);
      return;
    }
    setReviewRows((data as ReviewRow[]) || []);
  }

  const currentUser: User = useMemo(() => {
    if (currentUserId === "owner") {
      return { id: "owner", name: "Owner (You)", role: "owner", storeId: null };
    }

    const manager = managers.find((m) => `gm-${m.id}` === currentUserId);
    if (!manager) {
      return { id: "owner", name: "Owner (You)", role: "owner", storeId: null };
    }

    return {
      id: `gm-${manager.id}`,
      name: manager.name,
      role: "gm",
      storeId: toStoreKey(manager.store_id),
    };
  }, [currentUserId, managers]);

  const dynamicUsers: User[] = useMemo(() => {
    const owner: User = { id: "owner", name: "Owner (You)", role: "owner", storeId: null };
    const gms: User[] = managers
      .filter((m) => (m.role || "").toLowerCase() !== "owner")
      .map((m) => ({
        id: `gm-${m.id}`,
        name: m.name,
        role: "gm" as Role,
        storeId: toStoreKey(m.store_id),
      }));
    return [owner, ...gms];
  }, [managers]);

  const employees: Employee[] = useMemo(() => {
    return employeeRows.map((row) => ({
      id: String(row.id),
      dbId: row.id,
      name: row.name ?? "",
      title: row.title ?? "Team Member",
      storeId: toStoreKey(row.store_id),
      startDate: row.start_date ?? "",
      nextReviewDue: row.next_review_due ?? "",
      assignedTrainer: row.assigned_trainer ?? "",
      insuranceApproved: row.insurance_approved ?? false,
      adpSignedUp: row.adp_signed_up ?? false,
      terminated: row.terminated ?? false,
      terminationReason: row.termination_reason ?? undefined,
      terminationDate: row.termination_date ?? undefined,
      notes: noteRows
        .filter((n) => n.employee_id === row.id)
        .map((n) => ({
          id: n.id,
          date: n.note_date,
          manager: n.manager_name ?? "",
          text: n.note_text,
        })),
      goals: goalRows
        .filter((g) => g.employee_id === row.id)
        .map((g) => ({
          id: g.id,
          date: g.goal_date,
          manager: g.manager_name ?? "",
          goal: g.goal_text,
          support: g.support_text ?? "",
        })),
      checkins: checkinRows
        .filter((c) => c.employee_id === row.id)
        .map((c) => ({
          id: c.id,
          date: c.checkin_date,
          manager: c.manager_name ?? "",
          ratings: {
            "Team Player": c.team_player ?? "",
            "Customer Focus": c.customer_focus ?? "",
            "Quality Focus": c.quality_focus ?? "",
            Integrity: c.integrity ?? "",
            Reliability: c.reliability ?? "",
            "Upbeat/Friendly": c.upbeat_friendly ?? "",
            "Takes Initiative": c.takes_initiative ?? "",
          },
          notes: c.notes ?? "",
        })),
      documents: documentRows
        .filter((d) => d.employee_id === row.id)
        .map((d) => ({
          id: d.id,
          date: d.document_date,
          label: d.label ?? "",
          fileName: d.file_name ?? "",
          fileType: d.file_type ?? "",
          fileUrl: d.file_url ?? "",
          uploadedBy: d.uploaded_by ?? "",
        })),
      attendance: attendanceRows
        .filter((a) => a.employee_id === row.id)
        .map((a) => ({
          id: a.id,
          date: a.incident_date,
          type: a.incident_type,
          reason: a.reason,
          writeUp: a.write_up ?? false,
        })),
      reviewHistory: reviewRows
        .filter((r) => r.employee_id === row.id)
        .map((r) => ({
          id: r.id,
          date: r.review_date,
          manager: r.manager_name ?? "",
          total: r.total_score ?? 0,
          type: r.review_type ?? "6-month",
          nextReviewDate: r.next_review_date ?? "",
        })),
    }));
  }, [employeeRows, noteRows, goalRows, checkinRows, documentRows, attendanceRows, reviewRows]);

  const visibleEmployees = useMemo(() => {
    if (currentUser.role === "owner") {
      return employees.filter((e) => !e.terminated);
    }
    return employees.filter((e) => !e.terminated && e.storeId === currentUser.storeId);
  }, [employees, currentUser]);

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId) ?? null;

  function storeName(storeKey: string) {
    const store = stores.find((s) => toStoreKey(s.id) === storeKey);
    return store?.name ?? "Unknown store";
  }

  function logAudit(action: string, target: string) {
    setAudit((prev) => [
      { id: Date.now(), ts: nowStamp(), user: currentUser.name, action, target },
      ...prev,
    ]);
  }

  async function patchEmployee(dbId: number, patch: Partial<EmployeeRow>) {
    const { error } = await supabase.from("employees").update(patch).eq("id", dbId);
    if (error) {
      console.error("PATCH EMPLOYEE ERROR:", error);
      alert(error.message || "Could not update employee.");
      return;
    }
    await fetchEmployees();
  }

  async function addStore() {
    if (currentUser.role !== "owner") return;
    const name = prompt("Store name?");
    if (!name?.trim()) return;

    const { error } = await supabase.from("stores").insert([{ name: name.trim() }]);
    if (error) {
      console.error("ADD STORE ERROR:", error);
      alert(error.message || "Could not add store.");
      return;
    }

    logAudit("Added store", name.trim());
    await fetchStores();
  }

  async function addManager() {
    if (currentUser.role !== "owner") return;
    const name = prompt("Manager name?");
    if (!name?.trim()) return;

    const options = stores.map((s) => `${s.id}: ${s.name}`).join("\n");
    const chosen = prompt(`Store number:\n\n${options}`, String(stores[0]?.id || 1));
    if (!chosen) return;

    const storeId = Number(chosen);
    if (!storeId) {
      alert("Invalid store.");
      return;
    }

    const { error } = await supabase
      .from("managers")
      .insert([{ name: name.trim(), role: "manager", store_id: storeId }]);

    if (error) {
      console.error("ADD MANAGER ERROR:", error);
      alert(error.message || "Could not add manager.");
      return;
    }

    logAudit("Added manager", `${name.trim()} → ${stores.find((s) => s.id === storeId)?.name ?? ""}`);
    await fetchManagers();
  }

  async function changeManagerStore() {
    if (currentUser.role !== "owner") return;

    const managerOnly = managers.filter((m) => (m.role || "").toLowerCase() !== "owner");
    if (managerOnly.length === 0) {
      alert("No managers found.");
      return;
    }

    const managerOptions = managerOnly
      .map((m) => `${m.id}: ${m.name} (${stores.find((s) => s.id === m.store_id)?.name ?? "No store"})`)
      .join("\n");

    const chosenManager = prompt(`Manager ID to move:\n\n${managerOptions}`);
    if (!chosenManager) return;

    const manager = managerOnly.find((m) => String(m.id) === String(chosenManager));
    if (!manager) {
      alert("Manager not found.");
      return;
    }

    const storeOptions = stores.map((s) => `${s.id}: ${s.name}`).join("\n");
    const chosenStore = prompt(`New store ID:\n\n${storeOptions}`);
    if (!chosenStore) return;

    const storeId = Number(chosenStore);
    if (!storeId) {
      alert("Invalid store.");
      return;
    }

    const { error } = await supabase.from("managers").update({ store_id: storeId }).eq("id", manager.id);
    if (error) {
      console.error("CHANGE MANAGER STORE ERROR:", error);
      alert(error.message || "Could not change manager store.");
      return;
    }

    logAudit("Changed manager store", `${manager.name} → ${stores.find((s) => s.id === storeId)?.name ?? ""}`);
    await fetchManagers();
  }

  async function addEmployee() {
    const name = prompt("Employee name?");
    if (!name?.trim()) return;

    let storeId: number | null = null;
    if (currentUser.role === "gm") {
      storeId = fromStoreKey(currentUser.storeId);
    } else {
      const options = stores.map((s) => `${s.id}: ${s.name}`).join("\n");
      const chosen = prompt(`Store number:\n\n${options}`, String(stores[0]?.id || 1));
      if (!chosen) return;
      storeId = Number(chosen);
    }

    if (!storeId) {
      alert("Invalid store.");
      return;
    }

    const managerForStore =
      currentUser.role === "gm"
        ? currentUser.name
        : managers.find((m) => m.store_id === storeId && (m.role || "").toLowerCase() !== "owner")?.name ?? "";

    const { error } = await supabase.from("employees").insert([
      {
        name: name.trim(),
        title: "Team Member",
        store_id: storeId,
        start_date: new Date().toISOString().slice(0, 10),
        next_review_due: addMonthsToToday(1),
        assigned_trainer: managerForStore,
        insurance_approved: false,
        adp_signed_up: false,
        terminated: false,
      },
    ]);

    if (error) {
      console.error("ADD EMPLOYEE ERROR:", error);
      alert(error.message || "Could not add employee.");
      return;
    }

    logAudit("Added employee", name.trim());
    await fetchEmployees();
  }

  async function deleteEmployee(employee: Employee) {
    const confirmed = window.confirm(`Delete ${employee.name}?`);
    if (!confirmed) return;

    const { error } = await supabase.from("employees").delete().eq("id", employee.dbId);
    if (error) {
      console.error("DELETE EMPLOYEE ERROR:", error);
      alert(error.message || "Could not delete employee.");
      return;
    }

    logAudit("Deleted employee", employee.name);
    await fetchEmployees();
  }

  async function addNote(employee: Employee, text: string) {
    const { error } = await supabase.from("employee_notes").insert([
      {
        employee_id: employee.dbId,
        note_text: text,
        manager_name: currentUser.name,
      },
    ]);

    if (error) {
      console.error("ADD NOTE ERROR:", error);
      alert(error.message || "Could not save note.");
      return;
    }

    logAudit("Added note", employee.name);
    await fetchNotes();
  }

  async function addGoal(employee: Employee, goalText: string, supportText: string) {
    const { error } = await supabase.from("employee_goals").insert([
      {
        employee_id: employee.dbId,
        goal_text: goalText,
        support_text: supportText,
        manager_name: currentUser.name,
      },
    ]);

    if (error) {
      console.error("ADD GOAL ERROR:", error);
      alert(error.message || "Could not save goal.");
      return;
    }

    logAudit("Added goal", employee.name);
    await fetchGoals();
  }

  async function addCheckin(employee: Employee, ratings: Record<string, string>, notes: string) {
    const { error } = await supabase.from("employee_checkins").insert([
      {
        employee_id: employee.dbId,
        manager_name: currentUser.name,
        team_player: ratings["Team Player"] || null,
        customer_focus: ratings["Customer Focus"] || null,
        quality_focus: ratings["Quality Focus"] || null,
        integrity: ratings["Integrity"] || null,
        reliability: ratings["Reliability"] || null,
        upbeat_friendly: ratings["Upbeat/Friendly"] || null,
        takes_initiative: ratings["Takes Initiative"] || null,
        notes: notes || null,
      },
    ]);

    if (error) {
      console.error("ADD CHECKIN ERROR:", error);
      alert(error.message || "Could not save check-in.");
      return;
    }

    logAudit("Submitted monthly check-in", employee.name);
    await fetchCheckins();
  }

  async function addAttendance(
    employee: Employee,
    incidentDate: string,
    incidentType: string,
    reason: string,
    writeUp: boolean
  ) {
    const { error } = await supabase.from("employee_attendance").insert([
      {
        employee_id: employee.dbId,
        incident_date: incidentDate,
        incident_type: incidentType,
        reason,
        write_up: writeUp,
      },
    ]);

    if (error) {
      console.error("ADD ATTENDANCE ERROR:", error);
      alert(error.message || "Could not save attendance.");
      return;
    }

    logAudit(`Logged attendance (${incidentType})`, employee.name);
    await fetchAttendance();
  }

  async function addDocument(employee: Employee, label: string, file: File) {
    const dataUrl = await readFileAsDataUrl(file);

    const { error } = await supabase.from("employee_documents").insert([
      {
        employee_id: employee.dbId,
        label,
        file_name: file.name,
        file_type: file.type,
        file_url: dataUrl,
        uploaded_by: currentUser.name,
      },
    ]);

    if (error) {
      console.error("ADD DOCUMENT ERROR:", error);
      alert(error.message || "Could not upload document.");
      return;
    }

    logAudit("Uploaded document", employee.name);
    await fetchDocuments();
  }

  async function submitSixMonthReview(
    employee: Employee,
    scores: Record<string, number>,
    photoFile: File | null
  ) {
    const total = scoreTotal(scores);
    const reviewDate = new Date().toISOString().slice(0, 10);
    const nextReviewDate = addMonthsToToday(6);

    const { error } = await supabase.from("employee_reviews").insert([
      {
        employee_id: employee.dbId,
        review_date: reviewDate,
        review_type: "6-month",
        manager_name: currentUser.name,
        total_score: total,
        next_review_date: nextReviewDate,
      },
    ]);

    if (error) {
      console.error("ADD REVIEW ERROR:", error);
      alert(error.message || "Could not save review.");
      return;
    }

    const updateEmployeeError = await supabase
      .from("employees")
      .update({ next_review_due: nextReviewDate })
      .eq("id", employee.dbId);

    if (updateEmployeeError.error) {
      console.error("UPDATE NEXT REVIEW ERROR:", updateEmployeeError.error);
    }

    if (photoFile) {
      await addDocument(employee, `6-Month Review Photo - ${reviewDate}`, photoFile);
    }

    logAudit(`Completed 6-month review (${total}/32)`, employee.name);
    await fetchReviews();
    await fetchEmployees();
  }

  async function terminateEmployee(employee: Employee, reason: string) {
    const today = new Date().toISOString().slice(0, 10);

    const { error } = await supabase
      .from("employees")
      .update({
        terminated: true,
        termination_reason: reason,
        termination_date: today,
      })
      .eq("id", employee.dbId);

    if (error) {
      console.error("TERMINATE ERROR:", error);
      alert(error.message || "Could not terminate employee.");
      return;
    }

    logAudit("Submitted termination", employee.name);
    await fetchEmployees();
    setSelectedEmployeeId(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 text-stone-900 flex items-center justify-center">
        <div className="text-lg font-medium">Loading...</div>
      </div>
    );
  }

  if (selectedEmployee) {
    return (
      <div className="min-h-screen bg-stone-50 text-stone-900">
        <header className="bg-black text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="font-black text-xl tracking-tight">
              BRENZ<span className="text-red-500">.</span>
            </div>
            <span className="text-stone-400 text-sm">Employee Portal</span>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-6">
          <EmployeePacket
            employee={selectedEmployee}
            user={currentUser}
            stores={stores}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onBack={() => setSelectedEmployeeId(null)}
            onPatchEmployee={patchEmployee}
            onAddNote={addNote}
            onAddGoal={addGoal}
            onAddCheckin={addCheckin}
            onAddAttendance={addAttendance}
            onAddDocument={addDocument}
            onSubmitSixMonthReview={submitSixMonthReview}
            onTerminate={terminateEmployee}
            onDeleteEmployee={deleteEmployee}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="bg-black text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="font-black text-xl tracking-tight">
            BRENZ<span className="text-red-500">.</span>
          </div>
          <span className="text-stone-400 text-sm">Employee Portal</span>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={currentUserId}
            onChange={(e) => {
              setCurrentUserId(e.target.value);
              setSelectedEmployeeId(null);
            }}
            className="bg-stone-800 text-white text-sm px-3 py-1.5 rounded border border-stone-700"
          >
            {dynamicUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 text-xs bg-stone-800 px-2 py-1 rounded">
            {currentUser.role === "owner" ? (
              <Shield size={14} className="text-amber-400" />
            ) : (
              <Store size={14} className="text-green-400" />
            )}
            <span className="uppercase tracking-wide">{currentUser.role}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {currentUser.name.split(" ")[0]}</h1>
          <p className="text-stone-600 mt-1">
            {currentUser.role === "owner"
              ? "You're viewing all stores."
              : "You're viewing your store only."}
          </p>
        </div>

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

        <Dashboard
          user={currentUser}
          stores={stores}
          visibleEmployees={visibleEmployees}
          allEmployees={employees}
          managers={managers}
          audit={audit}
          onOpenEmployee={(id) => {
            setSelectedEmployeeId(id);
            setActiveTab("overview");
          }}
        />
      </main>
    </div>
  );
}

function Dashboard({
  user,
  stores,
  visibleEmployees,
  allEmployees,
  managers,
  audit,
  onOpenEmployee,
}: {
  user: User;
  stores: StoreRow[];
  visibleEmployees: Employee[];
  allEmployees: Employee[];
  managers: ManagerRow[];
  audit: AuditEntry[];
  onOpenEmployee: (id: string) => void;
}) {
  const overdueReviews = visibleEmployees.filter((e) => e.nextReviewDue && isOverdue(e.nextReviewDue));
  const checkinsOverdue = visibleEmployees.filter((e) => {
    const last = [...e.checkins].sort((a, b) => b.date.localeCompare(a.date))[0];
    if (!last) return true;
    return daysSince(last.date) > 30;
  });

  const byStore = stores.map((s) => {
    const list = allEmployees.filter((e) => e.storeId === toStoreKey(s.id) && !e.terminated);
    const reviewScores = list.flatMap((e) => e.reviewHistory.map((r) => r.total));
    const avgReview = reviewScores.length
      ? (reviewScores.reduce((sum, n) => sum + n, 0) / reviewScores.length).toFixed(1)
      : "—";

    const checkinsThisMonth = list.reduce(
      (sum, e) =>
        sum +
        e.checkins.filter((c) => {
          return daysSince(c.date) <= 30;
        }).length,
      0
    );

    const attendanceIssues = list.reduce((sum, e) => sum + e.attendance.length, 0);

    const checkinsOverdueCount = list.filter((e) => {
      const last = [...e.checkins].sort((a, b) => b.date.localeCompare(a.date))[0];
      if (!last) return true;
      return daysSince(last.date) > 30;
    }).length;

    const reviewOverdueCount = list.filter((e) => e.nextReviewDue && isOverdue(e.nextReviewDue)).length;

    return {
      store: s,
      total: list.length,
      avgReview,
      checkinsThisMonth,
      attendanceIssues,
      checkinsOverdueCount,
      reviewOverdueCount,
      managerCount: managers.filter((m) => m.store_id === s.id && (m.role || "").toLowerCase() !== "owner").length,
    };
  });

  return (
    <>
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
          value={user.role === "owner" ? stores.length : 1}
        />
      </div>

      {user.role === "owner" && (
        <section className="bg-white border border-stone-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Store size={18} />
              Store Analytics
            </h2>
            <span className="text-xs text-stone-500">Side-by-side comparison</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-stone-200">
                  <th className="text-left p-3 text-stone-600 font-medium">Metric</th>
                  {byStore.map((s) => (
                    <th key={s.store.id} className="text-left p-3 font-semibold">
                      {s.store.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <MetricRow label="Active Employees" values={byStore.map((s) => s.total)} />
                <MetricRow label="Managers" values={byStore.map((s) => s.managerCount)} />
                <MetricRow label="Reviews Overdue" values={byStore.map((s) => s.reviewOverdueCount)} redIf={(v) => v > 0} />
                <MetricRow label="Check-ins Overdue" values={byStore.map((s) => s.checkinsOverdueCount)} redIf={(v) => v > 0} />
                <MetricRow label="Check-ins Done (30d)" values={byStore.map((s) => s.checkinsThisMonth)} />
                <MetricRow label="Avg Review Score" values={byStore.map((s) => `${s.avgReview}/32`)} />
                <MetricRow label="Attendance Issues" values={byStore.map((s) => s.attendanceIssues)} redIf={(v) => v > 2} />
              </tbody>
            </table>
          </div>
        </section>
      )}

      {user.role === "owner" && (
        <section className="bg-white border border-stone-200 rounded-lg p-5">
          <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <ClipboardCheck size={18} />
            Manager Compliance
          </h2>
          <table className="w-full text-sm border border-stone-200">
            <thead className="bg-stone-100">
              <tr>
                <th className="text-left p-2">Employee</th>
                <th className="text-left p-2">Store</th>
                <th className="text-left p-2">Last Check-in</th>
                <th className="text-left p-2">Last 6-Mo Review</th>
              </tr>
            </thead>
            <tbody>
              {allEmployees
                .filter((e) => !e.terminated)
                .map((e) => {
                  const lastCheckin = [...e.checkins].sort((a, b) => b.date.localeCompare(a.date))[0];
                  const lastReview = [...e.reviewHistory].sort((a, b) => b.date.localeCompare(a.date))[0];
                  const checkinOverdue = !lastCheckin || daysSince(lastCheckin.date) > 35;
                  const reviewOverdue = !lastReview || daysSince(lastReview.date) > 200;

                  return (
                    <tr key={e.id} className="border-t border-stone-200">
                      <td className="p-2 font-medium">{e.name}</td>
                      <td className="p-2 text-stone-600">{stores.find((s) => toStoreKey(s.id) === e.storeId)?.name}</td>
                      <td className={`p-2 ${checkinOverdue ? "text-red-600 font-semibold" : ""}`}>
                        {lastCheckin ? `${lastCheckin.date} · ${lastCheckin.manager}` : "Never"}
                      </td>
                      <td className={`p-2 ${reviewOverdue ? "text-red-600 font-semibold" : ""}`}>
                        {lastReview ? `${lastReview.date} · ${lastReview.manager} · ${lastReview.total}/32` : "Never"}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </section>
      )}

      {user.role === "owner" && (
        <section className="bg-white border border-stone-200 rounded-lg p-5">
          <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <FileText size={18} />
            Audit Log
          </h2>
          <div className="space-y-2 text-sm">
            {audit.slice(0, 10).map((a) => (
              <div key={a.id} className="flex items-start gap-3 py-1.5 border-b border-stone-100 last:border-0">
                <div className="text-stone-400 text-xs w-32 shrink-0">{a.ts}</div>
                <div className="flex-1">
                  <span className="font-medium">{a.user}</span>
                  <span className="text-stone-600"> · {a.action} · </span>
                  <span className="text-stone-800">{a.target}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="bg-white border border-stone-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Users size={18} />
            Employees
          </h2>
        </div>

        <div className="divide-y divide-stone-200">
          {visibleEmployees.map((e) => {
            const lastCheckin = [...e.checkins].sort((a, b) => b.date.localeCompare(a.date))[0];

            return (
              <button
                key={e.id}
                onClick={() => onOpenEmployee(e.id)}
                className="w-full flex items-center justify-between py-3 hover:bg-stone-50 px-2 rounded text-left"
              >
                <div>
                  <div className="font-medium">{e.name}</div>
                  <div className="text-xs text-stone-500">
                    {e.title} · {stores.find((s) => toStoreKey(s.id) === e.storeId)?.name}
                  </div>
                </div>

                <div className="text-right text-xs text-stone-500">
                  <div>
                    Next review:{" "}
                    <span className={isOverdue(e.nextReviewDue) ? "text-red-600 font-semibold" : ""}>
                      {e.nextReviewDue || "—"}
                    </span>
                  </div>
                  <div className="mt-0.5">
                    Last check-in:{" "}
                    <span className={!lastCheckin || daysSince(lastCheckin.date) > 30 ? "text-red-600 font-semibold" : ""}>
                      {lastCheckin?.date || "never"}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}

          {visibleEmployees.length === 0 && (
            <div className="py-6 text-sm text-stone-500">No employees found.</div>
          )}
        </div>
      </section>
    </>
  );
}

function EmployeePacket({
  employee,
  user,
  stores,
  activeTab,
  setActiveTab,
  onBack,
  onPatchEmployee,
  onAddNote,
  onAddGoal,
  onAddCheckin,
  onAddAttendance,
  onAddDocument,
  onSubmitSixMonthReview,
  onTerminate,
  onDeleteEmployee,
}: {
  employee: Employee;
  user: User;
  stores: StoreRow[];
  activeTab: "overview" | "pay" | "checkin" | "review6" | "notes" | "documents" | "attendance" | "term";
  setActiveTab: (
    tab: "overview" | "pay" | "checkin" | "review6" | "notes" | "documents" | "attendance" | "term"
  ) => void;
  onBack: () => void;
  onPatchEmployee: (dbId: number, patch: Partial<EmployeeRow>) => Promise<void>;
  onAddNote: (employee: Employee, text: string) => Promise<void>;
  onAddGoal: (employee: Employee, goalText: string, supportText: string) => Promise<void>;
  onAddCheckin: (employee: Employee, ratings: Record<string, string>, notes: string) => Promise<void>;
  onAddAttendance: (
    employee: Employee,
    incidentDate: string,
    incidentType: string,
    reason: string,
    writeUp: boolean
  ) => Promise<void>;
  onAddDocument: (employee: Employee, label: string, file: File) => Promise<void>;
  onSubmitSixMonthReview: (
    employee: Employee,
    scores: Record<string, number>,
    photoFile: File | null
  ) => Promise<void>;
  onTerminate: (employee: Employee, reason: string) => Promise<void>;
  onDeleteEmployee: (employee: Employee) => Promise<void>;
}) {
  const tabs = [
    { id: "overview", label: "Overview", icon: <UserCheck size={14} /> },
    { id: "pay", label: "Pay & Reviews", icon: <ClipboardCheck size={14} /> },
    { id: "checkin", label: "Monthly Check-in", icon: <Bell size={14} /> },
    { id: "review6", label: "6-Month Review", icon: <ClipboardCheck size={14} /> },
    { id: "notes", label: "Notes & Goals", icon: <Target size={14} /> },
    { id: "documents", label: "Documents", icon: <Paperclip size={14} /> },
    { id: "attendance", label: "Attendance", icon: <Clock3 size={14} /> },
    { id: "term", label: "Termination", icon: <LogOut size={14} /> },
  ] as const;

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-stone-600 hover:text-black mb-3">
        <ChevronLeft size={16} />
        Back to dashboard
      </button>

      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
        <div className="bg-black text-white p-6">
          <div className="text-xs tracking-widest text-stone-400 mb-1">EMPLOYEE PACKET</div>
          <div className="text-3xl font-bold">{employee.name}</div>
          <div className="text-stone-300 mt-1">
            {employee.title} · Started {employee.startDate || "—"} ·{" "}
            {stores.find((s) => toStoreKey(s.id) === employee.storeId)?.name}
          </div>
        </div>

        <div className="flex gap-1 border-b border-stone-200 px-4 pt-3 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-t whitespace-nowrap ${
                activeTab === t.id
                  ? "bg-stone-100 font-semibold border-b-2 border-red-500"
                  : "text-stone-600 hover:bg-stone-50"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === "overview" && (
            <OverviewTab employee={employee} onPatchEmployee={onPatchEmployee} />
          )}

          {activeTab === "pay" && <PayTab employee={employee} />}

          {activeTab === "checkin" && (
            <CheckinTab employee={employee} user={user} onAddCheckin={onAddCheckin} />
          )}

          {activeTab === "review6" && (
            <SixMonthReviewTab
              employee={employee}
              user={user}
              onSubmitSixMonthReview={onSubmitSixMonthReview}
            />
          )}

          {activeTab === "notes" && (
            <NotesGoalsTab employee={employee} user={user} onAddNote={onAddNote} onAddGoal={onAddGoal} />
          )}

          {activeTab === "documents" && (
            <DocumentsTab employee={employee} user={user} onAddDocument={onAddDocument} />
          )}

          {activeTab === "attendance" && (
            <AttendanceTab employee={employee} onAddAttendance={onAddAttendance} />
          )}

          {activeTab === "term" && (
            <TerminationTab employee={employee} onTerminate={onTerminate} onDeleteEmployee={onDeleteEmployee} />
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({
  employee,
  onPatchEmployee,
}: {
  employee: Employee;
  onPatchEmployee: (dbId: number, patch: Partial<EmployeeRow>) => Promise<void>;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <EditableField
        label="Assigned Trainer"
        value={employee.assignedTrainer}
        onSave={(value) => onPatchEmployee(employee.dbId, { assigned_trainer: value })}
      />
      <Field label="Start Date" value={employee.startDate || "—"} />
      <Field label="Next Review Due" value={employee.nextReviewDue || "—"} />
      <Field label="Title" value={employee.title} />
      <ToggleField
        label="Insurance Approved"
        value={employee.insuranceApproved}
        onChange={(value) => onPatchEmployee(employee.dbId, { insurance_approved: value })}
      />
      <ToggleField
        label="ADP Signed Up"
        value={employee.adpSignedUp}
        onChange={(value) => onPatchEmployee(employee.dbId, { adp_signed_up: value })}
      />
    </div>
  );
}

function PayTab({ employee }: { employee: Employee }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-2">Review History</h3>
        {employee.reviewHistory.length === 0 ? (
          <p className="text-stone-500 text-sm">No reviews on file.</p>
        ) : (
          <table className="w-full text-sm border border-stone-200">
            <thead className="bg-stone-100">
              <tr>
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Manager</th>
                <th className="text-left p-2">Score</th>
                <th className="text-left p-2">Next Review</th>
              </tr>
            </thead>
            <tbody>
              {[...employee.reviewHistory]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((r) => (
                  <tr key={r.id} className="border-t border-stone-200">
                    <td className="p-2">{r.date}</td>
                    <td className="p-2">{r.type}</td>
                    <td className="p-2">{r.manager}</td>
                    <td className="p-2">{r.total}/32</td>
                    <td className="p-2">{r.nextReviewDate || "—"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function CheckinTab({
  employee,
  user,
  onAddCheckin,
}: {
  employee: Employee;
  user: User;
  onAddCheckin: (employee: Employee, ratings: Record<string, string>, notes: string) => Promise<void>;
}) {
  const [ratings, setRatings] = useState<Record<string, string>>(
    Object.fromEntries(CHECKIN_CATEGORIES.map((c) => [c, ""]))
  );
  const [notes, setNotes] = useState("");

  async function save() {
    await onAddCheckin(employee, ratings, notes);
    setRatings(Object.fromEntries(CHECKIN_CATEGORIES.map((c) => [c, ""])));
    setNotes("");
  }

  const history = [...employee.checkins].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-2">New Check-in</h3>
        <p className="text-sm text-stone-600 mb-3">
          Rate adherence to core values. (+) most of the time, (+/-) sometimes, (-) rarely.
        </p>

        <div className="space-y-2 mb-4">
          {CHECKIN_CATEGORIES.map((label) => (
            <div key={label} className="flex items-center justify-between border border-stone-200 rounded p-2">
              <span>{label}</span>
              <div className="flex gap-1">
                {["+", "+/-", "-"].map((value) => (
                  <button
                    key={value}
                    onClick={() => setRatings((prev) => ({ ...prev, [label]: value }))}
                    className={`px-3 py-1 text-sm rounded ${
                      ratings[label] === value ? "bg-black text-white" : "bg-stone-100 hover:bg-stone-200"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Optional manager notes..."
          className="w-full border border-stone-300 rounded px-3 py-2 text-sm mb-3"
        />

        <button onClick={save} className="bg-black text-white px-4 py-2 rounded hover:bg-stone-800">
          Save Check-in
        </button>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Check-in History</h3>
        {history.length === 0 ? (
          <p className="text-stone-500 text-sm">No check-ins recorded yet.</p>
        ) : (
          <table className="w-full text-sm border border-stone-200">
            <thead className="bg-stone-100">
              <tr>
                <th className="text-left p-2">Date Completed</th>
                <th className="text-left p-2">Manager</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} className="border-t border-stone-200">
                  <td className="p-2 font-medium">{h.date}</td>
                  <td className="p-2">{h.manager || user.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function SixMonthReviewTab({
  employee,
  user,
  onSubmitSixMonthReview,
}: {
  employee: Employee;
  user: User;
  onSubmitSixMonthReview: (
    employee: Employee,
    scores: Record<string, number>,
    photoFile: File | null
  ) => Promise<void>;
}) {
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(REVIEW_CATEGORIES.map((c) => [c, 0]))
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const total = scoreTotal(scores);

  async function submit() {
    await onSubmitSixMonthReview(employee, scores, photoFile);
    setScores(Object.fromEntries(REVIEW_CATEGORIES.map((c) => [c, 0])));
    setPhotoFile(null);
  }

  const reviewPhotos = employee.documents.filter((d) =>
    d.label.toLowerCase().includes("6-month review photo")
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-stone-600 mb-3">
          Hourly Performance Appraisal. 1 = Unacceptable, 2 = Meets, 3 = Exceeds, 4 = Outstanding.
        </p>

        <div className="space-y-2">
          {REVIEW_CATEGORIES.map((category) => (
            <div key={category} className="flex items-center justify-between border border-stone-200 rounded p-3">
              <span className="font-medium">{category}</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => setScores((prev) => ({ ...prev, [category]: n }))}
                    className={`w-9 h-9 rounded text-sm font-semibold ${
                      scores[category] === n ? "bg-black text-white" : "bg-stone-100 hover:bg-stone-200"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between bg-stone-100 p-4 rounded">
          <div className="font-semibold">Overall Rating</div>
          <div className="text-2xl font-bold">{total} / 32</div>
        </div>

        <div className="mt-4 border border-stone-200 rounded p-4 bg-stone-50">
          <div className="font-semibold mb-2">Upload photo of signed 6-month review</div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
            className="text-sm"
          />
          {photoFile && <div className="text-xs text-stone-600 mt-2">Selected: {photoFile.name}</div>}
        </div>

        <button
          onClick={submit}
          className="mt-4 bg-black text-white px-4 py-2 rounded hover:bg-stone-800"
        >
          Submit Review
        </button>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Review History</h3>
        {employee.reviewHistory.length === 0 ? (
          <p className="text-stone-500 text-sm">No reviews on file.</p>
        ) : (
          <table className="w-full text-sm border border-stone-200">
            <thead className="bg-stone-100">
              <tr>
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Manager</th>
                <th className="text-left p-2">Score</th>
              </tr>
            </thead>
            <tbody>
              {[...employee.reviewHistory]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((r) => (
                  <tr key={r.id} className="border-t border-stone-200">
                    <td className="p-2 font-medium">{r.date}</td>
                    <td className="p-2">{r.manager}</td>
                    <td className="p-2">{r.total}/32</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      <div>
        <h3 className="font-semibold mb-2">Uploaded Review Photos</h3>
        {reviewPhotos.length === 0 ? (
          <p className="text-stone-500 text-sm">No review photos uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {reviewPhotos.map((doc) => (
              <a
                key={doc.id}
                href={doc.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="border border-stone-200 rounded overflow-hidden bg-white hover:bg-stone-50"
              >
                {doc.fileType.startsWith("image/") ? (
                  <img src={doc.fileUrl} alt={doc.label} className="w-full aspect-square object-cover" />
                ) : (
                  <div className="w-full aspect-square flex items-center justify-center text-stone-500">
                    <FileText size={30} />
                  </div>
                )}
                <div className="p-2 text-xs">
                  <div className="font-medium truncate">{doc.label}</div>
                  <div className="text-stone-500">{doc.date}</div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NotesGoalsTab({
  employee,
  user,
  onAddNote,
  onAddGoal,
}: {
  employee: Employee;
  user: User;
  onAddNote: (employee: Employee, text: string) => Promise<void>;
  onAddGoal: (employee: Employee, goalText: string, supportText: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [goal, setGoal] = useState("");
  const [support, setSupport] = useState("");

  return (
    <div className="space-y-8">
      <section>
        <h3 className="font-semibold text-lg mb-2">Future Goals & Development</h3>
        <div className="border border-stone-200 rounded p-4 space-y-2 bg-stone-50">
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Employee goal"
            className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
          />
          <textarea
            value={support}
            onChange={(e) => setSupport(e.target.value)}
            placeholder="How you're helping them reach it"
            rows={3}
            className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
          />
          <button
            onClick={async () => {
              if (!goal.trim()) return;
              await onAddGoal(employee, goal.trim(), support.trim());
              setGoal("");
              setSupport("");
            }}
            className="bg-black text-white px-4 py-2 rounded hover:bg-stone-800 text-sm"
          >
            Save Goal
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {employee.goals.length === 0 ? (
            <p className="text-stone-500 text-sm">No goals recorded yet.</p>
          ) : (
            [...employee.goals]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((g) => (
                <div key={g.id} className="border border-stone-200 rounded p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold">{g.goal}</div>
                    <div className="text-xs text-stone-500">
                      {g.date} · {g.manager}
                    </div>
                  </div>
                  {g.support && (
                    <div className="text-sm text-stone-700 mt-1">
                      <span className="text-stone-500">Support plan:</span> {g.support}
                    </div>
                  )}
                </div>
              ))
          )}
        </div>
      </section>

      <section>
        <h3 className="font-semibold text-lg mb-2">Manager Notes</h3>
        <div className="border border-stone-200 rounded p-4 space-y-2 bg-stone-50">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note about this employee..."
            rows={3}
            className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
          />
          <button
            onClick={async () => {
              if (!note.trim()) return;
              await onAddNote(employee, note.trim());
              setNote("");
            }}
            className="bg-black text-white px-4 py-2 rounded hover:bg-stone-800 text-sm"
          >
            Add Note
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {employee.notes.length === 0 ? (
            <p className="text-stone-500 text-sm">No notes recorded yet.</p>
          ) : (
            [...employee.notes]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((n) => (
                <div key={n.id} className="border-l-4 border-stone-300 bg-white border border-stone-200 rounded p-3">
                  <div className="text-xs text-stone-500 mb-1">
                    {n.date} · {n.manager || user.name}
                  </div>
                  <div className="text-sm text-stone-800">{n.text}</div>
                </div>
              ))
          )}
        </div>
      </section>
    </div>
  );
}

function DocumentsTab({
  employee,
  user,
  onAddDocument,
}: {
  employee: Employee;
  user: User;
  onAddDocument: (employee: Employee, label: string, file: File) => Promise<void>;
}) {
  const [label, setLabel] = useState("");

  const docs = [...employee.documents].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <section>
        <h3 className="font-semibold text-lg mb-2">Upload Documents & Photos</h3>
        <div className="border-2 border-dashed border-stone-300 rounded-lg p-6 bg-stone-50">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Optional label"
            className="w-full border border-stone-300 rounded px-3 py-2 text-sm mb-3 bg-white"
          />

          <label className="flex items-center justify-center gap-2 cursor-pointer bg-black text-white px-4 py-3 rounded hover:bg-stone-800 text-sm font-medium">
            <Paperclip size={16} />
            Choose file or photo
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                await onAddDocument(employee, label.trim() || file.name, file);
                setLabel("");
                e.currentTarget.value = "";
              }}
              className="hidden"
            />
          </label>
        </div>
      </section>

      <section>
        <h3 className="font-semibold text-lg mb-3">Files on Record ({docs.length})</h3>
        {docs.length === 0 ? (
          <p className="text-stone-500 text-sm">No documents uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {docs.map((d) => (
              <a
                key={d.id}
                href={d.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="border border-stone-200 rounded overflow-hidden bg-white hover:bg-stone-50"
              >
                {d.fileType.startsWith("image/") ? (
                  <img src={d.fileUrl} alt={d.label} className="w-full aspect-square object-cover" />
                ) : (
                  <div className="w-full aspect-square flex items-center justify-center text-stone-500">
                    <FileText size={30} />
                  </div>
                )}
                <div className="p-2">
                  <div className="text-xs font-medium truncate">{d.label}</div>
                  <div className="text-xs text-stone-500">
                    {d.date} · {d.uploadedBy || user.name}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function AttendanceTab({
  employee,
  onAddAttendance,
}: {
  employee: Employee;
  onAddAttendance: (
    employee: Employee,
    incidentDate: string,
    incidentType: string,
    reason: string,
    writeUp: boolean
  ) => Promise<void>;
}) {
  const [form, setForm] = useState({
    date: "",
    type: "Late",
    reason: "",
    writeUp: false,
  });

  return (
    <div className="space-y-4">
      <div className="border border-stone-200 rounded p-4 grid grid-cols-1 md:grid-cols-4 gap-2">
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
          className="border border-stone-300 rounded px-2 py-1.5 text-sm"
        />
        <select
          value={form.type}
          onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
          className="border border-stone-300 rounded px-2 py-1.5 text-sm"
        >
          <option>Late</option>
          <option>Left Early</option>
          <option>Call Off</option>
          <option>Bad Behavior</option>
        </select>
        <input
          placeholder="Reason"
          value={form.reason}
          onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
          className="border border-stone-300 rounded px-2 py-1.5 text-sm"
        />
        <button
          onClick={async () => {
            if (!form.date || !form.reason.trim()) return;
            await onAddAttendance(employee, form.date, form.type, form.reason.trim(), form.writeUp);
            setForm({ date: "", type: "Late", reason: "", writeUp: false });
          }}
          className="bg-black text-white rounded px-3 py-1.5 text-sm hover:bg-stone-800"
        >
          Log Incident
        </button>
      </div>

      {employee.attendance.length === 0 ? (
        <p className="text-stone-500 text-sm">No incidents on file.</p>
      ) : (
        <table className="w-full text-sm border border-stone-200">
          <thead className="bg-stone-100">
            <tr>
              <th className="text-left p-2">Date</th>
              <th className="text-left p-2">Type</th>
              <th className="text-left p-2">Reason</th>
              <th className="text-left p-2">Write-Up</th>
            </tr>
          </thead>
          <tbody>
            {[...employee.attendance]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((a) => (
                <tr key={a.id} className="border-t border-stone-200">
                  <td className="p-2">{a.date}</td>
                  <td className="p-2">{a.type}</td>
                  <td className="p-2">{a.reason}</td>
                  <td className="p-2">{a.writeUp ? "Yes" : "No"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function TerminationTab({
  employee,
  onTerminate,
  onDeleteEmployee,
}: {
  employee: Employee;
  onTerminate: (employee: Employee, reason: string) => Promise<void>;
  onDeleteEmployee: (employee: Employee) => Promise<void>;
}) {
  const [reason, setReason] = useState("");

  return (
    <div className="space-y-4 max-w-2xl">
      <textarea
        placeholder="Termination reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={4}
        className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
      />

      <div className="flex flex-wrap gap-3">
        <button
          disabled={!reason.trim()}
          onClick={async () => {
            if (!reason.trim()) return;
            await onTerminate(employee, reason.trim());
          }}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-stone-300"
        >
          Submit Termination
        </button>

        <button
          onClick={() => onDeleteEmployee(employee)}
          className="bg-stone-200 text-stone-900 px-4 py-2 rounded hover:bg-stone-300 flex items-center gap-2"
        >
          <Trash2 size={16} />
          Delete Employee
        </button>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  danger = false,
}: {
  icon: JSX.Element;
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className={`bg-white border rounded-lg p-4 ${danger ? "border-red-300" : "border-stone-200"}`}>
      <div className={`flex items-center gap-2 text-sm ${danger ? "text-red-600" : "text-stone-600"}`}>
        {icon}
        {label}
      </div>
      <div className={`text-3xl font-bold mt-1 ${danger ? "text-red-600" : ""}`}>{value}</div>
    </div>
  );
}

function MetricRow({
  label,
  values,
  redIf,
}: {
  label: string;
  values: Array<number | string>;
  redIf?: (value: number) => boolean;
}) {
  return (
    <tr className="border-b border-stone-100">
      <td className="p-3 text-stone-600">{label}</td>
      {values.map((v, i) => {
        const isRed = redIf && typeof v === "number" && redIf(v);
        return (
          <td key={i} className={`p-3 font-semibold ${isRed ? "text-red-600" : ""}`}>
            {v}
          </td>
        );
      })}
    </tr>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-stone-200 rounded p-3">
      <div className="text-xs text-stone-500 uppercase tracking-wide">{label}</div>
      <div className="font-medium mt-1">{value}</div>
    </div>
  );
}

function EditableField({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string;
  onSave: (value: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <div className="border border-stone-200 rounded p-3">
      <div className="text-xs text-stone-500 uppercase tracking-wide mb-1">{label}</div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="flex-1 border border-stone-300 rounded px-2 py-1.5 text-sm"
        />
        <button
          onClick={() => onSave(draft)}
          className="bg-black text-white px-3 py-1.5 rounded text-sm hover:bg-stone-800"
        >
          Save
        </button>
      </div>
    </div>
  );
}

function ToggleField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => Promise<void>;
}) {
  return (
    <div className="border border-stone-200 rounded p-3 flex items-center justify-between">
      <div className="text-sm font-medium">{label}</div>
      <div className="flex gap-1">
        <button
          onClick={() => onChange(true)}
          className={`px-3 py-1 rounded text-sm ${value ? "bg-green-600 text-white" : "bg-stone-100"}`}
        >
          Yes
        </button>
        <button
          onClick={() => onChange(false)}
          className={`px-3 py-1 rounded text-sm ${!value ? "bg-stone-700 text-white" : "bg-stone-100"}`}
        >
          No
        </button>
      </div>
    </div>
  );
}
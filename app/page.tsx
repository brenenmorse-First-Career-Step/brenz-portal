"use client";

import { useMemo, useState } from "react";
import {
  Users,
  AlertTriangle,
  ClipboardCheck,
  Store,
  ChevronLeft,
  FileText,
  Bell,
  DollarSign,
  GraduationCap,
  Target,
  Clock3,
  LogOut,
  Shield,
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

type PayEntry = {
  title: string;
  rate: string;
  date: string;
  tipsEligible: "Yes" | "No";
};

type ReviewHistoryEntry = {
  date: string;
  manager: string;
  total: number;
  type: string;
};

type NoteEntry = {
  date: string;
  text: string;
  manager: string;
};

type GoalEntry = {
  date: string;
  goal: string;
  support: string;
  manager: string;
};

type CheckinEntry = {
  date: string;
  manager: string;
};

type AttendanceEntry = {
  date: string;
  type: string;
  reason: string;
};

type DocumentEntry = {
  date: string;
  name: string;
  uploadedBy: string;
};

type TrainingRecord = Record<string, boolean>;
type OnboardingRecord = Record<string, boolean>;

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
  training: TrainingRecord;
  onboarding: OnboardingRecord;
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

const TRAINING_ITEMS = [
  "Day 1 Basics",
  "Pizza / Salad Making",
  "Basic Kitchen",
  "Basic POS",
  "Customer Service",
  "Service Recovery",
  "Inventory",
  "Opening Procedures",
  "Closing Procedures",
];

const ONBOARDING_ITEMS = [
  "Paperwork Sent to HR",
  "Uniform Provided",
  "Training Scheduled",
  "Handbook Provided",
];

const STORES: StoreType[] = [
  { id: "s1", name: "Brenz - Chapel Hill" },
  { id: "s2", name: "Brenz - Columbus" },
];

const USERS: User[] = [
  { id: "u1", name: "Owner (You)", role: "owner", storeId: null },
  { id: "u2", name: "Maria (GM Chapel Hill)", role: "gm", storeId: "s1" },
  { id: "u3", name: "Derek (GM Columbus)", role: "gm", storeId: "s2" },
];

const EMPLOYEE_SEED: Employee[] = [
  {
    id: "e1",
    name: "Alex Rivera",
    title: "Team Member",
    storeId: "s1",
    startDate: "2025-09-15",
    nextReviewDue: "2026-04-01",
    assignedTrainer: "Maria",
    insuranceApproved: false,
    adpSignedUp: true,
    pay: [{ title: "Team Member", rate: "12.00", date: "2025-09-15", tipsEligible: "Yes" }],
    notes: [
      {
        date: "2026-03-18",
        text: "Needs a little more help on closing checklist.",
        manager: "Maria",
      },
    ],
    goals: [
      {
        date: "2026-03-20",
        goal: "Become a stronger closer",
        support: "Paired with Jamie twice a week for closing practice.",
        manager: "Maria",
      },
    ],
    checkins: [{ date: "2026-03-04", manager: "Maria" }],
    attendance: [{ date: "2026-03-10", type: "Late", reason: "Traffic" }],
    documents: [{ date: "2026-02-01", name: "Signed Handbook.pdf", uploadedBy: "Maria" }],
    reviewHistory: [{ date: "2025-12-15", manager: "Maria", total: 23, type: "90-day" }],
    training: {
      "Day 1 Basics": true,
      "Pizza / Salad Making": true,
      "Basic Kitchen": true,
      "Basic POS": false,
      "Customer Service": true,
      "Service Recovery": false,
      "Inventory": false,
      "Opening Procedures": false,
      "Closing Procedures": false,
    },
    onboarding: {
      "Paperwork Sent to HR": true,
      "Uniform Provided": true,
      "Training Scheduled": true,
      "Handbook Provided": true,
    },
    terminated: false,
  },
  {
    id: "e2",
    name: "Jamie Chen",
    title: "Team Captain",
    storeId: "s1",
    startDate: "2025-06-01",
    nextReviewDue: "2026-05-20",
    assignedTrainer: "Maria",
    insuranceApproved: true,
    adpSignedUp: true,
    pay: [
      { title: "Team Member", rate: "12.00", date: "2025-06-01", tipsEligible: "Yes" },
      { title: "Team Captain", rate: "14.50", date: "2025-09-01", tipsEligible: "Yes" },
    ],
    notes: [],
    goals: [
      {
        date: "2026-02-01",
        goal: "Move into Assistant Coach role",
        support: "Shadowing admin tasks and inventory counts.",
        manager: "Maria",
      },
    ],
    checkins: [
      { date: "2026-03-15", manager: "Maria" },
      { date: "2026-02-10", manager: "Maria" },
    ],
    attendance: [],
    documents: [{ date: "2026-01-09", name: "Performance Review.pdf", uploadedBy: "Maria" }],
    reviewHistory: [{ date: "2026-01-10", manager: "Maria", total: 28, type: "6-month" }],
    training: Object.fromEntries(TRAINING_ITEMS.map((item) => [item, true])),
    onboarding: Object.fromEntries(ONBOARDING_ITEMS.map((item) => [item, true])),
    terminated: false,
  },
  {
    id: "e3",
    name: "Sam Patel",
    title: "Driver",
    storeId: "s2",
    startDate: "2026-01-10",
    nextReviewDue: "2026-03-28",
    assignedTrainer: "Derek",
    insuranceApproved: true,
    adpSignedUp: false,
    pay: [{ title: "Driver", rate: "10.50", date: "2026-01-10", tipsEligible: "Yes" }],
    notes: [],
    goals: [],
    checkins: [],
    attendance: [],
    documents: [],
    reviewHistory: [],
    training: {
      "Day 1 Basics": true,
      "Pizza / Salad Making": false,
      "Basic Kitchen": false,
      "Basic POS": false,
      "Customer Service": true,
      "Service Recovery": false,
      "Inventory": false,
      "Opening Procedures": false,
      "Closing Procedures": false,
    },
    onboarding: {
      "Paperwork Sent to HR": true,
      "Uniform Provided": true,
      "Training Scheduled": false,
      "Handbook Provided": true,
    },
    terminated: false,
  },
  {
    id: "e4",
    name: "Priya Singh",
    title: "Assistant Coach",
    storeId: "s2",
    startDate: "2024-11-20",
    nextReviewDue: "2026-04-28",
    assignedTrainer: "Derek",
    insuranceApproved: true,
    adpSignedUp: true,
    pay: [{ title: "Assistant Coach", rate: "17.00", date: "2024-11-20", tipsEligible: "No" }],
    notes: [
      {
        date: "2026-03-20",
        text: "Ready for more admin responsibility.",
        manager: "Derek",
      },
    ],
    goals: [
      {
        date: "2026-03-21",
        goal: "Promotion to Head Coach",
        support: "Leading counts, interviewing, and cash handling training.",
        manager: "Derek",
      },
    ],
    checkins: [{ date: "2026-03-20", manager: "Derek" }],
    attendance: [],
    documents: [{ date: "2026-03-01", name: "Inventory Training.pdf", uploadedBy: "Derek" }],
    reviewHistory: [{ date: "2025-10-01", manager: "Derek", total: 30, type: "6-month" }],
    training: Object.fromEntries(TRAINING_ITEMS.map((item) => [item, true])),
    onboarding: Object.fromEntries(ONBOARDING_ITEMS.map((item) => [item, true])),
    terminated: false,
  },
];

function isOverdue(date: string) {
  return new Date(date) < new Date();
}

function daysSince(date: string) {
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

function nowStamp() {
  return new Date().toISOString().replace("T", " ").slice(0, 16);
}

export default function Page() {
  const [currentUserId, setCurrentUserId] = useState("u1");
  const [employees, setEmployees] = useState<Employee[]>(EMPLOYEE_SEED);
  const [audit, setAudit] = useState<AuditEntry[]>([
    { id: 1, ts: "2026-04-10 09:10", user: "Maria", action: "Completed review", target: "Jamie Chen" },
    { id: 2, ts: "2026-04-10 08:20", user: "Derek", action: "Added note", target: "Priya Singh" },
  ]);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "pay" | "review" | "training" | "notes" | "documents" | "attendance" | "term"
  >("overview");

  const [newNote, setNewNote] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [newGoalSupport, setNewGoalSupport] = useState("");
  const [newDocumentName, setNewDocumentName] = useState("");
  const [attendanceType, setAttendanceType] = useState("Late");
  const [attendanceReason, setAttendanceReason] = useState("");
  const [terminationReason, setTerminationReason] = useState("");

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

  const currentUser = USERS.find((u) => u.id === currentUserId)!;

  const visibleEmployees = useMemo(() => {
    if (currentUser.role === "owner") return employees.filter((e) => !e.terminated);
    return employees.filter((e) => !e.terminated && e.storeId === currentUser.storeId);
  }, [employees, currentUser]);

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId) ?? null;

  const overdueReviews = visibleEmployees.filter((e) => isOverdue(e.nextReviewDue));
  const checkinsOverdue = visibleEmployees.filter((e) => {
    const last = e.checkins[0];
    if (!last) return true;
    return daysSince(last.date) > 30;
  });

  function storeName(storeId: string) {
    return STORES.find((s) => s.id === storeId)?.name ?? "Unknown store";
  }

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

  function updateEmployee(id: string, patch: Partial<Employee>) {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  function addNote() {
    if (!selectedEmployee || !newNote.trim()) return;
    updateEmployee(selectedEmployee.id, {
      notes: [
        {
          date: new Date().toISOString().slice(0, 10),
          text: newNote.trim(),
          manager: currentUser.name,
        },
        ...selectedEmployee.notes,
      ],
    });
    logAudit("Added note", selectedEmployee.name);
    setNewNote("");
  }

  function addGoal() {
    if (!selectedEmployee || !newGoal.trim()) return;
    updateEmployee(selectedEmployee.id, {
      goals: [
        {
          date: new Date().toISOString().slice(0, 10),
          goal: newGoal.trim(),
          support: newGoalSupport.trim(),
          manager: currentUser.name,
        },
        ...selectedEmployee.goals,
      ],
    });
    logAudit("Added goal", selectedEmployee.name);
    setNewGoal("");
    setNewGoalSupport("");
  }

  function addCheckin() {
    if (!selectedEmployee) return;
    updateEmployee(selectedEmployee.id, {
      checkins: [
        { date: new Date().toISOString().slice(0, 10), manager: currentUser.name },
        ...selectedEmployee.checkins,
      ],
    });
    logAudit("Logged monthly check-in", selectedEmployee.name);
  }

  function addAttendance() {
    if (!selectedEmployee || !attendanceReason.trim()) return;
    updateEmployee(selectedEmployee.id, {
      attendance: [
        {
          date: new Date().toISOString().slice(0, 10),
          type: attendanceType,
          reason: attendanceReason.trim(),
        },
        ...selectedEmployee.attendance,
      ],
    });
    logAudit(`Logged attendance: ${attendanceType}`, selectedEmployee.name);
    setAttendanceReason("");
  }

  function addDocument() {
    if (!selectedEmployee || !newDocumentName.trim()) return;
    updateEmployee(selectedEmployee.id, {
      documents: [
        {
          date: new Date().toISOString().slice(0, 10),
          name: newDocumentName.trim(),
          uploadedBy: currentUser.name,
        },
        ...selectedEmployee.documents,
      ],
    });
    logAudit("Added document", selectedEmployee.name);
    setNewDocumentName("");
  }

  function toggleTraining(item: string) {
    if (!selectedEmployee) return;
    updateEmployee(selectedEmployee.id, {
      training: {
        ...selectedEmployee.training,
        [item]: !selectedEmployee.training[item],
      },
    });
    logAudit("Updated training", selectedEmployee.name);
  }

  function toggleOnboarding(item: string) {
    if (!selectedEmployee) return;
    updateEmployee(selectedEmployee.id, {
      onboarding: {
        ...selectedEmployee.onboarding,
        [item]: !selectedEmployee.onboarding[item],
      },
    });
    logAudit("Updated onboarding", selectedEmployee.name);
  }

  function submitReview() {
    if (!selectedEmployee) return;
    const total = Object.values(reviewScores).reduce((sum, v) => sum + v, 0);
    updateEmployee(selectedEmployee.id, {
      reviewHistory: [
        {
          date: new Date().toISOString().slice(0, 10),
          manager: currentUser.name,
          total,
          type: "6-month",
        },
        ...selectedEmployee.reviewHistory,
      ],
      nextReviewDue: addMonthsToToday(6),
    });
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
  }

  function terminateEmployee() {
    if (!selectedEmployee || !terminationReason.trim()) return;
    updateEmployee(selectedEmployee.id, {
      terminated: true,
      terminationReason: terminationReason.trim(),
      terminationDate: new Date().toISOString().slice(0, 10),
    });
    logAudit("Terminated employee", selectedEmployee.name);
    setTerminationReason("");
    setSelectedEmployeeId(null);
  }

  const ownerStoreRollup = STORES.map((store) => {
    const list = employees.filter((e) => !e.terminated && e.storeId === store.id);
    return {
      ...store,
      employees: list.length,
      overdueReviews: list.filter((e) => isOverdue(e.nextReviewDue)).length,
      overdueCheckins: list.filter((e) => {
        const last = e.checkins[0];
        if (!last) return true;
        return daysSince(last.date) > 30;
      }).length,
    };
  });

  if (selectedEmployee) {
    const tabs = [
      { id: "overview", label: "Overview", icon: <ClipboardCheck size={14} /> },
      { id: "pay", label: "Pay & Reviews", icon: <DollarSign size={14} /> },
      { id: "review", label: "6-Month Review", icon: <Shield size={14} /> },
      { id: "training", label: "Training", icon: <GraduationCap size={14} /> },
      { id: "notes", label: "Notes & Goals", icon: <Target size={14} /> },
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
            onClick={() => setSelectedEmployeeId(null)}
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
                {selectedEmployee.title} · {storeName(selectedEmployee.storeId)} · Started{" "}
                {selectedEmployee.startDate}
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
                  <InfoCard label="Assigned Trainer" value={selectedEmployee.assignedTrainer} />
                  <InfoCard label="Next Review Due" value={selectedEmployee.nextReviewDue} />
                  <InfoCard label="Store" value={storeName(selectedEmployee.storeId)} />
                  <InfoCard label="Title" value={selectedEmployee.title} />

                  <ToggleCard
                    label="Insurance Approved"
                    value={selectedEmployee.insuranceApproved}
                    onToggle={() =>
                      updateEmployee(selectedEmployee.id, {
                        insuranceApproved: !selectedEmployee.insuranceApproved,
                      })
                    }
                  />
                  <ToggleCard
                    label="ADP Signed Up"
                    value={selectedEmployee.adpSignedUp}
                    onToggle={() =>
                      updateEmployee(selectedEmployee.id, {
                        adpSignedUp: !selectedEmployee.adpSignedUp,
                      })
                    }
                  />

                  <div className="md:col-span-2 border border-stone-200 rounded-lg p-4">
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={addCheckin}
                        className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-800"
                      >
                        Log Monthly Check-in
                      </button>
                      <button
                        onClick={() => setActiveTab("notes")}
                        className="bg-stone-200 px-4 py-2 rounded-lg text-sm hover:bg-stone-300"
                      >
                        Open Notes & Goals
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "pay" && (
                <div className="space-y-6">
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
                          </tr>
                        </thead>
                        <tbody>
                          {selectedEmployee.pay.map((p, i) => (
                            <tr key={i} className="border-t border-stone-200">
                              <td className="p-2">{p.title}</td>
                              <td className="p-2">${p.rate}</td>
                              <td className="p-2">{p.date}</td>
                              <td className="p-2">{p.tipsEligible}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Review History</h3>
                    {selectedEmployee.reviewHistory.length === 0 ? (
                      <p className="text-sm text-stone-500">No reviews on file.</p>
                    ) : (
                      <div className="overflow-x-auto border border-stone-200 rounded-lg">
                        <table className="w-full text-sm">
                          <thead className="bg-stone-100">
                            <tr>
                              <th className="text-left p-2">Date</th>
                              <th className="text-left p-2">Manager</th>
                              <th className="text-left p-2">Type</th>
                              <th className="text-left p-2">Score</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedEmployee.reviewHistory.map((r, i) => (
                              <tr key={i} className="border-t border-stone-200">
                                <td className="p-2">{r.date}</td>
                                <td className="p-2">{r.manager}</td>
                                <td className="p-2">{r.type}</td>
                                <td className="p-2">{r.total}/32</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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

              {activeTab === "training" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">Training Checklist</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {TRAINING_ITEMS.map((item) => (
                        <button
                          key={item}
                          onClick={() => toggleTraining(item)}
                          className="border border-stone-200 rounded-lg p-3 text-left hover:bg-stone-50"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <span>{item}</span>
                            <span
                              className={
                                selectedEmployee.training[item]
                                  ? "text-green-700 font-semibold"
                                  : "text-stone-400"
                              }
                            >
                              {selectedEmployee.training[item] ? "Complete" : "Pending"}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Onboarding Checklist</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {ONBOARDING_ITEMS.map((item) => (
                        <button
                          key={item}
                          onClick={() => toggleOnboarding(item)}
                          className="border border-stone-200 rounded-lg p-3 text-left hover:bg-stone-50"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <span>{item}</span>
                            <span
                              className={
                                selectedEmployee.onboarding[item]
                                  ? "text-green-700 font-semibold"
                                  : "text-stone-400"
                              }
                            >
                              {selectedEmployee.onboarding[item] ? "Complete" : "Pending"}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
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
                        selectedEmployee.goals.map((goal, i) => (
                          <div key={i} className="border border-stone-200 rounded-lg p-3">
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
                    <h3 className="font-semibold mb-2">Add Document Record</h3>
                    <input
                      value={newDocumentName}
                      onChange={(e) => setNewDocumentName(e.target.value)}
                      className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="Example: Signed Handbook.pdf"
                    />
                    <button
                      onClick={addDocument}
                      className="mt-3 bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-800"
                    >
                      Add Document
                    </button>
                  </div>

                  <div className="space-y-2">
                    {selectedEmployee.documents.length === 0 ? (
                      <p className="text-sm text-stone-500">No documents on file.</p>
                    ) : (
                      selectedEmployee.documents.map((doc, i) => (
                        <div key={i} className="border border-stone-200 rounded-lg p-3">
                          <div className="font-medium">{doc.name}</div>
                          <div className="text-xs text-stone-500 mt-1">
                            {doc.date} · {doc.uploadedBy}
                          </div>
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                      selectedEmployee.attendance.map((a, i) => (
                        <div key={i} className="border border-stone-200 rounded-lg p-3">
                          <div className="font-medium">{a.type}</div>
                          <div className="text-sm text-stone-600">
                            {a.date} · {a.reason}
                          </div>
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
            {USERS.map((u) => (
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
            value={currentUser.role === "owner" ? STORES.length : 1}
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
              <button
                key={employee.id}
                onClick={() => {
                  setSelectedEmployeeId(employee.id);
                  setActiveTab("overview");
                }}
                className="w-full text-left py-4 hover:bg-stone-50 px-2 rounded-lg"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">{employee.name}</div>
                    <div className="text-sm text-stone-500">
                      {employee.title} · {storeName(employee.storeId)}
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <div
                      className={
                        isOverdue(employee.nextReviewDue)
                          ? "text-red-600 font-semibold"
                          : "text-stone-500"
                      }
                    >
                      Next review: {employee.nextReviewDue}
                    </div>
                    <div className="text-stone-400 mt-1">
                      Check-ins: {employee.checkins.length}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function addMonthsToToday(months: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
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
import "./healthDashboard.css";

const StudentIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>
);
const UsersIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
);
const HeartIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
);
const HospitalIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0H5m14 0H5m0 0H3"/><path d="M12 9v6m-3-3h6"/></svg>
);
const ArrowIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
);
const SparkleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/></svg>
);

const CARDS = [
  {
    key: "add-student",
    icon: <StudentIcon />,
    label: "Health Records",
    title: "Add Student Details",
    desc: "Register new student health information into the system.",
    accent: "linear-gradient(135deg, #633194, #9b59b6)",
    tileBg: "#f4f0ff", tileColor: "#633194", tileBorder: "#e9d5ff",
  },
  {
    key: "view-students",
    icon: <UsersIcon />,
    label: "Directory",
    title: "View Student Details",
    desc: "Browse and manage all registered student health records.",
    accent: "linear-gradient(135deg, #3b82f6, #60a5fa)",
    tileBg: "#eff6ff", tileColor: "#2563eb", tileBorder: "#bfdbfe",
  },
  {
    key: "heart-rate",
    icon: <HeartIcon />,
    label: "Monitoring",
    title: "Heart Rate Monitor",
    desc: "Measure and track student heart rate in real time.",
    accent: "linear-gradient(135deg, #f43f5e, #fb7185)",
    tileBg: "#fff1f2", tileColor: "#e11d48", tileBorder: "#fecdd3",
  },
  {
    key: "find-hospital",
    icon: <HospitalIcon />,
    label: "Nearby",
    title: "Find Hospital",
    desc: "Locate the nearest hospitals and emergency clinics.",
    accent: "linear-gradient(135deg, #059669, #34d399)",
    tileBg: "#ecfdf5", tileColor: "#059669", tileBorder: "#a7f3d0",
  },
];

interface DashboardProps {
  onLogout: () => void;
  onNavigateToStudentForm: () => void;
  onNavigateToViewStudents: () => void;
  onNavigateToResetPassword: () => void;
  onNavigateToHeartRateMonitor: () => void;
  onNavigateToFindHospital: () => void;
}

function HealthDashboardProps({
  onLogout,
  onNavigateToStudentForm,
  onNavigateToViewStudents,
  onNavigateToResetPassword,
  onNavigateToHeartRateMonitor,
  onNavigateToFindHospital,
}: DashboardProps) {
  const handlers: Record<string, () => void> = {
    "add-student": onNavigateToStudentForm,
    "view-students": onNavigateToViewStudents,
    "heart-rate": onNavigateToHeartRateMonitor,
    "find-hospital": onNavigateToFindHospital,
  };

  return (
    <div className="dashboard-page">
      <button className="reset-btn" onClick={onNavigateToResetPassword}>Reset Password</button>
      <button className="logout-btn" onClick={onLogout}>Logout</button>

      <div className="dashboard-header">
        <div className="dashboard-badge"><SparkleIcon /> Health Management</div>
        <h1>Welcome to <span>EduTrack</span></h1>
        <p className="dashboard-subtitle">
          Manage student health records, monitoring &amp; more — all in one place.
        </p>
      </div>

      <div className="dashboard-grid">
        {CARDS.map((card) => (
          <div
            key={card.key}
            className="dashboard-card"
            style={{
              "--card-accent": card.accent,
              "--tile-bg": card.tileBg,
              "--tile-color": card.tileColor,
              "--tile-border": card.tileBorder,
            } as React.CSSProperties}
            onClick={handlers[card.key]}
          >
            <div className="card-icon-tile">{card.icon}</div>
            <div className="card-body">
              <span className="card-label">{card.label}</span>
              <h2>{card.title}</h2>
              <p>{card.desc}</p>
            </div>
            <div className="card-arrow">Open Module <ArrowIcon /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HealthDashboardProps;

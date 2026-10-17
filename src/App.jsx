import { useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, CalendarDays, Check,
  ChevronDown, ChevronRight, CircleHelp, ClipboardList, Clock3, FileCheck2, FilePlus2,
  FileText, Filter, HeartPulse, LayoutDashboard, ListChecks, LogOut, Menu, MoreHorizontal,
  Plus, Search, Settings, ShieldCheck, Stethoscope, UserRound, UserRoundPlus, Users,
  X, XCircle, CalendarClock, ClipboardCheck, Sparkles, PanelLeftClose,
} from 'lucide-react';
import { getPatients, getEncounters, createPatient, createEncounter } from './api';

const navGroups = [
  {
    label: 'WORKSPACE',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard },
      { label: 'Patients', icon: Users, badge: '8' },
      { label: 'Case Taking', icon: ClipboardList },
      { label: 'Consultations', icon: FileText },
      { label: 'Follow-ups', icon: CalendarClock, badge: '3', badgeTone: 'warm' },
    ],
  },
  {
    label: 'PREFERENCES',
    items: [{ label: 'Settings', icon: Settings }],
  },
];

const formatToday = () => new Intl.DateTimeFormat('en-IN', {
  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
}).format(new Date());
function formatRecordDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function ageFromDateOfBirth(value) {
  if (!value) return null;
  const birthDate = new Date(value);
  if (Number.isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const beforeBirthday = today.getMonth() < birthDate.getMonth()
    || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 ? age : null;
}

function mapPatient(record) {
  const dateOfBirth = record.dateOfBirth ? new Date(record.dateOfBirth).toISOString().slice(0, 10) : '';
  return {
    id: record.patientCode || record._id,
    mongoId: record._id,
    fullName: record.fullName || '',
    dateOfBirth,
    age: record.age ?? ageFromDateOfBirth(record.dateOfBirth),
    gender: record.gender || 'Prefer not to say',
    phone: record.phone || '',
    email: record.email || '',
    bloodGroup: record.bloodGroup || '',
    lastVisit: formatRecordDate(record.lastVisit) || 'No visits yet',
    status: record.status || 'Active',
    chiefComplaint: record.chiefComplaint || '',
  };
}

function mapEncounter(record, patients = []) {
  const linkedPatient = record.patient && typeof record.patient === 'object' ? record.patient : null;
  const localPatient = patients.find((patient) =>
    patient.mongoId === (linkedPatient?._id || record.patient)
  );
  return {
    id: record.caseCode || record._id,
    mongoId: record._id,
    patientId: linkedPatient?.patientCode || localPatient?.id || '',
    patientMongoId: linkedPatient?._id || localPatient?.mongoId || '',
    patientName: linkedPatient?.fullName || localPatient?.fullName || '',
    date: formatRecordDate(record.visitDate),
    chiefComplaint: record.chiefComplaint || '',
    assessment: record.assessment || '',
    status: record.status || 'Completed',
    followUpDate: formatRecordDate(record.followUpDate),
  };
}


function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function Avatar({ name, tone = 'blue', size = 'normal' }) {
  return <span className={`avatar avatar-${tone} ${size === 'small' ? 'avatar-small' : ''}`}>{initials(name)}</span>;
}

function StatusPill({ status }) {
  const tone = status === 'Completed' || status === 'Active' ? 'success'
    : status === 'In progress' ? 'info'
      : status === 'Follow-up' || status === 'Upcoming' ? 'warning'
        : status === 'Inactive' ? 'neutral' : 'neutral';
  return <span className={`status-pill status-${tone}`}><span className="status-dot" />{status}</span>;
}

function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="heading-action">{action}</div>}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, change, changeLabel, tone, trend = 'up' }) {
  const TrendIcon = trend === 'down' ? ArrowDownRight : ArrowUpRight;
  return (
    <div className="metric-card">
      <div className="metric-topline">
        <span className={`metric-icon metric-${tone}`}><Icon size={19} strokeWidth={2} /></span>
        <button className="icon-button quiet-button" aria-label={`More about ${label}`} title="Demo metric"><MoreHorizontal size={19} /></button>
      </div>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-footnote"><span className={`trend trend-${trend}`}><TrendIcon size={14} />{change}</span><span>{changeLabel}</span></div>
    </div>
  );
}

function AppointmentRow({ appointment, onOpenPatient }) {
  return (
    <div className="appointment-row">
      <div className="appointment-time">{appointment.time}</div>
      <div className={`timeline-mark timeline-${appointment.color}`} />
      <Avatar name={appointment.patientName} tone={appointment.color} size="small" />
      <button className="appointment-main text-button" onClick={() => onOpenPatient(appointment.patientId)}>
        <strong>{appointment.patientName}</strong>
        <span>{appointment.reason}</span>
      </button>
      <StatusPill status={appointment.status} />
    </div>
  );
}

function RecentPatientsTable({ patients, onViewAll, onSelectPatient }) {
  return (
    <section className="panel recent-panel">
      <div className="panel-header">
        <div><h2>Recent patients</h2><p>Your latest patient records</p></div>
        <button className="link-button" onClick={onViewAll}>View all <ArrowRight size={15} /></button>
      </div>
      <div className="table-scroll">
        <table>
          <thead><tr><th>Patient</th><th>Patient ID</th><th>Last visit</th><th>Status</th><th aria-label="Actions" /></tr></thead>
          <tbody>
            {patients.slice(0, 5).map((patient, index) => (
              <tr key={patient.id}>
                <td>
                  <button className="person-cell text-button" onClick={() => onSelectPatient(patient.id)}>
                    <Avatar name={patient.fullName} tone={['blue', 'mint', 'violet', 'orange'][index % 4]} size="small" />
                    <span><strong>{patient.fullName}</strong><small>{patient.gender}, {patient.age != null ? `${patient.age} yrs` : 'age not recorded'}</small></span>
                  </button>
                </td>
                <td><span className="id-text">{patient.id}</span></td>
                <td>{patient.lastVisit}</td>
                <td><StatusPill status={patient.status} /></td>
                <td><button className="icon-button table-more" aria-label={`Open ${patient.fullName}`} onClick={() => onSelectPatient(patient.id)}><ChevronRight size={17} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {patients.length === 0 && <div className="empty-state">No patient records yet. Add a patient to get started.</div>}
    </section>
  );
}

function Dashboard({ patients, appointments, encounters, onAddPatient, onGo, onOpenPatient }) {
  const [noticeVisible, setNoticeVisible] = useState(true);
  const todayLabel = formatToday();
  const followupCount = encounters.filter((encounter) => encounter.followUpDate).length;
  const weekCounts = [4, 7, 5, 9, 6, 10, 7];
  const maxWeekCount = Math.max(...weekCounts);
  const weekdayLabels = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  return (
    <>
      <div className="welcome-row">
        <SectionHeading eyebrow={todayLabel} title="Good morning, Dr. Sharma" description="Here’s your clinic overview for today." />
        <div className="welcome-actions">
          <button className="button button-secondary" onClick={() => onGo('Case Taking')}><FilePlus2 size={16} /> New case</button>
          <button className="button button-primary" onClick={onAddPatient}><Plus size={17} /> Add patient</button>
        </div>
      </div>

      {noticeVisible && <div className="demo-notice"><span className="notice-icon"><ShieldCheck size={16} /></span><span><strong>Demo workspace</strong> — Use fictional patient information during development. Security controls are not complete.</span><button className="notice-dismiss" onClick={() => setNoticeVisible(false)} aria-label="Dismiss demo note"><X size={15} /></button></div>}

      <div className="metrics-grid">
        <MetricCard icon={Users} label="Total patients" value={String(patients.length).padStart(2, '0')} change="8.4%" changeLabel="vs. last month" tone="blue" />
        <MetricCard icon={CalendarDays} label="Today's visits" value={String(appointments.length).padStart(2, '0')} change="2 new" changeLabel="appointments today" tone="mint" />
        <MetricCard icon={ClipboardCheck} label="Cases this week" value={String(encounters.length).padStart(2, '0')} change="12.5%" changeLabel="vs. last week" tone="violet" />
        <MetricCard icon={CalendarClock} label="Follow-ups due" value={String(followupCount).padStart(2, '0')} change="Needs review" changeLabel="scheduled follow-ups" tone="orange" trend="down" />
      </div>

      <div className="dashboard-grid">
        <section className="panel schedule-panel">
          <div className="panel-header">
            <div><h2>Today's schedule</h2><p>Your upcoming consultations</p></div>
            <button className="select-button" onClick={() => onGo('Consultations')}>Today <ChevronDown size={14} /></button>
          </div>
          <div className="schedule-date"><CalendarDays size={15} /><span>{todayLabel}</span><span className="schedule-count">{appointments.length} visits</span></div>
          <div className="appointment-list">
            {appointments.length
              ? appointments.map((appointment) => <AppointmentRow key={appointment.id} appointment={appointment} onOpenPatient={onOpenPatient} />)
              : <div className="empty-inline">Appointment scheduling is not connected yet.</div>}
          </div>
          <button className="button button-full button-light" onClick={() => onGo('Consultations')}>View full schedule <ArrowRight size={15} /></button>
        </section>

        <section className="panel activity-panel">
          <div className="panel-header"><div><h2>Consultation activity</h2><p>Cases recorded this week</p></div><button className="icon-button quiet-button" aria-label="More chart options"><MoreHorizontal size={19} /></button></div>
          <div className="chart-legend"><span className="legend-dot" /> Recorded cases <strong>48</strong><span className="chart-period">Last 7 days <ChevronDown size={13} /></span></div>
          <div className="chart-area" role="img" aria-label="Illustrative bar chart of cases recorded over seven days">
            {weekCounts.map((count, index) => (
              <div className="chart-column" key={`${weekdayLabels[index]}-${index}`}>
                <div className="chart-bar-wrap"><div className={`chart-bar ${index === 6 ? 'chart-bar-highlight' : ''}`} style={{ height: `${Math.max(14, (count / maxWeekCount) * 100)}%` }} title={`${count} cases`} /></div>
                <span className="chart-x-label">{weekdayLabels[index]}</span>
              </div>
            ))}
          </div>
          <div className="chart-caption"><span className="chart-caption-dot" />This chart uses sample values for the demo.</div>
        </section>
      </div>

      <div className="lower-grid">
        <RecentPatientsTable patients={patients} onViewAll={() => onGo('Patients')} onSelectPatient={onOpenPatient} />
        <section className="panel activity-feed-panel">
          <div className="panel-header"><div><h2>Recent activity</h2><p>Latest updates in your workspace</p></div><button className="icon-button quiet-button" aria-label="More activity options"><MoreHorizontal size={19} /></button></div>
          <div className="activity-feed"><div className="empty-inline">Live activity tracking will be added in a later milestone.</div></div>
          <button className="link-button feed-link" onClick={() => onGo('Consultations')}>View case history <ArrowRight size={15} /></button>
        </section>
      </div>
    </>
  );
}

function PatientsPage({ patients, search, setSearch, onAddPatient, onSelectPatient }) {
  const filtered = patients.filter((patient) => `${patient.fullName} ${patient.id} ${patient.phone} ${patient.email}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <>
      <SectionHeading eyebrow="PATIENT DIRECTORY" title="Patients" description="Manage patient profiles and review their recorded details." action={<button className="button button-primary" onClick={onAddPatient}><Plus size={17} /> Add patient</button>} />
      <section className="panel directory-panel">
        <div className="directory-toolbar"><div className="toolbar-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, ID, phone or email..." /></div><button className="button button-secondary small-button" onClick={() => setSearch('')}><Filter size={15} /> Clear filters</button><span className="result-count">{filtered.length} patients</span></div>
        <div className="table-scroll"><table className="directory-table"><thead><tr><th>Patient</th><th>Patient ID</th><th>Contact</th><th>Blood group</th><th>Last visit</th><th>Status</th><th /></tr></thead><tbody>
          {filtered.map((patient, index) => <tr key={patient.id}>
            <td><button className="person-cell text-button" onClick={() => onSelectPatient(patient.id)}><Avatar name={patient.fullName} tone={['blue', 'mint', 'violet', 'orange'][index % 4]} size="small" /><span><strong>{patient.fullName}</strong><small>{patient.gender}, {patient.age != null ? `${patient.age} years` : 'age not recorded'}</small></span></button></td>
            <td><span className="id-text">{patient.id}</span></td><td><span className="contact-text">{patient.phone}</span><small className="table-subline">{patient.email}</small></td><td><span className="blood-tag">{patient.bloodGroup || '—'}</span></td><td>{patient.lastVisit || 'No visits yet'}</td><td><StatusPill status={patient.status} /></td><td><button className="icon-button table-more" aria-label={`View ${patient.fullName}`} onClick={() => onSelectPatient(patient.id)}><ChevronRight size={17} /></button></td>
          </tr>)}
        </tbody></table></div>
        {filtered.length === 0 && <div className="empty-state"><Search size={22} /><strong>No matching patients</strong><span>Try a different search term or add a new patient.</span></div>}
      </section>
    </>
  );
}

function PatientDetail({ patient, encounters, onBack, onNewCase }) {
  if (!patient) return <div className="panel empty-state"><strong>Patient not found</strong><button className="button button-secondary" onClick={onBack}>Back to patients</button></div>;
  const patientEncounters = encounters.filter((encounter) => encounter.patientId === patient.id);
  return (
    <>
      <button className="back-link" onClick={onBack}><ArrowRight className="back-arrow" size={15} /> Back to patients</button>
      <section className="panel patient-profile-card">
        <div className="profile-main"><Avatar name={patient.fullName} tone="blue" /><div><div className="eyebrow">PATIENT PROFILE · {patient.id}</div><h1>{patient.fullName}</h1><p>{patient.gender} · {patient.age != null ? `${patient.age} years` : 'Age not recorded'} · Blood group {patient.bloodGroup || 'not recorded'}</p><StatusPill status={patient.status} /></div></div>
        <button className="button button-primary" onClick={() => onNewCase(patient.id)}><Plus size={16} /> New consultation</button>
      </section>
      <div className="profile-grid">
        <section className="panel"><div className="panel-header"><div><h2>Contact information</h2><p>Patient-provided details</p></div></div><div className="detail-list"><div><span>Phone</span><strong>{patient.phone || 'Not provided'}</strong></div><div><span>Email</span><strong>{patient.email || 'Not provided'}</strong></div><div><span>Last visit</span><strong>{patient.lastVisit || 'No visits yet'}</strong></div><div><span>Chief complaint</span><strong>{patient.chiefComplaint || 'Not recorded'}</strong></div></div></section>
        <section className="panel"><div className="panel-header"><div><h2>Consultation history</h2><p>{patientEncounters.length} recorded case(s)</p></div></div>
          {patientEncounters.length ? <div className="history-list">{patientEncounters.map((encounter) => <div className="history-item" key={encounter.id}><span className="history-icon"><FileText size={16} /></span><div><strong>{encounter.chiefComplaint || 'Consultation'}</strong><span>{encounter.date} · {encounter.id}</span><small>{encounter.assessment || 'No assessment summary entered.'}</small></div><StatusPill status={encounter.status} /></div>)}</div> : <div className="empty-inline">No consultations recorded for this patient yet.</div>}
        </section>
      </div>
    </>
  );
}

function CaseTakingPage({ patients, onSaveCase, preselectedPatientId }) {
  const [form, setForm] = useState({
    patientId: preselectedPatientId || patients[0]?.id || '', chiefComplaint: '', duration: '', history: '', medicalHistory: '', allergies: '', medications: '',
    bloodPressure: '', pulse: '', temperature: '', respiratoryRate: '', weight: '', examination: '', assessment: '', plan: '', followUpDate: '',
  });
  const [errors, setErrors] = useState({});
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const submit = (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.patientId) nextErrors.patientId = 'Select a patient.';
    if (!form.chiefComplaint.trim()) nextErrors.chiefComplaint = 'Enter the chief complaint.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const patient = patients.find((item) => item.id === form.patientId);
    onSaveCase({ ...form, patientName: patient?.fullName || 'Unknown patient' });
  };
  return (
    <>
      <SectionHeading eyebrow="CLINICAL WORKFLOW" title="New patient case" description="Capture the consultation in a structured, easy-to-review format." action={<span className="draft-label"><span /> Draft form</span>} />
      <form className="case-form" onSubmit={submit}>
        <div className="case-form-main">
          <section className="panel form-panel"><div className="form-section-heading"><span className="form-step">01</span><div><h2>Visit information</h2><p>Identify the patient and reason for today's visit.</p></div></div>
            <div className="form-grid"><label className="field field-full">Patient <span className="required">*</span><select value={form.patientId} onChange={(event) => update('patientId', event.target.value)}><option value="">Select patient</option>{patients.map((patient) => <option value={patient.id} key={patient.id}>{patient.fullName} · {patient.id}</option>)}</select>{errors.patientId && <small className="field-error">{errors.patientId}</small>}</label>
              <label className="field field-full">Chief complaint <span className="required">*</span><input value={form.chiefComplaint} onChange={(event) => update('chiefComplaint', event.target.value)} placeholder="e.g. Headache, cough, routine check-up" />{errors.chiefComplaint && <small className="field-error">{errors.chiefComplaint}</small>}</label>
              <label className="field">Duration of symptoms<input value={form.duration} onChange={(event) => update('duration', event.target.value)} placeholder="e.g. 3 days" /></label>
              <label className="field">Date of visit<input value={new Date().toLocaleDateString('en-CA')} readOnly /></label>
              <label className="field field-full">History of present illness <textarea value={form.history} onChange={(event) => update('history', event.target.value)} rows={3} placeholder="Onset, location, character, associated symptoms, progression..." /></label>
            </div>
          </section>

          <section className="panel form-panel"><div className="form-section-heading"><span className="form-step">02</span><div><h2>Medical background</h2><p>Record information relevant to the current consultation.</p></div></div>
            <div className="form-grid"><label className="field field-full">Past medical / surgical history<textarea value={form.medicalHistory} onChange={(event) => update('medicalHistory', event.target.value)} rows={2} placeholder="Known conditions, previous surgeries, relevant history..." /></label><label className="field">Known allergies<input value={form.allergies} onChange={(event) => update('allergies', event.target.value)} placeholder="List or write 'Not known'" /></label><label className="field">Current medications<input value={form.medications} onChange={(event) => update('medications', event.target.value)} placeholder="Medication and dose, if known" /></label></div>
          </section>

          <section className="panel form-panel"><div className="form-section-heading"><span className="form-step">03</span><div><h2>Clinical observations</h2><p>Enter measurements collected by the clinical team.</p></div></div>
            <div className="form-grid vitals-grid"><label className="field">Blood pressure<input value={form.bloodPressure} onChange={(event) => update('bloodPressure', event.target.value)} placeholder="e.g. 120/80 mmHg" /></label><label className="field">Pulse<input value={form.pulse} onChange={(event) => update('pulse', event.target.value)} placeholder="e.g. 72 bpm" /></label><label className="field">Temperature<input value={form.temperature} onChange={(event) => update('temperature', event.target.value)} placeholder="e.g. 36.8 °C" /></label><label className="field">Respiratory rate<input value={form.respiratoryRate} onChange={(event) => update('respiratoryRate', event.target.value)} placeholder="e.g. 16 /min" /></label><label className="field">Weight<input value={form.weight} onChange={(event) => update('weight', event.target.value)} placeholder="e.g. 68 kg" /></label><label className="field">Examination findings<textarea value={form.examination} onChange={(event) => update('examination', event.target.value)} rows={2} placeholder="Document examination findings..." /></label></div>
          </section>

          <section className="panel form-panel"><div className="form-section-heading"><span className="form-step">04</span><div><h2>Assessment & plan</h2><p>Document the clinician's assessment and next steps.</p></div></div>
            <div className="form-grid"><label className="field field-full">Clinical assessment<textarea value={form.assessment} onChange={(event) => update('assessment', event.target.value)} rows={3} placeholder="Clinician-entered assessment; do not enter unverified AI output." /></label><label className="field field-full">Plan / instructions<textarea value={form.plan} onChange={(event) => update('plan', event.target.value)} rows={3} placeholder="Plan, tests, care instructions and recommendations..." /></label><label className="field">Recommended follow-up date<input type="date" value={form.followUpDate} onChange={(event) => update('followUpDate', event.target.value)} /></label></div>
          </section>
        </div>
        <aside className="case-form-aside"><section className="panel case-summary"><span className="summary-top-icon"><ClipboardList size={20} /></span><h3>Case summary</h3><p>Complete the required fields to save this consultation.</p><div className="summary-row"><span>Patient selected</span><strong>{patients.find((patient) => patient.id === form.patientId)?.fullName || 'Not selected'}</strong></div><div className="summary-row"><span>Required fields</span><strong>{(form.patientId ? 1 : 0) + (form.chiefComplaint.trim() ? 1 : 0)} of 2 complete</strong></div><div className="summary-checklist"><div className={form.patientId ? 'checklist-done' : ''}>{form.patientId ? <Check size={14} /> : <span className="empty-check" />} Patient selected</div><div className={form.chiefComplaint.trim() ? 'checklist-done' : ''}>{form.chiefComplaint.trim() ? <Check size={14} /> : <span className="empty-check" />} Chief complaint entered</div></div><div className="clinical-note"><ShieldCheck size={16} /><span>Clinical entries should be reviewed and confirmed by the responsible clinician.</span></div></section>
          <div className="case-save-actions"><button type="submit" className="button button-primary button-full"><Check size={16} /> Save case</button><button type="button" className="button button-secondary button-full" onClick={() => { setForm((current) => ({ ...current, chiefComplaint: '', duration: '', history: '', medicalHistory: '', allergies: '', medications: '', bloodPressure: '', pulse: '', temperature: '', respiratoryRate: '', weight: '', examination: '', assessment: '', plan: '', followUpDate: '' })); setErrors({}); }}>Clear form</button><p>Saving adds this case to the local demo session. No server or database is connected yet.</p></div>
        </aside>
      </form>
    </>
  );
}

function ConsultationsPage({ encounters, search, setSearch, onGo }) {
  const filtered = encounters.filter((encounter) => `${encounter.id} ${encounter.patientName} ${encounter.patientId} ${encounter.chiefComplaint} ${encounter.assessment}`.toLowerCase().includes(search.toLowerCase()));
  return <>
    <SectionHeading eyebrow="CLINICAL RECORDS" title="Consultations" description="Review case notes and consultation status." action={<button className="button button-primary" onClick={() => onGo('Case Taking')}><Plus size={16} /> New case</button>} />
    <section className="panel directory-panel"><div className="directory-toolbar"><div className="toolbar-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search case ID, patient or complaint..." /></div><button className="button button-secondary small-button" onClick={() => setSearch('')}><X size={14} /> Clear search</button><span className="result-count">{filtered.length} cases</span></div><div className="table-scroll"><table><thead><tr><th>Case ID</th><th>Patient</th><th>Chief complaint</th><th>Date</th><th>Follow-up</th><th>Status</th></tr></thead><tbody>{filtered.map((encounter) => <tr key={encounter.id}><td><span className="id-text">{encounter.id}</span></td><td><strong>{encounter.patientName}</strong><small className="table-subline">{encounter.patientId}</small></td><td>{encounter.chiefComplaint || '—'}</td><td>{encounter.date}</td><td>{encounter.followUpDate || '—'}</td><td><StatusPill status={encounter.status} /></td></tr>)}</tbody></table></div>{filtered.length === 0 && <div className="empty-state">No matching consultations. Try a different term or start a new case.</div>}</section>
  </>;
}

function FollowUpsPage({ encounters, onGo }) {
  const followups = encounters.filter((encounter) => encounter.followUpDate);
  return <>
    <SectionHeading eyebrow="CONTINUITY OF CARE" title="Follow-ups" description="Keep track of review dates noted during consultations." action={<button className="button button-primary" onClick={() => onGo('Case Taking')}><Plus size={16} /> Record follow-up</button>} />
    <div className="followup-callout"><span className="followup-callout-icon"><CalendarClock size={19} /></span><div><strong>{followups.length} follow-up dates recorded</strong><span>These dates are entered by the user for this prototype; no reminders are sent automatically.</span></div></div>
    <section className="panel directory-panel"><div className="panel-header panel-inset"><div><h2>Scheduled follow-ups</h2><p>Consultations with a follow-up date</p></div></div><div className="table-scroll"><table><thead><tr><th>Patient</th><th>Case ID</th><th>Reason</th><th>Follow-up date</th><th>Status</th></tr></thead><tbody>{followups.map((encounter) => <tr key={encounter.id}><td><strong>{encounter.patientName}</strong><small className="table-subline">{encounter.patientId}</small></td><td><span className="id-text">{encounter.id}</span></td><td>{encounter.chiefComplaint || '—'}</td><td><span className="date-chip"><CalendarDays size={14} />{encounter.followUpDate}</span></td><td><StatusPill status="Follow-up" /></td></tr>)}</tbody></table></div>{followups.length === 0 && <div className="empty-state">No follow-ups recorded yet.</div>}</section>
  </>;
}

function SettingsPage() {
  return <>
    <SectionHeading eyebrow="WORKSPACE PREFERENCES" title="Settings" description="Basic workspace information for this clinical demo." />
    <div className="settings-grid"><section className="panel settings-panel"><div className="panel-header"><div><h2>Clinic profile</h2><p>These details are sample defaults.</p></div><span className="settings-icon"><Stethoscope size={18} /></span></div><label className="field">Clinic name<input defaultValue="Carewell Family Clinic" /></label><label className="field">Primary clinician<input defaultValue="Dr. Sharma" /></label><label className="field">Clinic email<input defaultValue="hello@carewell.demo" /></label><button className="button button-primary" onClick={() => window.alert('Settings are UI-only in this demo. Backend storage will be added later.')}>Save preferences</button></section><section className="panel settings-panel"><div className="panel-header"><div><h2>Privacy & data</h2><p>Prototype information</p></div><span className="settings-icon settings-icon-mint"><ShieldCheck size={18} /></span></div><div className="privacy-row"><div><strong>Demo data only</strong><span>Use fictional records while developing.</span></div><StatusPill status="Active" /></div><div className="privacy-row"><div><strong>Authentication</strong><span>Login and access roles are not connected yet.</span></div><StatusPill status="Upcoming" /></div><div className="privacy-row"><div><strong>Database</strong><span>MongoDB connection will be added in the backend phase.</span></div><StatusPill status="Upcoming" /></div></section></div>
  </>;
}

function AddPatientModal({ onClose, onSave }) {
  const [form, setForm] = useState({ fullName: '', dateOfBirth: '', gender: 'Female', phone: '', email: '', bloodGroup: '' });
  const [errors, setErrors] = useState({});
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.fullName.trim()) nextErrors.fullName = 'Enter the patient name.';
    if (form.phone && !/^[+()\d\s-]{7,20}$/.test(form.phone)) nextErrors.phone = 'Enter a valid phone number.';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'Enter a valid email address.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const age = form.dateOfBirth ? Math.max(0, Math.floor((Date.now() - new Date(form.dateOfBirth).getTime()) / 31557600000)) : null;
    onSave({ ...form, age, dateOfBirth: form.dateOfBirth, fullName: form.fullName.trim() });
  };
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="add-patient-title">
        <div className="modal-header"><div><span className="modal-icon"><UserRoundPlus size={20} /></span><div><h2 id="add-patient-title">Add new patient</h2><p>Create a patient profile in the demo workspace.</p></div></div><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={19} /></button></div>
        <form onSubmit={submit}><div className="modal-body"><div className="form-grid"><label className="field field-full">Full name <span className="required">*</span><input autoFocus value={form.fullName} onChange={(event) => update('fullName', event.target.value)} placeholder="Enter patient's full name" />{errors.fullName && <small className="field-error">{errors.fullName}</small>}</label><label className="field">Date of birth<input type="date" max={new Date().toLocaleDateString('en-CA')} value={form.dateOfBirth} onChange={(event) => update('dateOfBirth', event.target.value)} /></label><label className="field">Gender<select value={form.gender} onChange={(event) => update('gender', event.target.value)}><option>Female</option><option>Male</option><option>Non-binary</option><option>Prefer not to say</option></select></label><label className="field">Phone number<input value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder="+91 98765 43210" />{errors.phone && <small className="field-error">{errors.phone}</small>}</label><label className="field">Email address<input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="patient@example.com" />{errors.email && <small className="field-error">{errors.email}</small>}</label><label className="field field-full">Blood group<select value={form.bloodGroup} onChange={(event) => update('bloodGroup', event.target.value)}><option value="">Not recorded</option>{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => <option key={group}>{group}</option>)}</select></label></div><div className="modal-note"><ShieldCheck size={15} /> Demo only: use fictional patient information until secure storage is implemented.</div></div><div className="modal-footer"><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary"><Plus size={16} /> Create patient</button></div></form>
      </section>
    </div>
  );
}

function Sidebar({ activePage, setActivePage, collapsed, setCollapsed, patientsCount, followupsCount }) {
  return <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
    <div className="brand-row"><span className="brand-mark"><HeartPulse size={22} strokeWidth={2.4} /></span><div className="brand-wordmark"><strong>caseflow<span>.</span></strong><small>CLINICAL WORKSPACE</small></div><button className="collapse-button" onClick={() => setCollapsed(!collapsed)} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-label="Toggle sidebar"><PanelLeftClose size={17} /></button></div>
    <div className="clinic-selector"><span className="clinic-avatar"><Stethoscope size={16} /></span><span className="clinic-copy"><strong>Carewell Clinic</strong><small>General practice</small></span><ChevronDown className="clinic-chevron" size={15} /></div>
    <nav className="side-nav" aria-label="Main navigation">{navGroups.map((group) => <div className="nav-group" key={group.label}><div className="nav-group-label">{group.label}</div>{group.items.map(({ label, icon: Icon, badge, badgeTone }) => {
        const displayBadge = label === 'Patients' ? patientsCount : label === 'Follow-ups' ? followupsCount : badge;
        return <button key={label} className={`nav-item ${activePage === label ? 'nav-item-active' : ''}`} onClick={() => setActivePage(label)} title={collapsed ? label : undefined}><Icon size={18} strokeWidth={activePage === label ? 2.2 : 1.8} /><span className="nav-item-label">{label}</span>{displayBadge ? <span className={`nav-badge ${badgeTone === 'warm' ? 'nav-badge-warm' : ''}`}>{displayBadge}</span> : null}</button>;
      })}</div>)}</nav>
    <div className="sidebar-bottom"><div className="help-card"><span className="help-icon"><CircleHelp size={17} /></span><div className="help-copy"><strong>Need a hand?</strong><span>Explore the starter guide</span></div><ChevronRight size={15} /></div><div className="user-card"><Avatar name="Dr. Sharma" tone="navy" /><span className="user-copy"><strong>Dr. Sharma</strong><small>Clinic administrator</small></span><button className="icon-button user-menu" title="Account menu" aria-label="Account menu"><MoreHorizontal size={18} /></button></div></div>
  </aside>;
}

function Topbar({ globalSearch, setGlobalSearch, onSearchResult, onMobileMenu, activePage }) {
  const showResults = globalSearch.trim().length > 0;
  return <header className="topbar"><div className="topbar-left"><button className="mobile-menu icon-button" onClick={onMobileMenu} aria-label="Open navigation"><Menu size={20} /></button><div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{activePage}</strong></div></div><div className="topbar-right"><div className="global-search"><Search size={16} /><input value={globalSearch} onChange={(event) => setGlobalSearch(event.target.value)} placeholder="Search patients, cases..." aria-label="Search patients and cases" /><kbd>⌘ K</kbd>{showResults && <button className="search-clear" onClick={() => setGlobalSearch('')} aria-label="Clear search"><X size={14} /></button>}</div><button className="top-icon-button notification-button" aria-label="Notifications" title="Notifications are not connected yet"><Bell size={19} /><span /></button><div className="topbar-divider" /><button className="account-button" aria-label="Current account"><Avatar name="Dr. Sharma" tone="blue" size="small" /><span><strong>Dr. Sharma</strong><small>Administrator</small></span><ChevronDown size={15} /></button></div>
    {showResults && <SearchResults query={globalSearch} onChoose={onSearchResult} onClose={() => setGlobalSearch('')} />}
  </header>;
}

function SearchResults({ query, onChoose, onClose }) {
  return <div className="search-results-popover"><div className="search-results-heading">Quick search <button onClick={onClose} aria-label="Close search"><X size={14} /></button></div><button className="search-result-item" onClick={() => onChoose(query, 'Patients')}><span className="search-result-icon"><Users size={16} /></span><span><strong>Search patient records</strong><small>Find a patient matching “{query}”</small></span><ArrowRight size={15} /></button><button className="search-result-item" onClick={() => onChoose(query, 'Consultations')}><span className="search-result-icon search-result-violet"><FileText size={16} /></span><span><strong>Search consultations</strong><small>Find cases and clinical notes</small></span><ArrowRight size={15} /></button></div>;
}

export default function App() {
  const [activePage, setActivePage] = useState('Dashboard');
  const [patients, setPatients] = useState([]);
  const [appointments] = useState([]);
  const [encounters, setEncounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isAddPatientOpen, setAddPatientOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [encounterSearch, setEncounterSearch] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [preselectedPatientId, setPreselectedPatientId] = useState('');
  const [toast, setToast] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const selectedPatient = useMemo(() => patients.find((patient) => patient.id === selectedPatientId), [patients, selectedPatientId]);
  const navTo = (page) => { if (page !== 'Case Taking') setPreselectedPatientId(''); setActivePage(page); setSelectedPatientId(null); setMobileNavOpen(false); };
  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(''), 3200); };

  useEffect(() => {
    let active = true;

    async function loadRecords() {
      setLoading(true);
      try {
        const [patientRecords, encounterRecords] = await Promise.all([
          getPatients(),
          getEncounters(),
        ]);
        if (!active) return;
        const mappedPatients = patientRecords.map(mapPatient);
        setPatients(mappedPatients);
        setEncounters(encounterRecords.map((record) => mapEncounter(record, mappedPatients)));
        setLoadError('');
      } catch (error) {
        if (active) {
          setLoadError(error.message || 'Could not connect to the CaseFlow API.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRecords();
    return () => { active = false; };
  }, []);

  const addPatient = async (form) => {
    try {
      const record = await createPatient({
        fullName: form.fullName,
        dateOfBirth: form.dateOfBirth || null,
        age: form.age ?? null,
        gender: form.gender || 'Prefer not to say',
        phone: form.phone || '',
        email: form.email || '',
        bloodGroup: form.bloodGroup || '',
        status: 'Active',
      });
      const newPatient = mapPatient(record);
      setPatients((current) => [newPatient, ...current]);
      setAddPatientOpen(false);
      setPatientSearch('');
      setSelectedPatientId(newPatient.id);
      setActivePage('Patients');
      setLoadError('');
      notify(newPatient.fullName + ' added to patient records.');
    } catch (error) {
      notify('Could not add patient: ' + (error.message || 'API request failed.'));
    }
  };

  const saveCase = async (form) => {
    const patient = patients.find((item) => item.id === form.patientId);
    if (!patient?.mongoId) {
      notify('Select a valid patient before saving the case.');
      return;
    }

    try {
      const record = await createEncounter({
        patientId: patient.mongoId,
        visitDate: new Date().toISOString(),
        chiefComplaint: form.chiefComplaint.trim(),
        duration: form.duration || '',
        history: form.history || '',
        medicalHistory: form.medicalHistory || '',
        allergies: form.allergies || '',
        medications: form.medications || '',
        vitals: {
          bloodPressure: form.bloodPressure || '',
          pulse: form.pulse || '',
          temperature: form.temperature || '',
          respiratoryRate: form.respiratoryRate || '',
          weight: form.weight || '',
        },
        examination: form.examination || '',
        assessment: form.assessment || '',
        plan: form.plan || '',
        followUpDate: form.followUpDate || null,
      });
      const newEncounter = mapEncounter(record, patients);
      const dateLabel = newEncounter.date || formatRecordDate(new Date());
      setEncounters((current) => [newEncounter, ...current]);
      setPatients((current) => current.map((item) => item.id === patient.id
        ? {
            ...item,
            lastVisit: dateLabel,
            chiefComplaint: form.chiefComplaint,
            status: form.followUpDate ? 'Follow-up' : item.status,
          }
        : item));
      setPreselectedPatientId('');
      setActivePage('Consultations');
      setLoadError('');
      notify('Case ' + newEncounter.id + ' saved for ' + newEncounter.patientName + '.');
    } catch (error) {
      notify('Could not save case: ' + (error.message || 'API request failed.'));
    }
  };

  const openPatient = (patientId) => { setSelectedPatientId(patientId); setActivePage('Patients'); setPatientSearch(''); };
  const openNewCaseForPatient = (patientId) => { setPreselectedPatientId(patientId); setSelectedPatientId(null); setActivePage('Case Taking'); };
  const runGlobalSearch = (query, target = 'Patients') => {
    if (target === 'Consultations') {
      setEncounterSearch(query);
      setActivePage('Consultations');
    } else {
      setPatientSearch(query);
      setActivePage('Patients');
    }
    setSelectedPatientId(null);
    setGlobalSearch('');
  };

  return (
    <div className={`app-shell ${collapsed ? 'app-shell-collapsed' : ''}`}>
      {mobileNavOpen && <button className="mobile-nav-backdrop" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation" />}
      <div className={`sidebar-wrap ${mobileNavOpen ? 'mobile-nav-visible' : ''}`}><Sidebar activePage={activePage} setActivePage={navTo} collapsed={collapsed} setCollapsed={setCollapsed} patientsCount={patients.length} followupsCount={encounters.filter((encounter) => encounter.followUpDate).length} /></div>
      <div className="main-column">
        <Topbar globalSearch={globalSearch} setGlobalSearch={setGlobalSearch} onSearchResult={runGlobalSearch} onMobileMenu={() => setMobileNavOpen(true)} activePage={selectedPatient ? 'Patient profile' : activePage} />
        <main className="main-content">
          {loading && <div className="demo-notice" role="status">Loading patient records from CaseFlow...</div>}
          {loadError && <div className="demo-notice" role="alert"><strong>Could not load records.</strong> {loadError} Start the API server and check the MongoDB connection, then refresh.</div>}
          {activePage === 'Dashboard' && <Dashboard patients={patients} appointments={appointments} encounters={encounters} onAddPatient={() => setAddPatientOpen(true)} onGo={navTo} onOpenPatient={openPatient} />}
          {activePage === 'Patients' && (selectedPatientId ? <PatientDetail patient={selectedPatient} encounters={encounters} onBack={() => setSelectedPatientId(null)} onNewCase={openNewCaseForPatient} /> : <PatientsPage patients={patients} search={patientSearch} setSearch={setPatientSearch} onAddPatient={() => setAddPatientOpen(true)} onSelectPatient={openPatient} />)}
          {activePage === 'Case Taking' && <CaseTakingPage key={preselectedPatientId || 'new-case'} patients={patients} onSaveCase={saveCase} preselectedPatientId={preselectedPatientId} />}
          {activePage === 'Consultations' && <ConsultationsPage encounters={encounters} search={encounterSearch} setSearch={setEncounterSearch} onGo={navTo} />}
          {activePage === 'Follow-ups' && <FollowUpsPage encounters={encounters} onGo={navTo} />}
          {activePage === 'Settings' && <SettingsPage />}
          <footer className="app-footer"><span>© 2026 CaseFlow</span><span><span className="footer-status-dot" /> Demo environment</span><span>Built for a student clinical workflow project</span></footer>
        </main>
      </div>
      {isAddPatientOpen && <AddPatientModal onClose={() => setAddPatientOpen(false)} onSave={addPatient} />}
      {toast && <div className="toast-message" role="status"><span className="toast-check"><Check size={15} /></span>{toast}<button onClick={() => setToast('')} aria-label="Dismiss notification"><X size={14} /></button></div>}
    </div>
  );
}

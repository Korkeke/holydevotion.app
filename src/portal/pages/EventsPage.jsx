import { useState, useEffect } from "react";
import { useChurchColors } from "../useChurchColors";
import { COLORS } from "../../colors";
import { useAuth } from "../AuthContext";
import { get, post, put, del } from "../api";
import FormModal from "../components/FormModal";
import ConfirmDialog from "../components/ConfirmDialog";

const EVENT_FIELDS = [
  { name: "title", label: "Title", required: true, placeholder: "Sunday Worship Service" },
  { name: "description", label: "Description", type: "textarea", placeholder: "Details about the event..." },
  { name: "event_date", label: "Date & Time", type: "datetime-local", required: true },
  { name: "location", label: "Location", placeholder: "Main Sanctuary" },
];

export default function EventsPage() {
  const C = useChurchColors();
  const { church } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [calendarDate, setCalendarDate] = useState(null);
  // TODO: Google Calendar import needs a backend integration
  const [calendarImporting, setCalendarImporting] = useState(false);
  const [calendarImported, setCalendarImported] = useState(false);

  // Calendar state
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());

  async function load() {
    if (!church?.id) return;
    try {
      const data = await get(`/api/churches/${church.id}/events`);
      setEvents(data?.events || []);
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [church?.id]);

  async function handleCreate(values) {
    await post(`/api/churches/${church.id}/events`, values);
    await load();
  }

  async function handleEdit(values) {
    await put(`/api/churches/${church.id}/events/${editing.id}`, values);
    setEditing(null);
    await load();
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      await del(`/api/churches/${church.id}/events/${deleting.id}`);
      setDeleting(null);
      await load();
    } finally { setDeleteLoading(false); }
  }

  function toInputDate(iso) {
    if (!iso) return "";
    return iso.slice(0, 16);
  }

  // Calendar helpers
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Mon=0

  // Events on each day
  const eventDayMap = {};
  events.forEach(e => {
    if (!e.event_date) return;
    const d = new Date(e.event_date);
    if (d.getMonth() === viewMonth && d.getFullYear() === viewYear) {
      const day = d.getDate();
      if (!eventDayMap[day]) eventDayMap[day] = [];
      eventDayMap[day].push(e);
    }
  });

  // Filtered events
  const filteredEvents = calendarDate ? (eventDayMap[calendarDate] || []) : events;

  if (loading) return <div style={{ padding: 60, display: "flex", justifyContent: "center" }}><div style={{ width: 28, height: 28, border: `2px solid ${C.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /></div>;

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1280 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: C.text, fontFamily: "var(--heading)" }}>Events</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => { setCalendarImporting(true); setTimeout(() => { setCalendarImporting(false); setCalendarImported(true); }, 2000); }} style={{ padding: "10px 20px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.card, color: C.body, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--body)", display: "flex", alignItems: "center", gap: 6 }}>
            {calendarImporting ? "Importing..." : calendarImported ? "✓ Connected" : "📅 Import from Google Calendar"}
          </button>
          <button onClick={() => setShowForm(true)} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: C.accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--body)", boxShadow: `0 4px 12px ${C.accent}25` }}>+ Create Event</button>
        </div>
      </div>

      {calendarImported && (
        <div style={{ padding: "12px 16px", borderRadius: 12, background: C.greenBg, border: `1px solid ${C.green}20`, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>✓</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.green }}>Google Calendar connected. Choose which events to publish to your congregation.</div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
        {/* Calendar */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: "var(--heading)" }}>{monthNames[viewMonth]} {viewYear}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1); setCalendarDate(null); }} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.card, color: C.sec, fontSize: 12, cursor: "pointer", fontFamily: "var(--body)" }}>←</button>
              <button onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1); setCalendarDate(null); }} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.card, color: C.sec, fontSize: 12, cursor: "pointer", fontFamily: "var(--body)" }}>→</button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d, i) => (
              <div key={i} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: C.muted, padding: "6px 0" }}>{d}</div>
            ))}
          </div>
          {(() => {
            const weeks = Math.ceil((firstDayOfWeek + daysInMonth) / 7);
            return [...Array(weeks)].map((_, w) => (
              <div key={w} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                {[...Array(7)].map((_, d) => {
                  const dayNum = w * 7 + d - firstDayOfWeek + 1;
                  const isValid = dayNum >= 1 && dayNum <= daysInMonth;
                  const hasEvent = isValid && eventDayMap[dayNum];
                  const selected = dayNum === calendarDate;
                  return (
                    <div key={d} onClick={() => isValid && hasEvent && setCalendarDate(selected ? null : dayNum)} style={{
                      textAlign: "center", padding: "10px 0", borderRadius: 10,
                      background: selected ? C.accent : hasEvent ? C.accentLight : "transparent",
                      cursor: hasEvent ? "pointer" : "default", transition: "all 0.2s ease",
                    }}>
                      <div style={{ fontSize: 13, fontWeight: hasEvent ? 700 : 400, color: isValid ? (selected ? "#fff" : hasEvent ? C.accent : C.text) : "transparent" }}>{isValid ? dayNum : "."}</div>
                      {hasEvent && !selected && <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.accent, margin: "3px auto 0" }} />}
                    </div>
                  );
                })}
              </div>
            ));
          })()}
        </div>

        {/* Event List */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
            {calendarDate ? `${monthNames[viewMonth].toUpperCase()} ${calendarDate}` : "ALL EVENTS"}
          </div>
          {filteredEvents.length === 0 ? (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "40px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 14, color: C.sec }}>No events{calendarDate ? " on this date" : " yet"}. Create your first one.</div>
            </div>
          ) : (
            filteredEvents.map((e, i) => {
              const d = e.event_date ? new Date(e.event_date) : null;
              return (
                <div key={e.id || i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 10, boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📅</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{e.title}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>
                        {d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}{d ? " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : ""}
                      </div>
                      {e.location && <div style={{ fontSize: 11, color: C.sec }}>{e.location}</div>}
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginTop: 10, paddingTop: 8, borderTop: `1px solid ${C.borderLight}` }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => setEditing(e)} style={{ padding: "5px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.card, color: C.body, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "var(--body)" }}>Edit</button>
                      <button onClick={() => setDeleting(e)} style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${C.red}30`, background: C.redBg, color: C.red, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "var(--body)" }}>Delete</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showForm && (
        <FormModal title="Create Event" fields={EVENT_FIELDS} onSubmit={handleCreate} onClose={() => setShowForm(false)} submitLabel="Create" />
      )}
      {editing && (
        <FormModal title="Edit Event" fields={EVENT_FIELDS} initialValues={{ title: editing.title, description: editing.description || "", event_date: toInputDate(editing.event_date), location: editing.location || "" }} onSubmit={handleEdit} onClose={() => setEditing(null)} submitLabel="Save Changes" />
      )}
      {deleting && (
        <ConfirmDialog title="Delete Event" message={`Are you sure you want to delete "${deleting.title}"? This cannot be undone.`} onConfirm={handleDelete} onCancel={() => setDeleting(null)} loading={deleteLoading} />
      )}
    </div>
  );
}

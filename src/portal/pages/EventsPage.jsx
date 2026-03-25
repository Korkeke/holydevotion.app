import { useState, useEffect } from "react";
import { useChurchColors } from "../useChurchColors";
import { useAuth } from "../AuthContext";
import { get, post, put, del } from "../api";
import FormModal from "../components/FormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import SectionLabel from "../components/ui/SectionLabel";

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

  // Event color palette for accent bars
  const eventColors = ["#3d6b44", "#8b6914", "#c26a4a", "#5b7a9d", "#8b5e83"];

  if (loading) return (
    <div style={{ padding: 60, display: "flex", justifyContent: "center" }}>
      <div style={{
        width: 28, height: 28,
        border: "2px solid #3d6b44",
        borderTopColor: "transparent",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
    </div>
  );

  return (
    <div style={{ padding: "24px 32px 48px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: "#2c2a25", fontFamily: "'DM Serif Display', serif" }}>Events</div>
        <Button primary onClick={() => setShowForm(true)}>+ New Event</Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>
        {/* Calendar Card */}
        <Card style={{ padding: 24 }}>
          {/* Month navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#2c2a25", fontFamily: "'DM Serif Display', serif" }}>
              {monthNames[viewMonth]} {viewYear}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1); setCalendarDate(null); }}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: "1px solid #e0dbd1", background: "#fff",
                  color: "#5a5647", fontSize: 14, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}
              >
                &#8592;
              </button>
              <button
                onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1); setCalendarDate(null); }}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: "1px solid #e0dbd1", background: "#fff",
                  color: "#5a5647", fontSize: 14, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}
              >
                &#8594;
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d, i) => (
              <div key={i} style={{
                textAlign: "center", fontSize: 11, fontWeight: 600,
                color: "#9e9888", padding: "6px 0", textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          {(() => {
            const weeks = Math.ceil((firstDayOfWeek + daysInMonth) / 7);
            return [...Array(weeks)].map((_, w) => (
              <div key={w} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                {[...Array(7)].map((_, d) => {
                  const dayNum = w * 7 + d - firstDayOfWeek + 1;
                  const isValid = dayNum >= 1 && dayNum <= daysInMonth;
                  const hasEvent = isValid && eventDayMap[dayNum];
                  const selected = dayNum === calendarDate;
                  const isToday = isValid && dayNum === now.getDate() && viewMonth === now.getMonth() && viewYear === now.getFullYear();
                  return (
                    <div
                      key={d}
                      onClick={() => isValid && hasEvent && setCalendarDate(selected ? null : dayNum)}
                      style={{
                        textAlign: "center", padding: "8px 0", borderRadius: 10,
                        background: selected ? C.accent : "transparent",
                        cursor: hasEvent ? "pointer" : "default",
                        transition: "all 0.2s ease",
                        position: "relative",
                      }}
                    >
                      <div style={{
                        width: isToday && !selected ? 30 : "auto",
                        height: isToday && !selected ? 30 : "auto",
                        borderRadius: "50%",
                        background: isToday && !selected ? "#3d6b44" : "transparent",
                        color: isValid
                          ? (selected ? "#fff" : isToday ? "#fff" : hasEvent ? "#2c2a25" : "#5a5647")
                          : "transparent",
                        fontSize: 13,
                        fontWeight: hasEvent || isToday ? 700 : 400,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto",
                        lineHeight: isToday && !selected ? "30px" : "normal",
                      }}>
                        {isValid ? dayNum : "."}
                      </div>
                      {hasEvent && !selected && (
                        <div style={{ display: "flex", gap: 3, justifyContent: "center", marginTop: 3 }}>
                          {eventDayMap[dayNum].slice(0, 3).map((_, idx) => (
                            <div key={idx} style={{
                              width: 5, height: 5, borderRadius: "50%",
                              background: eventColors[idx % eventColors.length],
                            }} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ));
          })()}
        </Card>

        {/* Event List Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <SectionLabel
            right={calendarDate ? "Show All" : undefined}
            onRightClick={calendarDate ? () => setCalendarDate(null) : undefined}
          >
            {calendarDate ? `${monthNames[viewMonth]} ${calendarDate}` : "Upcoming Events"}
          </SectionLabel>

          {filteredEvents.length === 0 ? (
            <Card style={{ padding: "36px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📅</div>
              <div style={{ fontSize: 14, color: "#7a7668", lineHeight: 1.5 }}>
                No events{calendarDate ? " on this date" : " yet"}.
              </div>
              <div style={{ fontSize: 13, color: "#9e9888", marginTop: 4 }}>
                Create your first event to get started.
              </div>
            </Card>
          ) : (
            filteredEvents.map((e, i) => {
              const d = e.event_date ? new Date(e.event_date) : null;
              const accentColor = eventColors[i % eventColors.length];
              return (
                <Card key={e.id || i} style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ display: "flex" }}>
                    {/* Color accent bar */}
                    <div style={{ width: 4, background: accentColor, flexShrink: 0 }} />
                    <div style={{ flex: 1, padding: 16 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#2c2a25", marginBottom: 6 }}>
                        {e.title}
                      </div>
                      {d && (
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#7a7668", marginBottom: 4 }}>
                          <span style={{ fontSize: 13 }}>&#128339;</span>
                          {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          {" \u00B7 "}
                          {d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </div>
                      )}
                      {e.location && (
                        <div style={{ fontSize: 12, color: "#9e9888" }}>{e.location}</div>
                      )}
                      <div style={{ display: "flex", gap: 6, marginTop: 10, paddingTop: 10, borderTop: "1px solid #f0ece4" }}>
                        <Button small onClick={() => setEditing(e)}>Edit</Button>
                        <Button small danger onClick={() => setDeleting(e)}>Delete</Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}

          {/* Tip card */}
          <Card style={{ padding: 16, background: "#f9f7f2", border: "1px solid #ece7dd" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>&#128276;</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#5a5647", marginBottom: 3 }}>
                  Push Notifications
                </div>
                <div style={{ fontSize: 12, color: "#9e9888", lineHeight: 1.5 }}>
                  Members who enable notifications will receive reminders before events start.
                </div>
              </div>
            </div>
          </Card>
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

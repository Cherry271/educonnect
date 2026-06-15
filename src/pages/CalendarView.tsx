import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Clock, Plus, Tag, X } from "lucide-react";
import { eventsApi } from "../api/client";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  event_type: string; // exam, deadline, activity, event
  reference_id?: string;
  created_by: string;
}

export default function CalendarView() {
  const { user } = useAuthStore();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [eventType, setEventType] = useState("event");
  const [referenceId, setReferenceId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Filter State
  const [filterType, setFilterType] = useState<string>("all");

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const response = await eventsApi.list();
      setEvents(response.data?.items ?? []);
    } catch (e) {
      console.error("Failed to load events", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startTime || !endTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    try {
      await eventsApi.create({
        title,
        description,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        event_type: eventType,
        reference_id: referenceId || undefined,
      });
      toast.success("Event created successfully!");
      setIsModalOpen(false);
      // Reset form
      setTitle("");
      setDescription("");
      setStartTime("");
      setEndTime("");
      setEventType("event");
      setReferenceId("");
      loadEvents();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create calendar event");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await eventsApi.delete(eventId);
      toast.success("Event deleted successfully");
      loadEvents();
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete event");
    }
  };

  // Helper to render calendar days
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    return { firstDay, totalDays };
  };

  const { firstDay, totalDays } = getDaysInMonth(currentDate);
  const blanks = Array(firstDay).fill(null);
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);
  const calendarDays = [...blanks, ...days];

  const getEventsForDay = (day: number) => {
    if (!day) return [];
    return events.filter((e) => {
      const eDate = new Date(e.start_time);
      return (
        eDate.getDate() === day &&
        eDate.getMonth() === currentDate.getMonth() &&
        eDate.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "exam":
        return "bg-rose-500/20 text-rose-400 border-rose-500/30";
      case "deadline":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "activity":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    }
  };

  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case "exam":
        return "bg-rose-500 text-white";
      case "deadline":
        return "bg-amber-500 text-dark-bg";
      case "activity":
        return "bg-blue-500 text-white";
      default:
        return "bg-emerald-500 text-dark-bg";
    }
  };

  const isTeacherOrAdmin = user?.role === "teacher" || user?.role === "admin";

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const filteredEvents = filterType === "all" 
    ? events 
    : events.filter(e => e.event_type === filterType);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-900/50 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <CalendarIcon size={24} className="text-primary-400" />
            Academic Calendar
          </h1>
          <p className="text-gray-400 text-xs mt-1">
            Keep track of class activities, exams, assignment deadlines, and events.
          </p>
        </div>
        
        <div className="flex gap-2">
          {isTeacherOrAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-primary-400 hover:bg-primary-300 text-dark-bg font-bold px-4 py-2 rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/5"
            >
              <Plus size={14} />
              Add Event
            </button>
          )}
        </div>
      </div>

      {/* Grid: Calendar + Event List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid (Col Span 2) */}
        <div className="lg:col-span-2 bg-[#161616] border border-gray-900 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-white font-bold text-base select-none">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex gap-1.5">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg bg-[#202221] hover:bg-[#2e3230] text-gray-400 hover:text-white transition-colors cursor-pointer border border-gray-800"
              >
                &lt;
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg bg-[#202221] hover:bg-[#2e3230] text-gray-400 hover:text-white transition-colors cursor-pointer border border-gray-800"
              >
                &gt;
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] uppercase tracking-wider text-gray-500 mb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((day, idx) => {
              const dayEvents = getEventsForDay(day);
              const isToday =
                day === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear();

              return (
                <div
                  key={idx}
                  className={`min-h-[90px] rounded-xl border border-gray-900/60 bg-[#1a1d1b]/40 p-1.5 flex flex-col justify-between ${
                    day ? "" : "opacity-10"
                  } ${isToday ? "border-primary-400 bg-primary-400/5" : ""}`}
                >
                  <span
                    className={`text-xs font-bold ${
                      day ? (isToday ? "text-primary-400" : "text-gray-300") : "text-transparent"
                    }`}
                  >
                    {day}
                  </span>
                  
                  <div className="space-y-1 mt-1 flex-1 overflow-y-auto max-h-[60px] scrollbar-thin">
                    {dayEvents.slice(0, 3).map((e) => (
                      <div
                        key={e.id}
                        title={e.title}
                        className={`text-[8px] font-bold px-1.5 py-0.5 rounded border truncate capitalize ${getEventTypeColor(
                          e.event_type,
                        )}`}
                      >
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[7px] text-gray-500 font-bold text-center">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Event List Widget */}
        <div className="bg-[#161616] border border-gray-900 rounded-2xl p-5 flex flex-col h-full space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-white font-bold text-sm tracking-wide">
              Event Schedule
            </h3>
            
            {/* Filter Dropdown */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-[#202221] border border-gray-800 text-[10px] text-gray-300 rounded-lg py-1 px-2 focus:outline-none font-bold capitalize cursor-pointer"
            >
              <option value="all">All Items</option>
              <option value="exam">Exams</option>
              <option value="deadline">Deadlines</option>
              <option value="activity">Activities</option>
              <option value="event">Events</option>
            </select>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[350px] pr-1 scrollbar-thin">
            {isLoading ? (
              <p className="text-xs text-gray-500 text-center py-4">Loading schedule...</p>
            ) : filteredEvents.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-8">No events scheduled.</p>
            ) : (
              filteredEvents.map((e) => (
                <div
                  key={e.id}
                  className="bg-[#1a1d1b] border border-gray-800 rounded-xl p-3.5 space-y-2 relative overflow-hidden group"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span
                      className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${getEventBadgeColor(
                        e.event_type,
                      )}`}
                    >
                      {e.event_type}
                    </span>
                    {isTeacherOrAdmin && (
                      <button
                        onClick={() => handleDeleteEvent(e.id)}
                        className="text-gray-500 hover:text-rose-400 transition-colors text-xs font-bold opacity-0 group-hover:opacity-100 cursor-pointer"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <h4 className="text-white font-bold text-xs truncate leading-snug">
                    {e.title}
                  </h4>
                  <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed">
                    {e.description}
                  </p>
                  
                  <div className="pt-2 border-t border-gray-900/40 flex flex-col gap-1 text-[9px] text-gray-500 font-semibold">
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(e.start_time).toLocaleDateString()} · {new Date(e.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {e.reference_id && (
                      <span className="flex items-center gap-1 capitalize">
                        <Tag size={10} />
                        Group: {e.reference_id}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* CREATE EVENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-[460px] bg-[#161616] border border-gray-800 rounded-3xl p-6 shadow-2xl relative space-y-4">
            <div className="flex justify-between items-center border-b border-gray-900/50 pb-3">
              <h3 className="text-white font-bold text-sm tracking-wide flex items-center gap-1.5">
                <CalendarIcon size={16} className="text-primary-400" />
                Add Calendar Event
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1 px-0.5">
                  Event Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Physics Midterm"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#202221] border border-gray-900 rounded-xl py-2.5 px-3 text-white focus:outline-none placeholder:text-gray-600 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1 px-0.5">
                  Description
                </label>
                <textarea
                  placeholder="Additional event details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#202221] border border-gray-900 rounded-xl py-2.5 px-3 text-white focus:outline-none placeholder:text-gray-600 transition-all resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1 px-0.5">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-[#202221] border border-gray-900 rounded-xl py-2.5 px-3 text-white focus:outline-none transition-all font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1 px-0.5">
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-[#202221] border border-gray-900 rounded-xl py-2.5 px-3 text-white focus:outline-none transition-all font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1 px-0.5">
                    Event Category
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full bg-[#202221] border border-gray-900 rounded-xl py-2.5 px-3 text-white focus:outline-none transition-all font-semibold cursor-pointer"
                  >
                    <option value="event">General Event</option>
                    <option value="exam">Exam / Quiz</option>
                    <option value="deadline">Deadline</option>
                    <option value="activity">Activity</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1 px-0.5">
                    Course / Group ID (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. physics-101"
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                    className="w-full bg-[#202221] border border-gray-900 rounded-xl py-2.5 px-3 text-white focus:outline-none placeholder:text-gray-600 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-primary-400 hover:bg-primary-300 text-dark-bg font-bold py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/5 mt-2"
              >
                {isSaving ? "Saving Event..." : "Save Event"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

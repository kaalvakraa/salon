"use client";

import Link from "next/link";
import { CalendarDays, Clock, History, PlusCircle, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { StylistBookingCard } from "@/components/bookings/stylist-booking-card";
import { ProtectedPage } from "@/components/layout/protected-page";
import { Notice } from "@/components/ui/notice";
import { apiRequest, todayInputValue } from "@/lib/api";
import type { Booking, Salon } from "@/types/api";

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export default function StylistDashboardPage() {
  return (
    <AppShell area="stylist">
      <ProtectedPage role="stylist">
        {({ token, user }) => <StylistDashboard token={token} email={user.email} />}
      </ProtectedPage>
    </AppShell>
  );
}

function StylistDashboard({ token, email }: { token: string; email: string }) {
  const [date, setDate] = useState(todayInputValue());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [weekBookings, setWeekBookings] = useState<Booking[]>([]);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      const weekEnd = addDays(date, 6);
      const [dayData, weekData] = await Promise.all([
        apiRequest<Booking[]>(`/stylist/me/schedule?date=${date}`, { token }),
        apiRequest<Booking[]>(`/stylist/me/booking-history?date_from=${date}&date_to=${weekEnd}`, { token }),
      ]);
      setBookings(dayData);
      setWeekBookings(weekData);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load your dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [date, token]);

  useEffect(() => {
    async function loadSalon() {
      try {
        const data = await apiRequest<Salon>("/stylist/me/salon", { token });
        setSalon(data);
      } catch {
        setSalon(null);
      }
    }
    loadSalon();
  }, [token]);

  return (
    <main className="page">
      <section className="section-header">
        <div>
          <span className="eyebrow">Stylist dashboard</span>
          <h1 className="page-title">Your workday</h1>
          {salon && <p className="lead">{salon.name}</p>}
          <p className="lead">{email}</p>
        </div>
        <div className="row">
          <div className="field">
            <label>Dashboard date</label>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </div>
          <Link className="button" href="/stylist/walk-in">
            Add walk-in
          </Link>
        </div>
      </section>
      {error && <Notice kind="error">{error}</Notice>}
      {loading && <div className="loading" role="status">Loading your day...</div>}
      <section className="stat-grid section">
        <div className="card stat-card">
          <span className="stat-icon">
            <CalendarDays />
          </span>
          <span className="stat-label">Selected day</span>
          <div className="metric">{bookings.length}</div>
          <span className="stat-hint">{bookings.length === 1 ? "appointment" : "appointments"}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-icon gold">
            <Clock />
          </span>
          <span className="stat-label">Next 7 days</span>
          <div className="metric">{weekBookings.length}</div>
          <span className="stat-hint">bookings this week</span>
        </div>
        <Link className="card stat-card stat-link" href="/stylist/walk-in">
          <span className="stat-icon moss">
            <PlusCircle />
          </span>
          <span className="stat-label">Walk-in</span>
          <div className="stat-cta">Add a walk-in</div>
          <span className="stat-hint">book a customer at the chair</span>
        </Link>
      </section>
      <section className="quick-actions" aria-label="Quick actions">
        <Link className="quick-action" href="/stylist/schedule">
          <CalendarDays /> Full schedule
        </Link>
        <Link className="quick-action" href="/stylist/history">
          <History /> Booking history
        </Link>
        <Link className="quick-action" href="/stylist/profile">
          <UserRound /> My profile
        </Link>
      </section>
      <section className="card stack section">
        <h2>Selected day appointments</h2>
        {bookings.length === 0 ? (
          <div className="empty">No appointments for this date.</div>
        ) : (
          bookings.map((booking) => <StylistBookingCard booking={booking} key={booking.id} onChanged={loadDashboard} token={token} />)
        )}
      </section>
      <section className="card stack section">
        <h2>Full week bookings</h2>
        <p className="muted">
          {date} to {addDays(date, 6)}
        </p>
        {weekBookings.length === 0 ? (
          <div className="empty">No bookings in this week.</div>
        ) : (
          weekBookings.map((booking) => (
            <div className="card" key={booking.id}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <strong>{booking.customer_name}</strong>
                <span className={`status-badge status-${booking.status}`}>{booking.status}</span>
              </div>
              <p>
                {booking.services && booking.services.length > 0
                  ? booking.services.map((s) => s.name).join(" + ")
                  : booking.service_name}
                , {new Date(booking.starts_at_utc).toLocaleString()}
              </p>
              <p className="muted">
                {booking.customer_phone}
                {booking.customer_email ? ` | ${booking.customer_email}` : ""}
              </p>
            </div>
          ))
        )}
      </section>
    </main>
  );
}

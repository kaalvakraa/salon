"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Clock, IndianRupee, PlusCircle, Scissors, Users } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedPage } from "@/components/layout/protected-page";
import { Notice } from "@/components/ui/notice";
import { apiRequest, formatCurrency, todayInputValue } from "@/lib/api";
import { useAdminSalon } from "@/lib/use-admin-salon";
import type { DashboardSummary } from "@/types/api";

export default function AdminDashboardPage() {
  return (
    <AppShell area="admin">
      <ProtectedPage role="admin">
        {({ token }) => <AdminDashboard token={token} />}
      </ProtectedPage>
    </AppShell>
  );
}

function AdminDashboard({ token }: { token: string }) {
  const [date, setDate] = useState(todayInputValue());
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { salon, salonId, loading: salonLoading, error: salonError } = useAdminSalon(token);

  useEffect(() => {
    async function loadSummary() {
      if (!salonId) return;
      setLoading(true);
      setError("");
      try {
        const data = await apiRequest<DashboardSummary>(
          `/dashboard/summary?salon_id=${salonId}&date=${date}&upcoming_limit=6`,
          { token },
        );
        setSummary(data);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not load dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, [date, salonId, token]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const isToday = date === todayInputValue();

  return (
    <main className="page">
      <section className="section-header">
        <div>
          <span className="eyebrow">Admin dashboard</span>
          <h1 className="page-title">{isToday ? `${greeting}.` : "Day overview"}</h1>
          <p className="lead">
            {salon ? `${salon.name} — ` : ""}
            {isToday ? "here is how today is shaping up." : `showing ${date}.`}
          </p>
        </div>
        <div className="field">
          <label htmlFor="dashboard-date">Dashboard date</label>
          <input
            id="dashboard-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
      </section>

      {(error || salonError) && <Notice kind="error">{error || salonError}</Notice>}
      {(loading || salonLoading) && (
        <div className="stat-grid" aria-busy="true" aria-label="Loading dashboard">
          {[0, 1, 2].map((i) => (
            <div className="skeleton skeleton-stat" key={i} />
          ))}
        </div>
      )}

      {summary && !loading && (
        <>
          <section className="stat-grid">
            <div className="card stat-card">
              <span className="stat-icon">
                <CalendarDays />
              </span>
              <span className="stat-label">Bookings</span>
              <div className="metric">{summary.metrics.today_bookings}</div>
              <span className="stat-hint">{isToday ? "on the books today" : "on this date"}</span>
            </div>
            <div className="card stat-card">
              <span className="stat-icon gold">
                <IndianRupee />
              </span>
              <span className="stat-label">Revenue</span>
              <div className="metric">{formatCurrency(summary.metrics.today_revenue)}</div>
              <span className="stat-hint">from paid bookings</span>
            </div>
            <div className="card stat-card">
              <span className="stat-icon moss">
                <Clock />
              </span>
              <span className="stat-label">Upcoming</span>
              <div className="metric">{summary.metrics.upcoming_bookings}</div>
              <span className="stat-hint">still to come</span>
            </div>
          </section>

          <section className="quick-actions" aria-label="Quick actions">
            <Link className="quick-action" href="/admin/bookings">
              <CalendarDays /> View all bookings
            </Link>
            <Link className="quick-action" href="/admin/services">
              <Scissors /> Manage services
            </Link>
            <Link className="quick-action" href="/admin/stylists">
              <Users /> Manage stylists
            </Link>
            <Link className="quick-action" href="/customer/booking">
              <PlusCircle /> New booking
            </Link>
          </section>

          <section className="grid grid-2 section">
            <div className="card stack">
              <div className="panel-head">
                <h2>Upcoming appointments</h2>
                <Link className="panel-link" href="/admin/bookings">
                  See all
                </Link>
              </div>
              {summary.upcoming_appointments.length === 0 ? (
                <div className="empty">
                  Nothing coming up. New bookings will show here as they come in.
                </div>
              ) : (
                summary.upcoming_appointments.map((booking) => {
                  const when = new Date(booking.starts_at_utc);
                  return (
                    <Link
                      className="appt-row"
                      href={`/admin/bookings?date_from=${booking.local_date}&date_to=${booking.local_date}`}
                      key={booking.id}
                    >
                      <span className="appt-time">
                        <strong>
                          {when.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                        </strong>
                        <small>{when.toLocaleDateString([], { day: "numeric", month: "short" })}</small>
                      </span>
                      <span className="appt-body">
                        <strong>{booking.customer_name}</strong>
                        <span>
                          {booking.services && booking.services.length > 0
                            ? booking.services.map((s) => s.name).join(" + ")
                            : booking.service_name}{" "}
                          with {booking.stylist_name}
                        </span>
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
            <div className="card stack">
              <div className="panel-head">
                <h2>Stylist utilization</h2>
              </div>
              {summary.stylist_utilization.length === 0 ? (
                <div className="empty">Add stylists and availability to see utilization.</div>
              ) : (
                summary.stylist_utilization.map((item) => {
                  const pct = Math.max(0, Math.min(100, Math.round(item.utilization_percent)));
                  return (
                    <div className="util-row" key={item.stylist_id}>
                      <div className="util-head">
                        <strong>{item.stylist_name}</strong>
                        <span className="pill">{pct}%</span>
                      </div>
                      <div
                        className="progress"
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${item.stylist_name} utilization`}
                      >
                        <span style={{ width: `${pct}%` }} />
                      </div>
                      <p className="muted">
                        {item.booked_minutes} of {item.available_minutes} minutes booked
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

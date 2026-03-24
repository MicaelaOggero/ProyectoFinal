"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Home,
  Bell,
  LogOut,
  FolderOpen,
  Users,
  Clock,
  CheckCircle2,
  TrendingUp,
  MoreHorizontal,
  Plus,
  Search,
  ChevronRight,
} from "lucide-react"

export function Dashboard({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary-foreground">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
                </svg>
              </div>
              <span className="text-base font-semibold tracking-tight text-card-foreground">Smart Assistant</span>
            </div>
            <nav className="hidden md:flex items-center gap-1 ml-6">
              <Button variant="ghost" size="sm" className="text-card-foreground gap-2 bg-muted rounded-lg">
                <Home className="h-4 w-4" />
                Inicio
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground gap-2 rounded-lg hover:text-card-foreground">
                <FolderOpen className="h-4 w-4" />
                Proyectos
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground gap-2 rounded-lg hover:text-card-foreground">
                <Users className="h-4 w-4" />
                Equipo
              </Button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative rounded-lg text-muted-foreground hover:text-card-foreground">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="relative rounded-lg text-muted-foreground hover:text-card-foreground">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
            </Button>
            <div className="hidden md:flex items-center gap-3 ml-1 pl-3 border-l border-border">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">CG</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium leading-none text-card-foreground">Carlos Gomez</span>
                <span className="text-xs text-muted-foreground mt-0.5">Admin</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onLogout}
              className="rounded-lg text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Panel de control</p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground text-balance">
              Bienvenido, Carlos
            </h1>
            <p className="text-muted-foreground mt-1">Aqui tienes un resumen de tu actividad reciente.</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 rounded-xl h-10 px-5 w-fit">
            <Plus className="h-4 w-4" />
            Nuevo proyecto
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<FolderOpen className="h-5 w-5" />}
            label="Proyectos activos"
            value="8"
            change="+2 este mes"
            trend="up"
            color="primary"
          />
          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="Desarrolladores"
            value="22"
            change="+3 este mes"
            trend="up"
            color="accent"
          />
          <StatCard
            icon={<Clock className="h-5 w-5" />}
            label="Horas trabajadas"
            value="45h 16m"
            change="0h disponibles"
            trend="neutral"
            color="warning"
          />
          <StatCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            label="Tareas completadas"
            value="12"
            change="85% tasa de exito"
            trend="up"
            color="success"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Projects */}
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-card-foreground">Proyectos activos</h2>
                <p className="text-sm text-muted-foreground">Progreso de tus proyectos recientes</p>
              </div>
              <Button variant="ghost" size="sm" className="text-primary gap-1 hover:text-primary/80">
                Ver todos
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <ProjectRow name="App Mobile v2.0" team="Frontend" progress={72} status="En progreso" />
              <ProjectRow name="API Gateway" team="Backend" progress={45} status="En progreso" />
              <ProjectRow name="Dashboard Analytics" team="Full Stack" progress={90} status="Revision" />
              <ProjectRow name="Auth Microservice" team="Backend" progress={30} status="En progreso" />
            </div>
          </div>

          {/* Activity Feed */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-card-foreground">Actividad reciente</h2>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-5">
              <ActivityItem
                initials="MR"
                name="Maria Rodriguez"
                action="completo la tarea"
                target="Diseno de login"
                time="Hace 2h"
              />
              <ActivityItem
                initials="JP"
                name="Juan Perez"
                action="subio un commit a"
                target="API Gateway"
                time="Hace 4h"
              />
              <ActivityItem
                initials="AL"
                name="Ana Lopez"
                action="creo el proyecto"
                target="Auth Microservice"
                time="Hace 6h"
              />
              <ActivityItem
                initials="CG"
                name="Carlos Gomez"
                action="aprobo la revision de"
                target="Dashboard v1"
                time="Ayer"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  change,
  trend,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  change: string
  trend: "up" | "neutral"
  color: "primary" | "accent" | "warning" | "success"
}) {
  const colorMap = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
    warning: "bg-chart-3/10 text-chart-3",
    success: "bg-accent/10 text-accent",
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorMap[color]}`}>
          {icon}
        </div>
        {trend === "up" && <TrendingUp className="h-4 w-4 text-accent" />}
      </div>
      <p className="text-2xl font-bold tracking-tight text-card-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
      <p className="text-xs text-muted-foreground mt-2">{change}</p>
    </div>
  )
}

function ProjectRow({
  name,
  team,
  progress,
  status,
}: {
  name: string
  team: string
  progress: number
  status: string
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-muted/50 p-4 transition-colors hover:bg-muted">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-semibold text-card-foreground truncate">{name}</p>
          <Badge variant="secondary" className="text-xs font-medium shrink-0 bg-secondary text-secondary-foreground">
            {team}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <Progress value={progress} className="h-1.5 flex-1 bg-muted [&>div]:bg-primary" />
          <span className="text-xs font-medium text-muted-foreground shrink-0">{progress}%</span>
        </div>
      </div>
      <Badge
        variant="outline"
        className={`shrink-0 text-xs font-medium border-border ${
          status === "Revision"
            ? "bg-chart-3/10 text-chart-3 border-chart-3/30"
            : "bg-primary/10 text-primary border-primary/30"
        }`}
      >
        {status}
      </Badge>
    </div>
  )
}

function ActivityItem({
  initials,
  name,
  action,
  target,
  time,
}: {
  initials: string
  name: string
  action: string
  target: string
  time: string
}) {
  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-relaxed text-card-foreground">
          <span className="font-medium">{name}</span>{" "}
          <span className="text-muted-foreground">{action}</span>{" "}
          <span className="font-medium text-primary">{target}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{time}</p>
      </div>
    </div>
  )
}

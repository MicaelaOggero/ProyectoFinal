"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from "lucide-react"

export function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,oklch(0.55_0.18_255/0.4),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,oklch(0.62_0.20_160/0.3),transparent_60%)]" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/15 backdrop-blur-sm">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary-foreground">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
              </svg>
            </div>
            <span className="text-lg font-semibold tracking-tight">Smart Assistant</span>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-balance">
              Gestiona tus proyectos de forma inteligente
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-primary-foreground/80">
              Controla equipos, tareas y tiempos en una sola plataforma. 
              Haz mas con menos esfuerzo.
            </p>
            <div className="mt-8 flex gap-6">
              <div>
                <p className="text-3xl font-bold">+500</p>
                <p className="text-sm text-primary-foreground/70">Proyectos activos</p>
              </div>
              <div className="h-12 w-px bg-primary-foreground/20" />
              <div>
                <p className="text-3xl font-bold">98%</p>
                <p className="text-sm text-primary-foreground/70">Satisfaccion</p>
              </div>
              <div className="h-12 w-px bg-primary-foreground/20" />
              <div>
                <p className="text-3xl font-bold">24/7</p>
                <p className="text-sm text-primary-foreground/70">Soporte</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-primary-foreground/50">
            Smart Assistant 2026. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2 bg-card">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary-foreground">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
            </svg>
          </div>
          <span className="text-lg font-semibold text-card-foreground">Smart Assistant</span>
        </div>

        <div className="w-full max-w-[400px]">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted h-12 rounded-xl p-1">
              <TabsTrigger
                value="login"
                className="rounded-lg text-sm font-medium data-[state=active]:bg-card data-[state=active]:text-card-foreground data-[state=active]:shadow-sm"
              >
                Iniciar Sesion
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="rounded-lg text-sm font-medium data-[state=active]:bg-card data-[state=active]:text-card-foreground data-[state=active]:shadow-sm"
              >
                Registrarse
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-8">
              <div className="space-y-2 mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-card-foreground">Bienvenido de nuevo</h2>
                <p className="text-sm text-muted-foreground">Ingresa tus credenciales para acceder a tu cuenta</p>
              </div>

              <Button
                variant="outline"
                className="w-full h-12 rounded-xl border-border bg-card text-card-foreground hover:bg-muted font-medium gap-3"
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuar con Google
              </Button>

              <div className="relative my-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                  o continua con email
                </span>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  onLogin()
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-card-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 rounded-xl pl-10 bg-muted/50 border-border text-card-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium text-card-foreground">Contrasena</Label>
                    <button type="button" className="text-xs text-primary hover:underline font-medium">
                      Olvidaste tu contrasena?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Tu contrasena"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 rounded-xl pl-10 pr-10 bg-muted/50 border-border text-card-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-card-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm gap-2 mt-2"
                >
                  Iniciar Sesion
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-8">
              <div className="space-y-2 mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-card-foreground">Crea tu cuenta</h2>
                <p className="text-sm text-muted-foreground">Registrate para comenzar a gestionar tus proyectos</p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  onLogin()
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="reg-name" className="text-sm font-medium text-card-foreground">Nombre completo</Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-name"
                      type="text"
                      placeholder="Carlos Gomez"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12 rounded-xl pl-10 bg-muted/50 border-border text-card-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-sm font-medium text-card-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="tu@email.com"
                      className="h-12 rounded-xl pl-10 bg-muted/50 border-border text-card-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-password" className="text-sm font-medium text-card-foreground">Contrasena</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="Minimo 8 caracteres"
                      className="h-12 rounded-xl pl-10 bg-muted/50 border-border text-card-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm gap-2 mt-2"
                >
                  Crear cuenta
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

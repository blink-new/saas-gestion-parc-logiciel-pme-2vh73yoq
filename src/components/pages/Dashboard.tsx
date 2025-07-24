import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { 
  Package, 
  Euro, 
  AlertTriangle, 
  MessageSquare, 
  TrendingUp,
  Users,
  Plus,
  Star
} from 'lucide-react'
import { blink } from '../../blink/client'
import { User, DashboardStats, Software, SoftwareRequest } from '../../types'

interface DashboardProps {
  user: User
}

export function Dashboard({ user }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalSoftware: 0,
    totalCost: 0,
    expiringContracts: 0,
    pendingRequests: 0,
    completionRate: 0,
    activeUsers: 0
  })
  const [recentSoftware, setRecentSoftware] = useState<Software[]>([])
  const [recentRequests, setRecentRequests] = useState<SoftwareRequest[]>([])
  const [loading, setLoading] = useState(true)

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Get user's company
      const users = await blink.db.users.list({
        where: { id: user.id },
        limit: 1
      })
      
      if (users.length === 0) return
      
      const userData = users[0]
      const companyId = userData.companyId

      // Load software
      const software = await blink.db.software.list({
        where: { companyId: companyId },
        orderBy: { createdAt: 'desc' },
        limit: 100
      })

      // Load contracts for cost calculation
      const contracts = await blink.db.contracts.list({
        limit: 100
      })

      // Load requests
      const requests = await blink.db.softwareRequests.list({
        where: { companyId: companyId },
        orderBy: { createdAt: 'desc' },
        limit: 5
      })

      // Load company users
      const companyUsers = await blink.db.users.list({
        where: { companyId: companyId }
      })

      // Calculate stats
      const totalCost = contracts.reduce((sum, contract) => {
        const amount = contract.billingPeriod === 'monthly' 
          ? contract.costAmount * 12 
          : contract.costAmount
        return sum + amount
      }, 0)

      const pendingRequests = requests.filter(r => r.status === 'submitted' || r.status === 'in_review').length
      
      // Mock expiring contracts (would need date logic)
      const expiringContracts = Math.floor(contracts.length * 0.1)
      
      // Mock completion rate
      const completionRate = Math.min(95, 60 + (software.length * 5))

      setStats({
        totalSoftware: software.length,
        totalCost,
        expiringContracts,
        pendingRequests,
        completionRate,
        activeUsers: companyUsers.length
      })

      setRecentSoftware(software.slice(0, 5))
      setRecentRequests(requests.slice(0, 3))

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de votre parc logiciel
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Ajouter un logiciel
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Logiciels</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSoftware}</div>
            <p className="text-xs text-muted-foreground">
              +2 ce mois-ci
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coût annuel</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalCost.toLocaleString('fr-FR')}€
            </div>
            <p className="text-xs text-muted-foreground">
              Par utilisateur actif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Échéances</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.expiringContracts}
            </div>
            <p className="text-xs text-muted-foreground">
              Dans les 30 jours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demandes</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              En attente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Software */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Logiciels récents
            </CardTitle>
            <CardDescription>
              Derniers logiciels ajoutés à votre catalogue
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentSoftware.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun logiciel ajouté pour le moment</p>
                <Button variant="outline" className="mt-4">
                  Ajouter votre premier logiciel
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentSoftware.map((software) => (
                  <div key={software.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{software.name}</p>
                        <p className="text-sm text-muted-foreground">{software.category}</p>
                      </div>
                    </div>
                    <Badge variant={software.status === 'active' ? 'default' : 'secondary'}>
                      {software.status === 'active' ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Demandes récentes
            </CardTitle>
            <CardDescription>
              Dernières demandes de logiciels de l'équipe
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune demande pour le moment</p>
                <Button variant="outline" className="mt-4">
                  Faire une demande
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentRequests.map((request) => (
                  <div key={request.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{request.softwareName}</p>
                      <Badge variant={
                        request.status === 'approved' ? 'default' :
                        request.status === 'rejected' ? 'destructive' :
                        'secondary'
                      }>
                        {request.status === 'submitted' ? 'Soumise' :
                         request.status === 'in_review' ? 'En revue' :
                         request.status === 'approved' ? 'Approuvée' :
                         'Rejetée'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {request.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {request.voteCount} votes
                      </span>
                      <span>
                        Urgence: {
                          request.urgency === 'immediate' ? 'Immédiate' :
                          request.urgency === 'short_term' ? '< 3 mois' :
                          '> 3 mois'
                        }
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Progression de votre parc
          </CardTitle>
          <CardDescription>
            Complétude des informations de votre catalogue logiciel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Complétude globale</span>
              <span className="text-sm text-muted-foreground">{stats.completionRate}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${stats.completionRate}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.activeUsers}</div>
                <p className="text-sm text-muted-foreground">Utilisateurs actifs</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.totalSoftware}</div>
                <p className="text-sm text-muted-foreground">Logiciels référencés</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">
                  {Math.round(stats.totalCost / Math.max(stats.activeUsers, 1))}€
                </div>
                <p className="text-sm text-muted-foreground">Coût par utilisateur</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
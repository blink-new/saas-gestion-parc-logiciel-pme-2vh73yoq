import { useState, useEffect, useCallback } from 'react'
import { User, Software, Contract } from '../../types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { BarChart3, Euro, TrendingUp, Package, Users } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { blink } from '../../blink/client'

interface AnalyticsProps {
  user: User
}

interface AnalyticsData {
  totalCost: number
  monthlyCost: number
  yearlyCost: number
  softwareCount: number
  activeUsers: number
  costByCategory: Array<{ name: string; value: number; color: string }>
  costBySoftware: Array<{ name: string; cost: number }>
  expiringContracts: Array<{ name: string; endDate: string; cost: number }>
}

const COLORS = ['#2563EB', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16']

export function Analytics({ user }: AnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const loadAnalytics = useCallback(async () => {
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
        where: { companyId: companyId }
      })

      // Load contracts
      const contracts = await blink.db.contracts.list()

      // Load usage
      const usage = await blink.db.usage.list({
        where: { status: 'active' }
      })

      // Calculate analytics
      const softwareWithContracts = software.map(sw => {
        const contract = contracts.find(c => c.softwareId === sw.id)
        return { ...sw, contract }
      })

      // Total costs
      let totalYearlyCost = 0
      let totalMonthlyCost = 0

      softwareWithContracts.forEach(sw => {
        if (sw.contract) {
          if (sw.contract.billingPeriod === 'yearly') {
            totalYearlyCost += sw.contract.costAmount
            totalMonthlyCost += sw.contract.costAmount / 12
          } else if (sw.contract.billingPeriod === 'monthly') {
            totalMonthlyCost += sw.contract.costAmount
            totalYearlyCost += sw.contract.costAmount * 12
          }
        }
      })

      // Cost by category
      const categoryMap = new Map<string, number>()
      softwareWithContracts.forEach(sw => {
        if (sw.contract) {
          const yearlyCost = sw.contract.billingPeriod === 'yearly' 
            ? sw.contract.costAmount 
            : sw.contract.costAmount * 12
          
          categoryMap.set(
            sw.category, 
            (categoryMap.get(sw.category) || 0) + yearlyCost
          )
        }
      })

      const costByCategory = Array.from(categoryMap.entries()).map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length]
      }))

      // Cost by software (top 10)
      const costBySoftware = softwareWithContracts
        .filter(sw => sw.contract)
        .map(sw => ({
          name: sw.name,
          cost: sw.contract!.billingPeriod === 'yearly' 
            ? sw.contract!.costAmount 
            : sw.contract!.costAmount * 12
        }))
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 10)

      // Expiring contracts (next 90 days)
      const now = new Date()
      const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
      
      const expiringContracts = softwareWithContracts
        .filter(sw => {
          if (!sw.contract?.endDate) return false
          const endDate = new Date(sw.contract.endDate)
          return endDate >= now && endDate <= in90Days
        })
        .map(sw => ({
          name: sw.name,
          endDate: sw.contract!.endDate!,
          cost: sw.contract!.costAmount
        }))
        .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())

      // Active users count
      const activeUsers = new Set(usage.map(u => u.userId)).size

      setData({
        totalCost: totalYearlyCost,
        monthlyCost: totalMonthlyCost,
        yearlyCost: totalYearlyCost,
        softwareCount: software.length,
        activeUsers,
        costByCategory,
        costBySoftware,
        expiringContracts
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-80 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Impossible de charger les données</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Analysez les coûts et l'utilisation de votre parc logiciel
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coût total annuel</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.totalCost.toLocaleString('fr-FR')}€
            </div>
            <p className="text-xs text-muted-foreground">
              {data.monthlyCost.toLocaleString('fr-FR')}€/mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Logiciels</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.softwareCount}</div>
            <p className="text-xs text-muted-foreground">
              Dans votre catalogue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Utilisent au moins un logiciel
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contrats expirant</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.expiringContracts.length}</div>
            <p className="text-xs text-muted-foreground">
              Dans les 90 prochains jours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Coûts par catégorie</CardTitle>
            <CardDescription>
              Répartition des coûts annuels par type de logiciel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.costByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.costByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value.toLocaleString('fr-FR')}€`, 'Coût annuel']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Software by Cost */}
        <Card>
          <CardHeader>
            <CardTitle>Logiciels les plus coûteux</CardTitle>
            <CardDescription>
              Top 10 des logiciels par coût annuel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.costBySoftware} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip formatter={(value: number) => [`${value.toLocaleString('fr-FR')}€`, 'Coût annuel']} />
                <Bar dataKey="cost" fill="#2563EB" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Contracts */}
      {data.expiringContracts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Contrats arrivant à échéance</CardTitle>
            <CardDescription>
              Contrats expirant dans les 90 prochains jours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.expiringContracts.map((contract, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{contract.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Expire le {new Date(contract.endDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{contract.cost.toLocaleString('fr-FR')}€</p>
                    <p className="text-sm text-muted-foreground">
                      {Math.ceil((new Date(contract.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} jours
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
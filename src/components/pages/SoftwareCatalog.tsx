import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { 
  Package, 
  Plus, 
  Search, 
  Filter,
  Star,
  Euro,
  Calendar,
  Users
} from 'lucide-react'
import { blink } from '../../blink/client'
import { User, Software, Contract, Review } from '../../types'
import { AddSoftwareModal } from '../modals/AddSoftwareModal'
import { ReviewModal } from '../modals/ReviewModal'
import { SoftwareDetailsModal } from '../modals/SoftwareDetailsModal'

interface SoftwareCatalogProps {
  user: User
}

interface SoftwareWithDetails extends Software {
  contract?: Contract
  averageRating?: number
  reviewCount?: number
  userCount?: number
}

export function SoftwareCatalog({ user }: SoftwareCatalogProps) {
  const [software, setSoftware] = useState<SoftwareWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedSoftware, setSelectedSoftware] = useState<Software | null>(null)
  const [softwareReviews, setSoftwareReviews] = useState<Review[]>([])

  const loadSoftware = useCallback(async () => {
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
      const softwareList = await blink.db.software.list({
        where: { companyId: companyId },
        orderBy: { name: 'asc' }
      })

      // Load contracts
      const contracts = await blink.db.contracts.list()
      
      // Load reviews
      const reviews = await blink.db.reviews.list()
      
      // Load usage data
      const usage = await blink.db.usage.list()

      // Combine data
      const softwareWithDetails: SoftwareWithDetails[] = softwareList.map(sw => {
        const contract = contracts.find(c => c.softwareId === sw.id)
        const softwareReviews = reviews.filter(r => r.softwareId === sw.id)
        const softwareUsers = usage.filter(u => u.softwareId === sw.id && u.status === 'active')
        
        const averageRating = softwareReviews.length > 0
          ? softwareReviews.reduce((sum, r) => sum + r.rating, 0) / softwareReviews.length
          : undefined

        return {
          ...sw,
          contract,
          averageRating,
          reviewCount: softwareReviews.length,
          userCount: softwareUsers.length
        }
      })

      setSoftware(softwareWithDetails)
    } catch (error) {
      console.error('Error loading software:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadSoftware()
  }, [loadSoftware])

  const categories = ['all', ...new Set(software.map(s => s.category))]
  
  const filteredSoftware = software.filter(sw => {
    const matchesSearch = sw.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sw.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || sw.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const renderStars = (rating?: number) => {
    if (!rating) return <span className="text-muted-foreground text-sm">Pas d'avis</span>
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">
          ({rating.toFixed(1)})
        </span>
      </div>
    )
  }

  const handleReviewClick = (sw: Software) => {
    setSelectedSoftware(sw)
    setShowReviewModal(true)
  }

  const handleDetailsClick = async (sw: Software) => {
    setSelectedSoftware(sw)
    
    // Load reviews for this software
    try {
      const reviews = await blink.db.reviews.list({
        where: { softwareId: sw.id },
        orderBy: { createdAt: 'desc' }
      })
      setSoftwareReviews(reviews)
    } catch (error) {
      console.error('Error loading reviews:', error)
      setSoftwareReviews([])
    }
    
    setShowDetailsModal(true)
  }

  const handleEditSoftware = (sw: Software) => {
    setSelectedSoftware(sw)
    setShowDetailsModal(false)
    setShowAddModal(true)
  }

  const handleAddReviewFromDetails = (sw: Software) => {
    setShowDetailsModal(false)
    setShowReviewModal(true)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded"></div>
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
          <h1 className="text-3xl font-bold">Catalogue logiciels</h1>
          <p className="text-muted-foreground">
            Gérez votre parc logiciel et ses informations
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" />
          Ajouter un logiciel
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Rechercher un logiciel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtres
          </Button>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-input rounded-md text-sm bg-background"
          >
            <option value="all">Toutes les catégories</option>
            {categories.filter(c => c !== 'all').map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Software Grid */}
      {filteredSoftware.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Aucun logiciel trouvé</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Essayez de modifier vos critères de recherche'
              : 'Commencez par ajouter votre premier logiciel'
            }
          </p>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un logiciel
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSoftware.map((sw) => (
            <Card key={sw.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{sw.name}</CardTitle>
                      <CardDescription>{sw.category}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={sw.status === 'active' ? 'default' : 'secondary'}>
                    {sw.status === 'active' ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Rating */}
                <div>
                  {renderStars(sw.averageRating)}
                  {sw.reviewCount && sw.reviewCount > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {sw.reviewCount} avis
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{sw.userCount || 0} utilisateurs</span>
                  </div>
                  {sw.contract && (
                    <div className="flex items-center gap-2">
                      <Euro className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {sw.contract.costAmount.toLocaleString('fr-FR')}€
                        {sw.contract.billingPeriod === 'monthly' ? '/mois' : '/an'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Contract info */}
                {sw.contract && sw.contract.endDate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Expire le {new Date(sw.contract.endDate).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}

                {/* Description */}
                {sw.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {sw.description}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleDetailsClick(sw)}
                  >
                    Voir détails
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleReviewClick(sw)}
                  >
                    <Star className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <AddSoftwareModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        user={user}
        onSoftwareAdded={loadSoftware}
      />

      {selectedSoftware && (
        <ReviewModal
          open={showReviewModal}
          onOpenChange={setShowReviewModal}
          user={user}
          software={selectedSoftware}
          onReviewAdded={loadSoftware}
        />
      )}

      {selectedSoftware && (
        <SoftwareDetailsModal
          software={selectedSoftware}
          reviews={softwareReviews}
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          onEditSoftware={handleEditSoftware}
          onAddReview={handleAddReviewFromDetails}
        />
      )}
    </div>
  )
}
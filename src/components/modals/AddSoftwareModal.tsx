import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { X, Package } from 'lucide-react'
import { blink } from '../../blink/client'
import { User } from '../../types'

interface AddSoftwareModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
  onSoftwareAdded: () => void
}

const SOFTWARE_CATEGORIES = [
  'CRM',
  'Comptabilité',
  'Marketing',
  'Communication',
  'Productivité',
  'Design',
  'Développement',
  'RH',
  'Sécurité',
  'Autre'
]

export function AddSoftwareModal({ open, onOpenChange, user, onSoftwareAdded }: AddSoftwareModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    version: '',
    category: '',
    description: '',
    costAmount: '',
    billingPeriod: 'yearly' as 'monthly' | 'yearly' | 'one-time',
    licenseCount: '1',
    endDate: '',
    noticeDays: '30'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.category) return

    setLoading(true)
    try {
      // Get user's company
      const users = await blink.db.users.list({
        where: { id: user.id },
        limit: 1
      })
      
      if (users.length === 0) return
      
      const userData = users[0]
      const companyId = userData.companyId

      // Create software
      const software = await blink.db.software.create({
        name: formData.name,
        version: formData.version || undefined,
        category: formData.category,
        description: formData.description || undefined,
        companyId: companyId,
        departmentId: userData.departmentId,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      // Create contract if cost information provided
      if (formData.costAmount && parseFloat(formData.costAmount) > 0) {
        await blink.db.contracts.create({
          softwareId: software.id,
          costAmount: parseFloat(formData.costAmount),
          currency: 'EUR',
          billingPeriod: formData.billingPeriod,
          licenseCount: parseInt(formData.licenseCount) || 1,
          startDate: new Date().toISOString(),
          endDate: formData.endDate || undefined,
          noticeDays: parseInt(formData.noticeDays) || 30,
          createdAt: new Date().toISOString()
        })
      }

      // Create usage record for current user
      await blink.db.usage.create({
        userId: user.id,
        softwareId: software.id,
        status: 'active',
        createdAt: new Date().toISOString()
      })

      // Reset form
      setFormData({
        name: '',
        version: '',
        category: '',
        description: '',
        costAmount: '',
        billingPeriod: 'yearly',
        licenseCount: '1',
        endDate: '',
        noticeDays: '30'
      })

      onSoftwareAdded()
      onOpenChange(false)
    } catch (error) {
      console.error('Error adding software:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Ajouter un logiciel
          </DialogTitle>
          <DialogDescription>
            Ajoutez un nouveau logiciel à votre catalogue d'entreprise
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-medium">Informations générales</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du logiciel *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="ex: Slack, Figma, Salesforce..."
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                  placeholder="ex: 2024.1, v3.2..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Catégorie *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {SOFTWARE_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez brièvement l'usage de ce logiciel..."
                rows={3}
              />
            </div>
          </div>

          {/* Contract Information */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium">Informations contractuelles (optionnel)</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="costAmount">Coût</Label>
                <div className="relative">
                  <Input
                    id="costAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.costAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, costAmount: e.target.value }))}
                    placeholder="0.00"
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                    €
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="billingPeriod">Période de facturation</Label>
                <Select
                  value={formData.billingPeriod}
                  onValueChange={(value: 'monthly' | 'yearly' | 'one-time') => 
                    setFormData(prev => ({ ...prev, billingPeriod: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensuel</SelectItem>
                    <SelectItem value="yearly">Annuel</SelectItem>
                    <SelectItem value="one-time">Paiement unique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="licenseCount">Nombre de licences</Label>
                <Input
                  id="licenseCount"
                  type="number"
                  min="1"
                  value={formData.licenseCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, licenseCount: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="noticeDays">Préavis (jours)</Label>
                <Input
                  id="noticeDays"
                  type="number"
                  min="0"
                  value={formData.noticeDays}
                  onChange={(e) => setFormData(prev => ({ ...prev, noticeDays: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Date de fin de contrat</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !formData.name || !formData.category}>
              {loading ? 'Ajout en cours...' : 'Ajouter le logiciel'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
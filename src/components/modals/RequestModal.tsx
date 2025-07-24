import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { MessageSquarePlus } from 'lucide-react'
import { blink } from '../../blink/client'
import { User } from '../../types'

interface RequestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
  onRequestAdded: () => void
}

export function RequestModal({ open, onOpenChange, user, onRequestAdded }: RequestModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    softwareName: '',
    description: '',
    urgency: 'short_term' as 'immediate' | 'short_term' | 'long_term',
    estimatedBudget: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.softwareName || !formData.description) return

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

      // Create request
      await blink.db.softwareRequests.create({
        softwareName: formData.softwareName,
        description: formData.description,
        urgency: formData.urgency,
        estimatedBudget: formData.estimatedBudget ? parseFloat(formData.estimatedBudget) : undefined,
        status: 'submitted',
        requesterId: user.id,
        departmentId: userData.departmentId,
        companyId: companyId,
        voteCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      // Reset form
      setFormData({
        softwareName: '',
        description: '',
        urgency: 'short_term',
        estimatedBudget: ''
      })

      onRequestAdded()
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating request:', error)
    } finally {
      setLoading(false)
    }
  }

  const urgencyLabels = {
    immediate: 'Immédiat (urgent)',
    short_term: 'Court terme (< 3 mois)',
    long_term: 'Long terme (> 3 mois)'
  }

  const urgencyColors = {
    immediate: 'text-red-600',
    short_term: 'text-orange-600',
    long_term: 'text-green-600'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5" />
            Demander un nouveau logiciel
          </DialogTitle>
          <DialogDescription>
            Proposez un logiciel à votre équipe et recueillez des votes
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="softwareName">Nom du logiciel *</Label>
            <Input
              id="softwareName"
              value={formData.softwareName}
              onChange={(e) => setFormData(prev => ({ ...prev, softwareName: e.target.value }))}
              placeholder="ex: Notion, Slack, Figma..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Problème / Usage *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Décrivez en quelques phrases le problème que ce logiciel résoudrait et comment vous comptez l'utiliser..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="urgency">Urgence</Label>
            <Select
              value={formData.urgency}
              onValueChange={(value: 'immediate' | 'short_term' | 'long_term') => 
                setFormData(prev => ({ ...prev, urgency: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(urgencyLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    <span className={urgencyColors[key as keyof typeof urgencyColors]}>
                      {label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimatedBudget">Budget estimé (optionnel)</Label>
            <div className="relative">
              <Input
                id="estimatedBudget"
                type="number"
                step="0.01"
                min="0"
                value={formData.estimatedBudget}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedBudget: e.target.value }))}
                placeholder="0.00"
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                €/mois
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Cette information sera visible par tous les membres de l'équipe
            </p>
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
            <Button 
              type="submit" 
              disabled={loading || !formData.softwareName || !formData.description}
            >
              {loading ? 'Création...' : 'Créer la demande'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
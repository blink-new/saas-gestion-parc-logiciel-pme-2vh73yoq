import { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Progress } from '../ui/progress'
import { Package, Users, Star } from 'lucide-react'
import { blink } from '../../blink/client'
import { User } from '../../types'
import { useToast } from '../../hooks/use-toast'

interface OnboardingProps {
  user: User
  onComplete: () => void
}

type Step = 'company' | 'software' | 'invite'

export function Onboarding({ user, onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState<Step>('company')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Company step
  const [companyName, setCompanyName] = useState('')
  const [companyDomain, setCompanyDomain] = useState('')

  // Software step
  const [softwareName, setSoftwareName] = useState('')
  const [softwareCategory, setSoftwareCategory] = useState('')

  // Invite step
  const [inviteEmails, setInviteEmails] = useState('')

  const steps = [
    { id: 'company', title: 'Entreprise', icon: Package },
    { id: 'software', title: 'Premier logiciel', icon: Star },
    { id: 'invite', title: 'Inviter l\'équipe', icon: Users },
  ]

  const currentStepIndex = steps.findIndex(step => step.id === currentStep)
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  const handleCompanySubmit = async () => {
    if (!companyName.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom de l\'entreprise est requis',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      // Create company
      const companyId = `company_${Date.now()}`
      await blink.db.companies.create({
        id: companyId,
        name: companyName,
        domain: companyDomain || null,
        multiEntity: false
      })

      // Create default department
      const departmentId = `dept_${Date.now()}`
      await blink.db.departments.create({
        id: departmentId,
        name: 'Général',
        companyId: companyId
      })

      // Update user with company info
      await blink.db.users.create({
        id: user.id,
        email: user.email,
        displayName: user.displayName || user.email,
        role: 'admin', // First user is admin
        companyId: companyId,
        departmentId: departmentId
      })

      setCurrentStep('software')
    } catch (error) {
      console.error('Error creating company:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de créer l\'entreprise',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSoftwareSubmit = async () => {
    if (!softwareName.trim() || !softwareCategory.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom et la catégorie du logiciel sont requis',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      // Get user's company
      const users = await blink.db.users.list({
        where: { id: user.id },
        limit: 1
      })
      
      if (users.length === 0) {
        throw new Error('User not found')
      }

      const userData = users[0]
      
      // Create software
      const softwareId = `software_${Date.now()}`
      await blink.db.software.create({
        id: softwareId,
        name: softwareName,
        category: softwareCategory,
        companyId: userData.companyId,
        departmentId: userData.departmentId,
        status: 'active'
      })

      // Create usage record
      await blink.db.usage.create({
        id: `usage_${Date.now()}`,
        userId: user.id,
        softwareId: softwareId,
        status: 'active'
      })

      setCurrentStep('invite')
    } catch (error) {
      console.error('Error creating software:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter le logiciel',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInviteSubmit = async () => {
    // For now, just complete onboarding
    // TODO: Implement email invitations
    onComplete()
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'company':
        return (
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Créer votre entreprise
              </CardTitle>
              <CardDescription>
                Commençons par configurer votre espace entreprise
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Nom de l'entreprise *</Label>
                <Input
                  id="company-name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: Acme Corp"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-domain">Domaine (optionnel)</Label>
                <Input
                  id="company-domain"
                  value={companyDomain}
                  onChange={(e) => setCompanyDomain(e.target.value)}
                  placeholder="Ex: acme.com"
                />
              </div>
              <Button 
                onClick={handleCompanySubmit} 
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Création...' : 'Continuer'}
              </Button>
            </CardContent>
          </Card>
        )

      case 'software':
        return (
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                Ajouter votre premier logiciel
              </CardTitle>
              <CardDescription>
                Quel logiciel utilisez-vous le plus dans votre travail ?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="software-name">Nom du logiciel *</Label>
                <Input
                  id="software-name"
                  value={softwareName}
                  onChange={(e) => setSoftwareName(e.target.value)}
                  placeholder="Ex: Slack, Microsoft Office, Figma..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="software-category">Catégorie *</Label>
                <Input
                  id="software-category"
                  value={softwareCategory}
                  onChange={(e) => setSoftwareCategory(e.target.value)}
                  placeholder="Ex: Communication, Productivité, Design..."
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep('company')}
                  className="flex-1"
                >
                  Retour
                </Button>
                <Button 
                  onClick={handleSoftwareSubmit} 
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? 'Ajout...' : 'Continuer'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      case 'invite':
        return (
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Inviter votre équipe
              </CardTitle>
              <CardDescription>
                Invitez vos collègues pour une gestion collaborative (optionnel)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-emails">Adresses email</Label>
                <textarea
                  id="invite-emails"
                  className="w-full min-h-[100px] px-3 py-2 border border-input rounded-md text-sm"
                  value={inviteEmails}
                  onChange={(e) => setInviteEmails(e.target.value)}
                  placeholder="jean@entreprise.com&#10;marie@entreprise.com&#10;..."
                />
                <p className="text-xs text-muted-foreground">
                  Une adresse par ligne. Vous pourrez inviter d'autres personnes plus tard.
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep('software')}
                  className="flex-1"
                >
                  Retour
                </Button>
                <Button 
                  onClick={handleInviteSubmit} 
                  className="flex-1"
                >
                  Terminer
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Bienvenue sur LogicielHub
          </h1>
          <p className="text-muted-foreground">
            Configurons votre espace en 3 étapes simples
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-4">
          <Progress value={progress} className="w-full" />
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <div 
                key={step.id}
                className={`flex items-center gap-2 ${
                  index <= currentStepIndex 
                    ? 'text-primary' 
                    : 'text-muted-foreground'
                }`}
              >
                <step.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex justify-center">
          {renderStep()}
        </div>
      </div>
    </div>
  )
}
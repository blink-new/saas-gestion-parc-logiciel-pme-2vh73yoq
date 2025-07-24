import { useState, useEffect, useCallback } from 'react'
import { User, SoftwareRequest, Vote } from '../../types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { MessageSquare, Plus, ThumbsUp, Clock, Euro, User as UserIcon } from 'lucide-react'
import { blink } from '../../blink/client'
import { RequestModal } from '../modals/RequestModal'

interface RequestsProps {
  user: User
}

interface RequestWithDetails extends SoftwareRequest {
  requester?: User
  votes?: Vote[]
  userHasVoted?: boolean
}

export function Requests({ user }: RequestsProps) {
  const [requests, setRequests] = useState<RequestWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [showRequestModal, setShowRequestModal] = useState(false)

  const loadRequests = useCallback(async () => {
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

      // Load requests
      const requestsList = await blink.db.softwareRequests.list({
        where: { companyId: companyId },
        orderBy: { createdAt: 'desc' }
      })

      // Load all users for requester info
      const allUsers = await blink.db.users.list({
        where: { companyId: companyId }
      })

      // Load votes
      const votes = await blink.db.votes.list()

      // Combine data
      const requestsWithDetails: RequestWithDetails[] = requestsList.map(req => {
        const requester = allUsers.find(u => u.id === req.requesterId)
        const requestVotes = votes.filter(v => v.requestId === req.id)
        const userHasVoted = requestVotes.some(v => v.voterId === user.id)

        return {
          ...req,
          requester,
          votes: requestVotes,
          userHasVoted,
          voteCount: requestVotes.length
        }
      })

      setRequests(requestsWithDetails)
    } catch (error) {
      console.error('Error loading requests:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  const handleVote = async (requestId: string) => {
    try {
      const request = requests.find(r => r.id === requestId)
      if (!request) return

      if (request.userHasVoted) {
        // Remove vote
        const userVote = request.votes?.find(v => v.voterId === user.id)
        if (userVote) {
          await blink.db.votes.delete(userVote.id)
        }
      } else {
        // Add vote
        await blink.db.votes.create({
          requestId: requestId,
          voterId: user.id,
          createdAt: new Date().toISOString()
        })
      }

      // Reload requests
      loadRequests()
    } catch (error) {
      console.error('Error voting:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Brouillon', variant: 'secondary' as const },
      submitted: { label: 'Envoyé', variant: 'default' as const },
      in_review: { label: 'En revue', variant: 'outline' as const },
      approved: { label: 'Approuvé', variant: 'default' as const },
      rejected: { label: 'Refusé', variant: 'destructive' as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.submitted
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getUrgencyBadge = (urgency: string) => {
    const urgencyConfig = {
      immediate: { label: 'Urgent', className: 'bg-red-100 text-red-800' },
      short_term: { label: '< 3 mois', className: 'bg-orange-100 text-orange-800' },
      long_term: { label: '> 3 mois', className: 'bg-green-100 text-green-800' }
    }
    
    const config = urgencyConfig[urgency as keyof typeof urgencyConfig] || urgencyConfig.short_term
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Demandes de logiciels</h1>
          <p className="text-muted-foreground">
            Gérez les demandes de nouveaux logiciels de votre équipe
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowRequestModal(true)}>
          <Plus className="w-4 h-4" />
          Nouvelle demande
        </Button>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Aucune demande</h3>
            <p className="text-muted-foreground mb-4">
              Commencez par créer votre première demande de logiciel
            </p>
            <Button onClick={() => setShowRequestModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle demande
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{request.softwareName}</CardTitle>
                      {getStatusBadge(request.status)}
                      {getUrgencyBadge(request.urgency)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <UserIcon className="w-4 h-4" />
                        <span>{request.requester?.displayName || 'Utilisateur inconnu'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(request.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                      {request.estimatedBudget && (
                        <div className="flex items-center gap-1">
                          <Euro className="w-4 h-4" />
                          <span>{request.estimatedBudget.toLocaleString('fr-FR')}€/mois</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{request.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={request.userHasVoted ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleVote(request.id)}
                      className="gap-2"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      {request.voteCount} vote{request.voteCount !== 1 ? 's' : ''}
                    </Button>
                  </div>
                  
                  {user.role === 'admin' && request.status === 'submitted' && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Rejeter
                      </Button>
                      <Button size="sm">
                        Approuver
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RequestModal
        open={showRequestModal}
        onOpenChange={setShowRequestModal}
        user={user}
        onRequestAdded={loadRequests}
      />
    </div>
  )
}
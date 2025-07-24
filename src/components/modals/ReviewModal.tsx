import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Star, MessageSquare } from 'lucide-react'
import { blink } from '../../blink/client'
import { User, Software, Review } from '../../types'

interface ReviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
  software: Software
  onReviewAdded: () => void
}

export function ReviewModal({ open, onOpenChange, user, software, onReviewAdded }: ReviewModalProps) {
  const [loading, setLoading] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [existingReview, setExistingReview] = useState<Review | null>(null)
  const [hoveredRating, setHoveredRating] = useState(0)

  const loadExistingReview = useCallback(async () => {
    try {
      const reviews = await blink.db.reviews.list({
        where: { 
          userId: user.id,
          softwareId: software.id
        },
        limit: 1
      })
      
      if (reviews.length > 0) {
        const review = reviews[0]
        setExistingReview(review)
        setRating(review.rating)
        setComment(review.comment || '')
      } else {
        setExistingReview(null)
        setRating(0)
        setComment('')
      }
    } catch (error) {
      console.error('Error loading existing review:', error)
    }
  }, [user.id, software.id])

  useEffect(() => {
    if (open) {
      loadExistingReview()
    }
  }, [open, loadExistingReview])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) return

    setLoading(true)
    try {
      if (existingReview) {
        // Update existing review
        await blink.db.reviews.update(existingReview.id, {
          rating,
          comment: comment.trim() || undefined,
          updatedAt: new Date().toISOString()
        })
      } else {
        // Create new review
        await blink.db.reviews.create({
          userId: user.id,
          softwareId: software.id,
          rating,
          comment: comment.trim() || undefined,
          createdAt: new Date().toISOString()
        })
      }

      onReviewAdded()
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving review:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStarClick = (starRating: number) => {
    setRating(starRating)
  }

  const handleStarHover = (starRating: number) => {
    setHoveredRating(starRating)
  }

  const handleStarLeave = () => {
    setHoveredRating(0)
  }

  const displayRating = hoveredRating || rating

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            {existingReview ? 'Modifier votre avis' : 'Donner votre avis'}
          </DialogTitle>
          <DialogDescription>
            Évaluez <strong>{software.name}</strong> et partagez votre expérience
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating Stars */}
          <div className="space-y-2">
            <Label>Note *</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => handleStarHover(star)}
                  onMouseLeave={handleStarLeave}
                  className="p-1 rounded hover:bg-muted transition-colors"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= displayRating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 hover:text-yellow-200'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-3 text-sm text-muted-foreground">
                {rating === 0 ? 'Cliquez pour noter' : 
                 rating === 1 ? 'Très insatisfait' :
                 rating === 2 ? 'Insatisfait' :
                 rating === 3 ? 'Neutre' :
                 rating === 4 ? 'Satisfait' :
                 'Très satisfait'}
              </span>
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Commentaire (optionnel)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Partagez votre expérience avec ce logiciel..."
              rows={4}
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground text-right">
              {comment.length}/500 caractères
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
            <Button type="submit" disabled={loading || rating === 0}>
              {loading ? 'Enregistrement...' : 
               existingReview ? 'Modifier l\'avis' : 'Publier l\'avis'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
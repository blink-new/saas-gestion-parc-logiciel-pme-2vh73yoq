import React from 'react';
import { X, Star, Users, Calendar, DollarSign, AlertTriangle } from 'lucide-react';
import { Software, Review } from '../../types';

interface SoftwareDetailsModalProps {
  software: Software;
  reviews: Review[];
  isOpen: boolean;
  onClose: () => void;
  onEditSoftware: (software: Software) => void;
  onAddReview: (software: Software) => void;
}

export const SoftwareDetailsModal: React.FC<SoftwareDetailsModalProps> = ({
  software,
  reviews,
  isOpen,
  onClose,
  onEditSoftware,
  onAddReview
}) => {
  if (!isOpen) return null;

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getDaysUntilExpiry = (endDate: string) => {
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilExpiry = software.contract_end_date ? getDaysUntilExpiry(software.contract_end_date) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{software.name}</h2>
            <p className="text-gray-600">{software.category}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Informations générales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Informations générales</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Version:</span>
                  <span className="text-sm font-medium">{software.version || 'Non spécifiée'}</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Service propriétaire:</span>
                  <span className="text-sm font-medium">{software.owner_department || 'Non défini'}</span>
                </div>

                <div className="flex items-center space-x-3">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-gray-600">Satisfaction moyenne:</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-medium">{averageRating.toFixed(1)}/5</span>
                    <span className="text-xs text-gray-500">({reviews.length} avis)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Informations contractuelles</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-600">Coût annuel:</span>
                  <span className="text-sm font-medium">
                    {software.annual_cost ? `${software.annual_cost}€` : 'Non renseigné'}
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Nombre de licences:</span>
                  <span className="text-sm font-medium">{software.license_count || 'Non renseigné'}</span>
                </div>

                {software.contract_end_date && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-gray-600">Fin de contrat:</span>
                    <span className="text-sm font-medium">{formatDate(software.contract_end_date)}</span>
                    {daysUntilExpiry !== null && daysUntilExpiry <= 30 && (
                      <div className="flex items-center space-x-1">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="text-xs text-red-600">
                          {daysUntilExpiry > 0 ? `${daysUntilExpiry} jours restants` : 'Expiré'}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {software.notice_period_days && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Préavis:</span>
                    <span className="text-sm font-medium">{software.notice_period_days} jours</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {software.description && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Description</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{software.description}</p>
            </div>
          )}

          {/* Avis récents */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Avis récents</h3>
              <button
                onClick={() => onAddReview(software)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Ajouter un avis
              </button>
            </div>

            {reviews.length > 0 ? (
              <div className="space-y-4 max-h-60 overflow-y-auto">
                {reviews.slice(0, 5).map((review) => (
                  <div key={review.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= review.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium">{review.rating}/5</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-600">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Star className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Aucun avis pour le moment</p>
                <p className="text-sm">Soyez le premier à donner votre avis !</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Fermer
          </button>
          <button
            onClick={() => onEditSoftware(software)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Modifier
          </button>
        </div>
      </div>
    </div>
  );
};
// backend/app/services/documentAggregationService.js

import { ProjDoc, DocType, EmissionPeriod } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Service pour l'agrégation des documents par projet et catégorie
 */
class DocumentAggregationService {
  /**
   * Récupère les statistiques agrégées des documents d'un projet
   * @param {string} projectId - ID du projet
   * @param {Object} options - Options de filtrage
   * @param {string} options.category - Catégorie de document (HSE, Technical, etc.)
   * @param {string} options.referencePeriod - Période de référence (optionnel)
   * @param {string} options.documentType - Type de document ('all', 'adhoc', 'periodic')
   * @returns {Promise<Object>} Statistiques agrégées
   */
  static async getProjectDocumentsAggregated(projectId, options = {}) {
    const { category, referencePeriod, documentType = 'all' } = options;

    // Construire le where clause pour les documents
    const whereClause = { project_id: projectId };

    // Filtre par type de document
    if (documentType === 'adhoc') {
      whereClause.is_periodic = false;
    } else if (documentType === 'periodic') {
      whereClause.is_periodic = true;
    }

    // Récupérer tous les documents du projet avec leur type
    const documents = await ProjDoc.findAll({
      where: whereClause,
      include: [
        {
          model: DocType,
          as: 'docType',
          attributes: ['id', 'name', 'category', 'subcategory']
        }
      ]
    });

    // Filtrer par catégorie si spécifiée
    let filteredDocs = documents;
    if (category) {
      filteredDocs = documents.filter(doc => doc.docType?.category === category);
    }

    // Séparer ad-hoc et périodiques
    const adhocDocs = filteredDocs.filter(doc => !doc.is_periodic);
    const periodicDocs = filteredDocs.filter(doc => doc.is_periodic);

    // Pour les documents périodiques, récupérer la dernière période
    const periodicDocsWithLastPeriod = await Promise.all(
      periodicDocs.map(async (doc) => {
        const lastPeriod = await EmissionPeriod.findOne({
          where: { document_id: doc.id },
          order: [['period_number', 'DESC']],
          limit: 1
        });
        
        return {
          ...doc.toJSON(),
          lastPeriodStatus: lastPeriod?.status || 'pending'
        };
      })
    );

    // Calcul des statistiques ad-hoc
    const adhocTotal = adhocDocs.length;
    const adhocReceived = adhocDocs.filter(doc => doc.current_revision_file !== null).length;

    // Calcul des statistiques périodiques
    const periodicTotal = periodicDocsWithLastPeriod.length;
    const periodicReceived = periodicDocsWithLastPeriod.filter(doc => doc.lastPeriodStatus === 'received').length;
    const periodicOverdue = periodicDocsWithLastPeriod.filter(doc => doc.lastPeriodStatus === 'overdue').length;

    const total = adhocTotal + periodicTotal;
    const received = adhocReceived + periodicReceived;
    const hasDocuments = total > 0;

    return {
      total,
      received,
      overdueCount: periodicOverdue,
      hasDocuments,
      details: {
        adhocTotal,
        adhocReceived,
        periodicTotal,
        periodicReceived,
        periodicOverdue
      }
    };
  }
}

export default DocumentAggregationService;
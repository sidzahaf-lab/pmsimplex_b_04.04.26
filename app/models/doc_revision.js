import { DataTypes, Op } from 'sequelize';  // Add Op to the import

const DocRevision = (sequelize) => {
  const DocRevisionModel = sequelize.define('DocRevision', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'Unique identifier for each revision.'
    },
    projdoc_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'projdocs',
        key: 'id'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
      validate: {
        notNull: { msg: 'Project document ID is required' },
        isUUID: {
          args: 4,
          msg: 'Invalid project document ID format. Must be a valid UUID.'
        }
      },
      comment: 'Parent document reference.'
    },
    period_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'emission_periods',
        key: 'id'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
      validate: {
        isUUID: {
          args: 4,
          msg: 'Invalid period ID format. Must be a valid UUID.'
        }
      },
      comment: 'Reporting period reference (NULL for ad-hoc documents).'
    },
    revision: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      validate: {
        isInt: { msg: 'Revision must be an integer' },
        min: {
          args: 1,
          msg: 'Revision must be at least 1'
        }
      },
      comment: 'Sequential revision number (NULL until uploaded).'
    },
    revision_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: {
          args: [0, 50],
          msg: 'Revision code must not exceed 50 characters'
        }
      },
      comment: 'Internal procedure code e.g., R0, B1, C2.'
    },
    revision_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reason or summary of the revision.'
    },
    source_filename: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        len: {
          args: [0, 255],
          msg: 'Source filename must not exceed 255 characters'
        }
      },
      comment: 'Name of the uploaded file (NULL until uploaded).'
    },
    source_file_hash: {
      type: DataTypes.STRING(64),
      allowNull: true,
      validate: {
        len: {
          args: [0, 64],
          msg: 'SHA256 hash must be exactly 64 characters when provided'
        },
        isValidHash(value) {
          if (value && !/^[a-f0-9]{64}$/i.test(value)) {
            throw new Error('Invalid SHA256 hash format');
          }
        }
      },
      comment: 'SHA256 hash for duplicate detection (NULL until uploaded).'
    },
    hash_algorithm: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'SHA256',
      validate: {
        notNull: { msg: 'Hash algorithm is required' },
        notEmpty: { msg: 'Hash algorithm cannot be empty' },
        len: {
          args: [1, 20],
          msg: 'Hash algorithm must be between 1 and 20 characters'
        }
      },
      comment: 'Algorithm used for hashing.'
    },
    source_file_size: {
      type: DataTypes.BIGINT,
      allowNull: true,
      validate: {
        isPositive(value) {
          if (value !== null && value < 0) {
            throw new Error('File size must be a positive number');
          }
        },
        isReasonableSize(value) {
          if (value !== null && value > 100 * 1024 * 1024) {
            throw new Error('File size exceeds maximum allowed (100MB)');
          }
        }
      },
      comment: 'File size in bytes (NULL until uploaded).'
    },
    source_file_path: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        len: {
          args: [0, 500],
          msg: 'File path must not exceed 500 characters'
        }
      },
      comment: 'B2 path e.g., docs/{id}/rev_1.xer (NULL until uploaded).'
    },
    uploaded_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
      comment: 'Upload timestamp (NULL until uploaded).'
    },
    uploaded_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
      validate: {
        isUUID: {
          args: 4,
          msg: 'Invalid user ID format. Must be a valid UUID.'
        }
      },
      comment: 'User who uploaded the revision (NULL until uploaded).'
    },
    superseded_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'doc_revisions',
        key: 'id'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
      validate: {
        isUUID: {
          args: 4,
          msg: 'Invalid superseding revision ID format. Must be a valid UUID.'
        },
        notSelf(value) {
          if (value === this.id) {
            throw new Error('A revision cannot supersede itself');
          }
        }
      },
      comment: 'Next revision reference.'
    },
    status: {
      type: DataTypes.ENUM('pending', 'received', 'late'),
      allowNull: false,
      defaultValue: 'pending',
      validate: {
        notNull: { msg: 'Status is required' },
        isIn: {
          args: [['pending', 'received', 'late']],
          msg: 'Status must be pending, received, or late'
        }
      },
      comment: 'Document status for this period.'
    }
  }, {
    tableName: 'doc_revisions',
    timestamps: true,
    createdAt: 'uploaded_at',
    updatedAt: false,
    hooks: {
      beforeValidate: (revision) => {
        if (revision.source_filename) revision.source_filename = revision.source_filename.trim();
        if (revision.revision_code) revision.revision_code = revision.revision_code.trim();
        if (revision.source_file_hash) revision.source_file_hash = revision.source_file_hash.trim();
        if (revision.hash_algorithm) revision.hash_algorithm = revision.hash_algorithm.trim().toUpperCase();
        
        if (!revision.hash_algorithm && revision.source_file_hash) {
          revision.hash_algorithm = 'SHA256';
        }
      },
      
      beforeCreate: async (revision) => {
        if (revision.source_file_path && !revision.revision) {
          const lastRevision = await DocRevisionModel.findOne({
            where: { projdoc_id: revision.projdoc_id },
            order: [['revision', 'DESC']]
          });
          revision.revision = (lastRevision?.revision || 0) + 1;
        }
      },
      
      afterCreate: async (revision, options) => {
        if (revision.period_id && revision.status === 'received') {
          await sequelize.models.EmissionPeriod.update(
            { 
              status: 'received',
              received_at: revision.uploaded_at || new Date()
            },
            { 
              where: { id: revision.period_id }
            }
          );
        }
      },
      
      afterUpdate: async (revision, options) => {
        if (revision.changed('status') && revision.status === 'received' && revision.period_id) {
          await sequelize.models.EmissionPeriod.update(
            { 
              status: 'received',
              received_at: revision.uploaded_at || new Date()
            },
            { 
              where: { id: revision.period_id }
            }
          );
        }
      }
    },
    indexes: [
      {
        name: 'idx_doc_revision_projdoc_id',
        fields: ['projdoc_id']
      },
      {
        name: 'idx_doc_revision_period_id',
        fields: ['period_id']
      },
      {
        name: 'idx_doc_revision_uploaded_by',
        fields: ['uploaded_by']
      },
      {
        name: 'idx_doc_revision_uploaded_at',
        fields: ['uploaded_at']
      },
      {
        name: 'idx_doc_revision_hash',
        fields: ['source_file_hash']
      },
      {
        name: 'idx_doc_revision_status',
        fields: ['status']
      },
      {
        name: 'idx_doc_revision_status_period',
        fields: ['status', 'period_id']
      },
      {
        name: 'unique_projdoc_revision',
        unique: true,
        fields: ['projdoc_id', 'revision']
      },
      {
        name: 'idx_doc_revision_superseded_by',
        fields: ['superseded_by']
      }
    ],
    comment: 'Document revisions table with status tracking.'
  });

  // Instance Methods
  DocRevisionModel.prototype.markAsReceived = function() {
    this.status = 'received';
    return this.save();
  };

  DocRevisionModel.prototype.markAsLate = function() {
    this.status = 'late';
    return this.save();
  };

  DocRevisionModel.prototype.isUploaded = function() {
    return !!this.source_file_path;
  };

  DocRevisionModel.prototype.getFileExtension = function() {
    if (!this.source_filename) return null;
    return this.source_filename.split('.').pop();
  };

  // Static Methods
  DocRevisionModel.findByPeriod = function(periodId, options = {}) {
    return this.findAll({
      where: { period_id: periodId },
      ...options
    });
  };

  DocRevisionModel.findByDocument = function(projdocId, options = {}) {
    return this.findAll({
      where: { projdoc_id: projdocId },
      order: [['revision', 'DESC']],
      ...options
    });
  };

  DocRevisionModel.findLatestByDocument = function(projdocId) {
    return this.findOne({
      where: { projdoc_id: projdocId },
      order: [['revision', 'DESC']]
    });
  };

  DocRevisionModel.findByHash = function(hash) {
    return this.findOne({
      where: { source_file_hash: hash }
    });
  };

  DocRevisionModel.findByStatus = function(status, options = {}) {
    return this.findAll({
      where: { status },
      ...options
    });
  };

  DocRevisionModel.countByStatus = function(periodId = null) {
    const where = periodId ? { period_id: periodId } : {};
    
    return this.findAll({
      where,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('status')), 'count']
      ],
      group: ['status']
    });
  };

  // Scopes
  DocRevisionModel.addScope('uploaded', {
    where: {
      source_file_path: { [Op.ne]: null }  // Now Op is defined
    }
  });

  DocRevisionModel.addScope('pending', {
    where: { status: 'pending' }
  });

  DocRevisionModel.addScope('received', {
    where: { status: 'received' }
  });

  DocRevisionModel.addScope('late', {
    where: { status: 'late' }
  });

  DocRevisionModel.addScope('forPeriod', (periodId) => ({
    where: { period_id: periodId }
  }));

  // Associations
  DocRevisionModel.associate = (models) => {
    DocRevisionModel.belongsTo(models.ProjDoc, {
      foreignKey: 'projdoc_id',
      as: 'document',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
    
    DocRevisionModel.belongsTo(models.EmissionPeriod, {
      foreignKey: 'period_id',
      as: 'period',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
    
    DocRevisionModel.belongsTo(models.User, {
      foreignKey: 'uploaded_by',
      as: 'uploader',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
    
    DocRevisionModel.belongsTo(models.DocRevision, {
      foreignKey: 'superseded_by',
      as: 'superseding_revision',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
    
    DocRevisionModel.hasMany(models.DocRevision, {
      foreignKey: 'superseded_by',
      as: 'superseded_revisions',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
  };

  return DocRevisionModel;
};

export default DocRevision;
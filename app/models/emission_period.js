import { DataTypes, Op } from 'sequelize';  // Add Op to the import

const EmissionPeriod = (sequelize) => {
  const EmissionPeriodModel = sequelize.define('EmissionPeriod', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'Unique identifier for each emission period.'
    },
    emission_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'emission_policies',
        key: 'id'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
      validate: {
        notNull: { msg: 'Emission policy ID is required' },
        isUUID: {
          args: 4,
          msg: 'Invalid emission policy ID format. Must be a valid UUID.'
        }
      },
      comment: 'Parent policy reference.'
    },
    period_label: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notNull: { msg: 'Period label is required' },
        notEmpty: { msg: 'Period label cannot be empty' },
        len: {
          args: [1, 50],
          msg: 'Period label must be between 1 and 50 characters'
        },
        async isUniqueCombination(value) {
          const existing = await this.constructor.findOne({
            where: {
              emission_id: this.emission_id,
              period_label: value
            }
          });
          if (existing && existing.id !== this.id) {
            throw new Error('Period label must be unique per emission policy');
          }
        }
      },
      comment: 'Example: "W12-2025", "2025-03".'
    },
    period_start: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notNull: { msg: 'Period start date is required' },
        isDate: { msg: 'Period start must be a valid date' }
      },
      comment: 'Start of the reporting window.'
    },
    period_end: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notNull: { msg: 'Period end date is required' },
        isDate: { msg: 'Period end must be a valid date' },
        isAfterStart(value) {
          if (this.period_start && value <= this.period_start) {
            throw new Error('Period end must be after period start');
          }
        },
        isReasonableDuration(value) {
          if (this.period_start) {
            const start = new Date(this.period_start);
            const end = new Date(value);
            const daysDiff = (end - start) / (1000 * 60 * 60 * 24);
            if (daysDiff > 366) {
              throw new Error('Period duration cannot exceed one year');
            }
          }
        }
      },
      comment: 'End of the reporting window.'
    },
    expected_at: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: { msg: 'Expected date must be a valid date' }
      },
      comment: 'Theoretical submission date.'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Creation timestamp.'
    }
  }, {
    tableName: 'emission_periods',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    hooks: {
      beforeValidate: (period) => {
        if (period.period_label) {
          period.period_label = period.period_label.trim();
        }
      }
    },
    indexes: [
      {
        name: 'idx_emission_period_emission_id',
        fields: ['emission_id']
      },
      {
        name: 'idx_emission_period_dates',
        fields: ['period_start', 'period_end']
      },
      {
        name: 'idx_emission_period_expected_at',
        fields: ['expected_at']
      },
      {
        name: 'unique_emission_period_label',
        unique: true,
        fields: ['emission_id', 'period_label']
      }
    ],
    comment: 'Materialized reporting windows table.'
  });

  // Instance Methods
  EmissionPeriodModel.prototype.getDurationInDays = function() {
    if (!this.period_start || !this.period_end) return null;
    const start = new Date(this.period_start);
    const end = new Date(this.period_end);
    return Math.round((end - start) / (1000 * 60 * 60 * 24));
  };

  EmissionPeriodModel.prototype.isOverdue = function() {
    if (!this.expected_at) return false;
    const today = new Date().toISOString().split('T')[0];
    return this.expected_at < today;
  };

  // Static Methods
  EmissionPeriodModel.findByPolicy = function(policyId, options = {}) {
    return this.findAll({
      where: { emission_id: policyId },
      order: [['period_start', 'DESC']],
      ...options
    });
  };

  EmissionPeriodModel.findOverdue = function() {
    const today = new Date().toISOString().split('T')[0];
    return this.findAll({
      where: {
        expected_at: { [Op.lt]: today }  // Now Op is defined
      },
      order: [['expected_at', 'ASC']]
    });
  };

  EmissionPeriodModel.findByDateRange = function(startDate, endDate, options = {}) {
    return this.findAll({
      where: {
        period_start: { [Op.gte]: startDate },  // Now Op is defined
        period_end: { [Op.lte]: endDate }        // Now Op is defined
      },
      order: [['period_start', 'ASC']],
      ...options
    });
  };

  EmissionPeriodModel.findByLabel = function(policyId, label) {
    return this.findOne({
      where: {
        emission_id: policyId,
        period_label: label
      }
    });
  };

  EmissionPeriodModel.getPolicyStatistics = async function(policyId) {
    const periods = await this.findAll({
      where: { emission_id: policyId },
      order: [['period_start', 'DESC']]
    });

    const today = new Date().toISOString().split('T')[0];
    
    const stats = {
      total: periods.length,
      overdue: periods.filter(p => p.expected_at && p.expected_at < today).length,
      upcoming: periods.filter(p => p.expected_at && p.expected_at >= today).length,
      no_expected_date: periods.filter(p => !p.expected_at).length,
      first_period: periods.length > 0 ? periods[periods.length - 1] : null,
      latest_period: periods.length > 0 ? periods[0] : null
    };

    return stats;
  };

  // Scopes
  EmissionPeriodModel.addScope('forPolicy', (policyId) => ({
    where: { emission_id: policyId }
  }));

  EmissionPeriodModel.addScope('upcoming', {
    where: {
      expected_at: {
        [Op.gte]: new Date().toISOString().split('T')[0]  // Now Op is defined
      }
    }
  });

  EmissionPeriodModel.addScope('overdue', {
    where: {
      expected_at: {
        [Op.lt]: new Date().toISOString().split('T')[0]  // Now Op is defined
      }
    }
  });

  EmissionPeriodModel.addScope('withExpectedDate', {
    where: {
      expected_at: { [Op.ne]: null }  // Now Op is defined
    }
  });

  EmissionPeriodModel.addScope('byYear', (year) => ({
    where: sequelize.where(
      sequelize.fn('YEAR', sequelize.col('period_start')), 
      year
    )
  }));

  // Associations
  EmissionPeriodModel.associate = (models) => {
    EmissionPeriodModel.belongsTo(models.EmissionPolicy, {
      foreignKey: 'emission_id',
      as: 'policy',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
    
    EmissionPeriodModel.hasMany(models.DocRevision, {
      foreignKey: 'period_id',
      as: 'revisions',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });

    EmissionPeriodModel.hasMany(models.ProjDoc, {
      foreignKey: 'period_id',
      as: 'documents',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
  };

  return EmissionPeriodModel;
};

export default EmissionPeriod;
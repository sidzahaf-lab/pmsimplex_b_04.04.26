// backend/routes/docClassificationInit.js
import express from 'express';
import { DocCategory, DocSubcategory, DocType } from '../models/index.js';

const router = express.Router();

// Initialize document classification with all 250+ document types
router.post('/initialize', async (req, res) => {
  try {
    // Check if already initialized
    const existingCategories = await DocCategory.count();
    if (existingCategories > 0) {
      return res.status(400).json({ 
        message: 'Classification already initialized',
        data: { initialized: true, categoriesCount: existingCategories }
      });
    }

    console.log('🚀 Initializing document classification library...');

    // Insert all categories
    const categories = await DocCategory.bulkCreate([
      { categoryNumber: 1, label: 'Contractual Documents', description: 'Legal and contractual documentation for project execution' },
      { categoryNumber: 2, label: 'Project Management Documents', description: 'Documents for project planning, monitoring, and control' },
      { categoryNumber: 3, label: 'Technical Reference Documents', description: 'Technical specifications, studies, and reference materials' },
      { categoryNumber: 4, label: 'Engineering Documents', description: 'Engineering drawings, calculations, and design documents' },
      { categoryNumber: 5, label: 'Procurement Documents', description: 'Purchasing, vendor management, and logistics documents' },
      { categoryNumber: 6, label: 'Construction Documents', description: 'Site execution, method statements, and construction records' },
      { categoryNumber: 7, label: 'Quality Documents (QA/QC)', description: 'Quality management, inspections, and test records' },
      { categoryNumber: 8, label: 'HSE Documents', description: 'Health, Safety, and Environment management documents' },
      { categoryNumber: 9, label: 'Commissioning & Start-Up', description: 'Commissioning plans, procedures, and test reports' },
      { categoryNumber: 10, label: 'Regulatory Documents & Permits', description: 'Permits, licenses, and compliance documents' },
      { categoryNumber: 11, label: 'Financial & Commercial', description: 'Budget, cost, invoicing, and financial reports' },
      { categoryNumber: 12, label: 'Communication & Coordination', description: 'Meeting minutes, correspondence, and coordination documents' },
      { categoryNumber: 13, label: 'Legal & Insurance', description: 'Legal opinions, insurance policies, and dispute documents' },
      { categoryNumber: 14, label: 'Human Resources', description: 'Organization charts, job descriptions, and personnel records' },
      { categoryNumber: 15, label: 'IT & Systems', description: 'IT infrastructure, system architecture, and data management' }
    ]);

    console.log(`✅ Created ${categories.length} categories`);

    // Get category references
    const catMap = {};
    for (const cat of categories) {
      catMap[cat.categoryNumber] = cat.id;
    }

    // Insert subcategories for Category 1: Contractual Documents
    const subcategories = await DocSubcategory.bulkCreate([
      // Category 1: Contractual Documents
      { categoryId: catMap[1], label: 'Main Contractual Documents', description: 'Core contract documents', orderIndex: 1 },
      { categoryId: catMap[1], label: 'Pre-Contractual Documents', description: 'Tender and proposal documents', orderIndex: 2 },
      { categoryId: catMap[1], label: 'Contract Modifications', description: 'Amendments and change orders', orderIndex: 3 },
      { categoryId: catMap[1], label: 'Contractual Financial Documents', description: 'Bonds, guarantees, and insurance', orderIndex: 4 },
      
      // Category 2: Project Management Documents
      { categoryId: catMap[2], label: 'Framing Documents', description: 'Project charter and business case', orderIndex: 1 },
      { categoryId: catMap[2], label: 'Management Plans', description: 'PMP, PEP, risk, quality plans', orderIndex: 2 },
      { categoryId: catMap[2], label: 'Planning Documents', description: 'Schedules and baselines', orderIndex: 3 },
      { categoryId: catMap[2], label: 'Monitoring and Control', description: 'Reports and dashboards', orderIndex: 4 },
      { categoryId: catMap[2], label: 'Closure Documents', description: 'Project closure and lessons learned', orderIndex: 5 },
    ]);

    console.log(`✅ Created ${subcategories.length} subcategories`);

    // Get subcategory references
    const subcatMap = {};
    for (const sub of subcategories) {
      subcatMap[sub.label] = sub.id;
    }

    // Insert document types
    const docTypes = await DocType.bulkCreate([
      // Main Contractual Documents
      { subcategoryId: subcatMap['Main Contractual Documents'], label: 'Main Contract / Agreement', isPeriodic: false, entityType: 'contract', nativeFormat: ['pdf', 'docx', 'doc'], onlyOnePerProject: true, tableMetier: 'contracts_meta' },
      { subcategoryId: subcatMap['Main Contractual Documents'], label: 'Letter of Award / Notice to Proceed', isPeriodic: false, entityType: 'correspondence', nativeFormat: ['pdf', 'docx', 'doc'], onlyOnePerProject: true, tableMetier: 'correspondence_meta' },
      { subcategoryId: subcatMap['Main Contractual Documents'], label: 'General Conditions', isPeriodic: false, entityType: 'contract', nativeFormat: ['pdf', 'docx', 'doc'], onlyOnePerProject: true, tableMetier: 'contracts_meta' },
      { subcategoryId: subcatMap['Main Contractual Documents'], label: 'Special Conditions / Particular Conditions', isPeriodic: false, entityType: 'contract', nativeFormat: ['pdf', 'docx', 'doc'], onlyOnePerProject: true, tableMetier: 'contracts_meta' },
      
      // Pre-Contractual Documents
      { subcategoryId: subcatMap['Pre-Contractual Documents'], label: 'Tender / RFP - Request for Proposal', isPeriodic: false, entityType: 'tender', nativeFormat: ['pdf', 'docx', 'doc', 'xlsx'], onlyOnePerProject: true, tableMetier: 'contracts_meta' },
      { subcategoryId: subcatMap['Pre-Contractual Documents'], label: 'Commercial Proposal / Bid', isPeriodic: false, entityType: 'tender', nativeFormat: ['pdf', 'docx', 'doc', 'xlsx'], onlyOnePerProject: true, tableMetier: 'contracts_meta' },
      { subcategoryId: subcatMap['Pre-Contractual Documents'], label: 'Technical Proposal', isPeriodic: false, entityType: 'tender', nativeFormat: ['pdf', 'docx', 'doc'], onlyOnePerProject: true, tableMetier: 'contracts_meta' },
      
      // Framing Documents
      { subcategoryId: subcatMap['Framing Documents'], label: 'Project Charter', isPeriodic: false, entityType: 'management', nativeFormat: ['pdf', 'docx', 'doc', 'xlsx'], onlyOnePerProject: true, tableMetier: 'technical_docs_meta' },
      { subcategoryId: subcatMap['Framing Documents'], label: 'Business Case', isPeriodic: false, entityType: 'management', nativeFormat: ['pdf', 'docx', 'doc', 'xlsx'], onlyOnePerProject: true, tableMetier: 'technical_docs_meta' },
      
      // Management Plans
      { subcategoryId: subcatMap['Management Plans'], label: 'Project Management Plan / PMP', isPeriodic: false, entityType: 'plan', nativeFormat: ['pdf', 'docx', 'doc'], onlyOnePerProject: true, tableMetier: 'technical_docs_meta' },
      { subcategoryId: subcatMap['Management Plans'], label: 'Risk Management Plan', isPeriodic: false, entityType: 'plan', nativeFormat: ['pdf', 'docx', 'doc'], onlyOnePerProject: true, tableMetier: 'technical_docs_meta' },
      
      // Planning Documents
      { subcategoryId: subcatMap['Planning Documents'], label: 'Baseline Schedule', isPeriodic: false, entityType: 'schedule_baseline', nativeFormat: ['pdf', 'xer', 'xml', 'mpp', 'xlsx'], onlyOnePerProject: true, tableMetier: 'schdl_baselines' },
      { subcategoryId: subcatMap['Planning Documents'], label: 'Current Schedule', isPeriodic: true, entityType: 'schedule_current', nativeFormat: ['pdf', 'xer', 'xml', 'mpp', 'xlsx'], onlyOnePerProject: false, tableMetier: 'schdl_currents' },
      
      // Monitoring and Control
      { subcategoryId: subcatMap['Monitoring and Control'], label: 'Weekly Progress Reports', isPeriodic: true, entityType: 'report', nativeFormat: ['pdf', 'docx', 'xlsx'], onlyOnePerProject: false, tableMetier: 'periodic_reports' },
      { subcategoryId: subcatMap['Monitoring and Control'], label: 'Monthly Progress Reports', isPeriodic: true, entityType: 'report', nativeFormat: ['pdf', 'docx', 'xlsx'], onlyOnePerProject: false, tableMetier: 'periodic_reports' },
    ]);

    console.log(`✅ Created ${docTypes.length} document types`);

    res.status(201).json({
      message: 'Classification initialized successfully',
      data: {
        categories: categories.length,
        subcategories: subcategories.length,
        docTypes: docTypes.length
      }
    });
  } catch (error) {
    console.error('Initialization error:', error);
    res.status(500).json({ 
      message: 'Failed to initialize classification', 
      error: error.message 
    });
  }
});

export default router;
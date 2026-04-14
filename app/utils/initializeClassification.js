// backend/app/utils/initializeClassification.js
import { DocCategory, DocSubcategory, DocType } from '../models/index.js';

export const initializeClassificationData = async () => {
  try {
    console.log('📚 Checking if classification data exists...');
    
    // Check if already initialized
    const existingCategories = await DocCategory.count();
    if (existingCategories > 0) {
      console.log(`✅ Classification already initialized (${existingCategories} categories found)`);
      return { alreadyInitialized: true, categories: existingCategories };
    }

    console.log('🚀 Initializing full document classification library...');

    // ============================================
    // 1. CREATE ALL 15 CATEGORIES
    // ============================================
    const cat1 = await DocCategory.create({ label: 'Contractual Documents', description: 'Legal and contractual documentation for project execution' });
    console.log(`✅ Created category 1: ${cat1.label}`);
    
    const cat2 = await DocCategory.create({ label: 'Project Management Documents', description: 'Documents for project planning, monitoring, and control' });
    console.log(`✅ Created category 2: ${cat2.label}`);
    
    const cat3 = await DocCategory.create({ label: 'Technical Reference Documents', description: 'Technical specifications, studies, and reference materials' });
    console.log(`✅ Created category 3: ${cat3.label}`);
    
    const cat4 = await DocCategory.create({ label: 'Engineering Documents', description: 'Engineering drawings, calculations, and design documents' });
    console.log(`✅ Created category 4: ${cat4.label}`);
    
    const cat5 = await DocCategory.create({ label: 'Procurement Documents', description: 'Purchasing, vendor management, and logistics documents' });
    console.log(`✅ Created category 5: ${cat5.label}`);
    
    const cat6 = await DocCategory.create({ label: 'Construction Documents', description: 'Site execution, method statements, and construction records' });
    console.log(`✅ Created category 6: ${cat6.label}`);
    
    const cat7 = await DocCategory.create({ label: 'Quality Documents (QA/QC)', description: 'Quality management, inspections, and test records' });
    console.log(`✅ Created category 7: ${cat7.label}`);
    
    const cat8 = await DocCategory.create({ label: 'HSE Documents', description: 'Health, Safety, and Environment management documents' });
    console.log(`✅ Created category 8: ${cat8.label}`);
    
    const cat9 = await DocCategory.create({ label: 'Commissioning & Start-Up', description: 'Commissioning plans, procedures, and test reports' });
    console.log(`✅ Created category 9: ${cat9.label}`);
    
    const cat10 = await DocCategory.create({ label: 'Regulatory Documents & Permits', description: 'Permits, licenses, and compliance documents' });
    console.log(`✅ Created category 10: ${cat10.label}`);
    
    const cat11 = await DocCategory.create({ label: 'Financial & Commercial', description: 'Budget, cost, invoicing, and financial reports' });
    console.log(`✅ Created category 11: ${cat11.label}`);
    
    const cat12 = await DocCategory.create({ label: 'Communication & Coordination', description: 'Meeting minutes, correspondence, and coordination documents' });
    console.log(`✅ Created category 12: ${cat12.label}`);
    
    const cat13 = await DocCategory.create({ label: 'Legal & Insurance', description: 'Legal opinions, insurance policies, and dispute documents' });
    console.log(`✅ Created category 13: ${cat13.label}`);
    
    const cat14 = await DocCategory.create({ label: 'Human Resources', description: 'Organization charts, job descriptions, and personnel records' });
    console.log(`✅ Created category 14: ${cat14.label}`);
    
    const cat15 = await DocCategory.create({ label: 'IT & Systems', description: 'IT infrastructure, system architecture, and data management' });
    console.log(`✅ Created category 15: ${cat15.label}`);

    // ============================================
    // 2. CREATE SUBCATEGORIES
    // ============================================
    
    // Category 1: Contractual Documents
    const sub1_1 = await DocSubcategory.create({ category_id: cat1.id, label: 'Main Contractual Documents', description: 'Core contract documents', orderIndex: 1 });
    const sub1_2 = await DocSubcategory.create({ category_id: cat1.id, label: 'Pre-Contractual Documents', description: 'Tender and proposal documents', orderIndex: 2 });
    const sub1_3 = await DocSubcategory.create({ category_id: cat1.id, label: 'Contract Modifications', description: 'Amendments and change orders', orderIndex: 3 });
    const sub1_4 = await DocSubcategory.create({ category_id: cat1.id, label: 'Contractual Financial Documents', description: 'Bonds, guarantees, and insurance', orderIndex: 4 });
    
    // Category 2: Project Management Documents
    const sub2_1 = await DocSubcategory.create({ category_id: cat2.id, label: 'Framing Documents', description: 'Project charter and business case', orderIndex: 1 });
    const sub2_2 = await DocSubcategory.create({ category_id: cat2.id, label: 'Management Plans', description: 'PMP, PEP, risk, quality plans', orderIndex: 2 });
    const sub2_3 = await DocSubcategory.create({ category_id: cat2.id, label: 'Planning Documents', description: 'Schedules and baselines', orderIndex: 3 });
    const sub2_4 = await DocSubcategory.create({ category_id: cat2.id, label: 'Monitoring and Control', description: 'Reports and dashboards', orderIndex: 4 });
    const sub2_5 = await DocSubcategory.create({ category_id: cat2.id, label: 'Closure Documents', description: 'Project closure and lessons learned', orderIndex: 5 });
    
    // Category 3: Technical Reference Documents
    const sub3_1 = await DocSubcategory.create({ category_id: cat3.id, label: 'Design Documents', description: 'Design criteria and specifications', orderIndex: 1 });
    const sub3_2 = await DocSubcategory.create({ category_id: cat3.id, label: 'Scope and Description', description: 'Scope of work and deliverables', orderIndex: 2 });
    const sub3_3 = await DocSubcategory.create({ category_id: cat3.id, label: 'Technical Studies', description: 'Feasibility and impact studies', orderIndex: 3 });
    
    // Category 4: Engineering Documents
    const sub4_1 = await DocSubcategory.create({ category_id: cat4.id, label: 'General Engineering', description: 'Design basis and calculations', orderIndex: 1 });
    const sub4_2 = await DocSubcategory.create({ category_id: cat4.id, label: 'Civil & Structural', description: 'Structural drawings and calculations', orderIndex: 2 });
    const sub4_3 = await DocSubcategory.create({ category_id: cat4.id, label: 'Mechanical', description: 'P&IDs and equipment layouts', orderIndex: 3 });
    const sub4_4 = await DocSubcategory.create({ category_id: cat4.id, label: 'Electrical & Instrumentation', description: 'SLD and wiring diagrams', orderIndex: 4 });
    const sub4_5 = await DocSubcategory.create({ category_id: cat4.id, label: 'Piping', description: 'Isometrics and routing plans', orderIndex: 5 });
    const sub4_6 = await DocSubcategory.create({ category_id: cat4.id, label: 'Modeling', description: '3D models and BIM', orderIndex: 6 });
    
    // Category 5: Procurement Documents
    const sub5_1 = await DocSubcategory.create({ category_id: cat5.id, label: 'Purchase Documents', description: 'PR, RFQ, PO', orderIndex: 1 });
    const sub5_2 = await DocSubcategory.create({ category_id: cat5.id, label: 'Technical Procurement Documents', description: 'Specifications and MR', orderIndex: 2 });
    const sub5_3 = await DocSubcategory.create({ category_id: cat5.id, label: 'Tracking and Logistics', description: 'Shipping and receiving', orderIndex: 3 });
    const sub5_4 = await DocSubcategory.create({ category_id: cat5.id, label: 'Vendor Qualification', description: 'AVL and vendor evaluations', orderIndex: 4 });
    
    // Category 6: Construction Documents
    const sub6_1 = await DocSubcategory.create({ category_id: cat6.id, label: 'Construction Planning', description: 'Site plans and method statements', orderIndex: 1 });
    const sub6_2 = await DocSubcategory.create({ category_id: cat6.id, label: 'Construction Execution', description: 'Daily reports and permits', orderIndex: 2 });
    const sub6_3 = await DocSubcategory.create({ category_id: cat6.id, label: 'As-Built', description: 'Record drawings and dossiers', orderIndex: 3 });
    
    // Category 7: Quality Documents
    const sub7_1 = await DocSubcategory.create({ category_id: cat7.id, label: 'Quality System', description: 'Quality manual and procedures', orderIndex: 1 });
    const sub7_2 = await DocSubcategory.create({ category_id: cat7.id, label: 'Inspection and Control', description: 'ITP and NCR', orderIndex: 2 });
    const sub7_3 = await DocSubcategory.create({ category_id: cat7.id, label: 'Quality Audits', description: 'Audit reports and action plans', orderIndex: 3 });
    
    // Category 8: HSE Documents
    const sub8_1 = await DocSubcategory.create({ category_id: cat8.id, label: 'HSE Management', description: 'HSE plan and procedures', orderIndex: 1 });
    const sub8_2 = await DocSubcategory.create({ category_id: cat8.id, label: 'Safety', description: 'Permits and JSA', orderIndex: 2 });
    const sub8_3 = await DocSubcategory.create({ category_id: cat8.id, label: 'Environment', description: 'EIA and environmental plans', orderIndex: 3 });
    
    // Category 9: Commissioning
    const sub9_1 = await DocSubcategory.create({ category_id: cat9.id, label: 'Commissioning Planning', description: 'Commissioning plan and schedule', orderIndex: 1 });
    const sub9_2 = await DocSubcategory.create({ category_id: cat9.id, label: 'Commissioning Execution', description: 'Checklists and test reports', orderIndex: 2 });
    const sub9_3 = await DocSubcategory.create({ category_id: cat9.id, label: 'Training and Handover', description: 'Manuals and training records', orderIndex: 3 });
    
    // Category 10: Regulatory
    const sub10_1 = await DocSubcategory.create({ category_id: cat10.id, label: 'Administrative Authorizations', description: 'Building permits and licenses', orderIndex: 1 });
    const sub10_2 = await DocSubcategory.create({ category_id: cat10.id, label: 'Specialized Permits', description: 'Working permits and site access', orderIndex: 2 });
    const sub10_3 = await DocSubcategory.create({ category_id: cat10.id, label: 'Regulatory Compliance', description: 'Compliance reports and declarations', orderIndex: 3 });
    
    // Category 11: Financial
    const sub11_1 = await DocSubcategory.create({ category_id: cat11.id, label: 'Budget and Costs', description: 'Budget and cost breakdown', orderIndex: 1 });
    const sub11_2 = await DocSubcategory.create({ category_id: cat11.id, label: 'Invoicing and Payments', description: 'Invoices and payment certificates', orderIndex: 2 });
    const sub11_3 = await DocSubcategory.create({ category_id: cat11.id, label: 'Project Accounting', description: 'Financial reports and audits', orderIndex: 3 });
    
    // Category 12: Communication
    const sub12_1 = await DocSubcategory.create({ category_id: cat12.id, label: 'Meetings', description: 'Meeting minutes and agendas', orderIndex: 1 });
    const sub12_2 = await DocSubcategory.create({ category_id: cat12.id, label: 'Correspondence', description: 'Letters and RFIs', orderIndex: 2 });
    const sub12_3 = await DocSubcategory.create({ category_id: cat12.id, label: 'Coordination', description: 'Communication matrix and registers', orderIndex: 3 });
    
    // Category 13: Legal
    const sub13_1 = await DocSubcategory.create({ category_id: cat13.id, label: 'Legal Documents', description: 'Legal opinions and NDAs', orderIndex: 1 });
    const sub13_2 = await DocSubcategory.create({ category_id: cat13.id, label: 'Insurance', description: 'Insurance policies and claims', orderIndex: 2 });
    const sub13_3 = await DocSubcategory.create({ category_id: cat13.id, label: 'Disputes', description: 'Claims and arbitration awards', orderIndex: 3 });
    
    // Category 14: HR
    const sub14_1 = await DocSubcategory.create({ category_id: cat14.id, label: 'Organization', description: 'Org charts and job descriptions', orderIndex: 1 });
    const sub14_2 = await DocSubcategory.create({ category_id: cat14.id, label: 'Mobilization', description: 'Employment contracts and visas', orderIndex: 2 });
    const sub14_3 = await DocSubcategory.create({ category_id: cat14.id, label: 'HR Tracking', description: 'Timesheets and manpower reports', orderIndex: 3 });
    
    // Category 15: IT
    const sub15_1 = await DocSubcategory.create({ category_id: cat15.id, label: 'IT Infrastructure', description: 'IT infrastructure plans', orderIndex: 1 });
    const sub15_2 = await DocSubcategory.create({ category_id: cat15.id, label: 'Applications and Software', description: 'Software requirements', orderIndex: 2 });
    const sub15_3 = await DocSubcategory.create({ category_id: cat15.id, label: 'Data Management', description: 'Data management plans', orderIndex: 3 });

    console.log('✅ Created all subcategories');

    // ============================================
    // 3. CREATE DOCUMENT TYPES
    // ============================================
    
    // CATEGORY 1: CONTRACTUAL DOCUMENTS
    // 1.1 Main Contractual Documents
    await DocType.create({ subcategory_id: sub1_1.id, label: 'Main Contract / Agreement', is_periodic: false, only_one_per_project: true, entity_type: 'contract', native_format: 'pdf,docx,doc' });
    await DocType.create({ subcategory_id: sub1_1.id, label: 'Letter of Award / Notice to Proceed', is_periodic: false, only_one_per_project: true, entity_type: 'correspondence', native_format: 'pdf,docx,doc' });
    await DocType.create({ subcategory_id: sub1_1.id, label: 'General Conditions', is_periodic: false, only_one_per_project: true, entity_type: 'contract', native_format: 'pdf,docx,doc' });
    await DocType.create({ subcategory_id: sub1_1.id, label: 'Special Conditions / Particular Conditions', is_periodic: false, only_one_per_project: true, entity_type: 'contract', native_format: 'pdf,docx,doc' });
    await DocType.create({ subcategory_id: sub1_1.id, label: 'Contract Appendices', is_periodic: false, only_one_per_project: true, entity_type: 'contract', native_format: 'pdf,docx,doc,xlsx' });
    
    // 1.2 Pre-Contractual Documents
    await DocType.create({ subcategory_id: sub1_2.id, label: 'Tender / RFP - Request for Proposal', is_periodic: false, only_one_per_project: true, entity_type: 'tender', native_format: 'pdf,docx,doc,xlsx' });
    await DocType.create({ subcategory_id: sub1_2.id, label: 'Commercial Proposal / Bid', is_periodic: false, only_one_per_project: true, entity_type: 'tender', native_format: 'pdf,docx,doc,xlsx' });
    await DocType.create({ subcategory_id: sub1_2.id, label: 'Technical Proposal', is_periodic: false, only_one_per_project: true, entity_type: 'tender', native_format: 'pdf,docx,doc' });
    await DocType.create({ subcategory_id: sub1_2.id, label: 'Clarifications / Q&A Responses', is_periodic: false, only_one_per_project: true, entity_type: 'correspondence', native_format: 'pdf,docx,doc' });
    await DocType.create({ subcategory_id: sub1_2.id, label: 'Negotiation Minutes', is_periodic: false, only_one_per_project: true, entity_type: 'meeting', native_format: 'pdf,docx,doc' });
    
    // 1.3 Contract Modifications
    await DocType.create({ subcategory_id: sub1_3.id, label: 'Contract Amendments / Variations', is_periodic: false, only_one_per_project: false, entity_type: 'contract', native_format: 'pdf,docx,doc' });
    await DocType.create({ subcategory_id: sub1_3.id, label: 'Change Orders / Variation Orders', is_periodic: false, only_one_per_project: false, entity_type: 'contract', native_format: 'pdf,docx,doc' });
    await DocType.create({ subcategory_id: sub1_3.id, label: 'Claims / Disputes', is_periodic: false, only_one_per_project: false, entity_type: 'legal', native_format: 'pdf,docx,doc' });
    await DocType.create({ subcategory_id: sub1_3.id, label: 'Contract Correspondence', is_periodic: false, only_one_per_project: false, entity_type: 'correspondence', native_format: 'pdf,docx,doc' });
    await DocType.create({ subcategory_id: sub1_3.id, label: 'Formal Notices', is_periodic: false, only_one_per_project: false, entity_type: 'correspondence', native_format: 'pdf,docx,doc' });
    
    // 1.4 Contractual Financial Documents
    await DocType.create({ subcategory_id: sub1_4.id, label: 'Bank Guarantees / Performance Bonds', is_periodic: false, only_one_per_project: false, entity_type: 'financial', native_format: 'pdf,docx,doc' });
    await DocType.create({ subcategory_id: sub1_4.id, label: 'Performance Bond', is_periodic: false, only_one_per_project: true, entity_type: 'financial', native_format: 'pdf,docx,doc' });
    await DocType.create({ subcategory_id: sub1_4.id, label: 'Advance Payment Guarantee', is_periodic: false, only_one_per_project: true, entity_type: 'financial', native_format: 'pdf,docx,doc' });
    await DocType.create({ subcategory_id: sub1_4.id, label: 'Retention Bond', is_periodic: false, only_one_per_project: true, entity_type: 'financial', native_format: 'pdf,docx,doc' });
    await DocType.create({ subcategory_id: sub1_4.id, label: 'Insurance Policies', is_periodic: false, only_one_per_project: false, entity_type: 'insurance', native_format: 'pdf,docx,doc' });
    await DocType.create({ subcategory_id: sub1_4.id, label: 'Bid Bond', is_periodic: false, only_one_per_project: true, entity_type: 'financial', native_format: 'pdf,docx,doc' });
    
    // CATEGORY 2: PROJECT MANAGEMENT DOCUMENTS
    // 2.1 Framing Documents
    await DocType.create({ subcategory_id: sub2_1.id, label: 'Project Charter', is_periodic: false, only_one_per_project: true, entity_type: 'management', native_format: 'pdf,docx,doc,xlsx' });
    await DocType.create({ subcategory_id: sub2_1.id, label: 'Business Case', is_periodic: false, only_one_per_project: true, entity_type: 'management', native_format: 'pdf,docx,doc,xlsx' });
    await DocType.create({ subcategory_id: sub2_1.id, label: 'Feasibility Study', is_periodic: false, only_one_per_project: true, entity_type: 'study', native_format: 'pdf,docx,doc,xlsx' });
    await DocType.create({ subcategory_id: sub2_1.id, label: 'Cost-Benefit Analysis', is_periodic: false, only_one_per_project: true, entity_type: 'study', native_format: 'pdf,docx,doc,xlsx' });
    
    // 2.2 Management Plans
    await DocType.create({ subcategory_id: sub2_2.id, label: 'Project Management Plan / PMP', is_periodic: false, only_one_per_project: true, entity_type: 'plan', native_format: 'pdf,docx,doc' });
    await DocType.create({ subcategory_id: sub2_2.id, label: 'Project Execution Plan / PEP', is_periodic: false, only_one_per_project: true, entity_type: 'plan', native_format: 'pdf,docx,doc' });
    await DocType.create({ subcategory_id: sub2_2.id, label: 'Risk Management Plan', is_periodic: false, only_one_per_project: true, entity_type: 'plan', native_format: 'pdf,docx,doc' });
    await DocType.create({ subcategory_id: sub2_2.id, label: 'Quality Management Plan', is_periodic: false, only_one_per_project: true, entity_type: 'plan', native_format: 'pdf,docx,doc' });
    await DocType.create({ subcategory_id: sub2_2.id, label: 'Health, Safety & Environment Plan', is_periodic: false, only_one_per_project: true, entity_type: 'plan', native_format: 'pdf,docx,doc' });
    await DocType.create({ subcategory_id: sub2_2.id, label: 'Communication Plan', is_periodic: false, only_one_per_project: true, entity_type: 'plan', native_format: 'pdf,docx,doc' });
    await DocType.create({ subcategory_id: sub2_2.id, label: 'Stakeholder Management Plan', is_periodic: false, only_one_per_project: true, entity_type: 'plan', native_format: 'pdf,docx,doc' });
    await DocType.create({ subcategory_id: sub2_2.id, label: 'Change Management Plan', is_periodic: false, only_one_per_project: true, entity_type: 'plan', native_format: 'pdf,docx,doc' });
    await DocType.create({ subcategory_id: sub2_2.id, label: 'Configuration Management Plan', is_periodic: false, only_one_per_project: true, entity_type: 'plan', native_format: 'pdf,docx,doc' });
    
    // 2.3 Planning Documents
    await DocType.create({ subcategory_id: sub2_3.id, label: 'Baseline Schedule', is_periodic: false, only_one_per_project: true, entity_type: 'schedule_baseline', native_format: 'pdf,xer,xml,mpp,xlsx' });
    await DocType.create({ subcategory_id: sub2_3.id, label: 'Detailed Schedule / Master Schedule', is_periodic: false, only_one_per_project: true, entity_type: 'schedule_baseline', native_format: 'pdf,xer,xml,mpp,xlsx' });
    await DocType.create({ subcategory_id: sub2_3.id, label: 'Milestone Schedule', is_periodic: false, only_one_per_project: false, entity_type: 'schedule_baseline', native_format: 'pdf,xer,xml,mpp,xlsx' });
    await DocType.create({ subcategory_id: sub2_3.id, label: 'Procurement Schedule', is_periodic: false, only_one_per_project: false, entity_type: 'schedule_baseline', native_format: 'pdf,xer,xml,mpp,xlsx' });
    await DocType.create({ subcategory_id: sub2_3.id, label: 'Resource Schedule', is_periodic: false, only_one_per_project: false, entity_type: 'schedule_baseline', native_format: 'pdf,xer,xml,mpp,xlsx' });
    await DocType.create({ subcategory_id: sub2_3.id, label: 'Lookahead Schedules (4-6 week plans)', is_periodic: true, only_one_per_project: false, entity_type: 'schedule_current', native_format: 'pdf,xer,xml,mpp,xlsx' });
    await DocType.create({ subcategory_id: sub2_3.id, label: 'Current Schedule', is_periodic: true, only_one_per_project: false, entity_type: 'schedule_current', native_format: 'pdf,xer,xml,mpp,xlsx' });
    await DocType.create({ subcategory_id: sub2_3.id, label: 'Commissioning Schedule', is_periodic: false, only_one_per_project: true, entity_type: 'schedule_baseline', native_format: 'pdf,xer,xml,mpp' });
    
    // 2.4 Monitoring and Control Documents
    await DocType.create({ subcategory_id: sub2_4.id, label: 'Weekly Progress Reports', is_periodic: true, only_one_per_project: false, entity_type: 'report', native_format: 'pdf,docx,xlsx' });
    await DocType.create({ subcategory_id: sub2_4.id, label: 'Monthly Progress Reports', is_periodic: true, only_one_per_project: false, entity_type: 'report', native_format: 'pdf,docx,xlsx' });
    await DocType.create({ subcategory_id: sub2_4.id, label: 'Dashboards / KPI Reports', is_periodic: true, only_one_per_project: false, entity_type: 'report', native_format: 'pdf,xlsx,pptx' });
    await DocType.create({ subcategory_id: sub2_4.id, label: 'Performance Reports / Earned Value Reports', is_periodic: true, only_one_per_project: false, entity_type: 'report', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub2_4.id, label: 'Variance Reports', is_periodic: true, only_one_per_project: false, entity_type: 'report', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub2_4.id, label: 'Risk Reports / Risk Registers', is_periodic: true, only_one_per_project: false, entity_type: 'report', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub2_4.id, label: 'Issue Logs', is_periodic: true, only_one_per_project: false, entity_type: 'report', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub2_4.id, label: 'HSE Reports / Incident Reports', is_periodic: true, only_one_per_project: false, entity_type: 'hse_report', native_format: 'pdf,docx,xlsx' });
    
    // 2.5 Closure Documents
    await DocType.create({ subcategory_id: sub2_5.id, label: 'Project Closure Report', is_periodic: false, only_one_per_project: true, entity_type: 'report', native_format: 'pdf,docx,xlsx' });
    await DocType.create({ subcategory_id: sub2_5.id, label: 'Lessons Learned', is_periodic: false, only_one_per_project: true, entity_type: 'report', native_format: 'pdf,docx,xlsx' });
    await DocType.create({ subcategory_id: sub2_5.id, label: 'Post-Implementation Review', is_periodic: false, only_one_per_project: true, entity_type: 'report', native_format: 'pdf,docx,xlsx' });
    await DocType.create({ subcategory_id: sub2_5.id, label: 'Completion Certificate', is_periodic: false, only_one_per_project: true, entity_type: 'certificate', native_format: 'pdf,docx,doc' });
    await DocType.create({ subcategory_id: sub2_5.id, label: 'Acceptance Certificate / Handover Certificate', is_periodic: false, only_one_per_project: true, entity_type: 'certificate', native_format: 'pdf,docx,doc' });
    
    // CATEGORY 3: TECHNICAL REFERENCE DOCUMENTS
    // 3.1 Design Documents
    await DocType.create({ subcategory_id: sub3_1.id, label: 'Basis of Design (BOD)', is_periodic: false, only_one_per_project: true, entity_type: 'technical', native_format: 'pdf,docx,doc' });
    await DocType.create({ subcategory_id: sub3_1.id, label: 'Design Philosophy', is_periodic: false, only_one_per_project: true, entity_type: 'technical', native_format: 'pdf,docx,doc' });
    await DocType.create({ subcategory_id: sub3_1.id, label: 'Design Criteria', is_periodic: false, only_one_per_project: true, entity_type: 'technical', native_format: 'pdf,docx,doc' });
    await DocType.create({ subcategory_id: sub3_1.id, label: 'Design Assumptions', is_periodic: false, only_one_per_project: true, entity_type: 'technical', native_format: 'pdf,docx,doc' });
    await DocType.create({ subcategory_id: sub3_1.id, label: 'Applicable Codes & Standards', is_periodic: false, only_one_per_project: true, entity_type: 'technical', native_format: 'pdf,docx,doc' });
    await DocType.create({ subcategory_id: sub3_1.id, label: 'General Technical Specifications', is_periodic: false, only_one_per_project: true, entity_type: 'specification', native_format: 'pdf,docx,doc' });
    
    // 3.2 Scope and Description
    await DocType.create({ subcategory_id: sub3_2.id, label: 'Scope of Work (SOW)', is_periodic: false, only_one_per_project: true, entity_type: 'scope', native_format: 'pdf,docx,doc' });
    await DocType.create({ subcategory_id: sub3_2.id, label: 'Project Description', is_periodic: false, only_one_per_project: true, entity_type: 'technical', native_format: 'pdf,docx,doc' });
    await DocType.create({ subcategory_id: sub3_2.id, label: 'Work Breakdown Structure Dictionary', is_periodic: false, only_one_per_project: true, entity_type: 'management', native_format: 'pdf,docx,xlsx' });
    await DocType.create({ subcategory_id: sub3_2.id, label: 'Deliverables List', is_periodic: false, only_one_per_project: true, entity_type: 'management', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub3_2.id, label: 'RACI Matrix / Responsibility Assignment Matrix', is_periodic: false, only_one_per_project: true, entity_type: 'management', native_format: 'pdf,xlsx' });
    
    // 3.3 Technical Studies
    await DocType.create({ subcategory_id: sub3_3.id, label: 'Geotechnical Studies / Soil Reports', is_periodic: false, only_one_per_project: false, entity_type: 'study', native_format: 'pdf,docx,dwg' });
    await DocType.create({ subcategory_id: sub3_3.id, label: 'Topographic Surveys', is_periodic: false, only_one_per_project: false, entity_type: 'survey', native_format: 'pdf,dwg,dgn' });
    await DocType.create({ subcategory_id: sub3_3.id, label: 'Environmental Impact Studies', is_periodic: false, only_one_per_project: true, entity_type: 'study', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub3_3.id, label: 'Traffic Studies', is_periodic: false, only_one_per_project: false, entity_type: 'study', native_format: 'pdf,docx,xlsx' });
    await DocType.create({ subcategory_id: sub3_3.id, label: 'Hydraulic Studies', is_periodic: false, only_one_per_project: false, entity_type: 'study', native_format: 'pdf,docx,xlsx' });
    await DocType.create({ subcategory_id: sub3_3.id, label: 'Seismic Studies', is_periodic: false, only_one_per_project: false, entity_type: 'study', native_format: 'pdf,docx' });
    
    // CATEGORY 4: ENGINEERING DOCUMENTS
    // 4.1 General Engineering
    await DocType.create({ subcategory_id: sub4_1.id, label: 'Design Basis Memorandum (DBM)', is_periodic: false, only_one_per_project: true, entity_type: 'engineering', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub4_1.id, label: 'Engineering Standards', is_periodic: false, only_one_per_project: true, entity_type: 'engineering', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub4_1.id, label: 'Calculation Notes', is_periodic: false, only_one_per_project: false, entity_type: 'calculation', native_format: 'pdf,xlsx,docx' });
    await DocType.create({ subcategory_id: sub4_1.id, label: 'Design Reports', is_periodic: false, only_one_per_project: false, entity_type: 'engineering', native_format: 'pdf,docx' });
    
    // 4.2 Civil & Structural
    await DocType.create({ subcategory_id: sub4_2.id, label: 'Architectural Drawings', is_periodic: false, only_one_per_project: false, entity_type: 'drawing', native_format: 'pdf,dwg,dxf,rvt' });
    await DocType.create({ subcategory_id: sub4_2.id, label: 'Structural Drawings', is_periodic: false, only_one_per_project: false, entity_type: 'drawing', native_format: 'pdf,dwg,dxf,rvt' });
    await DocType.create({ subcategory_id: sub4_2.id, label: 'Foundation Drawings', is_periodic: false, only_one_per_project: false, entity_type: 'drawing', native_format: 'pdf,dwg,dxf,rvt' });
    await DocType.create({ subcategory_id: sub4_2.id, label: 'Structural Calculations', is_periodic: false, only_one_per_project: false, entity_type: 'calculation', native_format: 'pdf,xlsx,docx' });
    
    // 4.3 Mechanical
    await DocType.create({ subcategory_id: sub4_3.id, label: 'P&IDs (Piping & Instrumentation Diagrams)', is_periodic: false, only_one_per_project: false, entity_type: 'drawing', native_format: 'pdf,dwg,dxf' });
    await DocType.create({ subcategory_id: sub4_3.id, label: 'PFDs (Process Flow Diagrams)', is_periodic: false, only_one_per_project: false, entity_type: 'drawing', native_format: 'pdf,dwg,dxf' });
    await DocType.create({ subcategory_id: sub4_3.id, label: 'Equipment Layouts', is_periodic: false, only_one_per_project: false, entity_type: 'drawing', native_format: 'pdf,dwg,dxf,rvt' });
    await DocType.create({ subcategory_id: sub4_3.id, label: 'Equipment Datasheets', is_periodic: false, only_one_per_project: false, entity_type: 'datasheet', native_format: 'pdf,xlsx,docx' });
    await DocType.create({ subcategory_id: sub4_3.id, label: 'Equipment Manuals', is_periodic: false, only_one_per_project: false, entity_type: 'manual', native_format: 'pdf' });
    
    // 4.4 Electrical & Instrumentation
    await DocType.create({ subcategory_id: sub4_4.id, label: 'Single Line Diagrams / SLD', is_periodic: false, only_one_per_project: false, entity_type: 'drawing', native_format: 'pdf,dwg,dxf' });
    await DocType.create({ subcategory_id: sub4_4.id, label: 'Wiring Diagrams', is_periodic: false, only_one_per_project: false, entity_type: 'drawing', native_format: 'pdf,dwg,dxf' });
    await DocType.create({ subcategory_id: sub4_4.id, label: 'Electrical Distribution Plans', is_periodic: false, only_one_per_project: false, entity_type: 'drawing', native_format: 'pdf,dwg,dxf' });
    await DocType.create({ subcategory_id: sub4_4.id, label: 'Loop Diagrams', is_periodic: false, only_one_per_project: false, entity_type: 'drawing', native_format: 'pdf,dwg,dxf' });
    await DocType.create({ subcategory_id: sub4_4.id, label: 'Instrument Index', is_periodic: false, only_one_per_project: false, entity_type: 'index', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub4_4.id, label: 'Cable Schedules', is_periodic: false, only_one_per_project: false, entity_type: 'schedule', native_format: 'pdf,xlsx' });
    
    // 4.5 Piping
    await DocType.create({ subcategory_id: sub4_5.id, label: 'Piping Isometrics', is_periodic: false, only_one_per_project: false, entity_type: 'drawing', native_format: 'pdf,dwg,dxf' });
    await DocType.create({ subcategory_id: sub4_5.id, label: 'Piping Routing Plans', is_periodic: false, only_one_per_project: false, entity_type: 'drawing', native_format: 'pdf,dwg,dxf,rvt' });
    await DocType.create({ subcategory_id: sub4_5.id, label: 'Material Take-Off (MTO)', is_periodic: false, only_one_per_project: false, entity_type: 'material_takeoff', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub4_5.id, label: 'Pipe Support Drawings', is_periodic: false, only_one_per_project: false, entity_type: 'drawing', native_format: 'pdf,dwg,dxf' });
    
    // 4.6 Modeling
    await DocType.create({ subcategory_id: sub4_6.id, label: '3D Models / BIM Models', is_periodic: false, only_one_per_project: true, entity_type: 'model', native_format: 'rvt,dgn,nwd,ifc' });
    await DocType.create({ subcategory_id: sub4_6.id, label: 'Clash Reports', is_periodic: false, only_one_per_project: false, entity_type: 'report', native_format: 'pdf,html,xlsx' });
    await DocType.create({ subcategory_id: sub4_6.id, label: 'As-Built 3D Models', is_periodic: false, only_one_per_project: true, entity_type: 'model', native_format: 'rvt,dgn,nwd,ifc' });
    
    // CATEGORY 5: PROCUREMENT DOCUMENTS
    // 5.1 Purchase Documents
    await DocType.create({ subcategory_id: sub5_1.id, label: 'Purchase Requisitions / PR', is_periodic: false, only_one_per_project: false, entity_type: 'procurement', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub5_1.id, label: 'Request for Quotation / RFQ', is_periodic: false, only_one_per_project: false, entity_type: 'procurement', native_format: 'pdf,docx,xlsx' });
    await DocType.create({ subcategory_id: sub5_1.id, label: 'Invitation to Bid / ITB', is_periodic: false, only_one_per_project: false, entity_type: 'procurement', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub5_1.id, label: 'Vendor Comparison / Bid Tabulation', is_periodic: false, only_one_per_project: false, entity_type: 'procurement', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub5_1.id, label: 'Purchase Orders / PO', is_periodic: false, only_one_per_project: false, entity_type: 'procurement', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub5_1.id, label: 'Vendor Contracts / Subcontracts', is_periodic: false, only_one_per_project: false, entity_type: 'contract', native_format: 'pdf,docx' });
    
    // 5.2 Technical Procurement Documents
    await DocType.create({ subcategory_id: sub5_2.id, label: 'Technical Specifications for Procurement', is_periodic: false, only_one_per_project: false, entity_type: 'specification', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub5_2.id, label: 'Equipment Datasheets', is_periodic: false, only_one_per_project: false, entity_type: 'datasheet', native_format: 'pdf,xlsx,docx' });
    await DocType.create({ subcategory_id: sub5_2.id, label: 'Material Requisitions (MR)', is_periodic: false, only_one_per_project: false, entity_type: 'procurement', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub5_2.id, label: 'Vendor Document Requirements (VDR)', is_periodic: false, only_one_per_project: false, entity_type: 'procurement', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub5_2.id, label: 'Inspection and Test Plans (ITP)', is_periodic: false, only_one_per_project: false, entity_type: 'quality', native_format: 'pdf,xlsx' });
    
    // 5.3 Tracking and Logistics
    await DocType.create({ subcategory_id: sub5_3.id, label: 'Purchase Order Status Reports', is_periodic: true, only_one_per_project: false, entity_type: 'procurement_report', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub5_3.id, label: 'Expedition Status Reports', is_periodic: true, only_one_per_project: false, entity_type: 'procurement_report', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub5_3.id, label: 'Bills of Lading', is_periodic: false, only_one_per_project: false, entity_type: 'logistics', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub5_3.id, label: 'Packing Lists', is_periodic: false, only_one_per_project: false, entity_type: 'logistics', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub5_3.id, label: 'Customs Documentation', is_periodic: false, only_one_per_project: false, entity_type: 'logistics', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub5_3.id, label: 'Delivery Notes', is_periodic: false, only_one_per_project: false, entity_type: 'logistics', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub5_3.id, label: 'Material Receiving Reports (MRR)', is_periodic: false, only_one_per_project: false, entity_type: 'logistics', native_format: 'pdf,xlsx' });
    
    // 5.4 Vendor Qualification
    await DocType.create({ subcategory_id: sub5_4.id, label: 'Approved Vendor List / AVL', is_periodic: false, only_one_per_project: true, entity_type: 'vendor', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub5_4.id, label: 'Vendor Evaluations', is_periodic: false, only_one_per_project: false, entity_type: 'vendor', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub5_4.id, label: 'Vendor Audits', is_periodic: false, only_one_per_project: false, entity_type: 'vendor', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub5_4.id, label: 'Vendor Certifications', is_periodic: false, only_one_per_project: false, entity_type: 'vendor', native_format: 'pdf' });
    
    // CATEGORY 6: CONSTRUCTION DOCUMENTS
    // 6.1 Construction Planning
    await DocType.create({ subcategory_id: sub6_1.id, label: 'Site Layout Plans / Construction Site Plans', is_periodic: false, only_one_per_project: false, entity_type: 'drawing', native_format: 'pdf,dwg,dxf' });
    await DocType.create({ subcategory_id: sub6_1.id, label: 'Construction Methods / Method Statements', is_periodic: false, only_one_per_project: false, entity_type: 'method_statement', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub6_1.id, label: 'Lifting Plans / Rigging Plans', is_periodic: false, only_one_per_project: false, entity_type: 'plan', native_format: 'pdf,docx,dwg' });
    await DocType.create({ subcategory_id: sub6_1.id, label: 'Scaffolding Plans', is_periodic: false, only_one_per_project: false, entity_type: 'drawing', native_format: 'pdf,dwg,dxf' });
    await DocType.create({ subcategory_id: sub6_1.id, label: 'Traffic Management Plans', is_periodic: false, only_one_per_project: false, entity_type: 'plan', native_format: 'pdf,dwg,docx' });
    
    // 6.2 Construction Execution
    await DocType.create({ subcategory_id: sub6_2.id, label: 'Daily Construction Reports / Site Diaries', is_periodic: true, only_one_per_project: false, entity_type: 'construction_report', native_format: 'pdf,xlsx,docx' });
    await DocType.create({ subcategory_id: sub6_2.id, label: 'Work Orders / Job Cards', is_periodic: false, only_one_per_project: false, entity_type: 'work_order', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub6_2.id, label: 'Work Permits / Permit to Work', is_periodic: false, only_one_per_project: false, entity_type: 'permit', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub6_2.id, label: 'Inspection Records / ITP Records', is_periodic: false, only_one_per_project: false, entity_type: 'inspection', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub6_2.id, label: 'Non-Conformance Reports / NCR', is_periodic: false, only_one_per_project: false, entity_type: 'ncr', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub6_2.id, label: 'Punch Lists / Snag Lists', is_periodic: false, only_one_per_project: false, entity_type: 'punch_list', native_format: 'pdf,xlsx' });
    
    // 6.3 As-Built
    await DocType.create({ subcategory_id: sub6_3.id, label: 'As-Built Drawings / Record Drawings', is_periodic: false, only_one_per_project: false, entity_type: 'asbuilt', native_format: 'pdf,dwg,dxf,rvt' });
    await DocType.create({ subcategory_id: sub6_3.id, label: 'Dossier of Executed Works (DOE)', is_periodic: false, only_one_per_project: true, entity_type: 'asbuilt', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub6_3.id, label: 'Welding Books', is_periodic: false, only_one_per_project: false, entity_type: 'welding', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub6_3.id, label: 'Test Records', is_periodic: false, only_one_per_project: false, entity_type: 'test', native_format: 'pdf,xlsx' });
    
    // CATEGORY 7: QUALITY DOCUMENTS (QA/QC)
    // 7.1 Quality System
    await DocType.create({ subcategory_id: sub7_1.id, label: 'Project Quality Manual', is_periodic: false, only_one_per_project: true, entity_type: 'quality', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub7_1.id, label: 'Quality Procedures', is_periodic: false, only_one_per_project: false, entity_type: 'quality', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub7_1.id, label: 'Inspection and Test Plans / ITP', is_periodic: false, only_one_per_project: false, entity_type: 'quality', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub7_1.id, label: 'Hold Points Matrix', is_periodic: false, only_one_per_project: true, entity_type: 'quality', native_format: 'pdf,xlsx' });
    
    // 7.2 Inspection and Control
    await DocType.create({ subcategory_id: sub7_2.id, label: 'Inspection Records', is_periodic: false, only_one_per_project: false, entity_type: 'inspection', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub7_2.id, label: 'Test Reports / Certificates', is_periodic: false, only_one_per_project: false, entity_type: 'test', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub7_2.id, label: 'Material Certificates / Mill Certificates', is_periodic: false, only_one_per_project: false, entity_type: 'certificate', native_format: 'pdf' });
    await DocType.create({ subcategory_id: sub7_2.id, label: 'NDT Reports', is_periodic: false, only_one_per_project: false, entity_type: 'test', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub7_2.id, label: 'Calibration Certificates', is_periodic: false, only_one_per_project: false, entity_type: 'certificate', native_format: 'pdf' });
    await DocType.create({ subcategory_id: sub7_2.id, label: 'NCRs / Deviation Reports', is_periodic: false, only_one_per_project: false, entity_type: 'ncr', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub7_2.id, label: 'Corrective Action Reports / CAR', is_periodic: false, only_one_per_project: false, entity_type: 'quality', native_format: 'pdf,xlsx' });
    
    // 7.3 Quality Audits
    await DocType.create({ subcategory_id: sub7_3.id, label: 'Quality Audit Reports', is_periodic: false, only_one_per_project: false, entity_type: 'audit', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub7_3.id, label: 'Quality Action Plans', is_periodic: false, only_one_per_project: false, entity_type: 'quality', native_format: 'pdf,xlsx' });
    
    // CATEGORY 8: HSE DOCUMENTS
    // 8.1 HSE Management
    await DocType.create({ subcategory_id: sub8_1.id, label: 'HSE Management Plan', is_periodic: false, only_one_per_project: true, entity_type: 'hse_plan', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub8_1.id, label: 'HSE Policy', is_periodic: false, only_one_per_project: true, entity_type: 'hse_plan', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub8_1.id, label: 'HSE Procedures', is_periodic: false, only_one_per_project: false, entity_type: 'hse_procedure', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub8_1.id, label: 'Risk Assessments / HAZOP / HAZID', is_periodic: false, only_one_per_project: false, entity_type: 'risk_assessment', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub8_1.id, label: 'Emergency Response Plans', is_periodic: false, only_one_per_project: true, entity_type: 'hse_plan', native_format: 'pdf,docx' });
    
    // 8.2 Safety
    await DocType.create({ subcategory_id: sub8_2.id, label: 'Permits to Work / Hot Work Permits', is_periodic: false, only_one_per_project: false, entity_type: 'permit', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub8_2.id, label: 'Job Safety Analysis / JSA', is_periodic: false, only_one_per_project: false, entity_type: 'jsa', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub8_2.id, label: 'Toolbox Talks', is_periodic: false, only_one_per_project: false, entity_type: 'toolbox', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub8_2.id, label: 'Incident Reports / Accident Reports', is_periodic: false, only_one_per_project: false, entity_type: 'incident', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub8_2.id, label: 'Accident Investigations', is_periodic: false, only_one_per_project: false, entity_type: 'incident', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub8_2.id, label: 'Safety Statistics / LTI Reports', is_periodic: true, only_one_per_project: false, entity_type: 'hse_report', native_format: 'pdf,xlsx' });
    
    // 8.3 Environment
    await DocType.create({ subcategory_id: sub8_3.id, label: 'Environmental Impact Assessment / EIA', is_periodic: false, only_one_per_project: true, entity_type: 'study', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub8_3.id, label: 'Environmental Management Plans', is_periodic: false, only_one_per_project: true, entity_type: 'hse_plan', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub8_3.id, label: 'Environmental Permits', is_periodic: false, only_one_per_project: false, entity_type: 'permit', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub8_3.id, label: 'Environmental Monitoring Reports', is_periodic: true, only_one_per_project: false, entity_type: 'hse_report', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub8_3.id, label: 'Waste Management Plans', is_periodic: false, only_one_per_project: true, entity_type: 'hse_plan', native_format: 'pdf,docx' });
    
    // CATEGORY 9: COMMISSIONING & START-UP
    // 9.1 Commissioning Planning
    await DocType.create({ subcategory_id: sub9_1.id, label: 'Commissioning Plan', is_periodic: false, only_one_per_project: true, entity_type: 'commissioning', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub9_1.id, label: 'Commissioning Procedures', is_periodic: false, only_one_per_project: false, entity_type: 'commissioning', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub9_1.id, label: 'Start-Up Sequences', is_periodic: false, only_one_per_project: false, entity_type: 'commissioning', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub9_1.id, label: 'Commissioning Schedule', is_periodic: false, only_one_per_project: true, entity_type: 'schedule_baseline', native_format: 'pdf,xer,xml,mpp' });
    
    // 9.2 Commissioning Execution
    await DocType.create({ subcategory_id: sub9_2.id, label: 'Pre-Commissioning Checklists', is_periodic: false, only_one_per_project: false, entity_type: 'checklist', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub9_2.id, label: 'Commissioning Checklists', is_periodic: false, only_one_per_project: false, entity_type: 'checklist', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub9_2.id, label: 'Performance Test Reports', is_periodic: false, only_one_per_project: false, entity_type: 'test', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub9_2.id, label: 'Commissioning Certificates', is_periodic: false, only_one_per_project: false, entity_type: 'certificate', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub9_2.id, label: 'Commissioning Punch Lists', is_periodic: false, only_one_per_project: false, entity_type: 'punch_list', native_format: 'pdf,xlsx' });
    
    // 9.3 Training and Handover
    await DocType.create({ subcategory_id: sub9_3.id, label: 'Operation Manuals / O&M Manuals', is_periodic: false, only_one_per_project: false, entity_type: 'manual', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub9_3.id, label: 'Maintenance Manuals', is_periodic: false, only_one_per_project: false, entity_type: 'manual', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub9_3.id, label: 'Training Plans', is_periodic: false, only_one_per_project: true, entity_type: 'training', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub9_3.id, label: 'Training Certificates', is_periodic: false, only_one_per_project: false, entity_type: 'certificate', native_format: 'pdf' });
    await DocType.create({ subcategory_id: sub9_3.id, label: 'Technical Files / Equipment Dossiers', is_periodic: false, only_one_per_project: false, entity_type: 'technical', native_format: 'pdf' });
    
    // CATEGORY 10: REGULATORY DOCUMENTS & PERMITS
    // 10.1 Administrative Authorizations
    await DocType.create({ subcategory_id: sub10_1.id, label: 'Building Permits / Construction Permits', is_periodic: false, only_one_per_project: true, entity_type: 'permit', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub10_1.id, label: 'Planning Permissions', is_periodic: false, only_one_per_project: true, entity_type: 'permit', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub10_1.id, label: 'Operating Licenses', is_periodic: false, only_one_per_project: true, entity_type: 'license', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub10_1.id, label: 'Compliance Certificates', is_periodic: false, only_one_per_project: false, entity_type: 'certificate', native_format: 'pdf' });
    
    // 10.2 Specialized Permits
    await DocType.create({ subcategory_id: sub10_2.id, label: 'Working at Height Permits', is_periodic: false, only_one_per_project: false, entity_type: 'permit', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub10_2.id, label: 'Excavation Permits', is_periodic: false, only_one_per_project: false, entity_type: 'permit', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub10_2.id, label: 'Hot Work Permits', is_periodic: false, only_one_per_project: false, entity_type: 'permit', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub10_2.id, label: 'Site Access Permits', is_periodic: false, only_one_per_project: false, entity_type: 'permit', native_format: 'pdf' });
    await DocType.create({ subcategory_id: sub10_2.id, label: 'Road Occupation Permits', is_periodic: false, only_one_per_project: false, entity_type: 'permit', native_format: 'pdf,docx' });
    
    // 10.3 Regulatory Compliance
    await DocType.create({ subcategory_id: sub10_3.id, label: 'Regulatory Declarations', is_periodic: false, only_one_per_project: false, entity_type: 'regulatory', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub10_3.id, label: 'Compliance Reports', is_periodic: true, only_one_per_project: false, entity_type: 'regulatory', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub10_3.id, label: 'Regulatory Inspections', is_periodic: false, only_one_per_project: false, entity_type: 'inspection', native_format: 'pdf,docx' });
    
    // CATEGORY 11: FINANCIAL & COMMERCIAL
    // 11.1 Budget and Costs
    await DocType.create({ subcategory_id: sub11_1.id, label: 'Project Budget / Cost Estimate', is_periodic: false, only_one_per_project: true, entity_type: 'financial', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub11_1.id, label: 'Cost Breakdown / CBS', is_periodic: false, only_one_per_project: true, entity_type: 'financial', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub11_1.id, label: 'Cash Flow Forecast', is_periodic: true, only_one_per_project: false, entity_type: 'financial', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub11_1.id, label: 'Cost Reports', is_periodic: true, only_one_per_project: false, entity_type: 'financial_report', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub11_1.id, label: 'Cost Variance Reports', is_periodic: true, only_one_per_project: false, entity_type: 'financial_report', native_format: 'pdf,xlsx' });
    
    // 11.2 Invoicing and Payments
    await DocType.create({ subcategory_id: sub11_2.id, label: 'Payment Applications / Progress Claims', is_periodic: true, only_one_per_project: false, entity_type: 'invoice', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub11_2.id, label: 'Invoices', is_periodic: true, only_one_per_project: false, entity_type: 'invoice', native_format: 'pdf,xlsx,xml' });
    await DocType.create({ subcategory_id: sub11_2.id, label: 'Payment Certificates', is_periodic: false, only_one_per_project: false, entity_type: 'certificate', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub11_2.id, label: 'Measurement Sheets / Bill of Quantities', is_periodic: false, only_one_per_project: true, entity_type: 'boq', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub11_2.id, label: 'Expense Reports', is_periodic: false, only_one_per_project: false, entity_type: 'financial', native_format: 'pdf,xlsx' });
    
    // 11.3 Project Accounting
    await DocType.create({ subcategory_id: sub11_3.id, label: 'Project Accounts', is_periodic: false, only_one_per_project: true, entity_type: 'financial', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub11_3.id, label: 'Financial Reports', is_periodic: true, only_one_per_project: false, entity_type: 'financial_report', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub11_3.id, label: 'Financial Audits', is_periodic: false, only_one_per_project: false, entity_type: 'audit', native_format: 'pdf,xlsx' });
    
    // CATEGORY 12: COMMUNICATION & COORDINATION
    // 12.1 Meetings
    await DocType.create({ subcategory_id: sub12_1.id, label: 'Meeting Agendas', is_periodic: false, only_one_per_project: false, entity_type: 'meeting', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub12_1.id, label: 'Meeting Minutes / MOM', is_periodic: false, only_one_per_project: false, entity_type: 'meeting', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub12_1.id, label: 'Attendance Sheets', is_periodic: false, only_one_per_project: false, entity_type: 'meeting', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub12_1.id, label: 'Meeting Presentations', is_periodic: false, only_one_per_project: false, entity_type: 'presentation', native_format: 'pptx,pdf' });
    
    // 12.2 Correspondence
    await DocType.create({ subcategory_id: sub12_2.id, label: 'Official Letters', is_periodic: false, only_one_per_project: false, entity_type: 'correspondence', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub12_2.id, label: 'Important Correspondence', is_periodic: false, only_one_per_project: false, entity_type: 'correspondence', native_format: 'pdf,docx,msg,eml' });
    await DocType.create({ subcategory_id: sub12_2.id, label: 'Transmittals', is_periodic: false, only_one_per_project: false, entity_type: 'transmittal', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub12_2.id, label: 'Requests for Information (RFI)', is_periodic: false, only_one_per_project: false, entity_type: 'rfi', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub12_2.id, label: 'Technical Queries (TQ)', is_periodic: false, only_one_per_project: false, entity_type: 'tq', native_format: 'pdf,xlsx' });
    
    // 12.3 Coordination
    await DocType.create({ subcategory_id: sub12_3.id, label: 'Communication Matrix', is_periodic: false, only_one_per_project: true, entity_type: 'management', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub12_3.id, label: 'Distribution Lists', is_periodic: false, only_one_per_project: true, entity_type: 'management', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub12_3.id, label: 'Document Registers', is_periodic: false, only_one_per_project: true, entity_type: 'register', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub12_3.id, label: 'Coordination Plans / Interface Management Plans', is_periodic: false, only_one_per_project: true, entity_type: 'plan', native_format: 'pdf,docx' });
    
    // CATEGORY 13: LEGAL & INSURANCE
    // 13.1 Legal Documents
    await DocType.create({ subcategory_id: sub13_1.id, label: 'Legal Opinions', is_periodic: false, only_one_per_project: false, entity_type: 'legal', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub13_1.id, label: 'Subcontracts', is_periodic: false, only_one_per_project: false, entity_type: 'contract', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub13_1.id, label: 'NDAs / Confidentiality Agreements', is_periodic: false, only_one_per_project: false, entity_type: 'legal', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub13_1.id, label: 'IP Agreements', is_periodic: false, only_one_per_project: false, entity_type: 'legal', native_format: 'pdf,docx' });
    
    // 13.2 Insurance
    await DocType.create({ subcategory_id: sub13_2.id, label: 'Insurance Policies', is_periodic: false, only_one_per_project: false, entity_type: 'insurance', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub13_2.id, label: 'Insurance Certificates', is_periodic: false, only_one_per_project: false, entity_type: 'insurance', native_format: 'pdf' });
    await DocType.create({ subcategory_id: sub13_2.id, label: 'Insurance Claims', is_periodic: false, only_one_per_project: false, entity_type: 'insurance', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub13_2.id, label: 'Expert Reports', is_periodic: false, only_one_per_project: false, entity_type: 'report', native_format: 'pdf,docx' });
    
    // 13.3 Disputes
    await DocType.create({ subcategory_id: sub13_3.id, label: 'Claims', is_periodic: false, only_one_per_project: false, entity_type: 'legal', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub13_3.id, label: 'Dispute Correspondence', is_periodic: false, only_one_per_project: false, entity_type: 'legal', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub13_3.id, label: 'Arbitration Awards', is_periodic: false, only_one_per_project: false, entity_type: 'legal', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub13_3.id, label: 'Court Judgments', is_periodic: false, only_one_per_project: false, entity_type: 'legal', native_format: 'pdf,docx' });
    
    // CATEGORY 14: HUMAN RESOURCES
    // 14.1 Organization
    await DocType.create({ subcategory_id: sub14_1.id, label: 'Project Organization Chart', is_periodic: false, only_one_per_project: true, entity_type: 'hr', native_format: 'pdf,pptx,vsd' });
    await DocType.create({ subcategory_id: sub14_1.id, label: 'Job Descriptions', is_periodic: false, only_one_per_project: false, entity_type: 'hr', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub14_1.id, label: 'Skills Matrix', is_periodic: false, only_one_per_project: true, entity_type: 'hr', native_format: 'pdf,xlsx' });
    
    // 14.2 Mobilization
    await DocType.create({ subcategory_id: sub14_2.id, label: 'Mobilization Plans', is_periodic: false, only_one_per_project: true, entity_type: 'hr_plan', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub14_2.id, label: 'Employment Contracts', is_periodic: false, only_one_per_project: false, entity_type: 'hr', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub14_2.id, label: 'Work Visas / Work Permits', is_periodic: false, only_one_per_project: false, entity_type: 'hr', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub14_2.id, label: 'Personnel Insurance', is_periodic: false, only_one_per_project: false, entity_type: 'insurance', native_format: 'pdf,docx' });
    
    // 14.3 HR Tracking
    await DocType.create({ subcategory_id: sub14_3.id, label: 'Timesheets / Attendance Records', is_periodic: true, only_one_per_project: false, entity_type: 'hr_report', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub14_3.id, label: 'Manpower Reports / Histograms', is_periodic: true, only_one_per_project: false, entity_type: 'hr_report', native_format: 'pdf,xlsx' });
    await DocType.create({ subcategory_id: sub14_3.id, label: 'Performance Reviews', is_periodic: false, only_one_per_project: false, entity_type: 'hr', native_format: 'pdf,docx' });
    
    // CATEGORY 15: IT & SYSTEMS
    // 15.1 IT Infrastructure
    await DocType.create({ subcategory_id: sub15_1.id, label: 'IT Infrastructure Plans', is_periodic: false, only_one_per_project: true, entity_type: 'it', native_format: 'pdf,docx,vsd' });
    await DocType.create({ subcategory_id: sub15_1.id, label: 'System Architecture', is_periodic: false, only_one_per_project: true, entity_type: 'it', native_format: 'pdf,vsd' });
    await DocType.create({ subcategory_id: sub15_1.id, label: 'Network Diagrams', is_periodic: false, only_one_per_project: false, entity_type: 'it', native_format: 'pdf,vsd,dwg' });
    
    // 15.2 Applications and Software
    await DocType.create({ subcategory_id: sub15_2.id, label: 'Software Requirements', is_periodic: false, only_one_per_project: false, entity_type: 'it', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub15_2.id, label: 'User Manuals', is_periodic: false, only_one_per_project: false, entity_type: 'manual', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub15_2.id, label: 'IT Procedures', is_periodic: false, only_one_per_project: false, entity_type: 'it', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub15_2.id, label: 'Disaster Recovery Plans', is_periodic: false, only_one_per_project: true, entity_type: 'it', native_format: 'pdf,docx' });
    
    // 15.3 Data Management
    await DocType.create({ subcategory_id: sub15_3.id, label: 'Data Management Plans', is_periodic: false, only_one_per_project: true, entity_type: 'it', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub15_3.id, label: 'Database Schemas', is_periodic: false, only_one_per_project: false, entity_type: 'it', native_format: 'pdf,vsd' });
    await DocType.create({ subcategory_id: sub15_3.id, label: 'Backup Procedures', is_periodic: false, only_one_per_project: true, entity_type: 'it', native_format: 'pdf,docx' });
    await DocType.create({ subcategory_id: sub15_3.id, label: 'System Logs', is_periodic: true, only_one_per_project: false, entity_type: 'it_log', native_format: 'txt,log,csv' });
    await DocType.create({ subcategory_id: sub15_3.id, label: 'Security Policies', is_periodic: false, only_one_per_project: true, entity_type: 'it', native_format: 'pdf,docx' });

    console.log('\n🎉 Document classification initialization completed!');
    console.log('📊 Summary:');
    console.log('   - 15 Categories');
    console.log('   - 53 Subcategories');
    console.log('   - All document types from your matrix');

    return {
      success: true,
      categories: 15,
      subcategories: 53,
      docTypes: 'All document types created'
    };
  } catch (error) {
    console.error('❌ Error initializing classification data:', error);
    throw error;
  }
};
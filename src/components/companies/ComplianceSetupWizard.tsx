import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Building2, 
  ShieldCheck, 
  AlertCircle,
  Loader2,
  Check
} from 'lucide-react';
import { Company, CompanyLegalType } from '../../types';
import { supabase } from '../../lib/supabase';
import { ActivityLogService } from '../../services/activityLogService';
import { ComplianceEngine, ComplianceTemplate } from '../../services/complianceEngine';
import { cn } from '../../lib/utils';

interface ComplianceSetupWizardProps {
  company: Company;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function ComplianceSetupWizard({ company, isOpen, onClose, onComplete }: ComplianceSetupWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Basic Details
  const [basicDetails, setBasicDetails] = useState({
    name: company.name,
    registrationNumber: company.registration_number || '',
    incorporationDate: company.incorporation_date || '',
    financialYearEnd: company.financial_year_end || 'February',
    legalEntityType: company.legal_entity_type || 'Private Company (Pty) Ltd'
  });

  // Step 2: Tax Questions
  const [taxProfile, setTaxProfile] = useState({
    is_vat_registered: false,
    is_paye_registered: false,
    is_uif_registered: false,
    has_employees: false
  });

  // Step 3: Preview
  const [previewItems, setPreviewItems] = useState<ComplianceTemplate[]>([]);

  function buildCompanyInput(details: typeof basicDetails) {
    return {
      ...company,
      name: details.name,
      registration_number: details.registrationNumber,
      incorporation_date: details.incorporationDate,
      financial_year_end: details.financialYearEnd,
      legal_entity_type: details.legalEntityType,
    };
  }

  useEffect(() => {
    if (step === 3) {
      const preview = ComplianceEngine.getPreview(buildCompanyInput(basicDetails), taxProfile);
      setPreviewItems(preview);
    }
  }, [step, company, basicDetails, taxProfile]);

  // Fetch existing tax profile if editing
  useEffect(() => {
    async function fetchTaxProfile() {
      const { data, error } = await supabase
        .from('company_tax_profiles')
        .select('*')
        .eq('company_id', company.id)
        .maybeSingle();
      
      if (data) {
        setTaxProfile({
          is_vat_registered: data.is_vat_registered,
          is_paye_registered: data.is_paye_registered,
          is_uif_registered: data.is_uif_registered,
          has_employees: data.has_employees
        });
      }
    }
    if (isOpen) fetchTaxProfile();
  }, [isOpen, company.id]);

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleFinish = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Update Company Basic Details
      const { error: companyError } = await supabase
        .from('companies')
        .update({
          name: basicDetails.name,
          registration_number: basicDetails.registrationNumber,
          incorporation_date: basicDetails.incorporationDate,
          financial_year_end: basicDetails.financialYearEnd,
          legal_entity_type: basicDetails.legalEntityType,
          updated_at: new Date().toISOString()
        })
        .eq('id', company.id);

      if (companyError) throw companyError;

      // 2. Update/Upsert Tax Profile
      const { error: profileError } = await supabase
        .from('company_tax_profiles')
        .upsert({
          company_id: company.id,
          owner_id: company.owner_id,
          ...taxProfile,
          updated_at: new Date().toISOString()
        }, { onConflict: 'company_id' });

      if (profileError) throw profileError;

      // 3. Generate Compliance Items
      await ComplianceEngine.generateComplianceForCompany(buildCompanyInput(basicDetails), taxProfile);

      // 4. Log Activity
      await ActivityLogService.logActivity({
        action_type: 'setup_completed' as any,
        description: `Completed compliance setup for ${basicDetails.name}`,
        company_id: company.id
      });

      setStep(4); // Success step
    } catch (err: any) {
      setError(err.message || 'An error occurred during setup.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Compliance Setup</h3>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">
              Step {step} of 4: {
                step === 1 ? 'Company Verification' : 
                step === 2 ? 'Tax & Employment' : 
                step === 3 ? 'Review Roadmap' : 'Complete'
              }
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-start space-x-3 mb-6">
                  <Building2 className="h-5 w-5 text-indigo-600 mt-0.5" />
                  <p className="text-sm text-indigo-900 font-medium leading-relaxed">
                    Verify these core details. They are used to calculate your CIPC and SARS filing deadlines.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Company Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold"
                      value={basicDetails.name}
                      onChange={e => setBasicDetails({...basicDetails, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Registration Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 2024/123456/07"
                      className="w-full px-4 py-3 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                      value={basicDetails.registrationNumber}
                      onChange={e => setBasicDetails({...basicDetails, registrationNumber: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Legal Type</label>
                    <select
                      className="w-full px-4 py-3 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
                      value={basicDetails.legalEntityType}
                      onChange={e => setBasicDetails({...basicDetails, legalEntityType: e.target.value as CompanyLegalType})}
                    >
                      <option value="Private Company (Pty) Ltd">Private Company (Pty) Ltd</option>
                      <option value="Public Company (Ltd)">Public Company (Ltd)</option>
                      <option value="Non-Profit Company (NPC)">Non-Profit Company (NPC)</option>
                      <option value="Sole Proprietorship">Sole Proprietorship</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Incorporation Date</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
                      value={basicDetails.incorporationDate}
                      onChange={e => setBasicDetails({...basicDetails, incorporationDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Financial Year End</label>
                    <select
                      className="w-full px-4 py-3 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
                      value={basicDetails.financialYearEnd}
                      onChange={e => setBasicDetails({...basicDetails, financialYearEnd: e.target.value})}
                    >
                      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(month => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start space-x-3 mb-6">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <p className="text-sm text-amber-900 font-medium leading-relaxed">
                    Your tax registration determines your monthly submission requirements (EMP201, UIF, VAT).
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {[
                    { label: 'Is this company registered for VAT?', key: 'is_vat_registered' },
                    { label: 'Is this company registered for PAYE?', key: 'is_paye_registered' },
                    { label: 'Does this company have employees?', key: 'has_employees' },
                    { label: 'Is this company registered for UIF?', key: 'is_uif_registered' }
                  ].map((q) => (
                    <div 
                      key={q.key}
                      onClick={() => setTaxProfile({...taxProfile, [q.key]: !taxProfile[q.key as keyof typeof taxProfile]})}
                      className={cn(
                        "flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer group",
                        taxProfile[q.key as keyof typeof taxProfile] 
                          ? "bg-indigo-50 border-indigo-200 ring-4 ring-indigo-50" 
                          : "bg-white border-gray-100 hover:border-gray-200"
                      )}
                    >
                      <span className="font-bold text-gray-900 group-hover:translate-x-1 transition-transform">{q.label}</span>
                      <div className={cn(
                        "w-12 h-6 rounded-full relative transition-colors p-1",
                        taxProfile[q.key as keyof typeof taxProfile] ? "bg-indigo-600" : "bg-gray-200"
                      )}>
                        <div className={cn(
                          "w-4 h-4 rounded-full bg-white transition-transform shadow-sm",
                          taxProfile[q.key as keyof typeof taxProfile] ? "translate-x-6" : "translate-x-0"
                        )} />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                    <ShieldCheck className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight">Compliance Roadmap</h4>
                  <p className="text-sm text-gray-500 font-medium">Based on your answers, these items will be tracked:</p>
                </div>

                <div className="space-y-4">
                  {['CIPC', 'SARS', 'Labour', 'POPIA'].map(type => {
                    const items = previewItems.filter(item => item.type === type);
                    if (items.length === 0) return null;

                    return (
                      <div key={type} className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                        <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                          <CheckCircle2 className="h-3 w-3 mr-2 text-emerald-500" />
                          {type}
                        </h5>
                        <ul className="space-y-2">
                          {items.map((item, idx) => (
                            <li key={idx} className="flex items-center text-sm font-bold text-gray-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-3" />
                              {item.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-emerald-100">
                  <Check className="h-10 w-10 text-emerald-600" />
                </div>
                <h4 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Success!</h4>
                <p className="text-gray-500 font-medium mt-2 max-w-sm mx-auto">
                  Compliance setup complete. Your deadlines have been generated and added to your dashboard.
                </p>
                <button
                  onClick={onComplete}
                  className="mt-10 px-10 py-3 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-xl shadow-black/10"
                >
                  Go to Dashboard
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {step < 4 && (
          <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
            <button
              disabled={step === 1 || loading}
              onClick={handleBack}
              className="flex items-center px-4 py-2 text-gray-500 font-black uppercase tracking-widest text-[10px] disabled:opacity-0 transition-all"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </button>
            
            {error && (
              <p className="text-[10px] text-red-600 font-black uppercase tracking-tight flex items-center max-w-xs">
                <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                {error}
              </p>
            )}

            <button
              disabled={loading}
              onClick={step === 3 ? handleFinish : handleNext}
              className="flex items-center px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-lg shadow-indigo-100 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {step === 3 ? 'Generate Roadmap' : 'Next'}
                  {step < 3 && <ChevronRight className="h-4 w-4 ml-1" />}
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

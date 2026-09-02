import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  BookOpen,
  CheckCircle2,
  X,
  Layers,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { LanguageMode, TextbookWorkspace } from '../types';
import { createCustomTextbookWorkspace } from '../data/textbookWorkspaces';
import { postFormData } from '../lib/api';

interface UploadPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkspaceCreated: (workspace: TextbookWorkspace) => void;
  language: LanguageMode;
}

export const UploadPdfModal: React.FC<UploadPdfModalProps> = ({
  isOpen,
  onClose,
  onWorkspaceCreated,
  language
}) => {
  const isAmharic = language === 'am';

  const [fileName, setFileName] = useState<string>('');
  const [fileObj, setFileObj] = useState<File | null>(null);
  const [bookTitle, setBookTitle] = useState<string>('');
  const [subject, setSubject] = useState<string>('Physics');
  const [gradeLevel, setGradeLevel] = useState<string>('Grade 11 National Curriculum');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [activeStep, setActiveStep] = useState<'upload' | 'review'>('upload');

  if (!isOpen) return null;

const selectFile = (f: File) => {
  if (!/\.pdf$/i.test(f.name) && f.type !== 'application/pdf') {
    setError(isAmharic ? 'እባክዎ የPDF ፋይል ይምረጡ።' : 'Please choose a PDF file.');
    return;
  }
  // 5MB limit to protect free-tier API quotas
  const maxSize = 5 * 1024 * 1024;
  if (f.size > maxSize) {
    setError(isAmharic
      ? 'ፋይሉ በጣም ትልቅ ነው። እባክዎ ከ5MB በታች የሆነ PDF ይምረጡ።'
      : 'File too large. Please choose a PDF under 5MB to protect our free-tier API quotas.');
    return;
  }
  setError('');
  setFileName(f.name);
  setFileObj(f);
  const titleGuess = f.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
  setBookTitle(titleGuess);
  setActiveStep('review');
};

const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault();
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    selectFile(e.dataTransfer.files[0]);
  }
};

const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) {
    selectFile(e.target.files[0]);
  }
};

  // Quick-Start samples build a deterministic local workspace instantly
  // (no Gemini, no upload needed) so the demo works even completely offline.
  const handleLoadSample = (sampleType: 'math10' | 'chem12' | 'econ11') => {
    let fileName = '';
    let title = '';
    let subj = '';
    let grade = '';
    let chapters: { title: string; topics: string[] }[] = [];

    if (sampleType === 'math10') {
      fileName = 'Grade_10_Mathematics_MoE_Ethiopia.pdf';
      title = 'Grade 10 Mathematics (Ethiopian Curriculum)';
      subj = 'Mathematics';
      grade = 'Grade 10 MoE';
      chapters = [
        {
          title: 'Unit 1: Polynomial Functions & Graphs',
          topics: ['Polynomial Division & Remainder Theorem', 'Roots & Zeros Analysis', 'Rational Function Asymptotes']
        },
        {
          title: 'Unit 2: Exponential & Logarithmic Functions',
          topics: ['Exponential Growth Equations', 'Logarithm Properties', 'Compound Interest Modeling']
        },
        {
          title: 'Unit 3: Trigonometry & Circular Functions',
          topics: ['Unit Circle Coordinates', 'Sine and Cosine Waves', 'Trigonometric Identities']
        }
      ];
    } else if (sampleType === 'chem12') {
      fileName = 'Grade_12_Chemistry_Electrochemistry_MoE.pdf';
      title = 'Grade 12 Chemistry: Advanced Electrochemistry & Kinetics';
      subj = 'Chemistry';
      grade = 'Grade 12 MoE';
      chapters = [
        {
          title: 'Unit 1: Chemical Kinetics & Reaction Rates',
          topics: ['Collision Theory & Activation Energy', 'Rate Law Equations', 'Catalysis Mechanisms']
        },
        {
          title: 'Unit 2: Electrochemistry & Galvanic Cells',
          topics: ['Standard Electrode Potentials', 'Nernst Equation & Cell EMF', 'Electrolysis & Faraday Laws']
        }
      ];
    } else {
      fileName = 'Grade_11_Economics_Micro_Macro_MoE.pdf';
      title = 'Grade 11 Economics (Micro & Macro Fundamentals)';
      subj = 'Economics';
      grade = 'Grade 11 MoE';
      chapters = [
        {
          title: 'Unit 1: Theory of Consumer Behavior & Utility',
          topics: ['Marginal Utility Diminishing Returns', 'Indifference Curves & Budget Lines', 'Consumer Equilibrium']
        },
        {
          title: 'Unit 2: Market Structures & Price Determination',
          topics: ['Perfect Competition Dynamics', 'Monopoly & Deadweight Loss', 'Elasticity of Demand & Supply']
        }
      ];
    }

    const newWs = createCustomTextbookWorkspace(fileName, title, subj, grade, chapters);
    onWorkspaceCreated(newWs);
    onClose();
  };

const handleCreateWorkspace = async () => {
  if (!bookTitle.trim()) return;
  if (!fileObj) {
    setError(isAmharic ? 'እባክዎ ፋይል ይምረጡ።' : 'Please select a PDF to process.');
    return;
  }
  setIsProcessing(true);
  setError('');

  try {
    const form = new FormData();
    form.append('file', fileObj);
    form.append('bookTitle', bookTitle.trim());
    form.append('subject', subject.trim() || 'Science');
    form.append('gradeLevel', gradeLevel.trim() || 'Secondary School');

    const result = await postFormData<{ workspace: TextbookWorkspace }>('/api/textbook/process', form, { timeoutMs: 120000 });

    if (!result.ok) {
      const msg =
        (result.data as any)?.error ||
        (isAmharic ? 'ፋይሉን ማስተካከል አልተቻለም።' : 'Could not process the textbook. Please try again.');
      setError(msg);
      setIsProcessing(false);
      return;
    }
    if (result.data?.workspace) {
      onWorkspaceCreated(result.data.workspace);
      onClose();
      return;
    }
    setError(isAmharic ? 'ምንም ውጤት አልተመለሰም።' : 'No workspace was returned.');
    setIsProcessing(false);
  } catch {
    setError(isAmharic ? 'ከአገልጋዩ ጋር መገናኘት አልተቻለም።' : 'Could not reach the server. Check your connection.');
    setIsProcessing(false);
  }
};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        style={{
          backgroundColor: 'var(--app-surface, #ffffff)',
          borderColor: 'var(--app-border, #cbd5e1)',
          color: 'var(--app-text, #020617)'
        }}
        className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div
          style={{ borderColor: 'var(--app-border, #cbd5e1)' }}
          className="flex items-center justify-between px-6 py-4 border-b"
        >
          <div className="flex items-center gap-2.5">
            <div
              style={{
                backgroundColor: 'var(--app-accent-bg, rgba(79, 70, 229, 0.12))',
                color: 'var(--app-accent, #4f46e5)'
              }}
              className="p-2 rounded-xl"
            >
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base tracking-tight">
                {isAmharic ? 'አዲስ የመማሪያ መጽሐፍ (PDF) ማዘጋጃ' : 'Generate Textbook Mind-Map Workspace'}
              </h2>
              <p style={{ color: 'var(--app-text-muted, #475569)' }} className="text-xs">
                {isAmharic
                  ? 'ከመጽሐፍ PDF ውስጥ ምዕራፎችን እና ንዑስ ርዕሶችን በራስ-ሰር በመለየት የተሟላ ማይንድ-ማፕ ይገንቡ'
                  : 'Synthesize Book Root Node → Unit Hubs → Topic Nodes → Socratic Feynman Arenas'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ color: 'var(--app-text-muted, #475569)' }}
            className="p-1.5 rounded-lg hover:bg-slate-500/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeStep === 'upload' ? (
            <div className="space-y-5">
              {/* Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                style={{
                  borderColor: 'var(--app-border-strong, #94a3b8)',
                  backgroundColor: 'var(--app-surface-elevated, #f8fafc)'
                }}
                className="border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3 transition-colors hover:border-indigo-500"
              >
                <div
                  style={{
                    backgroundColor: 'var(--app-accent-bg, rgba(79, 70, 229, 0.12))',
                    color: 'var(--app-accent, #4f46e5)'
                  }}
                  className="p-4 rounded-full"
                >
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    {isAmharic ? 'የመማሪያ መጽሐፍዎን (PDF) እዚህ ይጎትቱ' : 'Drag & drop student textbook PDF here'}
                  </p>
                  <p style={{ color: 'var(--app-text-muted, #475569)' }} className="text-xs mt-0.5">
                    {isAmharic ? 'ወይም ከኮምፒውተርዎ ይምረጡ (PDF, ከ5MB በታች)' : 'or browse from your device (PDF, max 5MB)'}
                  </p>
                </div>
                <label
                  style={{
                    backgroundColor: 'var(--app-accent, #4f46e5)',
                    color: 'var(--app-accent-text, #ffffff)'
                  }}
                  className="cursor-pointer px-4 py-2 rounded-xl text-xs font-semibold shadow-sm hover:opacity-90 transition-opacity"
                >
                  {isAmharic ? 'ፋይል ይምረጡ' : 'Browse PDF File'}
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt,.epub"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                </label>
              </div>

              {/* Sample Quick-Start Textbooks */}
              <div>
                <p style={{ color: 'var(--app-text-muted, #475569)' }} className="text-xs font-semibold mb-2 uppercase tracking-wider">
                  {isAmharic ? 'ወይም ከዝግጁ የኢትዮጵያ ሥርዓተ-ትምህርቶች ይሞክሩ' : 'Or Quick-Start With Ethiopian National Curriculum Samples'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    onClick={() => handleLoadSample('math10')}
                    style={{
                      borderColor: 'var(--app-border, #cbd5e1)',
                      backgroundColor: 'var(--app-surface-elevated, #f8fafc)'
                    }}
                    className="p-3 text-left rounded-xl border hover:border-indigo-500 transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        Math G10
                      </span>
                      <p className="font-semibold text-xs mt-1.5 group-hover:text-indigo-500">
                        Grade 10 Math MoE
                      </p>
                      <p style={{ color: 'var(--app-text-muted, #475569)' }} className="text-[11px] mt-0.5">
                        Polynomials & Trig
                      </p>
                    </div>
                    <span className="text-[10px] font-medium text-indigo-500 flex items-center gap-1 mt-2">
                      Load Blueprint <ArrowRight className="w-3 h-3" />
                    </span>
                  </button>

                  <button
                    onClick={() => handleLoadSample('chem12')}
                    style={{
                      borderColor: 'var(--app-border, #cbd5e1)',
                      backgroundColor: 'var(--app-surface-elevated, #f8fafc)'
                    }}
                    className="p-3 text-left rounded-xl border hover:border-emerald-500 transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        Chem G12
                      </span>
                      <p className="font-semibold text-xs mt-1.5 group-hover:text-emerald-500">
                        Grade 12 Chemistry
                      </p>
                      <p style={{ color: 'var(--app-text-muted, #475569)' }} className="text-[11px] mt-0.5">
                        Electrochem & Kinetics
                      </p>
                    </div>
                    <span className="text-[10px] font-medium text-emerald-500 flex items-center gap-1 mt-2">
                      Load Blueprint <ArrowRight className="w-3 h-3" />
                    </span>
                  </button>

                  <button
                    onClick={() => handleLoadSample('econ11')}
                    style={{
                      borderColor: 'var(--app-border, #cbd5e1)',
                      backgroundColor: 'var(--app-surface-elevated, #f8fafc)'
                    }}
                    className="p-3 text-left rounded-xl border hover:border-amber-500 transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        Econ G11
                      </span>
                      <p className="font-semibold text-xs mt-1.5 group-hover:text-amber-500">
                        Grade 11 Economics
                      </p>
                      <p style={{ color: 'var(--app-text-muted, #475569)' }} className="text-[11px] mt-0.5">
                        Utility & Market Structure
                      </p>
                    </div>
                    <span className="text-[10px] font-medium text-amber-500 flex items-center gap-1 mt-2">
                      Load Blueprint <ArrowRight className="w-3 h-3" />
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Review & Customization */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold block mb-1">
                    {isAmharic ? 'የመጽሐፉ ስም' : 'Textbook Title'}
                  </label>
                  <input
                    type="text"
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                    style={{
                      backgroundColor: 'var(--app-surface-elevated, #f8fafc)',
                      borderColor: 'var(--app-border, #cbd5e1)',
                      color: 'var(--app-text, #020617)'
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="e.g. Grade 11 Physics Student Textbook"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">
                    {isAmharic ? 'የትምህርት አይነት' : 'Subject'}
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    style={{
                      backgroundColor: 'var(--app-surface-elevated, #f8fafc)',
                      borderColor: 'var(--app-border, #cbd5e1)',
                      color: 'var(--app-text, #020617)'
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* AI Processing Preview */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold tracking-tight">
                    {isAmharic ? 'AI ማስተካከያ ሂደት' : 'AI Mastery Build'}
                  </span>
                </div>
                <div
                  style={{
                    backgroundColor: 'var(--app-surface-elevated, #f8fafc)',
                    borderColor: 'var(--app-border, #cbd5e1)'
                  }}
                  className="border rounded-xl p-4 space-y-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <p className="text-xs font-semibold">
                    {isAmharic ? 'ፋይል ተመርጧል፡' : 'File selected:'} {fileName}
                  </p>
                  <ul className="text-[11px] leading-relaxed space-y-1.5">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      {isAmharic ? 'የPDF ጽሑፍ ማውጣት (Text Extraction)' : 'Extract textbook text from the PDF'}
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                      {isAmharic ? 'AI የእውቀት ካርታ መገንባት' : 'Gemini builds the multi-level mind-map'}
                    </li>
                    <li className="flex items-center gap-1.5">
                      <BookOpen className="w-3 h-3 text-indigo-500" />
                      {isAmharic ? 'አማርኛ/እንግሊዝኛ፣ ምሳሌዎች፣ ጥያቄዎች እና ፍላሽካርድ' : 'Amharic + analogies + quizzes + flashcards'}
                    </li>
                  </ul>
                  <p style={{ color: 'var(--app-text-muted, #475569)' }} className="text-[11px] pt-1">
                    {isAmharic
                      ? 'በመግፋት ጊዜ AI ፋይሉን በማንበብ የተሟላ የጥናት ካርታ ይገነባል።'
                      : 'Click build and AI will read the file and structure a complete mastery workspace.'}
                  </p>
                </div>
              </div>

              {error && (
                <div
                  style={{
                    backgroundColor: 'rgba(225, 29, 72, 0.08)',
                    borderColor: 'rgba(225, 29, 72, 0.35)',
                    color: 'var(--app-text, #020617)'
                  }}
                  className="border rounded-xl px-4 py-3 text-xs font-medium"
                >
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{ borderColor: 'var(--app-border, #cbd5e1)' }}
          className="flex items-center justify-between px-6 py-4 border-t"
        >
          {activeStep === 'review' ? (
            <button
              onClick={() => setActiveStep('upload')}
              style={{ color: 'var(--app-text-muted, #475569)' }}
              className="text-xs font-semibold hover:underline"
            >
              {isAmharic ? '← ወደ ኋላ' : '← Back to Upload'}
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              style={{
                borderColor: 'var(--app-border, #cbd5e1)',
                color: 'var(--app-text, #020617)'
              }}
              className="px-4 py-2 text-xs font-semibold rounded-xl border hover:bg-slate-500/10 transition-colors"
            >
              {isAmharic ? 'ሰርዝ' : 'Cancel'}
            </button>

            {activeStep === 'review' && (
              <button
                onClick={handleCreateWorkspace}
                disabled={isProcessing}
                style={{
                  backgroundColor: 'var(--app-accent, #4f46e5)',
                  color: 'var(--app-accent-text, #ffffff)'
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl shadow-md flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {isProcessing
                  ? (isAmharic ? 'እየገነባ ነው...' : 'Building...')
                  : (isAmharic ? 'የመማሪያ ካርታውን ገንባ' : 'Build Multi-Level Mind Map')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

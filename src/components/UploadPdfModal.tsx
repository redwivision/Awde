import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  Plus,
  Trash2,
  BookOpen,
  CheckCircle2,
  X,
  Layers,
  ArrowRight
} from 'lucide-react';
import { LanguageMode, TextbookWorkspace } from '../types';
import { createCustomTextbookWorkspace } from '../data/textbookWorkspaces';

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
  const [bookTitle, setBookTitle] = useState<string>('');
  const [subject, setSubject] = useState<string>('Physics');
  const [gradeLevel, setGradeLevel] = useState<string>('Grade 11 National Curriculum');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<'upload' | 'review'>('upload');

  const [chapters, setChapters] = useState<{ title: string; topics: string[] }[]>([
    {
      title: 'Unit 1: Fundamentals & Invariants',
      topics: ['Conservation Principles', 'Vector Coordinate Systems', 'Equilibrium States']
    },
    {
      title: 'Unit 2: Dynamic Interactions & Flux',
      topics: ['Rate of Change Equations', 'Potential Well Analysis', 'Dissipative Losses']
    },
    {
      title: 'Unit 3: Applied Systems & Engineering',
      topics: ['Systemic Feedback Loops', 'Efficiency Limits & Real-World Scales']
    }
  ]);

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFileName(file.name);
      const titleGuess = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
      setBookTitle(titleGuess);
      simulateAutoExtraction(file.name);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      const titleGuess = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
      setBookTitle(titleGuess);
      simulateAutoExtraction(file.name);
    }
  };

  const simulateAutoExtraction = (name: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setActiveStep('review');
    }, 900);
  };

  const handleLoadSample = (sampleType: 'math10' | 'chem12' | 'econ11') => {
    if (sampleType === 'math10') {
      setFileName('Grade_10_Mathematics_MoE_Ethiopia.pdf');
      setBookTitle('Grade 10 Mathematics (Ethiopian Curriculum)');
      setSubject('Mathematics');
      setGradeLevel('Grade 10 MoE');
      setChapters([
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
      ]);
    } else if (sampleType === 'chem12') {
      setFileName('Grade_12_Chemistry_Electrochemistry_MoE.pdf');
      setBookTitle('Grade 12 Chemistry: Advanced Electrochemistry & Kinetics');
      setSubject('Chemistry');
      setGradeLevel('Grade 12 MoE');
      setChapters([
        {
          title: 'Unit 1: Chemical Kinetics & Reaction Rates',
          topics: ['Collision Theory & Activation Energy', 'Rate Law Equations', 'Catalysis Mechanisms']
        },
        {
          title: 'Unit 2: Electrochemistry & Galvanic Cells',
          topics: ['Standard Electrode Potentials', 'Nernst Equation & Cell EMF', 'Electrolysis & Faraday Laws']
        }
      ]);
    } else {
      setFileName('Grade_11_Economics_Micro_Macro_MoE.pdf');
      setBookTitle('Grade 11 Economics (Micro & Macro Fundamentals)');
      setSubject('Economics');
      setGradeLevel('Grade 11 MoE');
      setChapters([
        {
          title: 'Unit 1: Theory of Consumer Behavior & Utility',
          topics: ['Marginal Utility Diminishing Returns', 'Indifference Curves & Budget Lines', 'Consumer Equilibrium']
        },
        {
          title: 'Unit 2: Market Structures & Price Determination',
          topics: ['Perfect Competition Dynamics', 'Monopoly & Deadweight Loss', 'Elasticity of Demand & Supply']
        }
      ]);
    }
    setActiveStep('review');
  };

  const handleAddChapter = () => {
    setChapters([
      ...chapters,
      {
        title: `Unit ${chapters.length + 1}: New Curriculum Unit`,
        topics: ['Core Fundamental Concept', 'Key Law & Mechanism']
      }
    ]);
  };

  const handleAddTopic = (chapterIndex: number) => {
    const updated = [...chapters];
    updated[chapterIndex].topics.push(`Lesson ${updated[chapterIndex].topics.length + 1}`);
    setChapters(updated);
  };

  const handleRemoveTopic = (chapterIndex: number, topicIndex: number) => {
    const updated = [...chapters];
    updated[chapterIndex].topics = updated[chapterIndex].topics.filter((_, idx) => idx !== topicIndex);
    setChapters(updated);
  };

  const handleRemoveChapter = (chapterIndex: number) => {
    setChapters(chapters.filter((_, idx) => idx !== chapterIndex));
  };

  const handleCreateWorkspace = () => {
    if (!bookTitle.trim()) return;
    const newWs = createCustomTextbookWorkspace(
      fileName || 'Uploaded_Textbook.pdf',
      bookTitle,
      subject,
      gradeLevel,
      chapters
    );
    onWorkspaceCreated(newWs);
    onClose();
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
                    {isAmharic ? 'ወይም ከኮምፒውተርዎ ይምረጡ (PDF, EPUB)' : 'or browse from your device (PDF, DOCX, Syllabus)'}
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

              {/* Differentiated Units Hierarchy Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-bold tracking-tight">
                      {isAmharic ? 'የምዕራፎችና ርዕሶች ተዋረድ (Units & Topics Hierarchy)' : 'Differentiated Unit Nodes & Topic Structure'}
                    </span>
                  </div>
                  <button
                    onClick={handleAddChapter}
                    style={{ color: 'var(--app-accent, #4f46e5)' }}
                    className="text-xs font-semibold flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> {isAmharic ? 'ምዕራፍ ጨምር' : 'Add Unit'}
                  </button>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {chapters.map((ch, chIdx) => (
                    <div
                      key={chIdx}
                      style={{
                        backgroundColor: 'var(--app-surface-elevated, #f8fafc)',
                        borderColor: 'var(--app-border, #cbd5e1)'
                      }}
                      className="p-3.5 rounded-xl border space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={ch.title}
                          onChange={(e) => {
                            const updated = [...chapters];
                            updated[chIdx].title = e.target.value;
                            setChapters(updated);
                          }}
                          style={{
                            backgroundColor: 'transparent',
                            color: 'var(--app-text, #020617)'
                          }}
                          className="font-bold text-xs flex-1 focus:outline-none focus:underline"
                        />
                        <button
                          onClick={() => handleRemoveChapter(chIdx)}
                          className="text-rose-500 p-1 hover:bg-rose-500/10 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Topics for this chapter */}
                      <div className="space-y-1.5 pl-3 border-l-2 border-indigo-500/30">
                        {ch.topics.map((top, topIdx) => (
                          <div key={topIdx} className="flex items-center gap-2">
                            <span className="text-[10px] text-indigo-500 font-mono">
                              {chIdx + 1}.{topIdx + 1}
                            </span>
                            <input
                              type="text"
                              value={top}
                              onChange={(e) => {
                                const updated = [...chapters];
                                updated[chIdx].topics[topIdx] = e.target.value;
                                setChapters(updated);
                              }}
                              style={{
                                backgroundColor: 'var(--app-surface, #ffffff)',
                                borderColor: 'var(--app-border, #cbd5e1)',
                                color: 'var(--app-text, #020617)'
                              }}
                              className="px-2 py-1 text-[11px] rounded-lg border flex-1"
                            />
                            <button
                              onClick={() => handleRemoveTopic(chIdx, topIdx)}
                              className="text-slate-400 hover:text-rose-500 p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => handleAddTopic(chIdx)}
                          className="text-[11px] text-indigo-500 font-medium flex items-center gap-1 hover:underline pt-1"
                        >
                          <Plus className="w-3 h-3" /> {isAmharic ? 'ርዕስ ጨምር' : 'Add Topic'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
                style={{
                  backgroundColor: 'var(--app-accent, #4f46e5)',
                  color: 'var(--app-accent-text, #ffffff)'
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl shadow-md flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Sparkles className="w-4 h-4" />
                {isAmharic ? 'የመማሪያ ካርታውን ገንባ' : 'Build Multi-Level Mind Map'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

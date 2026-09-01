import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LanguageMode, TopicUnit } from '../types';
import {
  BookOpen,
  Plus,
  UploadCloud,
  FileText,
  Sparkles,
  Layers,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Flame,
  Search,
  BookMarked
} from 'lucide-react';

interface TextbookManagerProps {
  units: TopicUnit[];
  currentUnitId: string;
  language: LanguageMode;
  onSelectUnit: (unitId: string) => void;
  onAddNewUnit: (unit: TopicUnit) => void;
  onDeleteUnit?: (unitId: string) => void;
}

export const TextbookManager: React.FC<TextbookManagerProps> = ({
  units,
  currentUnitId,
  language,
  onSelectUnit,
  onAddNewUnit,
  onDeleteUnit
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [topicName, setTopicName] = useState('');
  const [subject, setSubject] = useState('Physics');
  const [gradeLevel, setGradeLevel] = useState('Grade 11 National Curriculum');
  const [textbookText, setTextbookText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const isAmharic = language === 'am';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setTextbookText(content);
      if (!topicName) {
        setTopicName(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsText(file);
  };

  const handleCreateNewUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName.trim() && !textbookText.trim()) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/mindmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicName.trim(),
          textbookText: textbookText.trim(),
          subject,
          gradeLevel,
          language
        })
      });
      const data = await res.json();
      if (data.success && data.unit) {
        onAddNewUnit(data.unit);
        onSelectUnit(data.unit.id);
        setIsModalOpen(false);
        setTopicName('');
        setTextbookText('');
      }
    } catch (err) {
      console.error('Failed to create textbook unit:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredUnits = units.filter(
    (u) =>
      u.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      u.titleAmharic.includes(searchFilter) ||
      u.subject.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 p-4 sm:p-6 overflow-y-auto" id="textbook-manager-view">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* Header Title Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                Textbook Knowledge Repository
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {isAmharic ? 'የመማሪያ መጽሐፍት እና ዩኒቶች ማውጫ' : 'Curriculum Units & Textbook Library'}
            </h2>
            <p className="text-xs text-slate-400">
              {isAmharic
                ? 'የኢትዮጵያ ሀገራዊ ሥርዓተ-ትምህርት ወይም የራስህን የመማሪያ መጽሐፍ ጽሁፍ አስገባ'
                : 'Ethiopian National Curriculum & Custom User-Uploaded Textbooks'}
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 flex items-center gap-2 transition-all"
            id="btn-upload-textbook"
          >
            <Plus className="w-4 h-4" />
            <span>{isAmharic ? 'አዲስ ዩኒት / መጽሐፍ አስገባ' : 'Import Textbook Unit'}</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder={isAmharic ? 'ዩኒት ወይም የትምህርት ዓይነት ፈልግ...' : 'Filter by unit title or subject...'}
              className="w-full bg-slate-900 text-xs text-slate-100 placeholder-slate-500 pl-9 pr-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Units Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredUnits.map((unit) => {
            const isCurrent = unit.id === currentUnitId;

            return (
              <motion.div
                key={unit.id}
                whileHover={{ y: -3 }}
                onClick={() => onSelectUnit(unit.id)}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                  isCurrent
                    ? 'bg-slate-900/95 border-emerald-500 shadow-xl shadow-emerald-950/30'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {unit.subject} • {unit.gradeOrLevel}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {isAmharic ? 'አሁን የተመረጠ' : 'Active Unit'}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white leading-snug">
                    {isAmharic ? unit.titleAmharic : unit.title}
                  </h3>
                  {isAmharic && (
                    <p className="text-xs text-slate-400 font-mono">{unit.title}</p>
                  )}

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {isAmharic ? unit.descriptionAmharic : unit.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-mono">
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      {unit.nodes.length} {isAmharic ? 'ኖዶች' : 'Nodes'}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      {unit.quizQuestions.length} {isAmharic ? 'ጥያቄዎች' : 'Quizzes'}
                    </span>
                  </div>

                  <span className="text-emerald-400 font-bold text-xs hover:underline">
                    {isAmharic ? 'ካርታውን ክፈት →' : 'Explore Mindmap →'}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Modal: Upload / Create Custom Textbook Unit */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  {isAmharic ? 'አዲስ የመማሪያ መጽሐፍ ዩኒት ማፍለቂያ' : 'Deconstruct Textbook Chapter with AI'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateNewUnit} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">
                    {isAmharic ? 'የዩኒቱ ርዕስ (Topic / Unit Title)' : 'Unit Title or Topic:'}
                  </label>
                  <input
                    type="text"
                    value={topicName}
                    onChange={(e) => setTopicName(e.target.value)}
                    placeholder="e.g. Electromagnetic Induction & Faraday's Law"
                    className="w-full bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-100 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">Subject:</label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-100 focus:outline-none"
                    >
                      <option value="Physics">Physics (ፊዚክስ)</option>
                      <option value="Biology">Biology (ባዮሎጂ)</option>
                      <option value="Chemistry">Chemistry (ኬሚስትሪ)</option>
                      <option value="Mathematics">Mathematics (ሂሳብ)</option>
                      <option value="Economics">Economics (ኢኮኖሚክስ)</option>
                      <option value="Computer Science">Computer Science (ኮምፒውተር ሳይንስ)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">Grade / Level:</label>
                    <input
                      type="text"
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      className="w-full bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-300 font-semibold">
                      {isAmharic ? 'የመጽሐፉ ጽሁፍ ወይም ማስታወሻዎች' : 'Paste Textbook Extract or Notes:'}
                    </label>
                    <label className="text-emerald-400 hover:underline cursor-pointer flex items-center gap-1">
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload .txt/.md file</span>
                      <input
                        type="file"
                        accept=".txt,.md,.json"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <textarea
                    value={textbookText}
                    onChange={(e) => setTextbookText(e.target.value)}
                    rows={4}
                    placeholder="Paste textbook chapter paragraphs, definitions, formulas, or syllabus outline..."
                    className="w-full bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none resize-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isGenerating || (!topicName && !textbookText)}
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-950"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isGenerating ? 'Deconstructing Unit...' : 'Generate Mind-Map'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

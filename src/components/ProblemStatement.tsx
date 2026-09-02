import React from "react";
import { LanguageMode } from "../types";

interface ProblemStatementProps {
  language: LanguageMode;
}

/**
 * A concise section that articulates the gap between the current reality
 * of Ethiopian STEM education and the ideal, then explains how Awde bridges
 * that gap. It is used on the landing page to give visitors a clear problem
 * statement before they enter the workspace.
 */
export const ProblemStatement: React.FC<ProblemStatementProps> = ({ language }) => {
  const isAmharic = language === "am";
  const title = isAmharic
    ? "ግዴታ፣ ውስጥ የተለየ ተማሪዎች እና የተወሰነ የትምህርት መርምር"
    : "The Gap: Traditional Learning vs. Mastery‑Driven Learning";
  const description = isAmharic
    ? "ባለፈው ዘመን፣ ተማሪዎች በመፅሀፍ መጽሀፍት ላይ ብቻ ተገብረው ይዘብበታል። ፈትሽ ያልተገነባ ግምገማዎች፣ የሁኔታ አማራጭነት እና የተቀረበው ተጠቃሚ ትምህርት አይሆንም። አዲሱ ሙዚቃር ተማሪዎች ፈልግቻ በግልጽ ሦስት ሚዲያዎች ተከታይ፣ ሚል የገጽታ ሙዚቃና ተሞክሮዎች ሲሆን የማስተላለፊያ ውስጥ የሚንአል ይዘቶች ባለሙዚቃር ምንጭም ቢሆን ለኮፐፍና ሕብረት ተማሪዎች ይዘቦችን ይዞታል።"
    : "Students today rely on static textbooks that force rote‑reading and memorization. There is no immediate feedback, no cultural relevance, and no way to measure whether the learning actually sticks. The result: low retention, disengagement, and a widening gap between what schools teach and what learners need to master.\n\nAwde addresses these pain points by turning any textbook into a bilingual, interactive mind‑map, providing Socratic Feynman dialogue (Rooty) for instant conceptual feedback, and a data‑driven efficacy lab that quantifies before‑and‑after recall. The platform is built for low‑bandwidth environments, works fully offline, and grounds every analogy in Ethiopian cultural context, closing the gap between reality and ideal.";

  return (
    <section className="max-w-4xl mx-auto py-12 px-6 sm:px-8 space-y-6">
      <h2 className="text-2xl sm:text-3xl font-bold text-center" style={{ color: "var(--app-accent, #4f46e5)" }}>
        {title}
      </h2>
      <p className="text-base sm:text-lg leading-relaxed text-center" style={{ color: "var(--app-text-muted, #475569)" }}>
        {description}
      </p>
    </section>
  );
};

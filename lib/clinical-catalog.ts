import { demoAccounts, getProvidersFromAccounts } from "@/lib/account-directory";

export type Specialty = {
  id: string;
  name: string;
  description: string;
};

export type EducationSection = {
  title: string;
  body: string;
};

export type MediaAsset = {
  id: string;
  title: string;
  type: "video" | "diagram" | "handout";
  description: string;
  duration?: string;
};

export type ConsentTemplate = {
  id: string;
  title: string;
  sections: string[];
};

export type TreatmentOption = {
  id: string;
  specialtyId: string;
  label: string;
  summary: string;
  optionGroup: string;
  optionGroupLabel: string;
  visits: string[];
  temporaryNotes: string[];
  patientBenefits: string[];
  patientTradeoffs: string[];
  mediaAssetIds: string[];
  consentTemplateId: string;
};

export type DiagnosisTemplate = {
  id: string;
  specialtyId: string;
  label: string;
  plainLanguageSummary: string;
  educationSections: EducationSection[];
  treatmentOptionIds: string[];
  commonQuestions: string[];
  mediaAssetIds: string[];
};

export type PracticeOverride = {
  diagnosisId: string;
  infoPageTitle: string;
  infoPageIntro: string;
  consentIntro: string;
  preferredMediaAssetIds: string[];
  consentTemplateId?: string;
};

export type PracticeProfile = {
  id: string;
  name: string;
  description: string;
  defaultPackageSource: "library" | "custom";
  brandNote: string;
  providers: {
    id: string;
    name: string;
    role: "provider" | "front-desk" | "admin";
  }[];
  overrides: PracticeOverride[];
};

const section = (title: string, body: string): EducationSection => ({ title, body });

const diagnosis = (
  id: string,
  specialtyId: string,
  label: string,
  plainLanguageSummary: string,
  treatmentOptionIds: string[],
  commonQuestions: string[],
  mediaAssetIds: string[],
  educationSections: EducationSection[]
): DiagnosisTemplate => ({
  id,
  specialtyId,
  label,
  plainLanguageSummary,
  treatmentOptionIds,
  commonQuestions,
  mediaAssetIds,
  educationSections
});

const generalDiagnosis = (
  id: string,
  label: string,
  plainLanguageSummary: string,
  treatmentOptionIds: string[],
  commonQuestions: string[],
  mediaAssetIds: string[],
  detail: {
    means: string;
    matters: string;
    goal: string;
  }
): DiagnosisTemplate =>
  diagnosis(id, "general-dentistry", label, plainLanguageSummary, treatmentOptionIds, commonQuestions, mediaAssetIds, [
    section("What this diagnosis means", detail.means),
    section("Why it matters", detail.matters),
    section("Treatment goal", detail.goal)
  ]);

const treatment = (
  id: string,
  specialtyId: string,
  label: string,
  summary: string,
  optionGroup: string,
  optionGroupLabel: string,
  visits: string[],
  temporaryNotes: string[],
  patientBenefits: string[],
  patientTradeoffs: string[],
  mediaAssetIds: string[],
  consentTemplateId: string
): TreatmentOption => ({
  id,
  specialtyId,
  label,
  summary,
  optionGroup,
  optionGroupLabel,
  visits,
  temporaryNotes,
  patientBenefits,
  patientTradeoffs,
  mediaAssetIds,
  consentTemplateId
});

export const specialties: Specialty[] = [
  {
    id: "general-dentistry",
    name: "General Dentistry",
    description: "Restorative diagnosis, structural breakdown, wear, and routine tooth-preserving treatment planning."
  },
  {
    id: "endodontics",
    name: "Endodontics",
    description: "Pulpal pain, infection, root canal therapy, retreatment, and apical surgery."
  },
  {
    id: "oral-surgery",
    name: "Oral Surgery",
    description: "Extractions, impacted teeth, site development, and other surgical treatment pathways."
  },
  {
    id: "periodontics",
    name: "Periodontics",
    description: "Gum disease, recession, supporting bone loss, and long-term maintenance planning."
  },
  {
    id: "prosthodontics",
    name: "Prosthodontics",
    description: "Tooth replacement, complex reconstruction, dentures, bridges, and esthetic rehabilitation."
  },
  {
    id: "orthodontics",
    name: "Orthodontics",
    description: "Crowding, bite correction, and aligner-based movement planning."
  }
];

export const mediaCatalog: MediaAsset[] = [
  {
    id: "video-root-canal-overview",
    title: "Root Canal Overview",
    type: "video",
    duration: "2:10",
    description: "Walkthrough of inflamed or infected nerve tissue and how treatment cleans and seals the tooth."
  },
  {
    id: "diagram-root-canal-steps",
    title: "Root Canal Step Diagram",
    type: "diagram",
    description: "Visual sequence of accessing, cleaning, filling, and restoring the tooth."
  },
  {
    id: "handout-root-canal-aftercare",
    title: "Root Canal Recovery Handout",
    type: "handout",
    description: "Simple recovery guidance, symptom expectations, and when to call the office."
  },
  {
    id: "video-filling-overview",
    title: "Filling Treatment Overview",
    type: "video",
    duration: "1:20",
    description: "Short explanation of removing decay and rebuilding the tooth with a filling."
  },
  {
    id: "diagram-filling-vs-crown",
    title: "Filling Versus Crown Diagram",
    type: "diagram",
    description: "Illustrates when a tooth can still be treated with a direct restoration and when more coverage is needed."
  },
  {
    id: "handout-restorative-aftercare",
    title: "Restorative Treatment Handout",
    type: "handout",
    description: "Explains numbness, bite adjustment, and what normal sensitivity can feel like after restorative work."
  },
  {
    id: "video-crown-overview",
    title: "Crown Treatment Overview",
    type: "video",
    duration: "1:30",
    description: "Patient-friendly explanation of tooth preparation, temporaries, and final crown delivery."
  },
  {
    id: "diagram-crown-temporary",
    title: "Temporary Crown Diagram",
    type: "diagram",
    description: "Visual guide to the temporary phase and how to avoid losing or damaging the temporary."
  },
  {
    id: "handout-crown-consent",
    title: "Crown and Onlay Summary",
    type: "handout",
    description: "Covers multi-visit expectations, bite changes, and the role of definitive coverage."
  },
  {
    id: "video-extraction-overview",
    title: "Extraction and Healing Overview",
    type: "video",
    duration: "1:45",
    description: "Explains when a tooth is no longer predictably savable and what early healing looks like."
  },
  {
    id: "diagram-extraction-healing",
    title: "Extraction Healing Diagram",
    type: "diagram",
    description: "Shows clot protection, swelling expectations, and early socket healing."
  },
  {
    id: "handout-extraction-aftercare",
    title: "Extraction Aftercare Handout",
    type: "handout",
    description: "Office-friendly guide to bleeding, swelling, diet changes, and warning signs."
  },
  {
    id: "video-implant-overview",
    title: "Dental Implant Overview",
    type: "video",
    duration: "2:20",
    description: "Explains how implants replace a missing tooth and why healing time matters."
  },
  {
    id: "diagram-implant-phases",
    title: "Implant Treatment Phases",
    type: "diagram",
    description: "Shows extraction, grafting, implant placement, healing, and final restoration timing."
  },
  {
    id: "handout-implant-timeline",
    title: "Implant Timeline Handout",
    type: "handout",
    description: "Simple explainer covering multiple visits, healing windows, and temporary replacement options."
  },
  {
    id: "video-periodontal-therapy",
    title: "Gum Therapy Overview",
    type: "video",
    duration: "1:50",
    description: "Covers why gum disease treatment targets infection under the gums and around the roots."
  },
  {
    id: "diagram-periodontal-charting",
    title: "Periodontal Charting Diagram",
    type: "diagram",
    description: "Helps patients understand pockets, bone loss, and the purpose of maintenance visits."
  },
  {
    id: "handout-periodontal-maintenance",
    title: "Periodontal Maintenance Handout",
    type: "handout",
    description: "Explains why maintenance is ongoing and how it differs from a regular cleaning."
  },
  {
    id: "video-denture-options",
    title: "Denture and Partial Options",
    type: "video",
    duration: "1:55",
    description: "Explains removable tooth replacement, adaptation, and common adjustment expectations."
  },
  {
    id: "diagram-bridge-vs-implant",
    title: "Bridge Versus Implant Diagram",
    type: "diagram",
    description: "Compares how fixed tooth replacement choices work and what each option asks of nearby teeth or bone."
  },
  {
    id: "handout-prosthetic-adaptation",
    title: "Tooth Replacement Adaptation Handout",
    type: "handout",
    description: "Reviews speech, chewing, soreness, and adjustment expectations after replacement treatment."
  },
  {
    id: "video-aligner-overview",
    title: "Clear Aligner Overview",
    type: "video",
    duration: "1:35",
    description: "Explains staged tooth movement, wear time, attachments, and retainers."
  },
  {
    id: "diagram-tooth-wear-night-guard",
    title: "Tooth Wear and Night Guard Diagram",
    type: "diagram",
    description: "Shows how clenching and grinding can flatten teeth, crack enamel, and strain restorations."
  },
  {
    id: "handout-whitening-veneers",
    title: "Cosmetic Treatment Handout",
    type: "handout",
    description: "Reviews esthetic goals, limitations, and how elective treatments differ from medically necessary care."
  }
];

export const consentCatalog: ConsentTemplate[] = [
  {
    id: "consent-filling",
    title: "Filling Treatment Consent",
    sections: [
      "Purpose of treatment: remove decayed or defective tooth structure and rebuild the tooth.",
      "Known alternatives: monitor, larger indirect restoration, or extraction when the tooth is not restorable.",
      "Common risks and limitations: temporary sensitivity, bite changes, deeper decay than expected, or future need for root canal or crown.",
      "Next-step reality: restorations can fail over time and may need repair or replacement."
    ]
  },
  {
    id: "consent-crown",
    title: "Crown or Onlay Consent",
    sections: [
      "Purpose of treatment: protect and restore a tooth with significant breakdown or fracture risk.",
      "Known alternatives: larger filling, inlay/onlay, extraction, or referral depending on remaining tooth structure.",
      "Common risks and limitations: temporary sensitivity, temporary restoration issues, bite adjustment, or deeper damage discovered after preparation.",
      "Next-step reality: a temporary phase and more than one visit are common."
    ]
  },
  {
    id: "consent-root-canal",
    title: "Root Canal Therapy Consent",
    sections: [
      "Purpose of treatment: remove inflamed or infected tissue from inside the tooth and retain the tooth when possible.",
      "Known alternatives: extraction, observation in very limited circumstances, or referral for another opinion.",
      "Common risks and limitations: soreness, hidden anatomy, missed canals, future retreatment, or eventual need for extraction.",
      "Next-step reality: definitive restoration is often needed after endodontic treatment."
    ]
  },
  {
    id: "consent-retreatment",
    title: "Root Canal Retreatment Consent",
    sections: [
      "Purpose of treatment: reopen a previously treated tooth and attempt to address persistent or recurrent infection.",
      "Known alternatives: apicoectomy, extraction, or specialist evaluation.",
      "Common risks and limitations: posts, crowns, or prior materials can limit access and predictability.",
      "Next-step reality: even after retreatment, surgical treatment or extraction may still become necessary."
    ]
  },
  {
    id: "consent-extraction",
    title: "Extraction Consent",
    sections: [
      "Purpose of treatment: remove a tooth that is not predictably restorable or is causing ongoing harm.",
      "Known alternatives: restorative or endodontic treatment when clinically feasible, or referral for another opinion.",
      "Common risks and limitations: pain, swelling, bleeding, dry socket, delayed healing, or future tooth replacement needs.",
      "Next-step reality: healing, diet changes, and replacement planning may follow removal."
    ]
  },
  {
    id: "consent-implant",
    title: "Implant and Site Development Consent",
    sections: [
      "Purpose of treatment: replace a missing tooth or prepare the site for stable future tooth replacement.",
      "Known alternatives: bridge, removable replacement, or no replacement in selected cases.",
      "Common risks and limitations: healing time, graft integration limits, implant failure, or need for staged surgery.",
      "Next-step reality: multiple visits and healing periods are normal."
    ]
  },
  {
    id: "consent-periodontal",
    title: "Periodontal Therapy Consent",
    sections: [
      "Purpose of treatment: reduce bacterial infection and inflammation around the teeth and roots.",
      "Known alternatives: delayed treatment or referral, though untreated disease can progress.",
      "Common risks and limitations: soreness, recession awareness, ongoing maintenance needs, and incomplete response in advanced disease.",
      "Next-step reality: long-term maintenance is part of successful treatment."
    ]
  },
  {
    id: "consent-bridge-denture",
    title: "Bridge and Denture Consent",
    sections: [
      "Purpose of treatment: replace missing teeth and restore chewing and appearance.",
      "Known alternatives: implants, other removable or fixed options, or no treatment in selected cases.",
      "Common risks and limitations: speech adaptation, sore spots, food trapping, repairs, or remake over time.",
      "Next-step reality: follow-up adjustments are common while the patient adapts."
    ]
  },
  {
    id: "consent-orthodontic",
    title: "Clear Aligner Consent",
    sections: [
      "Purpose of treatment: move teeth gradually to improve alignment, spacing, or bite relationships.",
      "Known alternatives: braces, retainers only, limited cosmetic reshaping, or no treatment.",
      "Common risks and limitations: compliance requirements, attachments, refinement stages, and relapse without retention.",
      "Next-step reality: consistent tray wear and long-term retainers matter."
    ]
  },
  {
    id: "consent-cosmetic",
    title: "Cosmetic Treatment Consent",
    sections: [
      "Purpose of treatment: improve appearance, shade, or smile design according to patient goals.",
      "Known alternatives: observation, whitening only, additive bonding, or more comprehensive reconstruction.",
      "Common risks and limitations: sensitivity, maintenance, replacement over time, and esthetic subjectivity.",
      "Next-step reality: cosmetic work is elective and may still need maintenance or replacement."
    ]
  }
];

export const treatmentCatalog: TreatmentOption[] = [
  {
    id: "monitoring",
    specialtyId: "general-dentistry",
    label: "Monitoring",
    summary: "Used when the condition may not require immediate treatment but does require review and reassessment.",
    optionGroup: "observation",
    optionGroupLabel: "Observation options",
    visits: [
      "Current visit: review findings and document baseline photos or radiographs.",
      "Follow-up: re-evaluate symptoms, imaging, or progression at a planned interval.",
      "Future care: move to active treatment if the condition worsens or becomes symptomatic."
    ],
    temporaryNotes: [
      "Monitoring is not the same as treatment and can still lead to future intervention.",
      "Patients should understand the signs that should trigger an earlier call."
    ],
    patientBenefits: [
      "Avoids immediate treatment when the office believes careful observation is appropriate.",
      "Lets the patient understand risk before committing to a procedure."
    ],
    patientTradeoffs: [
      "The condition can still progress while being watched.",
      "Waiting can narrow options if the tooth or tissues deteriorate."
    ],
    mediaAssetIds: ["diagram-filling-vs-crown", "handout-restorative-aftercare"],
    consentTemplateId: "consent-filling"
  },
  {
    id: "filling",
    specialtyId: "general-dentistry",
    label: "Filling",
    summary: "Remove localized decay or defective restorative material and rebuild the tooth directly.",
    optionGroup: "conservative-restoration",
    optionGroupLabel: "Conservative restoration options",
    visits: [
      "Visit 1: numb the area, remove decay, and place the restoration.",
      "Same day: check the bite and review numbness or sensitivity expectations.",
      "Follow-up only if needed: adjust the bite or re-evaluate lingering symptoms."
    ],
    temporaryNotes: [
      "Most fillings are completed in one visit without a temporary phase.",
      "The bite can feel high at first and may need adjustment."
    ],
    patientBenefits: [
      "Keeps treatment conservative when enough healthy tooth remains.",
      "Usually completed quickly with minimal interruption."
    ],
    patientTradeoffs: [
      "If the defect is deeper than expected, the plan can escalate to root canal or coverage.",
      "Large fillings may not protect a weakened tooth long term."
    ],
    mediaAssetIds: ["video-filling-overview", "diagram-filling-vs-crown", "handout-restorative-aftercare"],
    consentTemplateId: "consent-filling"
  },
  {
    id: "inlay-onlay",
    specialtyId: "general-dentistry",
    label: "Inlay or onlay",
    summary: "Provide stronger coverage than a filling while preserving more natural tooth than a full crown.",
    optionGroup: "conservative-restoration",
    optionGroupLabel: "Conservative restoration options",
    visits: [
      "Visit 1: prepare the tooth and capture a scan or impression.",
      "Between visits: wear a temporary if needed.",
      "Visit 2: bond the final inlay or onlay and confirm fit."
    ],
    temporaryNotes: [
      "A temporary may be used depending on how the restoration is made.",
      "Patients should expect at least two steps unless same-day technology is used."
    ],
    patientBenefits: [
      "Provides stronger cuspal support than a filling in the right case.",
      "Can preserve more natural tooth than a full crown."
    ],
    patientTradeoffs: [
      "Requires more planning and may cost more than a filling.",
      "Still may not be enough if the fracture risk becomes greater."
    ],
    mediaAssetIds: ["video-crown-overview", "diagram-crown-temporary", "handout-crown-consent"],
    consentTemplateId: "consent-crown"
  },
  {
    id: "crown",
    specialtyId: "general-dentistry",
    label: "Crown",
    summary: "Reinforce and protect a tooth with broad structural damage using full-coverage restoration.",
    optionGroup: "full-coverage",
    optionGroupLabel: "Full-coverage options",
    visits: [
      "Visit 1: reshape the tooth and place a temporary if the final is not same-day.",
      "Temporary phase: protect the temporary and avoid sticky or hard foods.",
      "Visit 2: seat the final crown and adjust the bite."
    ],
    temporaryNotes: [
      "Temporary crowns are common and can feel different from the final crown.",
      "The office should warn the patient what to do if the temporary loosens."
    ],
    patientBenefits: [
      "Protects heavily restored or cracked teeth more predictably than a large filling.",
      "Restores chewing strength and shape."
    ],
    patientTradeoffs: [
      "Usually requires more than one step and removal of additional outer tooth structure.",
      "If the nerve is already compromised, symptoms can still progress."
    ],
    mediaAssetIds: ["video-crown-overview", "diagram-crown-temporary", "handout-crown-consent"],
    consentTemplateId: "consent-crown"
  },
  {
    id: "root-canal",
    specialtyId: "endodontics",
    label: "Root canal therapy",
    summary: "Remove infected or inflamed tissue inside the tooth and seal the canal system to keep the tooth when possible.",
    optionGroup: "tooth-preserving",
    optionGroupLabel: "Tooth-preserving options",
    visits: [
      "Visit 1: numb the tooth, access the canals, disinfect, and seal or place a temporary filling.",
      "Visit 2 if needed: complete treatment or confirm symptoms are improving.",
      "Follow-up: return to the restoring doctor for the final build-up or crown if recommended."
    ],
    temporaryNotes: [
      "A temporary filling may be present before the final restoration is completed.",
      "Soreness with chewing for a few days can still be normal."
    ],
    patientBenefits: [
      "Treats the infection or inflamed nerve while keeping the natural tooth in function.",
      "Often resolves the underlying pain source directly."
    ],
    patientTradeoffs: [
      "The tooth commonly still needs a crown or additional restoration afterward.",
      "Complex anatomy or fractures can still reduce long-term predictability."
    ],
    mediaAssetIds: ["video-root-canal-overview", "diagram-root-canal-steps", "handout-root-canal-aftercare"],
    consentTemplateId: "consent-root-canal"
  },
  {
    id: "root-canal-retreatment",
    specialtyId: "endodontics",
    label: "Root canal retreatment",
    summary: "Re-enter a previously treated tooth to address persistent infection or inadequate prior sealing.",
    optionGroup: "tooth-preserving",
    optionGroupLabel: "Tooth-preserving options",
    visits: [
      "Visit 1: remove prior filling material and evaluate access through existing restorations.",
      "Additional visits: disinfect, medicate if needed, and refill the canal system.",
      "Follow-up: coordinate final restoration or further evaluation."
    ],
    temporaryNotes: [
      "Retreatment can be less predictable because of prior materials, posts, and crowns.",
      "Multiple visits are more common than with a straightforward first-time root canal."
    ],
    patientBenefits: [
      "Provides another chance to save a tooth that still has restorative value.",
      "Can address lingering infection without immediate extraction."
    ],
    patientTradeoffs: [
      "Access may require drilling through a crown or removing prior build-up.",
      "Surgery or extraction can still be needed afterward."
    ],
    mediaAssetIds: ["video-root-canal-overview", "diagram-root-canal-steps", "handout-root-canal-aftercare"],
    consentTemplateId: "consent-retreatment"
  },
  {
    id: "apicoectomy",
    specialtyId: "endodontics",
    label: "Apicoectomy",
    summary: "Surgically treat persistent infection near the end of a root when conventional retreatment is limited or unsuccessful.",
    optionGroup: "surgical-endodontics",
    optionGroupLabel: "Surgical endodontic options",
    visits: [
      "Visit 1: surgical access to the root end, cleaning, and sealing of the tip of the root.",
      "Healing period: manage swelling and soft tissue recovery.",
      "Follow-up: evaluate symptoms and healing on imaging."
    ],
    temporaryNotes: [
      "Soft tissue soreness and swelling are expected parts of the recovery phase.",
      "This is usually a specialist-level procedure with a healing review afterward."
    ],
    patientBenefits: [
      "Can save a tooth when infection persists despite prior root canal treatment.",
      "Avoids extraction in selected cases."
    ],
    patientTradeoffs: [
      "It is still a surgical procedure with healing and swelling.",
      "Not every tooth anatomy or restorative situation is a good candidate."
    ],
    mediaAssetIds: ["video-root-canal-overview", "diagram-root-canal-steps", "handout-root-canal-aftercare"],
    consentTemplateId: "consent-retreatment"
  },
  {
    id: "extraction",
    specialtyId: "oral-surgery",
    label: "Extraction",
    summary: "Remove the tooth when long-term predictability is poor or the problem cannot be reasonably repaired.",
    optionGroup: "tooth-removal",
    optionGroupLabel: "Removal options",
    visits: [
      "Visit 1: remove the tooth and control bleeding.",
      "Healing period: protect the site and review diet and activity guidance.",
      "Future planning: discuss implant, bridge, partial, or no replacement depending on the case."
    ],
    temporaryNotes: [
      "Healing of the site is its own phase and can affect when replacement is started.",
      "A temporary replacement option may or may not be used during healing."
    ],
    patientBenefits: [
      "Removes a painful or non-restorable tooth and addresses the immediate source.",
      "Can be more direct than investing in a very poor-prognosis tooth."
    ],
    patientTradeoffs: [
      "The patient leaves with a missing tooth unless replacement is planned separately.",
      "Healing and future replacement planning often add more steps."
    ],
    mediaAssetIds: ["video-extraction-overview", "diagram-extraction-healing", "handout-extraction-aftercare"],
    consentTemplateId: "consent-extraction"
  },
  {
    id: "wisdom-tooth-removal",
    specialtyId: "oral-surgery",
    label: "Impacted or erupted wisdom tooth removal",
    summary: "Remove a third molar that is causing infection, decay, crowding pressure, or difficult hygiene.",
    optionGroup: "tooth-removal",
    optionGroupLabel: "Removal options",
    visits: [
      "Visit 1: remove the wisdom tooth with local anesthesia or sedation planning as needed.",
      "Immediate recovery: swelling, soreness, and diet adjustments are expected.",
      "Follow-up only if needed: review healing or address concerns."
    ],
    temporaryNotes: [
      "Swelling and limited opening can occur for several days.",
      "Patients often need very direct food and activity instructions."
    ],
    patientBenefits: [
      "Removes a recurring source of gum inflammation, pain, or inaccessible decay.",
      "Can reduce future damage to the neighboring tooth."
    ],
    patientTradeoffs: [
      "Surgical healing is part of the treatment, even when the tooth is not badly painful today.",
      "Sedation planning may add logistics or cost."
    ],
    mediaAssetIds: ["video-extraction-overview", "diagram-extraction-healing", "handout-extraction-aftercare"],
    consentTemplateId: "consent-extraction"
  },
  {
    id: "socket-preservation",
    specialtyId: "oral-surgery",
    label: "Socket preservation or bone graft",
    summary: "Place grafting material at or after extraction to better preserve future implant or ridge contours.",
    optionGroup: "site-development",
    optionGroupLabel: "Site development options",
    visits: [
      "Visit 1: graft the extraction site or deficient area.",
      "Healing phase: allow the area to mature before implant or final replacement.",
      "Future evaluation: rescan or reassess the site for the next phase."
    ],
    temporaryNotes: [
      "This adds a healing phase before the final replacement can begin.",
      "Patients often need to understand that grafting is preparation, not the final replacement itself."
    ],
    patientBenefits: [
      "Can improve future implant or pontic support and preserve ridge form.",
      "Makes replacement planning more predictable in selected cases."
    ],
    patientTradeoffs: [
      "Adds time and cost before the final replacement.",
      "Healing does not guarantee that no additional grafting will ever be needed."
    ],
    mediaAssetIds: ["video-implant-overview", "diagram-implant-phases", "handout-implant-timeline"],
    consentTemplateId: "consent-implant"
  },
  {
    id: "implant",
    specialtyId: "prosthodontics",
    label: "Implant",
    summary: "Replace a missing tooth or support prosthetics with a fixture placed in bone and restored after healing.",
    optionGroup: "fixed-replacement",
    optionGroupLabel: "Fixed replacement options",
    visits: [
      "Phase 1: site preparation or implant placement.",
      "Healing phase: allow integration before the final tooth is attached.",
      "Final phase: place the custom restoration and review cleaning and maintenance."
    ],
    temporaryNotes: [
      "Patients should expect multiple visits and a healing window between steps.",
      "A temporary replacement may be needed while healing happens."
    ],
    patientBenefits: [
      "Replaces a tooth without using adjacent teeth for support.",
      "Can feel stable and natural when the case heals well."
    ],
    patientTradeoffs: [
      "Takes time and may involve surgery or grafting.",
      "Not every patient or site is immediately ready for implant treatment."
    ],
    mediaAssetIds: ["video-implant-overview", "diagram-implant-phases", "handout-implant-timeline"],
    consentTemplateId: "consent-implant"
  },
  {
    id: "bridge",
    specialtyId: "prosthodontics",
    label: "Bridge",
    summary: "Replace a missing tooth with a fixed restoration anchored to neighboring teeth.",
    optionGroup: "fixed-replacement",
    optionGroupLabel: "Fixed replacement options",
    visits: [
      "Visit 1: prepare the support teeth and capture a scan or impression.",
      "Temporary phase: wear the temporary bridge and protect it.",
      "Visit 2: seat the final bridge and check fit, bite, and cleansability."
    ],
    temporaryNotes: [
      "There is usually a temporary phase before the final bridge is delivered.",
      "Patients need instructions on how to clean under the replacement tooth."
    ],
    patientBenefits: [
      "Replaces a missing tooth without surgical implant placement.",
      "Can restore function and appearance relatively quickly."
    ],
    patientTradeoffs: [
      "Requires reshaping neighboring teeth that may otherwise be healthy.",
      "Bridge maintenance under the restoration is important and can be overlooked."
    ],
    mediaAssetIds: ["diagram-bridge-vs-implant", "handout-prosthetic-adaptation", "video-crown-overview"],
    consentTemplateId: "consent-bridge-denture"
  },
  {
    id: "partial-denture",
    specialtyId: "prosthodontics",
    label: "Partial denture",
    summary: "Replace one or more missing teeth with a removable appliance.",
    optionGroup: "removable-replacement",
    optionGroupLabel: "Removable replacement options",
    visits: [
      "Visit 1: records, impressions, or scans are taken.",
      "Try-in phase: evaluate fit, bite, and tooth arrangement if needed.",
      "Delivery and adjustment: place the partial and review adaptation."
    ],
    temporaryNotes: [
      "Adjustment visits are common as the patient gets used to the appliance.",
      "Speech and chewing can feel different at first."
    ],
    patientBenefits: [
      "Can replace multiple missing teeth without surgery.",
      "May be more affordable and easier to stage than fixed options."
    ],
    patientTradeoffs: [
      "It is removable and requires daily insertion, removal, and cleaning.",
      "Adaptation and sore spots are common early on."
    ],
    mediaAssetIds: ["video-denture-options", "handout-prosthetic-adaptation", "diagram-bridge-vs-implant"],
    consentTemplateId: "consent-bridge-denture"
  },
  {
    id: "full-denture",
    specialtyId: "prosthodontics",
    label: "Full denture",
    summary: "Replace a full arch of missing teeth with a removable prosthesis.",
    optionGroup: "removable-replacement",
    optionGroupLabel: "Removable replacement options",
    visits: [
      "Records phase: impressions, scans, and jaw relation records are taken.",
      "Try-in phase: preview esthetics and bite.",
      "Delivery and adaptation: deliver the denture and schedule adjustments."
    ],
    temporaryNotes: [
      "Patients should expect multiple adjustment visits as sore spots are relieved.",
      "Chewing and speaking take time to adapt after delivery."
    ],
    patientBenefits: [
      "Provides full-arch tooth replacement without implant surgery.",
      "Can restore appearance and basic chewing function."
    ],
    patientTradeoffs: [
      "Stability and adaptation are variable depending on anatomy.",
      "Bone changes over time mean relines or remake can eventually be necessary."
    ],
    mediaAssetIds: ["video-denture-options", "handout-prosthetic-adaptation", "diagram-implant-phases"],
    consentTemplateId: "consent-bridge-denture"
  },
  {
    id: "scaling-root-planing",
    specialtyId: "periodontics",
    label: "Scaling and root planing (deep cleaning)",
    summary: "Deep cleaning below the gumline to reduce infection around roots and support tissues.",
    optionGroup: "gum-disease-control",
    optionGroupLabel: "Gum disease control options",
    visits: [
      "Visit 1 and later visits: treat the affected areas in sections.",
      "Re-evaluation: remeasure healing and pocket response.",
      "Maintenance phase: shift to ongoing periodontal maintenance."
    ],
    temporaryNotes: [
      "Soreness and cold sensitivity can happen after deep cleaning.",
      "This is often completed across multiple visits or sections."
    ],
    patientBenefits: [
      "Targets the bacterial source under the gums.",
      "Can reduce inflammation, bleeding, and disease progression."
    ],
    patientTradeoffs: [
      "It does not regenerate every area of lost bone.",
      "Long-term maintenance is still required after active treatment."
    ],
    mediaAssetIds: ["video-periodontal-therapy", "diagram-periodontal-charting", "handout-periodontal-maintenance"],
    consentTemplateId: "consent-periodontal"
  },
  {
    id: "periodontal-maintenance",
    specialtyId: "periodontics",
    label: "Periodontal maintenance",
    summary: "Ongoing maintenance after gum disease treatment to help control recurrence.",
    optionGroup: "gum-disease-control",
    optionGroupLabel: "Gum disease control options",
    visits: [
      "Scheduled maintenance visits: review inflammation, measurements, and home care.",
      "Spot treatment as needed: localized areas may need additional attention.",
      "Long-term phase: maintain the healthiest stable condition possible."
    ],
    temporaryNotes: [
      "This is a recurring maintenance plan, not a one-time cure.",
      "The interval may differ from a standard six-month cleaning."
    ],
    patientBenefits: [
      "Supports long-term stability after periodontal treatment.",
      "Creates regular opportunities to catch relapse earlier."
    ],
    patientTradeoffs: [
      "Requires commitment to ongoing visits.",
      "Untreated home care issues can still cause recurrence."
    ],
    mediaAssetIds: ["video-periodontal-therapy", "diagram-periodontal-charting", "handout-periodontal-maintenance"],
    consentTemplateId: "consent-periodontal"
  },
  {
    id: "gum-graft",
    specialtyId: "periodontics",
    label: "Gum graft",
    summary: "Cover exposed roots or thicken fragile gum tissue in selected recession cases.",
    optionGroup: "soft-tissue-correction",
    optionGroupLabel: "Soft tissue correction options",
    visits: [
      "Visit 1: surgically place the graft or graft substitute.",
      "Healing phase: protect the area while the tissue stabilizes.",
      "Follow-up: review comfort, coverage, and oral hygiene instructions."
    ],
    temporaryNotes: [
      "Soft tissue healing and appearance change over several weeks.",
      "Patients need very specific brushing instructions during early healing."
    ],
    patientBenefits: [
      "Can reduce root exposure, sensitivity, or further tissue loss in selected cases.",
      "Improves tissue thickness where it is thin and vulnerable."
    ],
    patientTradeoffs: [
      "It is a surgical procedure with recovery and appearance changes during healing.",
      "Coverage goals vary by anatomy and severity."
    ],
    mediaAssetIds: ["video-periodontal-therapy", "diagram-periodontal-charting", "handout-periodontal-maintenance"],
    consentTemplateId: "consent-periodontal"
  },
  {
    id: "night-guard",
    specialtyId: "general-dentistry",
    label: "Night guard",
    summary: "Use a protective appliance to reduce wear forces and protect teeth or restorations from grinding.",
    optionGroup: "wear-management",
    optionGroupLabel: "Wear management options",
    visits: [
      "Visit 1: take records or scans.",
      "Delivery visit: fit the guard and review wear instructions.",
      "Follow-up as needed: adjust fit and monitor signs of wear."
    ],
    temporaryNotes: [
      "This is a preventive or protective phase, not a repair by itself.",
      "Some patients need an adjustment period to sleep comfortably with it."
    ],
    patientBenefits: [
      "Can help protect teeth, crowns, and restorations from ongoing grinding damage.",
      "Provides a conservative first step when managing wear."
    ],
    patientTradeoffs: [
      "It does not reverse lost tooth structure.",
      "Success depends on actually wearing the appliance."
    ],
    mediaAssetIds: ["diagram-tooth-wear-night-guard", "handout-restorative-aftercare"],
    consentTemplateId: "consent-filling"
  },
  {
    id: "aligner-therapy",
    specialtyId: "orthodontics",
    label: "Clear aligner therapy",
    summary: "Use a staged series of aligners to move teeth and improve crowding, spacing, or bite issues.",
    optionGroup: "bite-alignment",
    optionGroupLabel: "Bite and alignment options",
    visits: [
      "Planning phase: records, scans, and movement review.",
      "Active phase: wear aligners consistently and switch trays on schedule.",
      "Finishing phase: refinements and retainers."
    ],
    temporaryNotes: [
      "Treatment often includes attachments, monitoring visits, and a retainer phase.",
      "Patients should expect that refinements can extend the plan."
    ],
    patientBenefits: [
      "Can improve alignment with a removable, clear system.",
      "Provides a structured sequence patients can understand and track."
    ],
    patientTradeoffs: [
      "Works only if the patient wears aligners consistently.",
      "Movement limits mean some cases still need braces or combined treatment."
    ],
    mediaAssetIds: ["video-aligner-overview", "handout-whitening-veneers"],
    consentTemplateId: "consent-orthodontic"
  },
  {
    id: "veneers",
    specialtyId: "prosthodontics",
    label: "Veneers",
    summary: "Use cosmetic coverage on the front surfaces of teeth to improve esthetics and selected shape issues.",
    optionGroup: "cosmetic-enhancement",
    optionGroupLabel: "Cosmetic enhancement options",
    visits: [
      "Planning phase: records, shade, and smile design review.",
      "Preparation phase: minimal shaping, scans, and temporaries if needed.",
      "Delivery phase: bond the veneers and refine esthetics."
    ],
    temporaryNotes: [
      "Cosmetic planning and try-in conversations are part of the process.",
      "Temporary or mock-up phases can help prevent surprises."
    ],
    patientBenefits: [
      "Can make a major esthetic change in selected cases.",
      "Addresses color and shape concerns more directly than whitening alone."
    ],
    patientTradeoffs: [
      "This is elective treatment and may involve irreversible tooth preparation.",
      "Maintenance and eventual replacement can still be part of long-term care."
    ],
    mediaAssetIds: ["handout-whitening-veneers", "video-crown-overview"],
    consentTemplateId: "consent-cosmetic"
  },
  {
    id: "whitening",
    specialtyId: "prosthodontics",
    label: "Whitening",
    summary: "Use professional whitening to improve tooth shade when structure and health otherwise allow.",
    optionGroup: "cosmetic-enhancement",
    optionGroupLabel: "Cosmetic enhancement options",
    visits: [
      "Current visit: confirm candidacy and explain stain patterns and sensitivity risk.",
      "Treatment phase: in-office or take-home whitening protocol.",
      "Follow-up: review shade change and maintenance."
    ],
    temporaryNotes: [
      "Sensitivity can occur during active whitening.",
      "Existing crowns and fillings do not whiten like natural tooth structure."
    ],
    patientBenefits: [
      "Provides a conservative esthetic option before more involved treatment.",
      "Usually does not require drilling or structural change."
    ],
    patientTradeoffs: [
      "Shade change varies and may not fully correct all discoloration.",
      "Results need maintenance and can relapse with diet and habits."
    ],
    mediaAssetIds: ["handout-whitening-veneers"],
    consentTemplateId: "consent-cosmetic"
  },
  treatment(
    "fluoride-remineralization",
    "general-dentistry",
    "Fluoride / remineralization",
    "Use fluoride-based therapies and remineralization guidance to strengthen weakened enamel and slow early breakdown.",
    "preventive-care",
    "Preventive care options",
    [
      "Current visit: review the weak areas and apply or recommend fluoride support.",
      "Home phase: follow the office's product and hygiene instructions consistently.",
      "Re-evaluation: monitor whether the tooth surfaces stay stable or continue to progress."
    ],
    [
      "This is a supportive treatment, not a repair of lost tooth structure.",
      "Success depends on risk reduction and follow-through at home."
    ],
    [
      "Can strengthen vulnerable enamel without drilling in the right case.",
      "Works well as an early, conservative step when the lesion has not advanced deeply."
    ],
    [
      "It may not be enough if the area is already cavitated or progressing quickly.",
      "Diet and hygiene habits still matter even with fluoride support."
    ],
    ["video-filling-overview", "handout-restorative-aftercare"],
    "consent-filling"
  ),
  treatment(
    "sealant",
    "general-dentistry",
    "Sealant",
    "Place a protective coating in grooves and pits to lower future decay risk in susceptible chewing surfaces.",
    "preventive-care",
    "Preventive care options",
    [
      "Current visit: clean and isolate the tooth, then place the sealant material.",
      "Same day: confirm retention and review chewing expectations.",
      "Recall visits: check whether the sealant stays intact over time."
    ],
    [
      "Sealants are preventive and need periodic review.",
      "A sealant can wear or partially lose retention over time."
    ],
    [
      "Protects deep grooves that are harder to keep clean.",
      "Usually quick, conservative, and comfortable."
    ],
    [
      "It does not repair a tooth that already has significant structural loss.",
      "The tooth still needs ongoing hygiene and regular review."
    ],
    ["video-filling-overview", "diagram-filling-vs-crown"],
    "consent-filling"
  ),
  treatment(
    "composite-filling",
    "general-dentistry",
    "Composite filling",
    "Restore the tooth with tooth-colored filling material after removing decay or a failing restoration.",
    "conservative-restoration",
    "Conservative restoration options",
    [
      "Visit 1: numb the tooth, remove the damaged area, and place the bonded restoration.",
      "Same day: check the bite and review normal post-treatment sensitivity.",
      "Follow-up if needed: adjust the bite or reassess symptoms."
    ],
    [
      "Most composite fillings are completed in one visit.",
      "The bite can feel slightly different until the area settles."
    ],
    [
      "Tooth-colored and conservative when enough tooth remains.",
      "Usually allows fast return to normal chewing."
    ],
    [
      "Larger bonded restorations can still fail if the remaining tooth is weak.",
      "Deeper defects can uncover the need for more involved treatment."
    ],
    ["video-filling-overview", "diagram-filling-vs-crown", "handout-restorative-aftercare"],
    "consent-filling"
  ),
  treatment(
    "amalgam-filling",
    "general-dentistry",
    "Amalgam filling",
    "Restore the tooth with a durable direct filling material in selected situations where the office believes it is appropriate.",
    "conservative-restoration",
    "Conservative restoration options",
    [
      "Visit 1: remove the decayed or defective area and place the restoration.",
      "Same day: review numbness, bite adjustment, and early chewing expectations.",
      "Follow-up only if symptoms or bite concerns remain."
    ],
    [
      "This is usually a one-visit restoration without a temporary phase.",
      "The bite may need minor refinement after placement."
    ],
    [
      "Durable direct restoration option in selected cases.",
      "Can restore function quickly without a multi-visit indirect process."
    ],
    [
      "Not every patient or tooth is the right fit for this material choice.",
      "Large defects may still need more coverage than a direct filling can provide."
    ],
    ["video-filling-overview", "diagram-filling-vs-crown", "handout-restorative-aftercare"],
    "consent-filling"
  ),
  treatment(
    "indirect-restoration",
    "general-dentistry",
    "Indirect restoration (inlay/onlay)",
    "Rebuild the tooth with a custom indirect restoration that offers more support than a filling while preserving more natural structure than a full crown.",
    "conservative-restoration",
    "Conservative restoration options",
    [
      "Visit 1: prepare the tooth and capture a scan or impression.",
      "Interim phase: protect the tooth or wear a temporary if needed.",
      "Visit 2: bond the final inlay or onlay and confirm fit."
    ],
    [
      "This usually involves more than one step unless same-day technology is used.",
      "The office may use a temporary while the final restoration is being made."
    ],
    [
      "Provides stronger support than a direct filling in the right case.",
      "Can preserve more natural tooth than a full-coverage crown."
    ],
    [
      "It requires more planning and usually costs more than a simple direct filling.",
      "If the tooth is weaker than expected, a crown may still become the better option."
    ],
    ["video-crown-overview", "diagram-crown-temporary", "handout-crown-consent"],
    "consent-crown"
  ),
  treatment(
    "sedative-filling",
    "general-dentistry",
    "Sedative filling",
    "Place a temporary or calming restorative material to reduce irritation and protect the tooth while the next step is being determined.",
    "stabilization",
    "Stabilization options",
    [
      "Current visit: remove the most urgent irritant and place the sedative material.",
      "Short-term phase: monitor comfort and chewing response.",
      "Next visit: decide on the definitive restoration or endodontic plan."
    ],
    [
      "This is usually an interim step rather than the final treatment.",
      "The office still needs to reassess the tooth after symptoms settle or change."
    ],
    [
      "Can calm an irritated tooth while buying time for a more informed decision.",
      "Provides short-term protection when the immediate goal is stabilization."
    ],
    [
      "It does not guarantee that the nerve will recover.",
      "A more definitive procedure may still be needed very soon."
    ],
    ["video-filling-overview", "handout-restorative-aftercare"],
    "consent-filling"
  ),
  treatment(
    "definitive-restoration",
    "general-dentistry",
    "Definitive restoration",
    "Complete the final planned restoration after the tooth has been stabilized, treated endodontically, or otherwise prepared for long-term support.",
    "final-restoration",
    "Final restoration options",
    [
      "Current phase: confirm the tooth is ready for final restoration.",
      "Restorative visit: place the definitive material or restoration.",
      "Follow-up: check function, seal, bite, and long-term maintenance instructions."
    ],
    [
      "This is the final support phase after earlier stabilizing or disease-control steps.",
      "The exact restoration depends on how much healthy tooth remains."
    ],
    [
      "Provides the long-term seal and structure the tooth needs after earlier care.",
      "Helps convert a temporary or staged process into a more durable endpoint."
    ],
    [
      "If the tooth changes during the interim period, the final plan may still need to adapt.",
      "Long-term success still depends on maintenance and the underlying tooth condition."
    ],
    ["video-crown-overview", "diagram-crown-temporary", "handout-crown-consent"],
    "consent-crown"
  ),
  treatment(
    "desensitizing-agents",
    "general-dentistry",
    "Desensitizing agents",
    "Use topical desensitizing materials to reduce exposed-root or irritated-tooth sensitivity.",
    "symptom-relief",
    "Symptom relief options",
    [
      "Current visit: identify the sensitive areas and apply the desensitizing material.",
      "Home phase: follow product, brushing, and diet guidance.",
      "Re-evaluation: determine whether the sensitivity is improving or points to a deeper issue."
    ],
    [
      "This may be supportive rather than definitive treatment.",
      "Sensitivity can still return if the underlying cause remains active."
    ],
    [
      "Provides a conservative way to reduce discomfort quickly in selected cases.",
      "Can help clarify whether the pain is surface sensitivity or a deeper pulpal problem."
    ],
    [
      "It does not rebuild lost structure or remove deeper disease.",
      "Persistent sensitivity may mean the tooth needs a different treatment."
    ],
    ["handout-restorative-aftercare", "diagram-tooth-wear-night-guard"],
    "consent-filling"
  ),
  treatment(
    "pulpotomy",
    "endodontics",
    "Pulpotomy",
    "Remove the most inflamed portion of the pulp and place a medicated protective material in carefully selected cases.",
    "tooth-preserving",
    "Tooth-preserving options",
    [
      "Current visit: access the pulp, remove the targeted tissue, and place the medicated barrier.",
      "Short-term follow-up: monitor comfort and pulpal response.",
      "Next-step decision: continue observation or move to more definitive endodontic treatment if needed."
    ],
    [
      "This can be a staged or selective approach rather than a full root canal immediately.",
      "The tooth still needs close follow-up after treatment."
    ],
    [
      "May preserve part of the tooth's vitality in the right case.",
      "Can be less invasive than full canal treatment when the diagnosis supports it."
    ],
    [
      "Not every symptomatic tooth is a good pulpotomy candidate.",
      "A root canal or extraction may still become necessary later."
    ],
    ["video-root-canal-overview", "diagram-root-canal-steps", "handout-root-canal-aftercare"],
    "consent-root-canal"
  ),
  treatment(
    "occlusal-adjustment",
    "general-dentistry",
    "Occlusal adjustment",
    "Refine the bite where excess contact or traumatic force is contributing to soreness, overload, or restorative problems.",
    "bite-management",
    "Bite management options",
    [
      "Current visit: identify the heavy or traumatic contacts and adjust them conservatively.",
      "Short-term phase: reassess how the tooth, joint, or muscle symptoms respond.",
      "Follow-up: decide whether additional protection or restorative care is also needed."
    ],
    [
      "This is meant to reduce overload, not rebuild damaged tooth structure by itself.",
      "The office may still recommend a guard or restoration depending on the case."
    ],
    [
      "Can reduce traumatic contact and improve comfort quickly in the right situation.",
      "Helps protect vulnerable teeth or restorations from repeated overload."
    ],
    [
      "It does not solve every cause of pain or clenching by itself.",
      "Some patients still need protective appliances or restorative correction afterward."
    ],
    ["diagram-tooth-wear-night-guard", "handout-restorative-aftercare"],
    "consent-filling"
  ),
  treatment(
    "drainage",
    "general-dentistry",
    "Drainage",
    "Release collected infection or pressure to help control an acute abscess and improve comfort.",
    "urgent-infection-control",
    "Urgent infection control options",
    [
      "Current visit: open and drain the area when clinically appropriate.",
      "Immediate phase: review pain, swelling, and home-care expectations.",
      "Next step: treat the underlying source so the problem does not simply return."
    ],
    [
      "Drainage addresses pressure and infection locally but is not always the final treatment.",
      "The office still needs to treat the source tooth or tissue problem."
    ],
    [
      "Can reduce pressure, swelling, and acute discomfort quickly.",
      "Helps control the urgent phase while the larger plan is organized."
    ],
    [
      "It does not eliminate the underlying cause by itself.",
      "Additional treatment is usually still required after the acute phase settles."
    ],
    ["video-extraction-overview", "video-root-canal-overview", "handout-root-canal-aftercare"],
    "consent-extraction"
  ),
  treatment(
    "antibiotics",
    "general-dentistry",
    "Antibiotics",
    "Use antibiotic medication when the infection pattern, swelling, or systemic risk suggests medication support is appropriate.",
    "medical-support",
    "Medical support options",
    [
      "Current visit: review whether the infection pattern warrants antibiotic coverage.",
      "Medication phase: take the medication exactly as directed.",
      "Definitive phase: return for treatment of the source because medication alone is not usually the final answer."
    ],
    [
      "Antibiotics are often supportive rather than definitive treatment.",
      "Patients still need source control even if swelling or pain begins to improve."
    ],
    [
      "Can help control certain spreading or systemic infection patterns.",
      "Useful when the office believes medication support will improve safety or healing."
    ],
    [
      "Antibiotics do not remove decay, infected pulp, or trapped local factors by themselves.",
      "Not every dental infection pattern benefits from antibiotics."
    ],
    ["handout-root-canal-aftercare", "handout-extraction-aftercare"],
    "consent-extraction"
  ),
  treatment(
    "prophylaxis",
    "general-dentistry",
    "Prophylaxis (cleaning)",
    "Perform preventive professional cleaning to remove buildup and support healthier gum conditions.",
    "preventive-care",
    "Preventive care options",
    [
      "Current visit: remove plaque, stain, and calculus consistent with preventive cleaning.",
      "Home phase: reinforce daily hygiene to maintain the result.",
      "Recall: return on schedule for preventive review and maintenance."
    ],
    [
      "This is preventive maintenance rather than deep subgingival disease treatment.",
      "Regular home care still determines how long the tissues stay healthy."
    ],
    [
      "Helps reduce surface buildup and support gingival health.",
      "Pairs well with preventive diagnosis and home-care coaching."
    ],
    [
      "It does not treat deeper periodontal pockets when disease has already progressed.",
      "Patients with active periodontal disease may need more than routine cleaning."
    ],
    ["video-periodontal-therapy", "handout-periodontal-maintenance"],
    "consent-periodontal"
  ),
  treatment(
    "scaling",
    "periodontics",
    "Scaling",
    "Remove plaque and calculus deposits above and around the gumline to improve tissue health and lower inflammation.",
    "gum-disease-control",
    "Gum disease control options",
    [
      "Current visit: remove the visible and accessible deposits contributing to inflammation.",
      "Home phase: support the result with brushing and interdental cleaning.",
      "Re-evaluation: decide whether the gums are improving or whether deeper therapy is needed."
    ],
    [
      "Scaling may be the first step before deciding whether deeper treatment is also necessary.",
      "The tissue response over time helps guide the next step."
    ],
    [
      "Reduces the irritants that contribute to bleeding and inflammation.",
      "Can improve tissue health before more advanced disease is confirmed."
    ],
    [
      "It may not be enough if disease extends deeper below the gumline.",
      "Long-term control still depends on home care and re-evaluation."
    ],
    ["video-periodontal-therapy", "diagram-periodontal-charting", "handout-periodontal-maintenance"],
    "consent-periodontal"
  ),
  treatment(
    "oral-hygiene-instruction",
    "general-dentistry",
    "Oral hygiene instruction",
    "Provide patient-specific coaching on brushing, interdental care, fluoride use, and daily habits that lower disease risk.",
    "preventive-care",
    "Preventive care options",
    [
      "Current visit: show the patient where plaque control is breaking down and how to improve it.",
      "Home phase: apply the instructions consistently in the areas discussed.",
      "Recall: review whether the habits are improving tissue response and reducing risk."
    ],
    [
      "This is most effective when it is personalized, not generic.",
      "Visible improvement often depends on how consistently the routine changes at home."
    ],
    [
      "Targets the habits that influence long-term decay and gum outcomes the most.",
      "Can improve the success of almost every other treatment plan."
    ],
    [
      "It does not replace active treatment when disease is already advanced.",
      "Without follow-through, the risk pattern usually remains the same."
    ],
    ["handout-restorative-aftercare", "handout-periodontal-maintenance"],
    "consent-filling"
  ),
  treatment(
    "localized-antibiotics",
    "periodontics",
    "Localized antibiotics",
    "Place medication directly in a periodontal site to support bacterial control in selected areas.",
    "gum-disease-control",
    "Gum disease control options",
    [
      "Current visit: identify the targeted periodontal area and place the localized medication.",
      "Short-term phase: allow the site to respond while maintaining home care.",
      "Re-evaluation: assess whether the area improved enough or still needs more treatment."
    ],
    [
      "This is usually an adjunct to mechanical cleaning rather than a standalone fix.",
      "The office still monitors the site closely afterward."
    ],
    [
      "Targets medication where the periodontal issue is concentrated.",
      "Can support bacterial control in sites that need extra help."
    ],
    [
      "It does not replace full periodontal therapy when overall disease is broader.",
      "Some sites still require surgery, maintenance, or further instrumentation."
    ],
    ["video-periodontal-therapy", "diagram-periodontal-charting", "handout-periodontal-maintenance"],
    "consent-periodontal"
  ),
  treatment(
    "periodontal-surgery",
    "periodontics",
    "Periodontal surgery (flap, grafting)",
    "Use surgical access or grafting techniques to improve access, support, or tissue stability in selected periodontal cases.",
    "soft-tissue-correction",
    "Soft tissue correction options",
    [
      "Surgical visit: access the site, clean or reshape as planned, and place grafting material if indicated.",
      "Healing phase: protect the area and follow detailed oral hygiene instructions.",
      "Follow-up: assess comfort, tissue response, and long-term maintenance needs."
    ],
    [
      "This introduces a true surgical healing phase with appearance and comfort changes along the way.",
      "Long-term maintenance still matters after the surgical phase is complete."
    ],
    [
      "Can improve access, support, and tissue stability when non-surgical care is not enough.",
      "Allows more direct correction of selected periodontal problems."
    ],
    [
      "Healing takes time and can feel more involved than routine periodontal cleaning.",
      "Surgery does not eliminate the need for maintenance and home care."
    ],
    ["video-periodontal-therapy", "diagram-periodontal-charting", "handout-periodontal-maintenance"],
    "consent-periodontal"
  ),
  treatment(
    "soft-tissue-graft",
    "periodontics",
    "Soft tissue graft",
    "Add or reposition gum tissue to protect exposed roots, improve thickness, or stabilize vulnerable areas.",
    "soft-tissue-correction",
    "Soft tissue correction options",
    [
      "Surgical visit: place the graft or graft substitute where the tissue needs reinforcement.",
      "Healing phase: protect the site and follow the office's brushing restrictions carefully.",
      "Follow-up: review comfort, tissue appearance, and long-term maintenance."
    ],
    [
      "Healing changes the look and feel of the tissue over several weeks.",
      "Patients need to be very specific with early aftercare."
    ],
    [
      "Can improve tissue thickness, coverage, and comfort in selected recession areas.",
      "May reduce sensitivity and improve long-term tissue stability."
    ],
    [
      "It is a surgical procedure with recovery and site-specific limitations.",
      "Coverage results vary depending on anatomy and severity."
    ],
    ["video-periodontal-therapy", "diagram-periodontal-charting", "handout-periodontal-maintenance"],
    "consent-periodontal"
  ),
  treatment(
    "bonding-restoration",
    "general-dentistry",
    "Restorations (bonding)",
    "Use bonded material to repair chips, close small spaces, reshape selected areas, or restore localized defects.",
    "conservative-restoration",
    "Conservative restoration options",
    [
      "Current visit: prepare the surface and place the bonded restorative material.",
      "Same day: refine shape and bite where needed.",
      "Follow-up only if polish, edge, or bite refinement is needed later."
    ],
    [
      "This is often completed in one visit without a temporary phase.",
      "Bonded edges may need maintenance over time depending on habits and force."
    ],
    [
      "Provides a conservative esthetic or structural correction in selected cases.",
      "Can often improve shape or damage quickly without a larger indirect process."
    ],
    [
      "Bonding is not the strongest option for every high-force situation.",
      "Longevity depends on the case, habits, and how much structure was missing initially."
    ],
    ["video-filling-overview", "handout-restorative-aftercare", "handout-whitening-veneers"],
    "consent-filling"
  ),
  treatment(
    "behavior-modification",
    "general-dentistry",
    "Behavior modification",
    "Address habits and daily patterns that are contributing to disease, trauma, or treatment failure.",
    "risk-reduction",
    "Risk reduction options",
    [
      "Current visit: identify the behaviors contributing to the condition.",
      "Home phase: apply the changes discussed with the office.",
      "Follow-up: review whether symptoms, wear, or recurrence are improving."
    ],
    [
      "This is often supportive rather than a procedural treatment by itself.",
      "Lasting benefit depends on the patient's ability to change the pattern consistently."
    ],
    [
      "Targets the causes that keep the condition recurring.",
      "Can improve the long-term success of other treatment choices."
    ],
    [
      "It may not give fast results if damage is already advanced.",
      "Without follow-through, the same problems may keep returning."
    ],
    ["handout-restorative-aftercare", "handout-periodontal-maintenance"],
    "consent-filling"
  ),
  treatment(
    "dietary-counseling",
    "general-dentistry",
    "Dietary counseling",
    "Review diet habits that are increasing cavity risk, acid exposure, dry mouth symptoms, or tissue irritation.",
    "risk-reduction",
    "Risk reduction options",
    [
      "Current visit: identify the eating and drinking patterns contributing to risk.",
      "Home phase: apply the timing and product changes recommended by the office.",
      "Re-evaluation: assess whether the surfaces and symptoms are becoming more stable."
    ],
    [
      "This is a long-term habit intervention, not an instant fix.",
      "Small daily choices often matter more than occasional changes."
    ],
    [
      "Can meaningfully reduce decay and acid risk when the diagnosis is diet-driven.",
      "Supports more conservative treatment whenever the disease is caught early enough."
    ],
    [
      "It does not rebuild tooth structure that is already lost.",
      "The benefit depends on consistent change outside the office."
    ],
    ["handout-restorative-aftercare", "handout-periodontal-maintenance"],
    "consent-filling"
  ),
  treatment(
    "surgical-extraction",
    "oral-surgery",
    "Surgical extraction",
    "Remove a tooth using a more involved surgical approach when simple removal is not realistic or predictable.",
    "tooth-removal",
    "Removal options",
    [
      "Surgical visit: reflect tissue, remove bone or section the tooth as needed, and complete the extraction.",
      "Healing phase: manage swelling, soreness, and site protection carefully.",
      "Follow-up: review healing and future replacement planning if needed."
    ],
    [
      "This is a more involved healing phase than a straightforward simple extraction.",
      "The site may need additional follow-up depending on difficulty and symptoms."
    ],
    [
      "Allows removal when anatomy, fracture, or tooth position limits a simple extraction.",
      "Can be the most predictable way to resolve the source safely."
    ],
    [
      "Healing, swelling, and recovery are often more involved than with a simple extraction.",
      "Replacement planning may still be an important next step."
    ],
    ["video-extraction-overview", "diagram-extraction-healing", "handout-extraction-aftercare"],
    "consent-extraction"
  ),
  treatment(
    "exposure-orthodontic-traction",
    "orthodontics",
    "Exposure and orthodontic traction",
    "Expose an impacted tooth and guide it into position with orthodontic mechanics when the case is a good candidate.",
    "bite-alignment",
    "Bite and alignment options",
    [
      "Surgical phase: expose the tooth and attach the orthodontic aid if planned.",
      "Orthodontic phase: apply controlled traction over time to guide eruption or movement.",
      "Finishing phase: continue alignment and long-term retention planning."
    ],
    [
      "This is a staged treatment that combines surgery and orthodontic follow-through.",
      "Movement takes time and depends on biologic response and compliance."
    ],
    [
      "Can help preserve and position a tooth that would otherwise remain trapped.",
      "Provides a tooth-preserving path in selected impacted-tooth cases."
    ],
    [
      "The process can be long and requires coordination across visits.",
      "Not every impacted tooth is positioned favorably for traction."
    ],
    ["video-aligner-overview", "diagram-extraction-healing"],
    "consent-orthodontic"
  ),
  treatment(
    "orthodontics",
    "orthodontics",
    "Orthodontics (braces/aligners)",
    "Use orthodontic treatment to improve crowding, spacing, and bite relationships over time.",
    "bite-alignment",
    "Bite and alignment options",
    [
      "Planning phase: take records, review movement goals, and choose the appliance approach.",
      "Active phase: wear aligners or adjust braces over a sequence of visits.",
      "Finishing phase: refine movement and transition to retention."
    ],
    [
      "This is a staged treatment that depends on consistent follow-through.",
      "Retention after movement is part of the treatment, not an optional extra."
    ],
    [
      "Can improve alignment, bite function, and cleansability over time.",
      "Provides a structured path for both esthetic and functional movement goals."
    ],
    [
      "Treatment takes time and requires compliance.",
      "Some cases still need additional restorative or force-management steps afterward."
    ],
    ["video-aligner-overview", "handout-whitening-veneers"],
    "consent-orthodontic"
  ),
  treatment(
    "interproximal-reduction",
    "orthodontics",
    "Interproximal reduction",
    "Reshape small amounts of enamel between teeth to create room or improve alignment planning in selected orthodontic cases.",
    "bite-alignment",
    "Bite and alignment options",
    [
      "Current phase: review where small space creation is needed.",
      "Treatment visit: conservatively reduce selected contact areas.",
      "Ongoing movement: continue the orthodontic plan with the additional space created."
    ],
    [
      "This is usually an adjunct within orthodontic treatment rather than a standalone plan.",
      "The amount of reduction is controlled and case-specific."
    ],
    [
      "Can create small amounts of needed space without larger restorative steps.",
      "Supports more efficient tooth movement in selected crowding cases."
    ],
    [
      "It is not appropriate for every patient or enamel pattern.",
      "The benefit depends on the larger alignment plan being followed."
    ],
    ["video-aligner-overview", "handout-whitening-veneers"],
    "consent-orthodontic"
  ),
  treatment(
    "restorative-correction",
    "general-dentistry",
    "Restorative correction",
    "Adjust or rebuild teeth or restorations to improve function, contour, contact, or esthetic harmony after a problem is identified.",
    "final-restoration",
    "Final restoration options",
    [
      "Current visit: identify the aspect of the restoration or tooth that needs correction.",
      "Corrective phase: reshape, add, or replace the material as planned.",
      "Follow-up: confirm that function, contour, and comfort have improved."
    ],
    [
      "The amount of correction depends on what is wrong with the original result.",
      "Some cases need a minor adjustment while others need a full remake."
    ],
    [
      "Can improve fit, function, and esthetic integration after a problem is identified.",
      "Lets the office refine the result instead of ignoring a flawed endpoint."
    ],
    [
      "Minor correction is not always enough if the original issue is more fundamental.",
      "The corrected result still depends on the remaining tooth and overall force pattern."
    ],
    ["video-crown-overview", "diagram-filling-vs-crown", "handout-restorative-aftercare"],
    "consent-crown"
  ),
  treatment(
    "irrigation",
    "general-dentistry",
    "Irrigation",
    "Flush and clean an inflamed or infected area to reduce debris, bacterial load, and local irritation.",
    "urgent-infection-control",
    "Urgent infection control options",
    [
      "Current visit: irrigate the selected site or tissue area thoroughly.",
      "Immediate phase: review comfort and home-care expectations.",
      "Next step: continue monitoring or pair irrigation with the broader definitive plan."
    ],
    [
      "Irrigation is often supportive rather than definitive treatment by itself.",
      "The area may still need additional procedures depending on the source."
    ],
    [
      "Can improve local cleanliness and reduce irritation in the short term.",
      "Supports acute management while the larger treatment direction is clarified."
    ],
    [
      "It does not remove the underlying structural or disease cause on its own.",
      "Symptoms may return if the source is not addressed."
    ],
    ["video-periodontal-therapy", "handout-periodontal-maintenance"],
    "consent-periodontal"
  ),
  treatment(
    "operculectomy",
    "oral-surgery",
    "Operculectomy",
    "Remove the overlying tissue flap around a partially erupted tooth when that tissue is repeatedly trapping bacteria or being traumatized.",
    "soft-tissue-correction",
    "Soft tissue correction options",
    [
      "Current visit: remove the inflamed tissue flap around the tooth.",
      "Healing phase: keep the area clean and allow the tissue to settle.",
      "Re-evaluation: decide whether the local anatomy is now manageable or whether extraction is still the better answer."
    ],
    [
      "This can help specific tissue problems but may not fully solve the anatomy driving recurrence.",
      "The office still reassesses whether the tooth itself remains the larger issue."
    ],
    [
      "Can reduce repeated irritation around a partially erupted tooth.",
      "May improve hygiene access and comfort in selected cases."
    ],
    [
      "The problem can recur if the tooth position still traps tissue and bacteria.",
      "Some cases ultimately still need extraction instead."
    ],
    ["diagram-extraction-healing", "handout-extraction-aftercare"],
    "consent-extraction"
  ),
  treatment(
    "topical-steroids",
    "general-dentistry",
    "Topical steroids",
    "Use topical steroid medication to calm inflammatory oral tissue lesions when the diagnosis supports it.",
    "medical-support",
    "Medical support options",
    [
      "Current visit: confirm the lesion pattern and prescribe or dispense the medication plan if appropriate.",
      "Medication phase: apply the medicine exactly as directed.",
      "Recheck: confirm healing and make sure the lesion is responding the way it should."
    ],
    [
      "Topical medication is appropriate only for selected lesion patterns.",
      "Persistent or changing lesions still need close follow-up."
    ],
    [
      "Can reduce soreness and inflammation in the right oral lesion pattern.",
      "Provides a conservative first-line approach when the diagnosis fits."
    ],
    [
      "It is not the right treatment for every ulcer or suspicious lesion.",
      "If the lesion does not behave as expected, further evaluation may still be needed."
    ],
    ["handout-periodontal-maintenance"],
    "consent-filling"
  ),
  treatment(
    "remove-irritant",
    "general-dentistry",
    "Remove irritant",
    "Eliminate the local source of trauma or irritation that is contributing to a sore or reactive tissue change.",
    "risk-reduction",
    "Risk reduction options",
    [
      "Current visit: identify and remove or smooth the local irritant.",
      "Short-term phase: allow the tissue to settle and heal.",
      "Recheck: confirm the area is resolving as expected."
    ],
    [
      "This works best when the lesion truly is reactive to a local cause.",
      "The area still needs follow-up if it fails to heal normally."
    ],
    [
      "Addresses the most direct cause when a lesion is being mechanically irritated.",
      "Can allow the tissue to resolve without a more invasive procedure."
    ],
    [
      "It does not treat lesions caused by unrelated infection or deeper disease.",
      "Persistent tissue change after removing the irritant needs more evaluation."
    ],
    ["handout-periodontal-maintenance"],
    "consent-filling"
  ),
  treatment(
    "palliative-care",
    "general-dentistry",
    "Palliative care",
    "Provide short-term comfort-focused care while the diagnosis evolves, the patient stabilizes, or the definitive treatment is being arranged.",
    "symptom-relief",
    "Symptom relief options",
    [
      "Current visit: focus on comfort, protection, and immediate symptom reduction.",
      "Short-term phase: follow the office's medication and self-care instructions closely.",
      "Next step: return for the definitive treatment or re-evaluation plan."
    ],
    [
      "This is supportive care rather than a final answer to the underlying problem.",
      "The office still needs a clear follow-up plan."
    ],
    [
      "Can reduce pain and help the patient get through the acute phase safely.",
      "Useful when the immediate goal is comfort before a larger procedure."
    ],
    [
      "The underlying disease or source remains unless it is treated directly.",
      "Symptoms can return if the definitive plan is delayed too long."
    ],
    ["handout-root-canal-aftercare", "handout-extraction-aftercare"],
    "consent-filling"
  ),
  treatment(
    "antifungal-medication",
    "general-dentistry",
    "Antifungal medication",
    "Use antifungal therapy when the tissue findings are consistent with candidiasis or a similar fungal process.",
    "medical-support",
    "Medical support options",
    [
      "Current visit: confirm the likely fungal pattern and prescribe the medication plan if appropriate.",
      "Medication phase: use the antifungal exactly as directed.",
      "Re-evaluation: make sure the tissues are resolving and identify any factors driving recurrence."
    ],
    [
      "Medication works best when the contributing dry mouth, denture, or hygiene factors are also addressed.",
      "Persistent lesions still need follow-up."
    ],
    [
      "Targets the likely fungal overgrowth directly.",
      "Can improve soreness, coating, and tissue comfort when the diagnosis fits."
    ],
    [
      "It is not the right answer for every white or red tissue lesion.",
      "Recurrence can happen if the underlying risk factors remain unchanged."
    ],
    ["handout-periodontal-maintenance"],
    "consent-filling"
  ),
  treatment(
    "antiviral-medication",
    "general-dentistry",
    "Antiviral medication",
    "Use antiviral therapy when the lesion pattern and timing suggest a herpetic or similar viral flare.",
    "medical-support",
    "Medical support options",
    [
      "Current visit: review the lesion timing and decide whether antiviral therapy is appropriate.",
      "Medication phase: begin the antiviral plan as directed.",
      "Re-evaluation: confirm the lesions are resolving and review recurrence patterns."
    ],
    [
      "Timing matters because antivirals are often most effective early in the flare.",
      "The office still watches for lesions that do not follow the expected pattern."
    ],
    [
      "Can shorten or reduce the severity of selected viral flare patterns.",
      "Helps patients understand when future episodes should be reported earlier."
    ],
    [
      "It is not indicated for every oral sore pattern.",
      "Persistent or atypical lesions still need more evaluation."
    ],
    ["handout-periodontal-maintenance"],
    "consent-filling"
  ),
  treatment(
    "surgical-excision",
    "general-dentistry",
    "Surgical excision",
    "Remove a localized tissue lesion when the office believes removal is the best way to treat or diagnose it.",
    "soft-tissue-correction",
    "Soft tissue correction options",
    [
      "Surgical visit: remove the lesion and manage the site for healing.",
      "Healing phase: protect the area and monitor comfort.",
      "Follow-up: review healing and discuss the tissue result if it was sent for pathology."
    ],
    [
      "This creates a true surgical healing site even for a small lesion.",
      "The office may still recommend pathology review depending on the tissue type."
    ],
    [
      "Provides direct removal when the lesion is bothersome or best managed surgically.",
      "Can give both treatment and diagnostic value in the same step."
    ],
    [
      "Healing and appearance changes are part of the recovery period.",
      "Some lesions still need pathology or referral depending on what is found."
    ],
    ["handout-periodontal-maintenance"],
    "consent-extraction"
  ),
  treatment(
    "biopsy",
    "general-dentistry",
    "Biopsy",
    "Sample suspicious or persistent tissue so the diagnosis can be clarified more confidently.",
    "diagnostic-clarification",
    "Diagnostic clarification options",
    [
      "Current visit: remove or sample the tissue in the way the lesion requires.",
      "Pathology phase: send the sample for review.",
      "Follow-up: discuss the result and what treatment or monitoring comes next."
    ],
    [
      "A biopsy is about getting a clearer diagnosis, not automatically about major treatment.",
      "The next step depends on what the pathology report shows."
    ],
    [
      "Provides more certainty when a lesion does not look routine.",
      "Helps guide treatment decisions with better diagnostic information."
    ],
    [
      "It introduces a minor surgical site and waiting period for results.",
      "The biopsy itself does not determine the whole treatment plan until the findings return."
    ],
    ["handout-periodontal-maintenance"],
    "consent-extraction"
  ),
  treatment(
    "referral",
    "general-dentistry",
    "Referral",
    "Coordinate care with a specialist or medical provider when the diagnosis, anatomy, or treatment need goes beyond the current office's preferred scope.",
    "care-coordination",
    "Care coordination options",
    [
      "Current visit: explain why referral is being recommended and what the next provider should evaluate.",
      "Coordination phase: transfer records, imaging, and notes as needed.",
      "Return phase: integrate the specialist recommendation into the larger care plan."
    ],
    [
      "Referral is not a delay tactic when it is used well; it is part of safer care coordination.",
      "The office still helps the patient understand what happens before and after the specialist visit."
    ],
    [
      "Gets the patient to the right level of expertise when the case calls for it.",
      "Can improve predictability and diagnostic clarity in more complex situations."
    ],
    [
      "It can add time, logistics, and another layer of decision-making for the patient.",
      "The patient still needs clear guidance on what remains the same and what may change."
    ],
    ["handout-root-canal-aftercare", "handout-periodontal-maintenance"],
    "consent-filling"
  ),
  treatment(
    "nsaids",
    "general-dentistry",
    "NSAIDs",
    "Use anti-inflammatory pain medication to reduce discomfort and swelling when the office believes it is appropriate.",
    "symptom-relief",
    "Symptom relief options",
    [
      "Current visit: review whether anti-inflammatory medication is appropriate.",
      "Medication phase: use the medicine exactly as instructed.",
      "Re-evaluation: make sure symptoms are improving and that a definitive treatment plan is still in place."
    ],
    [
      "Medication support helps symptoms but does not usually remove the source by itself.",
      "Patients need to follow medical safety guidance and report if symptoms escalate."
    ],
    [
      "Can meaningfully reduce pain and inflammation during acute or post-operative phases.",
      "Often helps the patient stay more comfortable while treatment or healing continues."
    ],
    [
      "It is not a substitute for direct treatment when the source is still active.",
      "Not every patient is a good candidate for NSAID use."
    ],
    ["handout-root-canal-aftercare", "handout-extraction-aftercare"],
    "consent-filling"
  ),
  treatment(
    "physical-therapy",
    "general-dentistry",
    "Physical therapy",
    "Use guided exercises and supportive therapy to improve jaw function, muscle tension, and related TMD symptoms in selected cases.",
    "bite-management",
    "Bite management options",
    [
      "Current phase: review the jaw findings and decide whether therapy support fits the symptom pattern.",
      "Therapy phase: complete the recommended exercise and mobility plan.",
      "Follow-up: review whether function, pain, and opening are improving."
    ],
    [
      "This is usually part of a broader TMD or muscle-management plan.",
      "Improvement tends to happen through repetition and consistency over time."
    ],
    [
      "Can improve muscle tension, function, and movement in selected TMD cases.",
      "Provides a non-restorative support path when the symptoms are more functional than structural."
    ],
    [
      "It may not address bite damage or severe joint pathology by itself.",
      "The patient still needs a coordinated plan if multiple factors are involved."
    ],
    ["diagram-tooth-wear-night-guard"],
    "consent-filling"
  ),
  treatment(
    "no-treatment-monitor",
    "general-dentistry",
    "No treatment (monitor)",
    "Choose observation without active intervention for now while documenting the condition and planning review.",
    "observation",
    "Observation options",
    [
      "Current visit: document the condition and explain why active treatment is not being started today.",
      "Observation phase: watch for the changes the office discussed.",
      "Follow-up: return for reassessment at the planned interval or sooner if symptoms change."
    ],
    [
      "This is an active decision to observe, not simply ignoring the condition.",
      "The office still expects reassessment and symptom monitoring."
    ],
    [
      "Avoids intervention when the office believes the present risk does not justify it yet.",
      "Gives the patient time to understand the condition before committing to treatment."
    ],
    [
      "The condition can still progress during the observation period.",
      "Waiting may narrow options if changes happen faster than expected."
    ],
    ["diagram-filling-vs-crown", "handout-restorative-aftercare"],
    "consent-filling"
  ),
  treatment(
    "repair-restoration",
    "general-dentistry",
    "Repair restoration",
    "Conservatively repair part of an existing restoration when the office believes a full remake is not yet necessary.",
    "restoration-revision",
    "Restoration revision options",
    [
      "Current visit: identify the limited defect and repair the affected area.",
      "Same day: confirm fit, contour, and bite where relevant.",
      "Follow-up: monitor whether the repaired restoration remains stable."
    ],
    [
      "Repair is chosen when the office believes the larger restoration still has enough value to preserve.",
      "The rest of the restoration still needs ongoing review."
    ],
    [
      "Can preserve more of the existing work and reduce the size of the intervention.",
      "Often quicker and more conservative than a full replacement."
    ],
    [
      "Not every broken or leaking restoration is repairable enough to justify patching.",
      "The repaired area can still fail later if the larger structure remains compromised."
    ],
    ["video-filling-overview", "video-crown-overview", "handout-restorative-aftercare"],
    "consent-filling"
  ),
  treatment(
    "replace-restoration",
    "general-dentistry",
    "Replace restoration",
    "Remove and fully replace an existing restoration that is no longer functioning or sealing predictably.",
    "restoration-revision",
    "Restoration revision options",
    [
      "Current visit or visits: remove the old restoration and evaluate the underlying tooth.",
      "Restorative phase: place the new direct or indirect restoration.",
      "Follow-up: monitor comfort, fit, and long-term performance."
    ],
    [
      "Once the old restoration is removed, the tooth may need more than was originally expected.",
      "The final replacement type depends on what remaining structure is actually present."
    ],
    [
      "Resets the tooth-restoration interface when the older work is no longer predictable.",
      "Lets the office choose a better design based on the current condition."
    ],
    [
      "The replacement may become more involved if hidden decay or weakness is found.",
      "A full remake is usually more extensive than a simple repair."
    ],
    ["video-filling-overview", "video-crown-overview", "diagram-filling-vs-crown"],
    "consent-crown"
  ),
  treatment(
    "repositioning",
    "general-dentistry",
    "Repositioning",
    "Move a traumatized tooth back toward a healthier position after displacement injury when the case calls for it.",
    "trauma-management",
    "Trauma management options",
    [
      "Urgent phase: reposition the injured tooth as indicated.",
      "Stabilization phase: protect the tooth and monitor comfort and mobility.",
      "Follow-up: review vitality, support, and long-term healing."
    ],
    [
      "This is typically part of a broader trauma-management sequence.",
      "The tooth still needs close follow-up after the initial repositioning."
    ],
    [
      "Can improve the tooth's starting position for healing after displacement trauma.",
      "Supports a more organized healing path in selected injury patterns."
    ],
    [
      "It does not guarantee pulpal survival or long-term stability by itself.",
      "Trauma cases can change over time even after good initial management."
    ],
    ["handout-root-canal-aftercare", "diagram-extraction-healing"],
    "consent-extraction"
  ),
  treatment(
    "splinting",
    "general-dentistry",
    "Splinting",
    "Stabilize a traumatized or mobile tooth by temporarily connecting it to neighboring teeth during healing.",
    "trauma-management",
    "Trauma management options",
    [
      "Current visit: place the stabilizing splint after the tooth is positioned as needed.",
      "Healing phase: protect the area and follow the office's hygiene instructions carefully.",
      "Removal and review: remove the splint at the planned time and reassess stability."
    ],
    [
      "Splints are usually temporary and time-specific.",
      "The tooth still needs follow-up to evaluate vitality and support after removal."
    ],
    [
      "Can improve comfort and protection during the healing phase after trauma.",
      "Helps keep the tooth more stable while the tissues recover."
    ],
    [
      "It does not reverse the underlying injury on its own.",
      "Long-term survival still depends on the damage pattern and biologic healing."
    ],
    ["handout-root-canal-aftercare", "diagram-extraction-healing"],
    "consent-extraction"
  ),
  treatment(
    "reimplantation",
    "general-dentistry",
    "Reimplantation",
    "Place an avulsed tooth back into the socket when the injury conditions and timing make that attempt appropriate.",
    "trauma-management",
    "Trauma management options",
    [
      "Urgent phase: reimplant the tooth and stabilize it as indicated.",
      "Healing phase: follow the office's trauma instructions closely.",
      "Follow-up: monitor vitality, root status, support, and future treatment needs."
    ],
    [
      "This is highly time-sensitive and still requires significant follow-up.",
      "The tooth may later need root canal treatment or still have a guarded prognosis."
    ],
    [
      "Provides a chance to preserve the natural tooth after avulsion in selected circumstances.",
      "Can maintain space and support better than losing the tooth immediately."
    ],
    [
      "Prognosis varies widely based on handling time and injury conditions.",
      "The tooth can still be lost later even after successful reimplantation."
    ],
    ["handout-root-canal-aftercare", "diagram-extraction-healing"],
    "consent-extraction"
  ),
  treatment(
    "saliva-substitutes",
    "general-dentistry",
    "Saliva substitutes",
    "Use saliva-replacement products to improve comfort and tissue lubrication when natural moisture is reduced.",
    "dry-mouth-support",
    "Dry mouth support options",
    [
      "Current visit: review product choices and when to use them.",
      "Home phase: use the substitute regularly in the situations discussed.",
      "Re-evaluation: check whether comfort and tissue irritation are improving."
    ],
    [
      "These products support comfort but do not restore gland function.",
      "Patients often need regular use to feel meaningful benefit."
    ],
    [
      "Can improve comfort, lubrication, and eating or speaking tolerance with dry mouth.",
      "Provides a non-invasive support step that can be started quickly."
    ],
    [
      "It does not solve the underlying cause of low salivary flow.",
      "Different products work differently for different patients."
    ],
    ["handout-restorative-aftercare"],
    "consent-filling"
  ),
  treatment(
    "sialogogues",
    "general-dentistry",
    "Sialogogues",
    "Stimulate natural salivary flow when the diagnosis and patient factors suggest that increased output may be possible.",
    "dry-mouth-support",
    "Dry mouth support options",
    [
      "Current visit: review whether salivary stimulation support is appropriate.",
      "Treatment phase: use the stimulant or strategy exactly as directed.",
      "Re-evaluation: assess whether flow and comfort are improving."
    ],
    [
      "This depends on the patient still having gland function that can respond.",
      "The office may pair this with hydration, product changes, or medical follow-up."
    ],
    [
      "Can improve natural oral moisture when the patient still has responsive gland tissue.",
      "Supports comfort, oral balance, and dry-mouth risk reduction."
    ],
    [
      "It does not help every cause of salivary dysfunction equally.",
      "Broader medical or medication factors may still limit the result."
    ],
    ["handout-restorative-aftercare"],
    "consent-filling"
  ),
  treatment(
    "hydration",
    "general-dentistry",
    "Hydration",
    "Use hydration planning to support oral moisture balance and reduce dryness-related discomfort or risk.",
    "dry-mouth-support",
    "Dry mouth support options",
    [
      "Current visit: review the hydration pattern contributing to oral dryness.",
      "Home phase: apply the fluid timing and habit adjustments discussed.",
      "Re-evaluation: assess whether comfort and tissue stability improve."
    ],
    [
      "Hydration support is simple but often needs to be more intentional than patients expect.",
      "It is usually one part of a broader dry-mouth management plan."
    ],
    [
      "Can improve day-to-day comfort and reduce some tissue irritation from dryness.",
      "Provides an easy first step that supports many other dry-mouth strategies."
    ],
    [
      "It may not be enough if medications or gland dysfunction are the main drivers.",
      "The benefit depends on consistency and the overall cause pattern."
    ],
    ["handout-restorative-aftercare"],
    "consent-filling"
  ),
  treatment(
    "massage",
    "general-dentistry",
    "Massage",
    "Use gland or muscle massage techniques to support comfort and flow in selected salivary or TMD-related situations.",
    "supportive-therapy",
    "Supportive therapy options",
    [
      "Current visit: show the patient the specific massage approach being recommended.",
      "Home phase: apply the technique as directed at the intervals discussed.",
      "Re-evaluation: determine whether tenderness, flow, or muscle symptoms are improving."
    ],
    [
      "Massage works best when it matches the right diagnosis and anatomy.",
      "It is usually a supportive technique rather than a standalone definitive treatment."
    ],
    [
      "Can support comfort and local function in selected muscle or gland-related cases.",
      "Gives the patient an active self-care step between visits."
    ],
    [
      "It does not replace medical or surgical care when obstruction or disease is more advanced.",
      "Using the wrong area or too much pressure may not help."
    ],
    ["diagram-tooth-wear-night-guard", "handout-restorative-aftercare"],
    "consent-filling"
  ),
  treatment(
    "stone-removal",
    "general-dentistry",
    "Stone removal",
    "Remove a salivary stone or obstruction when it is causing flow problems, swelling, or gland symptoms.",
    "salivary-management",
    "Salivary management options",
    [
      "Current visit or procedure phase: identify and remove or relieve the obstruction when possible.",
      "Recovery phase: monitor swelling, flow, and comfort.",
      "Follow-up: reassess gland function and determine whether additional evaluation is needed."
    ],
    [
      "The exact approach depends on where the stone is located and how accessible it is.",
      "Some cases still require referral or more advanced management."
    ],
    [
      "Directly addresses a common mechanical reason for recurrent gland swelling.",
      "Can improve salivary flow and reduce repeated flare-ups."
    ],
    [
      "Not every gland problem is caused by a removable stone.",
      "Some obstructions still need specialist evaluation depending on depth and anatomy."
    ],
    ["handout-restorative-aftercare"],
    "consent-extraction"
  )
];

export const conditionCatalog: DiagnosisTemplate[] = [
  diagnosis(
    "incipient-caries",
    "general-dentistry",
    "Early enamel caries",
    "A small area is starting to break down and may be reversible or conservatively treated depending on depth and risk.",
    ["monitoring", "filling"],
    ["Can this be watched first?", "What changes would mean it needs treatment later?", "Is this something I caused recently or over time?"],
    ["video-filling-overview", "diagram-filling-vs-crown"],
    [
      section("What this diagnosis means", "This is an early cavity or weak spot that has not yet destroyed a large amount of tooth structure."),
      section("Why timing still matters", "Even small lesions can grow quietly if diet, hygiene, or risk factors continue."),
      section("What treatment is trying to do", "The goal is either to stop progression or fix the area before the defect becomes much larger.")
    ]
  ),
  diagnosis(
    "deep-caries",
    "general-dentistry",
    "Deep decay",
    "The cavity is close to the nerve and may be treated conservatively or may reveal the need for more extensive treatment.",
    ["filling", "inlay-onlay", "crown", "root-canal", "extraction"],
    ["Could this turn into a root canal?", "Why can't you know the final depth until treatment starts?", "What happens if I wait?"],
    ["video-filling-overview", "diagram-filling-vs-crown", "video-root-canal-overview"],
    [
      section("What this diagnosis means", "The tooth has a deeper defect and the nerve may already be irritated."),
      section("Why the plan can change", "The true condition inside the tooth is sometimes only clear once the decay is removed."),
      section("Why the office discusses multiple outcomes", "A tooth this deep can move from simple filling treatment to nerve treatment or even extraction depending on what is found.")
    ]
  ),
  diagnosis(
    "failing-filling",
    "general-dentistry",
    "Failing filling or recurrent decay",
    "An older restoration is leaking, breaking, or allowing new decay around it.",
    ["filling", "inlay-onlay", "crown"],
    ["Why does a filling fail after years?", "Can it just be repaired?", "How do you know when it needs a crown instead?"],
    ["video-filling-overview", "diagram-filling-vs-crown", "handout-restorative-aftercare"],
    [
      section("What this diagnosis means", "A prior filling or bonded area is no longer sealing or supporting the tooth properly."),
      section("Why it happens", "Restorations wear out, margins open, or the tooth changes over time."),
      section("Treatment goal", "The office is deciding how much of the tooth can still be predictably preserved and supported.")
    ]
  ),
  diagnosis(
    "fractured-cusp",
    "general-dentistry",
    "Fractured cusp or structural breakdown",
    "Part of the chewing surface has weakened or broken and the tooth needs support before the damage spreads.",
    ["filling", "inlay-onlay", "crown", "extraction"],
    ["Can the broken area just be bonded back?", "Why do cracked teeth sometimes worsen suddenly?", "Will this still be treatable if I wait?"],
    ["video-crown-overview", "diagram-crown-temporary", "diagram-filling-vs-crown"],
    [
      section("What this diagnosis means", "The tooth has a structural failure that makes chewing pressure more dangerous for the remaining walls of the tooth."),
      section("What patients often miss", "A tooth can still chew for a while even when it is close to breaking more seriously."),
      section("Treatment goal", "The office wants to stop a small fracture from becoming a split tooth or nerve problem.")
    ]
  ),
  diagnosis(
    "cracked-tooth",
    "general-dentistry",
    "Cracked tooth",
    "The tooth has a structural weakness that can worsen under chewing pressure and sometimes involve the nerve.",
    ["crown", "root-canal", "extraction"],
    ["Why does it only hurt on certain bites?", "Does every crack need a root canal?", "Can a crown stop the crack from growing?"],
    ["video-crown-overview", "diagram-crown-temporary", "video-root-canal-overview"],
    [
      section("What this diagnosis means", "A crack allows the tooth to flex in a way that can create sharp pain or nerve irritation."),
      section("Why symptoms vary", "Pain may come and go depending on bite direction, temperature, or pressure."),
      section("Treatment goal", "The office is trying to stabilize the tooth before the crack becomes deeper or reaches an unsalvageable level.")
    ]
  ),
  diagnosis(
    "reversible-pulpitis",
    "endodontics",
    "Reversible pulpitis",
    "The nerve is irritated but may still recover if the source is treated before the irritation becomes permanent.",
    ["filling", "inlay-onlay", "crown", "monitoring"],
    ["Can this settle down after a filling?", "How would I know if it turned into something worse?", "Why can cold sensitivity be temporary?"],
    ["video-filling-overview", "video-crown-overview", "handout-restorative-aftercare"],
    [
      section("What this diagnosis means", "The nerve is reacting, but the office still believes it may calm down if the problem is treated soon enough."),
      section("Why the diagnosis matters", "This is the window where nerve-saving care may still be possible."),
      section("What to watch for", "Lingering pain, spontaneous pain, or worsening bite discomfort can mean the tooth is progressing.")
    ]
  ),
  diagnosis(
    "irreversible-pulpitis",
    "endodontics",
    "Irreversible pulpitis",
    "The nerve tissue inside the tooth is too inflamed to heal on its own.",
    ["root-canal", "extraction"],
    ["Can this calm down on its own?", "What happens if I wait?", "If I save the tooth, what comes next?"],
    ["video-root-canal-overview", "diagram-root-canal-steps", "video-extraction-overview"],
    [
      section("What this diagnosis means", "The inside of the tooth is inflamed enough that the pain source is unlikely to resolve without treatment."),
      section("Why symptoms can be confusing", "Pain can come and go, which makes the problem seem smaller than it is."),
      section("Why timing matters", "Delaying care can lead to worsening pain, infection, or loss of a tooth-saving option.")
    ]
  ),
  diagnosis(
    "necrotic-pulp",
    "endodontics",
    "Necrotic pulp",
    "The nerve tissue inside the tooth is no longer healthy or alive and bacteria can move out through the root.",
    ["root-canal", "extraction"],
    ["Why can a dead tooth still hurt?", "If the nerve is dead, why is treatment still needed?", "Can the infection spread?"],
    ["video-root-canal-overview", "diagram-root-canal-steps", "video-extraction-overview"],
    [
      section("What this diagnosis means", "The inside of the tooth has lost vitality and can now act as a reservoir for infection."),
      section("Why patients get surprised", "A tooth can stop reacting to cold yet still cause pressure, swelling, or infection around the root."),
      section("Treatment goal", "The source must be cleaned out or the tooth removed.")
    ]
  ),
  diagnosis(
    "apical-periodontitis",
    "endodontics",
    "Apical periodontitis",
    "The tissues around the root tip are inflamed because of pressure, infection, or pulpal disease inside the tooth.",
    ["root-canal", "root-canal-retreatment", "extraction"],
    ["Why does it hurt to bite even if the tooth is not temperature sensitive?", "Is this already an infection?", "Will treatment help the ligament around the root heal?"],
    ["video-root-canal-overview", "diagram-root-canal-steps", "video-extraction-overview"],
    [
      section("What this diagnosis means", "The problem is no longer only inside the tooth. The surrounding tissues are reacting too."),
      section("What patients often notice", "Biting soreness, tenderness, or a tooth that feels raised can be the main symptom."),
      section("Treatment goal", "Treatment focuses on removing the inner source so the tissues around the root can recover.")
    ]
  ),
  diagnosis(
    "apical-abscess",
    "endodontics",
    "Apical abscess",
    "There is infection associated with the tooth root, and it can spread or flare if the source is not treated.",
    ["root-canal", "extraction"],
    ["Will antibiotics fix this by themselves?", "Is saving the tooth still realistic?", "What should I expect between urgent treatment and final care?"],
    ["video-root-canal-overview", "video-extraction-overview", "handout-root-canal-aftercare"],
    [
      section("What this diagnosis means", "An abscess means bacteria have moved beyond the tooth into the area around the root."),
      section("What patients often misunderstand", "Antibiotics can help swelling in some cases, but they do not remove the source inside the tooth."),
      section("Decision focus", "The core decision is whether the office can predictably save the tooth or whether removal makes more sense.")
    ]
  ),
  diagnosis(
    "failed-root-canal",
    "endodontics",
    "Persistent infection after prior root canal treatment",
    "A tooth that was previously treated is still showing symptoms, persistent infection, or new breakdown.",
    ["root-canal-retreatment", "apicoectomy", "extraction"],
    ["Why can a root canal fail years later?", "Do you have to remove the crown to retreat it?", "When would surgery be better than retreatment?"],
    ["video-root-canal-overview", "diagram-root-canal-steps", "video-extraction-overview"],
    [
      section("What this diagnosis means", "The tooth was previously treated, but bacteria or anatomy issues still appear to be active."),
      section("Why it is more complex", "Prior crowns, posts, or unusual anatomy can limit access and change which options are realistic."),
      section("Treatment goal", "The office is weighing whether the tooth still has enough value and predictability to justify another attempt to save it.")
    ]
  ),
  diagnosis(
    "non-restorable-tooth",
    "oral-surgery",
    "Non-restorable tooth",
    "There is not enough healthy tooth or predictable support left for a long-term repair.",
    ["extraction", "socket-preservation", "implant", "bridge", "partial-denture"],
    ["Why can't this just be crowned?", "If it is removed, what should replace it?", "Do I need a graft right away?"],
    ["video-extraction-overview", "diagram-extraction-healing", "diagram-implant-phases"],
    [
      section("What this diagnosis means", "The remaining tooth structure or support is too compromised for a predictable long-term repair."),
      section("Why this can be disappointing", "Patients often expect every broken or decayed tooth to be fixable if enough is done."),
      section("Treatment goal", "The plan shifts from saving the tooth to choosing the best way to remove and replace it if replacement is desired.")
    ]
  ),
  diagnosis(
    "impacted-third-molar",
    "oral-surgery",
    "Impacted or partially erupted wisdom tooth",
    "A wisdom tooth does not have a healthy path to erupt or stay clean and may threaten surrounding tissues or the neighboring tooth.",
    ["wisdom-tooth-removal", "monitoring"],
    ["Why remove it if it is not hurting today?", "Can it damage the tooth in front of it?", "What does healing usually feel like?"],
    ["video-extraction-overview", "diagram-extraction-healing", "handout-extraction-aftercare"],
    [
      section("What this diagnosis means", "The wisdom tooth is trapped, difficult to clean, or positioned in a way that raises future risk."),
      section("Why symptoms are not the whole story", "Some impacted teeth cause damage quietly before major pain appears."),
      section("Treatment goal", "The office is balancing current symptoms with future risk to the surrounding teeth and gums.")
    ]
  ),
  diagnosis(
    "pericoronitis",
    "oral-surgery",
    "Pericoronitis",
    "Inflamed gum tissue is collecting bacteria around a partially erupted tooth, often a wisdom tooth.",
    ["wisdom-tooth-removal", "monitoring"],
    ["Why does the gum around the tooth keep flaring?", "Can this keep coming back?", "Will cleaning alone solve it?"],
    ["video-extraction-overview", "diagram-extraction-healing", "handout-extraction-aftercare"],
    [
      section("What this diagnosis means", "The gum flap over or around the tooth is trapping bacteria and inflaming repeatedly."),
      section("Why it recurs", "Even after a flare settles, the anatomy often keeps the area difficult to clean."),
      section("Treatment goal", "The office is deciding whether short-term management is enough or whether the tooth should be removed to stop the cycle.")
    ]
  ),
  diagnosis(
    "missing-single-tooth",
    "prosthodontics",
    "Missing single tooth",
    "A tooth is already gone and the treatment question is how, when, or whether to replace it.",
    ["implant", "bridge", "partial-denture"],
    ["Do I have to replace it?", "What is the difference between an implant and a bridge?", "Will I need something temporary while I decide?"],
    ["video-implant-overview", "diagram-bridge-vs-implant", "handout-prosthetic-adaptation"],
    [
      section("What this diagnosis means", "The focus is no longer removing disease from a tooth. It is about replacing what has already been lost."),
      section("Why options differ", "Different replacements ask different things of neighboring teeth, bone, budget, and time."),
      section("Treatment goal", "The office wants the patient to understand both the function and the long-term maintenance tradeoffs of replacement.")
    ]
  ),
  diagnosis(
    "failing-crown",
    "general-dentistry",
    "Failing crown or recurrent decay under a crown",
    "An existing crown is no longer protecting the tooth predictably and there may be hidden decay or breakdown underneath it.",
    ["crown", "root-canal", "extraction"],
    ["Does the old crown have to come off?", "Could this still need a root canal?", "What if the tooth is worse under the crown than it looks?"],
    ["video-crown-overview", "diagram-crown-temporary", "video-root-canal-overview"],
    [
      section("What this diagnosis means", "The existing crown is not enough to keep the tooth healthy or sealed anymore."),
      section("Why the uncertainty feels bigger", "Part of the problem can be hidden under the restoration until it is removed."),
      section("Treatment goal", "The office is preparing the patient for a range of outcomes from replacement to more advanced care.")
    ]
  ),
  diagnosis(
    "gingivitis",
    "periodontics",
    "Gingivitis",
    "The gums are inflamed and bleeding, but the office does not yet see clear destructive periodontal breakdown.",
    ["monitoring", "scaling-root-planing"],
    ["Is this already gum disease?", "Can home care reverse this?", "Why are you talking about periodontal cleaning if the bone is still okay?"],
    ["video-periodontal-therapy", "diagram-periodontal-charting", "handout-periodontal-maintenance"],
    [
      section("What this diagnosis means", "The gum tissue is inflamed and reacting to bacterial buildup."),
      section("Why it matters early", "Bleeding gums are easy to normalize, but inflammation can be the beginning of more destructive disease."),
      section("Treatment goal", "The office wants to reduce inflammation before deeper support loss occurs.")
    ]
  ),
  diagnosis(
    "stage-1-periodontitis",
    "periodontics",
    "Early periodontitis",
    "There are signs that the infection has started affecting the support around the teeth.",
    ["scaling-root-planing", "periodontal-maintenance"],
    ["Is this reversible?", "Why is this different from a regular cleaning?", "How often will maintenance be needed?"],
    ["video-periodontal-therapy", "diagram-periodontal-charting", "handout-periodontal-maintenance"],
    [
      section("What this diagnosis means", "The bacterial problem is affecting the support around the teeth, not just the surface gums."),
      section("What patients often miss", "This can progress without dramatic pain."),
      section("Treatment goal", "The office is trying to stabilize the disease and set up long-term maintenance.")
    ]
  ),
  diagnosis(
    "advanced-periodontitis",
    "periodontics",
    "Moderate to advanced periodontitis",
    "There is deeper support loss around the teeth and long-term stability depends on active treatment and maintenance.",
    ["scaling-root-planing", "periodontal-maintenance", "gum-graft", "extraction"],
    ["Can loose teeth tighten again?", "Will this keep progressing if I do nothing?", "Why are maintenance visits part of the treatment plan?"],
    ["video-periodontal-therapy", "diagram-periodontal-charting", "handout-periodontal-maintenance"],
    [
      section("What this diagnosis means", "The disease has caused more meaningful changes to the support around the teeth."),
      section("Why the plan can include multiple phases", "Initial infection control, maintenance, and targeted surgery or removal can all be part of care."),
      section("Treatment goal", "The office wants to preserve the healthiest stable teeth and clearly explain which teeth may remain guarded.")
    ]
  ),
  diagnosis(
    "gingival-recession",
    "periodontics",
    "Gingival recession",
    "The gumline has moved away from the tooth, exposing root surface and sometimes increasing sensitivity or risk.",
    ["monitoring", "gum-graft"],
    ["Is this mostly cosmetic or also a health issue?", "Will the gum grow back on its own?", "What is grafting meant to improve?"],
    ["video-periodontal-therapy", "diagram-periodontal-charting", "handout-periodontal-maintenance"],
    [
      section("What this diagnosis means", "The root surface is more exposed than it should be and the tissue may be thin or vulnerable."),
      section("Why treatment is selective", "Not every recession area needs surgery, but some sites need protection because they are worsening or highly symptomatic."),
      section("Treatment goal", "The office is balancing comfort, stability, and esthetics.")
    ]
  ),
  diagnosis(
    "tooth-wear-bruxism",
    "general-dentistry",
    "Tooth wear, clenching, or grinding",
    "The teeth or restorations are showing damage from heavy forces, wear, or ongoing parafunction.",
    ["night-guard", "filling", "crown", "veneers"],
    ["Why are my teeth flattening or chipping?", "Will a night guard fix the damage or just protect against more?", "When is rebuilding the teeth necessary?"],
    ["diagram-tooth-wear-night-guard", "video-crown-overview", "handout-restorative-aftercare"],
    [
      section("What this diagnosis means", "The teeth are showing evidence of overload, wear, or repeated stress."),
      section("Why patients are often surprised", "Clenching and grinding may happen during sleep without obvious awareness."),
      section("Treatment goal", "The office is deciding when protection alone is enough and when rebuilding damaged teeth is also needed.")
    ]
  ),
  diagnosis(
    "esthetic-discoloration",
    "prosthodontics",
    "Esthetic discoloration or smile improvement request",
    "The concern is largely cosmetic, so the conversation is about goals, limitations, and the least invasive path that can realistically help.",
    ["whitening", "veneers"],
    ["Will whitening work on this kind of stain?", "What would veneers change that whitening cannot?", "How natural can the result look?"],
    ["handout-whitening-veneers", "video-crown-overview"],
    [
      section("What this diagnosis means", "This is an esthetic concern rather than an urgent health threat."),
      section("Why the conversation matters", "Patients need realistic expectations so cosmetic treatment feels empowering rather than disappointing."),
      section("Treatment goal", "The office is matching the patient's esthetic goals to the least invasive option that can realistically deliver them.")
    ]
  ),
  diagnosis(
    "malocclusion-crowding",
    "orthodontics",
    "Crowding, spacing, or bite alignment problem",
    "Tooth position or bite relationships can be improved, but the treatment depends on movement limits, compliance, and goals.",
    ["aligner-therapy", "monitoring"],
    ["How long would movement take?", "Do I have to wear trays all day?", "Will teeth move back afterward?"],
    ["video-aligner-overview", "handout-whitening-veneers"],
    [
      section("What this diagnosis means", "The alignment or bite could be improved to help function, hygiene, or smile appearance."),
      section("What often catches patients off guard", "Orthodontic treatment is a process with compliance, attachments, refinements, and retention."),
      section("Treatment goal", "The office is trying to show not only how teeth move, but what the daily commitment looks like.")
    ]
  ),
  diagnosis(
    "edentulous-arch",
    "prosthodontics",
    "Missing all teeth in an arch",
    "A full arch is already missing or near removal, so treatment focuses on removable or staged replacement planning.",
    ["full-denture", "implant"],
    ["Will dentures be my only option?", "Could implants support a more stable option later?", "What kind of adaptation should I expect?"],
    ["video-denture-options", "video-implant-overview", "handout-prosthetic-adaptation"],
    [
      section("What this diagnosis means", "The problem now is arch replacement and function, not saving a specific single tooth."),
      section("Why there can still be multiple paths", "Removable and implant-supported solutions differ in cost, surgery, stability, and timeline."),
      section("Treatment goal", "The office wants the patient to understand both the first delivery and the longer adaptation process.")
    ]
  ),
  generalDiagnosis(
    "caries",
    "Caries",
    "A cavity has damaged the tooth and may continue to grow deeper if it is not monitored or treated in time.",
    ["monitoring", "filling", "inlay-onlay", "crown"],
    ["How deep is the cavity?", "Can this still be treated with a filling?", "What happens if I wait?"],
    ["video-filling-overview", "diagram-filling-vs-crown", "handout-restorative-aftercare"],
    {
      means: "Tooth structure has been weakened by bacterial breakdown and the area is no longer fully healthy or sealed.",
      matters: "Caries can start small and silent, then move deeper into the tooth until treatment becomes more involved.",
      goal: "The office is trying to stop the damage and preserve the tooth with the most conservative predictable option."
    }
  ),
  generalDiagnosis(
    "pulp-necrosis",
    "Pulp necrosis",
    "The tissue inside the tooth is no longer healthy or alive, and infection can develop or spread from the root.",
    ["root-canal", "extraction"],
    ["How can a dead nerve still cause pain?", "Can the tooth still be saved?", "Will this spread if I do nothing?"],
    ["video-root-canal-overview", "diagram-root-canal-steps", "handout-root-canal-aftercare"],
    {
      means: "The nerve tissue inside the tooth has lost vitality and can no longer recover on its own.",
      matters: "Once the pulp becomes necrotic, the inside of the tooth can act as a source of bacteria and inflammation.",
      goal: "Treatment focuses on removing the source inside the tooth or removing the tooth itself if saving it is not realistic."
    }
  ),
  generalDiagnosis(
    "condensing-osteitis",
    "Condensing osteitis",
    "The bone near the root has become denser in response to long-term irritation or low-grade inflammation from the tooth.",
    ["root-canal", "extraction", "monitoring"],
    ["Why does the bone look different on the x-ray?", "Does this always mean infection?", "Will the bone go back to normal after treatment?"],
    ["diagram-root-canal-steps", "video-root-canal-overview", "handout-root-canal-aftercare"],
    {
      means: "The bone is reacting to ongoing irritation by becoming more sclerotic or dense around the tooth root.",
      matters: "This often signals that the tooth has had a chronic pulpal problem even if the symptoms have been mild or intermittent.",
      goal: "The office is identifying whether the tooth needs endodontic treatment, close review, or removal based on the full clinical picture."
    }
  ),
  generalDiagnosis(
    "periodontitis",
    "Periodontitis",
    "Gum disease has begun affecting the supporting tissues around the teeth and needs active control to protect long-term stability.",
    ["scaling-root-planing", "periodontal-maintenance", "gum-graft", "extraction"],
    ["Is this reversible?", "Why is this different from a regular cleaning?", "Will I need maintenance forever?"],
    ["video-periodontal-therapy", "diagram-periodontal-charting", "handout-periodontal-maintenance"],
    {
      means: "Bacterial infection and inflammation are affecting the attachment and support around the teeth, not just the surface gums.",
      matters: "Periodontitis can progress without dramatic pain, which is why patients are often surprised by the amount of support loss already present.",
      goal: "The office is trying to reduce infection, stabilize the healthiest possible teeth, and create a long-term maintenance plan."
    }
  ),
  generalDiagnosis(
    "periodontal-abscess",
    "Periodontal abscess",
    "A localized infection has developed in the supporting gum tissues around a tooth and may cause pain, swelling, or drainage.",
    ["scaling-root-planing", "periodontal-maintenance", "extraction"],
    ["Is this the same as an abscess inside the tooth?", "Will antibiotics solve it by themselves?", "Does this mean the tooth is in danger?"],
    ["video-periodontal-therapy", "diagram-periodontal-charting", "handout-periodontal-maintenance"],
    {
      means: "The infection is centered in the periodontal tissues around the tooth rather than only inside the tooth itself.",
      matters: "This can become painful quickly and may signal deeper periodontal destruction or trapped bacteria that need active care.",
      goal: "The office is trying to reduce the infection, evaluate the tooth's support, and decide whether the tooth is still stable enough to keep."
    }
  ),
  generalDiagnosis(
    "attrition",
    "Attrition",
    "Tooth structure has worn down from repeated tooth-to-tooth contact, often over time and under heavy biting forces.",
    ["night-guard", "filling", "crown"],
    ["Why are my teeth getting flatter?", "Is this from grinding?", "When does wear need to be rebuilt?"],
    ["diagram-tooth-wear-night-guard", "video-crown-overview", "handout-restorative-aftercare"],
    {
      means: "The chewing surfaces are gradually wearing against each other and losing normal anatomy.",
      matters: "Attrition can make teeth shorter, more sensitive, more fragile, and more likely to chip or crack later.",
      goal: "The office is deciding whether the priority is protection, rebuilding, or a combination of both."
    }
  ),
  generalDiagnosis(
    "abrasion",
    "Abrasion",
    "Tooth structure has been worn away by external mechanical habits such as overly aggressive brushing or repeated friction.",
    ["monitoring", "filling", "night-guard"],
    ["Is this from brushing too hard?", "Why is the root area sensitive?", "Does this always need to be filled?"],
    ["diagram-tooth-wear-night-guard", "handout-restorative-aftercare", "video-filling-overview"],
    {
      means: "The tooth surface has been mechanically worn down in a way that is not caused by decay.",
      matters: "Abrasion can expose root areas, create sensitivity, and weaken the contour where the tooth meets the gumline.",
      goal: "The office is trying to stop the habit causing the wear and restore the area if the damage is already significant."
    }
  ),
  generalDiagnosis(
    "erosion",
    "Erosion",
    "Acid exposure has softened and worn away tooth structure over time.",
    ["monitoring", "filling", "crown"],
    ["Is this from acid or reflux?", "Can enamel grow back?", "When does this become serious enough to rebuild?"],
    ["diagram-tooth-wear-night-guard", "video-filling-overview", "handout-restorative-aftercare"],
    {
      means: "Chemical wear is dissolving the outer layers of the tooth and changing how the surface looks and feels.",
      matters: "As erosion continues, teeth can become thin, sensitive, and more likely to chip or fracture.",
      goal: "The office is addressing both the damage already present and the factors that keep exposing the teeth to acid."
    }
  ),
  generalDiagnosis(
    "abfraction",
    "Abfraction",
    "Stress-related tooth flexing has contributed to a notch or defect near the gumline.",
    ["monitoring", "filling", "night-guard"],
    ["Why is the defect near the gumline?", "Is this caused by bite forces?", "Will a filling solve the whole problem?"],
    ["diagram-tooth-wear-night-guard", "video-filling-overview", "handout-restorative-aftercare"],
    {
      means: "The cervical area of the tooth is showing a wedge-like defect that may be related to stress and flexing over time.",
      matters: "These defects can deepen, become sensitive, and sometimes continue to worsen if the forces are not addressed.",
      goal: "The office is deciding whether the main need is protection, restoration, or force management."
    }
  ),
  generalDiagnosis(
    "tooth-fracture",
    "Tooth fracture",
    "A portion of the tooth has broken or weakened enough that the remaining structure may not be stable under normal chewing.",
    ["filling", "inlay-onlay", "crown", "extraction"],
    ["How bad is the break?", "Can the tooth still be saved?", "Why do some fractures need crowns and others extractions?"],
    ["video-crown-overview", "diagram-crown-temporary", "diagram-filling-vs-crown"],
    {
      means: "The tooth has lost structural integrity and the amount and location of the break determines what treatment is still realistic.",
      matters: "Some fractures stay limited, while others spread into the nerve area or below the gumline and change the outlook quickly.",
      goal: "The office is trying to preserve the tooth if possible while being honest about how predictable the repair can be."
    }
  ),
  generalDiagnosis(
    "bruxism",
    "Bruxism",
    "Clenching or grinding forces are damaging the teeth, restorations, muscles, or joints over time.",
    ["night-guard", "monitoring", "crown"],
    ["Do I grind without knowing it?", "Will a night guard stop the damage?", "Why do my teeth and jaw both feel sore?"],
    ["diagram-tooth-wear-night-guard", "handout-restorative-aftercare", "video-crown-overview"],
    {
      means: "The teeth and surrounding system are being overloaded by repeated heavy force, often during sleep or unconscious daytime clenching.",
      matters: "Bruxism can flatten teeth, chip restorations, strain muscles, and contribute to fractures or jaw symptoms.",
      goal: "The office is trying to reduce ongoing damage and decide whether the worn or broken teeth also need repair."
    }
  ),
  generalDiagnosis(
    "occlusal-trauma",
    "Occlusal trauma",
    "A tooth or group of teeth is being overloaded by biting forces in a way that can irritate the support structures.",
    ["night-guard", "monitoring", "scaling-root-planing"],
    ["Why does it feel sore to bite?", "Is this a bite problem or a gum problem?", "Can force alone damage the tooth support?"],
    ["diagram-tooth-wear-night-guard", "diagram-periodontal-charting", "handout-restorative-aftercare"],
    {
      means: "The tooth support is reacting to excessive or poorly directed force rather than only infection or decay.",
      matters: "Heavy bite stress can create mobility, soreness, wear, and inflammation around already vulnerable teeth.",
      goal: "The office is trying to reduce the overload and protect the teeth and support structures from further breakdown."
    }
  ),
  generalDiagnosis(
    "impacted-tooth",
    "Impacted tooth",
    "A tooth does not have a normal path to erupt or remain healthy in its current position.",
    ["wisdom-tooth-removal", "monitoring"],
    ["Does it need to come out if it is not hurting now?", "Can it damage nearby teeth?", "What happens if we just watch it?"],
    ["video-extraction-overview", "diagram-extraction-healing", "handout-extraction-aftercare"],
    {
      means: "The tooth is blocked, trapped, or positioned in a way that limits healthy eruption or hygiene.",
      matters: "Impacted teeth can create pressure, gum problems, decay risk, or silent damage to nearby teeth over time.",
      goal: "The office is balancing today's symptoms with future risk and whether removal is the most predictable long-term choice."
    }
  ),
  generalDiagnosis(
    "malocclusion",
    "Malocclusion",
    "The way the teeth fit together is not ideal and may affect function, hygiene, esthetics, or long-term wear.",
    ["aligner-therapy", "monitoring"],
    ["Is this mostly cosmetic or also functional?", "Can aligners help this type of bite?", "Will it keep causing wear if untreated?"],
    ["video-aligner-overview", "handout-whitening-veneers", "diagram-tooth-wear-night-guard"],
    {
      means: "The relationship between the upper and lower teeth is off in a way that can influence how the bite works and how the teeth age.",
      matters: "Malocclusion can contribute to crowding, uneven wear, cleaning difficulty, or functional strain over time.",
      goal: "The office is helping the patient understand whether simple monitoring is enough or whether alignment treatment would improve long-term function."
    }
  ),
  generalDiagnosis(
    "crowding-spacing",
    "Crowding / spacing",
    "The teeth are misaligned because there is either not enough room or extra room in the arch.",
    ["aligner-therapy", "monitoring"],
    ["How long would alignment take?", "Can this affect cleaning and gum health?", "Will the teeth move back afterward?"],
    ["video-aligner-overview", "handout-whitening-veneers", "diagram-periodontal-charting"],
    {
      means: "Tooth position is uneven enough that spacing or overlap is affecting appearance, function, or hygiene.",
      matters: "Crowding and spacing can make brushing more difficult, trap food, and sometimes worsen inflammation or wear patterns.",
      goal: "The office is showing what alignment treatment would change and what commitment the movement process requires."
    }
  ),
  generalDiagnosis(
    "ulcer",
    "Ulcer (aphthous or traumatic)",
    "A sore area has developed in the oral tissues from irritation, trauma, or a recurrent ulcer pattern.",
    ["monitoring"],
    ["Why does this spot hurt so much?", "How do you tell trauma from something more serious?", "When should I worry if it does not heal?"],
    ["video-periodontal-therapy", "handout-periodontal-maintenance", "diagram-periodontal-charting"],
    {
      means: "The tissue has broken down locally and become inflamed, tender, or sensitive during normal speaking and eating.",
      matters: "Many ulcers are self-limited, but persistent or unusual lesions need close follow-up to make sure they are healing normally.",
      goal: "The office is deciding whether the sore area appears routine and self-limited or whether it needs re-evaluation."
    }
  ),
  generalDiagnosis(
    "soft-tissue-abscess",
    "Abscess (soft tissue)",
    "A localized soft tissue infection has developed in the gums or oral tissues and needs evaluation for source and spread.",
    ["monitoring", "scaling-root-planing", "extraction"],
    ["Is this coming from the gums or a tooth?", "Will it drain on its own?", "What signs mean it is getting worse?"],
    ["video-periodontal-therapy", "diagram-periodontal-charting", "video-extraction-overview"],
    {
      means: "The infection is centered in the soft tissues and can create swelling, tenderness, or drainage.",
      matters: "Soft tissue abscesses can worsen quickly, and the real treatment depends on whether the source is periodontal, dental, or another local cause.",
      goal: "The office is identifying the source and deciding whether localized cleaning, tooth treatment, or close reassessment is needed."
    }
  ),
  generalDiagnosis(
    "candidiasis",
    "Candidiasis",
    "A fungal overgrowth is affecting the oral tissues and may create soreness, coating, redness, or altered taste.",
    ["monitoring"],
    ["Why did this develop now?", "Can it be related to dry mouth or antibiotics?", "How do we know it is fungal?"],
    ["video-periodontal-therapy", "handout-periodontal-maintenance", "diagram-periodontal-charting"],
    {
      means: "The balance of normal oral organisms has shifted and yeast is overgrowing in a way that is causing visible or symptomatic changes.",
      matters: "Candidiasis can reflect local irritation, medication effects, denture issues, or broader dry mouth and health patterns.",
      goal: "The office is confirming the diagnosis and identifying any habits or conditions that may be making recurrence more likely."
    }
  ),
  generalDiagnosis(
    "herpetic-lesion",
    "Herpetic lesion",
    "A viral lesion is affecting the oral tissues and may cause clusters of painful sores or recurrent flare-ups.",
    ["monitoring"],
    ["Why does it come back in the same area?", "Is it contagious right now?", "When is it not just a cold sore?"],
    ["video-periodontal-therapy", "handout-periodontal-maintenance", "diagram-periodontal-charting"],
    {
      means: "The lesion pattern suggests a viral process that affects the oral tissues in episodes or flare-ups.",
      matters: "Herpetic lesions can be painful, recurrent, and easy to confuse with traumatic or aphthous lesions without context.",
      goal: "The office is helping the patient understand the pattern, the triggers, and when a lesion needs more direct attention."
    }
  ),
  generalDiagnosis(
    "benign-lesion",
    "Benign lesion (fibroma, mucocele, etc.)",
    "A tissue finding appears nonaggressive, but it still needs documentation and follow-up when appropriate.",
    ["monitoring"],
    ["How do you know it looks benign?", "Does it need to be removed?", "What changes should make me come back sooner?"],
    ["video-periodontal-therapy", "handout-periodontal-maintenance", "diagram-periodontal-charting"],
    {
      means: "The tissue change appears more consistent with a harmless reactive or cyst-like process than with an aggressive disease pattern.",
      matters: "Even benign-looking lesions should be documented and watched if they change, persist, or begin interfering with function.",
      goal: "The office is deciding whether observation is enough or whether removal or referral would make the most sense."
    }
  ),
  generalDiagnosis(
    "suspicious-lesion",
    "Suspicious lesion (leukoplakia, etc.)",
    "A tissue change does not look routine and should be watched closely or referred for further evaluation.",
    ["monitoring"],
    ["Why are you concerned about this area?", "What makes a lesion suspicious?", "How quickly should this be rechecked?"],
    ["video-periodontal-therapy", "handout-periodontal-maintenance", "diagram-periodontal-charting"],
    {
      means: "The lesion has features that do not fit a simple routine sore or harmless reactive change.",
      matters: "Persistent, changing, or unusual lesions need careful follow-up because early evaluation matters when something is not behaving normally.",
      goal: "The office is documenting the lesion clearly and deciding whether observation, recheck, or referral is the safest next step."
    }
  ),
  generalDiagnosis(
    "tmd",
    "TMD",
    "The jaw joints, chewing muscles, or related bite forces are contributing to pain, tension, noise, or limited movement.",
    ["night-guard", "monitoring"],
    ["Is this my joint or my muscles?", "Why does my jaw click?", "Can clenching make this worse?"],
    ["diagram-tooth-wear-night-guard", "handout-restorative-aftercare", "video-aligner-overview"],
    {
      means: "The symptoms are coming from the temporomandibular system rather than only from a single tooth.",
      matters: "TMD can create jaw fatigue, headaches, joint sounds, and bite discomfort that patients often confuse with dental pain alone.",
      goal: "The office is trying to reduce strain, protect the system, and decide whether the symptoms look stable or progressive."
    }
  ),
  generalDiagnosis(
    "missing-tooth",
    "Missing tooth",
    "A tooth is already absent, so the question is whether and how to replace it in a way that fits the patient's goals.",
    ["implant", "bridge", "partial-denture"],
    ["Do I need to replace it?", "How is an implant different from a bridge?", "Will waiting change my options later?"],
    ["video-implant-overview", "diagram-bridge-vs-implant", "handout-prosthetic-adaptation"],
    {
      means: "The current concern is no longer saving a tooth but understanding the replacement choices and what each one requires.",
      matters: "A missing tooth can affect chewing, drifting, esthetics, and how the neighboring teeth or bone change over time.",
      goal: "The office is helping the patient compare replacement paths clearly enough to choose the one that best fits function, cost, and timeline."
    }
  ),
  generalDiagnosis(
    "failed-restoration",
    "Failed restoration",
    "A prior restorative treatment is no longer sealing, protecting, or supporting the tooth predictably.",
    ["filling", "inlay-onlay", "crown"],
    ["Why did the restoration fail?", "Can it be repaired instead of replaced?", "How do you know when the tooth needs more coverage?"],
    ["video-filling-overview", "diagram-filling-vs-crown", "video-crown-overview"],
    {
      means: "The older restoration is leaking, breaking down, or no longer matching what the tooth needs structurally.",
      matters: "Once a restoration fails, new decay, cracks, or deeper pulpal irritation can develop around it quietly.",
      goal: "The office is deciding how conservatively the tooth can still be rebuilt while improving long-term predictability."
    }
  ),
  generalDiagnosis(
    "broken-restoration",
    "Broken restoration (crown/filling/bridge)",
    "A crown, filling, or bridge has fractured, come loose, or otherwise lost its normal function.",
    ["filling", "crown", "bridge"],
    ["Can it be recemented or repaired?", "What if the tooth underneath is also damaged?", "Why do some broken restorations need full replacement?"],
    ["video-crown-overview", "diagram-crown-temporary", "diagram-bridge-vs-implant"],
    {
      means: "The existing restoration is no longer intact enough to protect the tooth or function normally.",
      matters: "What looks like a simple broken restoration can sometimes hide decay, root issues, or lack of remaining tooth support.",
      goal: "The office is evaluating whether the restoration can be repaired, replaced, or whether the underlying tooth has become a bigger part of the problem."
    }
  ),
  generalDiagnosis(
    "endo-perio-lesion",
    "Endo-perio lesion",
    "A tooth is showing both pulpal and periodontal involvement, which can make the diagnosis and prognosis more complex.",
    ["root-canal", "scaling-root-planing", "extraction"],
    ["Is this coming from the nerve or the gums?", "Which part gets treated first?", "Does this lower the chance of saving the tooth?"],
    ["video-root-canal-overview", "diagram-periodontal-charting", "handout-root-canal-aftercare"],
    {
      means: "Both the inside of the tooth and the supporting tissues may be contributing to the current signs and symptoms.",
      matters: "Combined lesions can be harder to diagnose and often carry more uncertainty than a single isolated endodontic or periodontal problem.",
      goal: "The office is sorting out the main source, the order of treatment, and whether the tooth still has a predictable future."
    }
  ),
  generalDiagnosis(
    "luxation-injury",
    "Luxation injury",
    "A tooth has been displaced or traumatized without being completely knocked out.",
    ["monitoring", "root-canal", "extraction"],
    ["Will the tooth tighten back up?", "Can the nerve still survive this?", "What changes should I watch for after the injury?"],
    ["video-root-canal-overview", "handout-root-canal-aftercare", "diagram-extraction-healing"],
    {
      means: "The tooth and its supporting ligament have been injured by trauma and may respond with mobility, soreness, or pulpal changes over time.",
      matters: "Traumatic injuries can look better before they are fully stable, so follow-up is often just as important as the first visit.",
      goal: "The office is monitoring healing, vitality, and support while deciding whether the tooth needs only time or more active care."
    }
  ),
  generalDiagnosis(
    "avulsion",
    "Avulsion",
    "A tooth has been completely displaced from the socket and requires urgent evaluation of the tooth and supporting tissues.",
    ["monitoring", "root-canal", "extraction"],
    ["Can the tooth be saved after being knocked out?", "What affects the prognosis the most?", "Why does follow-up matter even after replantation?"],
    ["video-root-canal-overview", "diagram-extraction-healing", "handout-root-canal-aftercare"],
    {
      means: "The tooth has been fully displaced, which is one of the most serious forms of dental trauma.",
      matters: "The amount of time out of the mouth and how the tooth was handled can change the long-term outlook dramatically.",
      goal: "The office is focused on urgent stabilization, realistic prognosis, and the sequence of follow-up needed afterward."
    }
  ),
  generalDiagnosis(
    "xerostomia",
    "Xerostomia",
    "The mouth is dry enough to affect comfort, oral balance, and cavity risk.",
    ["monitoring"],
    ["Why is my mouth so dry?", "Can this increase cavities or irritation?", "Is this related to medications or health changes?"],
    ["handout-restorative-aftercare", "video-periodontal-therapy", "diagram-periodontal-charting"],
    {
      means: "The oral tissues do not have enough moisture or salivary support to stay as comfortable and protected as they should be.",
      matters: "Dry mouth can increase decay risk, make tissues sore, affect taste, and change how teeth and restorations age.",
      goal: "The office is identifying possible causes and explaining how dry mouth changes the patient's long-term oral risk profile."
    }
  ),
  generalDiagnosis(
    "salivary-gland-disorder",
    "Salivary gland disorder",
    "A salivary gland issue may be affecting flow, swelling patterns, comfort, or oral moisture balance.",
    ["monitoring"],
    ["Why does the gland swell at certain times?", "Can this be a blockage or infection?", "When does it need more evaluation?"],
    ["handout-periodontal-maintenance", "diagram-periodontal-charting", "video-periodontal-therapy"],
    {
      means: "The problem may involve how saliva is being produced, drained, or how the gland tissues themselves are responding.",
      matters: "Salivary disorders can affect comfort, dryness, swelling, eating, and overall oral health in ways that are easy to underestimate.",
      goal: "The office is deciding whether the pattern looks routine, obstructive, inflammatory, or in need of broader evaluation."
    }
  )
];

export const practiceCatalog: PracticeProfile[] = [
  {
    id: "clearpath-default",
    name: "ClearPath Default Library",
    description: "The baseline generic education and consent set every new office receives at launch.",
    defaultPackageSource: "library",
    brandNote: "Uses the standard ClearPath tone, diagrams, and consent language.",
    providers: getProvidersFromAccounts("clearpath-default", demoAccounts).map((provider) => ({
      id: provider.id,
      name: provider.name,
      role: "provider" as const
    })),
    overrides: []
  },
  {
    id: "river-oaks-endo",
    name: "River Oaks Endodontics",
    description: "Example office using a customized endodontic education page and practice-edited consent framing.",
    defaultPackageSource: "custom",
    brandNote: "Introduces office-specific reassurance language and post-op instructions while reusing the ClearPath media library.",
    providers: getProvidersFromAccounts("river-oaks-endo", demoAccounts).map((provider) => ({
      id: provider.id,
      name: provider.name,
      role: "provider" as const
    })),
    overrides: [
      {
        diagnosisId: "irreversible-pulpitis",
        infoPageTitle: "River Oaks Root Canal Education Page",
        infoPageIntro: "This office uses a reassurance-first explanation that emphasizes why root canal treatment is often the tooth-saving choice when the tooth is restorable.",
        consentIntro: "River Oaks adds a practice-specific note about temporary soreness, crown follow-up, and when to contact the office directly.",
        preferredMediaAssetIds: ["video-root-canal-overview", "diagram-root-canal-steps", "handout-root-canal-aftercare"],
        consentTemplateId: "consent-root-canal"
      }
    ]
  }
];

export const specialtyById = Object.fromEntries(
  specialties.map((specialty) => [specialty.id, specialty])
) as Record<string, Specialty>;

export const conditionsById = Object.fromEntries(
  conditionCatalog.map((condition) => [condition.id, condition])
) as Record<string, DiagnosisTemplate>;

export const treatmentsById = Object.fromEntries(
  treatmentCatalog.map((treatment) => [treatment.id, treatment])
) as Record<string, TreatmentOption>;

export const mediaById = Object.fromEntries(
  mediaCatalog.map((asset) => [asset.id, asset])
) as Record<string, MediaAsset>;

export const consentsById = Object.fromEntries(
  consentCatalog.map((consent) => [consent.id, consent])
) as Record<string, ConsentTemplate>;

export const practicesById = Object.fromEntries(
  practiceCatalog.map((practice) => [practice.id, practice])
) as Record<string, PracticeProfile>;

export const catalogStats = {
  diagnoses: conditionCatalog.length,
  treatments: treatmentCatalog.length,
  specialties: specialties.length,
  mediaAssets: mediaCatalog.length,
  consents: consentCatalog.length
};

export function getConditionsForSpecialty(specialtyId: string) {
  return conditionCatalog.filter((condition) => condition.specialtyId === specialtyId);
}

export function getTreatmentsForDiagnosis(diagnosisId: string) {
  const selectedDiagnosis = conditionsById[diagnosisId];
  if (!selectedDiagnosis) {
    return [];
  }

  return selectedDiagnosis.treatmentOptionIds
    .map((id) => treatmentsById[id])
    .filter((option): option is TreatmentOption => Boolean(option));
}

export function getPracticeOverride(practiceId: string, diagnosisId: string) {
  return practicesById[practiceId]?.overrides.find((override) => override.diagnosisId === diagnosisId);
}

export function getProvidersForPractice(practiceId: string) {
  return getProvidersFromAccounts(practiceId).map((provider) => ({
    id: provider.id,
    name: provider.name,
    role: provider.role
  }));
}

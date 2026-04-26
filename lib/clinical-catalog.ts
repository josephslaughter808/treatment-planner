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
    label: "Monitor with close follow-up",
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
    label: "Crown restoration",
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
    label: "Dental implant",
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
    label: "Scaling and root planing",
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
  }
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
    "Apical abscess or endodontic infection",
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

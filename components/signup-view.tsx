"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState, type Dispatch, type SetStateAction } from "react";
import { useAuth } from "@/components/auth-provider";
import { createMemberId, emptyVault, writeVaultToStorage } from "@/lib/patient-vault";

export function SignupView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(() => searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [accessCode, setAccessCode] = useState(() => searchParams.get("accessCode") || "");
  const [conditionsText, setConditionsText] = useState("");
  const [selectedHistoryFlags, setSelectedHistoryFlags] = useState<string[]>([]);
  const [surgeryHistory, setSurgeryHistory] = useState("");
  const [anesthesiaConcerns, setAnesthesiaConcerns] = useState("");
  const [bleedingConcerns, setBleedingConcerns] = useState("");
  const [recentChanges, setRecentChanges] = useState("");
  const [careTeam, setCareTeam] = useState("");
  const [accessibilityNeeds, setAccessibilityNeeds] = useState("");
  const [pregnancyStatus, setPregnancyStatus] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
  const [medicationsText, setMedicationsText] = useState("");
  const [allergiesText, setAllergiesText] = useState("");
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [insuranceMemberId, setInsuranceMemberId] = useState("");
  const [insuranceGroupNumber, setInsuranceGroupNumber] = useState("");
  const [subscriberName, setSubscriberName] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyRelationship, setEmergencyRelationship] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const draftVault = buildSignupVaultDraft({
      name,
      email,
      phone,
      dateOfBirth,
      conditionsText,
      selectedHistoryFlags,
      surgeryHistory,
      anesthesiaConcerns,
      bleedingConcerns,
      recentChanges,
      careTeam,
      accessibilityNeeds,
      pregnancyStatus,
      medicalNotes,
      medicationsText,
      allergiesText,
      insuranceProvider,
      insuranceMemberId,
      insuranceGroupNumber,
      subscriberName,
      emergencyName,
      emergencyRelationship,
      emergencyPhone
    });

    const result = await signUp({
      name,
      email,
      password,
      practiceId: "clearpath-default",
      role: "patient",
      title: "Patient",
      phone,
      bio: accessCode.trim() ? `Pilot access code: ${accessCode.trim()}` : ""
    });

    setMessage(result.message);
    if (result.ok) {
      writeVaultToStorage(draftVault);
      router.push(result.redirectTo || "/vault");
    }
    setIsSubmitting(false);
  }

  return (
    <section className="grid login-layout patient-signup-layout">
      <form className="panel" onSubmit={handleSubmit}>
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Patient account</p>
          <h2>Set up your health profile</h2>
        </div>
      </div>

        <div className="grid two-up">
          <label>
            Full name
            <input onChange={(event) => setName(event.target.value)} value={name} />
          </label>
          <label>
            Email
            <input onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
          </label>
        </div>

        <div className="grid two-up">
          <label>
            Password
            <input
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </label>
          <label>
            Phone
            <input
              autoComplete="tel"
              onChange={(event) => setPhone(event.target.value)}
              placeholder="(555) 000-0000"
              value={phone}
            />
          </label>
          <label>
            Date of birth
            <input
              onChange={(event) => setDateOfBirth(event.target.value)}
              type="date"
              value={dateOfBirth}
            />
          </label>
        </div>

        <label>
            Access code from your office
            <input
              autoCapitalize="characters"
              onChange={(event) => setAccessCode(event.target.value)}
              placeholder="Optional"
              value={accessCode}
            />
            <span className="field-help">If your office gave you a code, keep it here so they can match your profile quickly.</span>
        </label>

        <div className="signup-questionnaire">
          <div>
            <p className="eyebrow">Guided history</p>
            <h3>Medical history questionnaire</h3>
            <p>Answer what you can now. You can edit everything later from your health profile.</p>
          </div>

          <div>
            <p className="mini-label">Medical conditions</p>
            <div className="guided-option-grid">
              {historyFlagOptions.map((option) => (
                <label className="guided-option" key={option}>
                  <input
                    checked={selectedHistoryFlags.includes(option)}
                    onChange={() => toggleHistoryFlag(option, setSelectedHistoryFlags)}
                    type="checkbox"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>

          <label>
            Other medical conditions or details
            <textarea
              onChange={(event) => setConditionsText(event.target.value)}
              placeholder="Anything not listed above. Include when it started and whether it is controlled if you know."
              value={conditionsText}
            />
          </label>

          <label>
            Current medications
            <textarea
              onChange={(event) => setMedicationsText(event.target.value)}
              placeholder="One per line. Include dose/frequency if you know it. Include prescriptions, over-the-counter medicine, supplements, and injections."
              value={medicationsText}
            />
          </label>

          <label>
            Allergies or reactions
            <textarea
              onChange={(event) => setAllergiesText(event.target.value)}
              placeholder="One per line, for example: Penicillin - rash"
              value={allergiesText}
            />
          </label>

          <div className="grid two-up">
            <label>
              Surgeries, hospitalizations, or major illnesses
              <textarea
                onChange={(event) => setSurgeryHistory(event.target.value)}
                placeholder="List surgery/illness, approximate date, and whether there were complications."
                value={surgeryHistory}
              />
            </label>
            <label>
              Anesthesia, sedation, or procedure concerns
              <textarea
                onChange={(event) => setAnesthesiaConcerns(event.target.value)}
                placeholder="Reactions to anesthesia, nausea, breathing problems, difficult IV access, panic, fainting, or other procedure concerns."
                value={anesthesiaConcerns}
              />
            </label>
          </div>

          <div className="grid two-up">
            <label>
              Bleeding or healing concerns
              <textarea
                onChange={(event) => setBleedingConcerns(event.target.value)}
                placeholder="Blood thinners, easy bruising, bleeding disorders, delayed healing, immune suppression, or recent infections."
                value={bleedingConcerns}
              />
            </label>
            <label>
              Current symptoms or recent health changes
              <textarea
                onChange={(event) => setRecentChanges(event.target.value)}
                placeholder="Chest pain, shortness of breath, fever, infection, new pain, dizziness, swelling, recent diagnosis, or medication changes."
                value={recentChanges}
              />
            </label>
          </div>

          <div className="grid two-up">
            <label>
              Doctors, specialists, or care team members
              <textarea
                onChange={(event) => setCareTeam(event.target.value)}
                placeholder="Primary care provider, cardiologist, endocrinologist, oncologist, psychiatrist, surgeon, or anyone managing a condition."
                value={careTeam}
              />
            </label>
            <label>
              Mobility, communication, or accessibility needs
              <textarea
                onChange={(event) => setAccessibilityNeeds(event.target.value)}
                placeholder="Wheelchair/walker use, hearing or vision needs, interpreter needs, anxiety accommodations, caregiver support, or transportation concerns."
                value={accessibilityNeeds}
              />
            </label>
          </div>

          <div className="grid two-up">
            <label>
              Pregnancy or nursing
              <select onChange={(event) => setPregnancyStatus(event.target.value)} value={pregnancyStatus}>
                <option value="">Select if applicable</option>
                <option value="Not applicable">Not applicable</option>
                <option value="Pregnant">Pregnant</option>
                <option value="Possibly pregnant">Possibly pregnant</option>
                <option value="Nursing">Nursing</option>
                <option value="Prefer to discuss privately">Prefer to discuss privately</option>
              </select>
            </label>
          </div>

          <label>
            Anything else your care team should know before your visit?
            <textarea
              onChange={(event) => setMedicalNotes(event.target.value)}
              placeholder="Anything not covered above, including goals, concerns, privacy preferences, or information you want reviewed before the visit."
              value={medicalNotes}
            />
          </label>

          <div className="grid two-up">
            <label>
              Insurance provider
              <input onChange={(event) => setInsuranceProvider(event.target.value)} value={insuranceProvider} />
            </label>
            <label>
              Insurance member ID
              <input onChange={(event) => setInsuranceMemberId(event.target.value)} value={insuranceMemberId} />
            </label>
            <label>
              Group number
              <input onChange={(event) => setInsuranceGroupNumber(event.target.value)} value={insuranceGroupNumber} />
            </label>
            <label>
              Subscriber name
              <input onChange={(event) => setSubscriberName(event.target.value)} value={subscriberName} />
            </label>
          </div>

          <div className="grid three-up">
            <label>
              Emergency contact
              <input onChange={(event) => setEmergencyName(event.target.value)} value={emergencyName} />
            </label>
            <label>
              Relationship
              <input onChange={(event) => setEmergencyRelationship(event.target.value)} value={emergencyRelationship} />
            </label>
            <label>
              Emergency phone
              <input onChange={(event) => setEmergencyPhone(event.target.value)} value={emergencyPhone} />
            </label>
          </div>
        </div>

        <div className="form-footer">
          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Creating account..." : "Create patient account"}
          </button>
          <Link className="secondary-button" href={email ? `/login?email=${encodeURIComponent(email)}` : "/login"}>
            I already have an account
          </Link>
          <p>After this, you will update medical history, medications, allergies, emergency contact, and insurance.</p>
        </div>

        {message ? <p className="info-text">{message}</p> : null}
      </form>

      <section className="panel patient-signup-guide">
        <p className="eyebrow">What happens next</p>
        <h2>A few minutes now saves time at check-in.</h2>
        <div className="dialogue-list">
          <div className="dialogue-card">
            <h4>1. Create your account</h4>
            <p>Create an account anytime. If your office sent an invite, use that same email so ClearPath can connect your profile to the office.</p>
          </div>
          <div className="dialogue-card">
            <h4>2. Update your health profile</h4>
            <p>Add medical conditions, medications, allergies, emergency contact, and insurance.</p>
          </div>
          <div className="dialogue-card">
            <h4>3. Save before your visit</h4>
            <p>Your office can review the saved profile before or during check-in.</p>
          </div>
        </div>
      </section>
    </section>
  );
}

type SignupVaultDraftInput = {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  conditionsText: string;
  selectedHistoryFlags: string[];
  surgeryHistory: string;
  anesthesiaConcerns: string;
  bleedingConcerns: string;
  recentChanges: string;
  careTeam: string;
  accessibilityNeeds: string;
  pregnancyStatus: string;
  medicalNotes: string;
  medicationsText: string;
  allergiesText: string;
  insuranceProvider: string;
  insuranceMemberId: string;
  insuranceGroupNumber: string;
  subscriberName: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
};

function buildSignupVaultDraft(input: SignupVaultDraftInput) {
  return {
    ...emptyVault,
    profileId: `vault-${crypto.randomUUID()}`,
    fullName: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    dateOfBirth: input.dateOfBirth,
    memberId: createMemberId("CP"),
    walletCode: createMemberId("WAL"),
    lastUpdatedAt: new Date().toISOString(),
    medicalConditions: [
      ...input.selectedHistoryFlags.map((name) => ({
        id: crypto.randomUUID(),
        name,
        notes: "Selected during guided account setup."
      })),
      ...splitLines(input.conditionsText).map((line) => ({
        id: crypto.randomUUID(),
        name: line,
        notes: "Added during account setup."
      })),
      ...makeNarrativeConditionEntries(input)
    ],
    medications: splitLines(input.medicationsText).map((line) => ({
      id: crypto.randomUUID(),
      name: line,
      dose: "",
      frequency: ""
    })),
    allergies: splitLines(input.allergiesText).map((line) => {
      const [allergen, reaction] = line.split(" - ");
      return {
        id: crypto.randomUUID(),
        allergen: allergen?.trim() || line,
        reaction: reaction?.trim() || "",
        severity: "moderate" as const
      };
    }),
    insurance: {
      providerName: input.insuranceProvider.trim(),
      memberId: input.insuranceMemberId.trim(),
      groupNumber: input.insuranceGroupNumber.trim(),
      subscriberName: input.subscriberName.trim()
    },
    emergencyContact: {
      name: input.emergencyName.trim(),
      relationship: input.emergencyRelationship.trim(),
      phone: input.emergencyPhone.trim()
    }
  };
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function makeNarrativeConditionEntries(input: SignupVaultDraftInput) {
  return [
    ["Surgery / hospitalization history", input.surgeryHistory],
    ["Anesthesia or sedation history", input.anesthesiaConcerns],
    ["Bleeding or healing concerns", input.bleedingConcerns],
    ["Current symptoms or recent changes", input.recentChanges],
    ["Specialists and care team", input.careTeam],
    ["Functional or accessibility needs", input.accessibilityNeeds],
    ["Pregnancy or nursing status", input.pregnancyStatus],
    ["Additional pre-visit notes", input.medicalNotes]
  ]
    .filter(([, notes]) => notes.trim())
    .map(([name, notes]) => ({
      id: crypto.randomUUID(),
      name,
      notes: notes.trim()
    }));
}

function toggleHistoryFlag(
  option: string,
  setSelectedHistoryFlags: Dispatch<SetStateAction<string[]>>
) {
  setSelectedHistoryFlags((current) =>
    current.includes(option)
      ? current.filter((item) => item !== option)
      : [...current, option]
  );
}

const historyFlagOptions = [
  "No known major medical conditions",
  "High blood pressure",
  "High cholesterol",
  "Heart disease, chest pain, or heart attack",
  "Heart murmur or valve problem",
  "Pacemaker, defibrillator, or implanted heart device",
  "Congestive heart failure",
  "Irregular heartbeat or atrial fibrillation",
  "Stroke or TIA",
  "Blood clot, DVT, or pulmonary embolism",
  "Bleeding disorder or easy bruising",
  "Blood thinner or antiplatelet medication use",
  "Anemia or blood disorder",
  "Diabetes or prediabetes",
  "Thyroid disease",
  "Adrenal or hormone disorder",
  "Asthma",
  "COPD, emphysema, or chronic bronchitis",
  "Sleep apnea",
  "Tuberculosis or chronic lung infection",
  "Seizures or epilepsy",
  "Migraine or chronic headaches",
  "Parkinson's disease, multiple sclerosis, or movement disorder",
  "Memory loss, dementia, or cognitive concerns",
  "Fainting, dizziness, or falls",
  "Kidney disease",
  "Dialysis or kidney transplant history",
  "Liver disease or hepatitis",
  "Stomach ulcers, reflux, or digestive disease",
  "Inflammatory bowel disease",
  "Cancer history",
  "Chemotherapy, radiation, or immunotherapy",
  "Immune suppression or transplant history",
  "Autoimmune disease",
  "HIV/AIDS",
  "Chronic infection or antibiotic-resistant infection history",
  "Osteoporosis or bone density concerns",
  "Bisphosphonate, Prolia, or other bone medication use",
  "Joint replacement",
  "Implanted device, port, shunt, or hardware",
  "Chronic pain condition",
  "Arthritis or mobility limitation",
  "Anxiety, depression, PTSD, or other mental health condition",
  "Eating disorder or nutritional concern",
  "Pregnant, possibly pregnant, or nursing",
  "Latex sensitivity",
  "Medication allergy history",
  "Food, environmental, or adhesive allergy history",
  "Tobacco or nicotine use",
  "Alcohol use concern",
  "Substance use or recovery history",
  "History of anesthesia reaction",
  "Hospitalization or ER visit in the last year",
  "Specialist care or ongoing medical monitoring"
];

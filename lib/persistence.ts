import { randomUUID } from "crypto";
import {
  conditionsById,
  getPracticeOverride,
  practicesById,
  treatmentsById
} from "@/lib/clinical-catalog";
import type { AccountProfile } from "@/lib/account-directory";
import type { AnalysisResponse, IntakePayload } from "@/lib/mock-analysis";
import type { RequestActor } from "@/lib/request-auth";
import type { CheckInRecord, PatientVault, ShareLinkRecord } from "@/lib/patient-vault";
import { createAdminSupabaseClient } from "@/lib/supabase";

const storageBucket = process.env.SUPABASE_STORAGE_BUCKET || "case-files";

export type SaveResult = {
  mode: "supabase" | "mock";
  message: string;
  caseId?: string;
  overrideId?: string;
  vaultId?: string;
  checkInId?: string;
  shareLinkId?: string;
};

export async function saveCaseRecord(
  payload: IntakePayload,
  analysis: AnalysisResponse,
  files: File[]
): Promise<SaveResult> {
  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return {
      mode: "mock",
      message:
        "Supabase environment variables are not set yet. The case model is ready, but persistence is waiting on project credentials."
    };
  }

  const practice = practicesById[payload.practiceId];
  if (!practice) {
    throw new Error("Selected practice profile was not found.");
  }

  const slug = toSlug(practice.name);
  const { data: practiceRow, error: practiceError } = await supabase
    .from("practices")
    .upsert({
      slug,
      name: practice.name,
      description: practice.description,
      default_package_source: practice.defaultPackageSource,
      brand_note: practice.brandNote
    }, { onConflict: "slug" })
    .select("id")
    .single();

  if (practiceError || !practiceRow) {
    throw new Error(practiceError?.message || "Unable to save the practice record.");
  }

  const { data: patientRow, error: patientError } = await supabase
    .from("patient_identities")
    .upsert(
      {
        email: payload.patientEmail,
        full_name: payload.patientName,
        date_of_birth: payload.dateOfBirth || null
      },
      { onConflict: "email" }
    )
    .select("id")
    .single();

  if (patientError || !patientRow) {
    throw new Error(patientError?.message || "Unable to save the global patient identity.");
  }

  const { error: practicePatientError } = await supabase.from("practice_patients").upsert(
    {
      practice_id: practiceRow.id,
      patient_identity_id: patientRow.id,
      local_chart_label: payload.patientName
    },
    { onConflict: "practice_id,patient_identity_id" }
  );

  if (practicePatientError) {
    throw new Error(practicePatientError.message);
  }

  const { data: localPatientRow, error: localPatientError } = await supabase
    .from("patients")
    .upsert(
      {
        practice_id: practiceRow.id,
        patient_identity_id: patientRow.id,
        full_name: payload.patientName,
        email: payload.patientEmail || null,
        date_of_birth: payload.dateOfBirth || null
      },
      { onConflict: "practice_id,email" }
    )
    .select("id")
    .single();

  if (localPatientError || !localPatientRow) {
    throw new Error(localPatientError?.message || "Unable to save the patient record.");
  }

  const packageVersionId = analysis.packageVersionId || randomUUID();
  const override = getPracticeOverride(payload.practiceId, payload.diagnosisId);
  const diagnosis = conditionsById[payload.diagnosisId];

  const { data: caseRow, error: caseError } = await supabase
    .from("cases")
    .insert({
      practice_id: practiceRow.id,
      patient_id: localPatientRow.id,
      specialty_id: diagnosis?.specialtyId || "unspecified",
      provider_label: payload.providerLabel || null,
      diagnosis_id: payload.diagnosisId,
      tooth_label: payload.toothLabel || null,
      package_source: analysis.packageSource,
      package_version_id: packageVersionId,
      package_snapshot: analysis,
      imaging_count: files.length
    })
    .select("id")
    .single();

  if (caseError || !caseRow) {
    throw new Error(caseError?.message || "Unable to save the case record.");
  }

  const optionRows = payload.selectedTreatmentIds.map((treatmentId) => ({
    case_id: caseRow.id,
    treatment_option_id: treatmentId,
    option_group: treatmentsById[treatmentId]?.optionGroup || null,
    is_presented_as_equal: analysis.fairnessNote.toLowerCase().includes("equal")
  }));

  const { error: optionError } = await supabase
    .from("case_treatment_options")
    .insert(optionRows);

  if (optionError) {
    throw new Error(optionError.message);
  }

  const { error: packageError } = await supabase.from("education_packages").insert({
    case_id: caseRow.id,
    diagnosis_id: payload.diagnosisId,
    treatment_option_ids: payload.selectedTreatmentIds,
    package_source: analysis.packageSource,
    package_snapshot: analysis
  });

  if (packageError) {
    throw new Error(packageError.message);
  }

  for (const file of files) {
    const path = `${caseRow.id}/${Date.now()}-${sanitizeFileName(file.name)}`;
    const upload = await supabase.storage.from(storageBucket).upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false
    });

    if (upload.error) {
      throw new Error(upload.error.message);
    }

    const { error: fileRowError } = await supabase.from("case_files").insert({
      case_id: caseRow.id,
      storage_bucket: storageBucket,
      storage_path: path,
      original_name: file.name,
      mime_type: file.type || null,
      size_bytes: file.size
    });

    if (fileRowError) {
      throw new Error(fileRowError.message);
    }
  }

  return {
    mode: "supabase",
    caseId: caseRow.id,
    message: override
      ? "Case, selected options, package snapshot, and files were saved with the practice-specific default."
      : "Case, selected options, package snapshot, and files were saved with the generic library default."
  };
}

export async function savePracticeOverrideRecord(input: {
  practiceId: string;
  diagnosisId: string;
  infoPageTitle: string;
  infoPageIntro: string;
  consentIntro: string;
  preferredMediaAssetIds: string[];
}): Promise<SaveResult> {
  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return {
      mode: "mock",
      message:
        "Supabase environment variables are not set yet. The override editor is ready, but it cannot persist until credentials are configured."
    };
  }

  const practice = practicesById[input.practiceId];
  if (!practice) {
    throw new Error("Selected practice profile was not found.");
  }

  const slug = toSlug(practice.name);
  const { data: practiceRow, error: practiceError } = await supabase
    .from("practices")
    .upsert({
      slug,
      name: practice.name,
      description: practice.description,
      default_package_source: "custom",
      brand_note: practice.brandNote
    }, { onConflict: "slug" })
    .select("id")
    .single();

  if (practiceError || !practiceRow) {
    throw new Error(practiceError?.message || "Unable to save the practice record.");
  }

  const { data, error } = await supabase
    .from("practice_overrides")
    .upsert(
      {
        practice_id: practiceRow.id,
        diagnosis_id: input.diagnosisId,
        info_page_title: input.infoPageTitle,
        info_page_intro: input.infoPageIntro,
        consent_intro: input.consentIntro,
        preferred_media_asset_ids: input.preferredMediaAssetIds
      },
      { onConflict: "practice_id,diagnosis_id" }
    )
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Unable to save the practice override.");
  }

  return {
    mode: "supabase",
    overrideId: data.id,
    message: "The practice-specific info page and consent defaults were saved."
  };
}

export async function savePatientVaultRecord(vault: PatientVault): Promise<SaveResult> {
  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return {
      mode: "mock",
      message:
        "Supabase environment variables are not set yet. The patient vault is working locally, but server persistence is waiting on project credentials."
    };
  }

  if (!vault.email || !vault.fullName) {
    throw new Error("Patient vault requires at least a full name and email.");
  }

  const { data: identityRow, error: identityError } = await supabase
    .from("patient_identities")
    .upsert(
      {
        email: vault.email,
        full_name: vault.fullName,
        date_of_birth: vault.dateOfBirth || null
      },
      { onConflict: "email" }
    )
    .select("id")
    .single();

  if (identityError || !identityRow) {
    throw new Error(identityError?.message || "Unable to save the patient identity.");
  }

  const { data: vaultRow, error: vaultError } = await supabase
    .from("patient_vaults")
    .upsert(
      {
        patient_identity_id: identityRow.id,
        phone: vault.phone || null,
        member_id: vault.memberId || null,
        wallet_code: vault.walletCode || null,
        insurance_snapshot: vault.insurance,
        conditions_snapshot: vault.medicalConditions,
        medications_snapshot: vault.medications,
        allergies_snapshot: vault.allergies,
        clearances_snapshot: vault.clearanceDocuments,
        emergency_contact_snapshot: vault.emergencyContact,
        emergency_disclosure_snapshot: vault.emergencyDisclosure
      },
      { onConflict: "patient_identity_id" }
    )
    .select("id")
    .single();

  if (vaultError || !vaultRow) {
    throw new Error(vaultError?.message || "Unable to save the patient vault.");
  }

  return {
    mode: "supabase",
    vaultId: vaultRow.id,
    message: "Patient vault saved to Supabase."
  };
}

export async function getPatientVaultRecord(email: string) {
  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return { mode: "mock" as const, vault: null };
  }

  const { data: identityRow, error: identityError } = await supabase
    .from("patient_identities")
    .select("id, full_name, email, date_of_birth")
    .eq("email", email)
    .maybeSingle();

  if (identityError) {
    throw new Error(identityError.message);
  }

  if (!identityRow) {
    return { mode: "supabase" as const, vault: null };
  }

  const { data: vaultRow, error: vaultError } = await supabase
    .from("patient_vaults")
    .select("*")
    .eq("patient_identity_id", identityRow.id)
    .maybeSingle();

  if (vaultError) {
    throw new Error(vaultError.message);
  }

  if (!vaultRow) {
    return { mode: "supabase" as const, vault: null };
  }

  const vault: PatientVault = {
    profileId: identityRow.id,
    fullName: identityRow.full_name,
    email: identityRow.email,
    phone: vaultRow.phone || "",
    dateOfBirth: identityRow.date_of_birth || "",
    memberId: vaultRow.member_id || "",
    walletCode: vaultRow.wallet_code || "",
    lastUpdatedAt: vaultRow.updated_at || "",
    medicalConditions: (vaultRow.conditions_snapshot as PatientVault["medicalConditions"]) || [],
    medications: (vaultRow.medications_snapshot as PatientVault["medications"]) || [],
    allergies: (vaultRow.allergies_snapshot as PatientVault["allergies"]) || [],
    clearanceDocuments:
      (vaultRow.clearances_snapshot as PatientVault["clearanceDocuments"]) || [],
    insurance: (vaultRow.insurance_snapshot as PatientVault["insurance"]) || {
      providerName: "",
      memberId: "",
      groupNumber: "",
      subscriberName: ""
    },
    emergencyContact:
      (vaultRow.emergency_contact_snapshot as PatientVault["emergencyContact"]) || {
        name: "",
        relationship: "",
        phone: ""
      },
    emergencyDisclosure:
      (vaultRow.emergency_disclosure_snapshot as PatientVault["emergencyDisclosure"]) || {
        enabled: true,
        showAllergies: true,
        showConditions: true,
        showMedications: true,
        showEmergencyContact: true,
        showBloodThinners: true,
        responderMessage: ""
      },
    officeConnections: []
  };

  return { mode: "supabase" as const, vault };
}

export async function saveOfficeCheckInRecord(
  input: CheckInRecord & { createdByUserId?: string | null }
): Promise<SaveResult> {
  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return {
      mode: "mock",
      message:
        "Supabase environment variables are not set yet. The office check-in is working locally, but server persistence is waiting on project credentials."
    };
  }

  const practice = practicesById[input.practiceId];
  if (!practice) {
    throw new Error("Selected practice was not found.");
  }

  const slug = toSlug(practice.name);
  const { data: practiceRow, error: practiceError } = await supabase
    .from("practices")
    .upsert(
      {
        slug,
        name: practice.name,
        description: practice.description,
        default_package_source: practice.defaultPackageSource,
        brand_note: practice.brandNote
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (practiceError || !practiceRow) {
    throw new Error(practiceError?.message || "Unable to save the practice record.");
  }

  const { data: identityRow } = await supabase
    .from("patient_identities")
    .select("id")
    .eq("email", input.patientEmail)
    .maybeSingle();

  const { data: checkInRow, error: checkInError } = await supabase
    .from("office_check_ins")
    .insert({
      practice_id: practiceRow.id,
      patient_identity_id: identityRow?.id ?? null,
      patient_email: input.patientEmail,
      member_id: input.memberId || null,
      status: input.status,
      insurance_confirmed: input.insuranceConfirmed,
      history_confirmed: input.historyConfirmed,
      medication_confirmed: input.medicationConfirmed,
      notes: input.notes || null,
      created_by_user_id: input.createdByUserId || null
    })
    .select("id")
    .single();

  if (checkInError || !checkInRow) {
    throw new Error(checkInError?.message || "Unable to save the office check-in.");
  }

  if (identityRow?.id) {
    await supabase.from("practice_patients").upsert(
      {
        practice_id: practiceRow.id,
        patient_identity_id: identityRow.id,
        local_chart_label: input.patientEmail
      },
      { onConflict: "practice_id,patient_identity_id" }
    );
  }

  return {
    mode: "supabase",
    checkInId: checkInRow.id,
    message: "Office check-in saved to Supabase."
  };
}

export async function getOfficeCheckInRecords(input: {
  patientEmail?: string;
  practiceId?: string;
}) {
  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return {
      mode: "mock" as const,
      records: [] as CheckInRecord[]
    };
  }

  let query = supabase
    .from("office_check_ins")
    .select("id, patient_email, member_id, status, insurance_confirmed, history_confirmed, medication_confirmed, notes, created_at, practices(name, slug)");

  if (input.patientEmail) {
    query = query.eq("patient_email", input.patientEmail);
  }

  if (input.practiceId) {
    const practice = practicesById[input.practiceId];
    if (practice) {
      const slug = toSlug(practice.name);
      const { data: practiceRow } = await supabase
        .from("practices")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (practiceRow?.id) {
        query = query.eq("practice_id", practiceRow.id);
      }
    }
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const records: CheckInRecord[] =
    data?.map((row) => ({
      id: row.id as string,
      practiceId: ((row.practices as { slug?: string } | null)?.slug as string) || "",
      practiceName: ((row.practices as { name?: string } | null)?.name as string) || "Office",
      patientEmail: row.patient_email as string,
      memberId: (row.member_id as string) || "",
      verifiedAt: row.created_at as string,
      status: row.status as CheckInRecord["status"],
      insuranceConfirmed: Boolean(row.insurance_confirmed),
      historyConfirmed: Boolean(row.history_confirmed),
      medicationConfirmed: Boolean(row.medication_confirmed),
      notes: (row.notes as string) || ""
    })) || [];

  return {
    mode: "supabase" as const,
    records
  };
}

export async function saveAppUserProfileRecord(input: {
  authUserId: string;
  practiceId: string;
  name: string;
  email: string;
  role: AccountProfile["role"];
  title: string;
  phone: string;
  bio: string;
  avatarColor: string;
  avatarDataUrl?: string;
}) {
  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return {
      mode: "mock" as const,
      profile: null
    };
  }

  const practice = practicesById[input.practiceId];
  if (!practice) {
    throw new Error("Selected practice was not found.");
  }

  const slug = toSlug(practice.name);
  const { data: practiceRow, error: practiceError } = await supabase
    .from("practices")
    .upsert(
      {
        slug,
        name: practice.name,
        description: practice.description,
        default_package_source: practice.defaultPackageSource,
        brand_note: practice.brandNote
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (practiceError || !practiceRow) {
    throw new Error(practiceError?.message || "Unable to save the practice record.");
  }

  const { data: profileRow, error: profileError } = await supabase
    .from("app_users")
    .upsert(
      {
        auth_user_id: input.authUserId,
        practice_id: practiceRow.id,
        full_name: input.name,
        email: input.email,
        role: input.role,
        title: input.title || null,
        phone: input.phone || null,
        bio: input.bio || null,
        avatar_url: input.avatarDataUrl || null
      },
      { onConflict: "email" }
    )
    .select("id, practice_id, full_name, email, role, title, phone, bio, avatar_url, auth_user_id, practices(slug)")
    .single();

  if (profileError || !profileRow) {
    throw new Error(profileError?.message || "Unable to save the office profile.");
  }

  const profile: AccountProfile = {
    id: profileRow.id,
    practiceId: ((profileRow.practices as { slug?: string } | null)?.slug as string) || input.practiceId,
    name: profileRow.full_name,
    email: profileRow.email,
    password: "",
    role: profileRow.role as AccountProfile["role"],
    title: profileRow.title || "Office team member",
    phone: profileRow.phone || "",
    avatarColor: input.avatarColor,
    bio: profileRow.bio || "",
    avatarDataUrl: profileRow.avatar_url || undefined
  };

  return {
    mode: "supabase" as const,
    profile
  };
}

export async function getAppUserProfileRecord(input: {
  authUserId?: string;
  email?: string;
}) {
  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return {
      mode: "mock" as const,
      profile: null
    };
  }

  let query = supabase
    .from("app_users")
    .select("id, practice_id, full_name, email, role, title, phone, bio, avatar_url, auth_user_id, practices(slug)");

  if (input.authUserId) {
    query = query.eq("auth_user_id", input.authUserId);
  } else if (input.email) {
    query = query.eq("email", input.email);
  } else {
    throw new Error("authUserId or email is required.");
  }

  const { data: profileRow, error: profileError } = await query.maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (!profileRow) {
    return {
      mode: "supabase" as const,
      profile: null
    };
  }

  const profile: AccountProfile = {
    id: profileRow.id,
    practiceId: ((profileRow.practices as { slug?: string } | null)?.slug as string) || "clearpath-default",
    name: profileRow.full_name,
    email: profileRow.email,
    password: "",
    role: profileRow.role as AccountProfile["role"],
    title: profileRow.title || "Office team member",
    phone: profileRow.phone || "",
    avatarColor: "#0f766e",
    bio: profileRow.bio || "",
    avatarDataUrl: profileRow.avatar_url || undefined
  };

  return {
    mode: "supabase" as const,
    profile
  };
}

export async function getPracticeProfilesRecord(practiceId: string) {
  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return {
      mode: "mock" as const,
      profiles: [] as AccountProfile[]
    };
  }

  const practice = practicesById[practiceId];
  if (!practice) {
    throw new Error("Selected practice was not found.");
  }

  const slug = toSlug(practice.name);
  const { data: rows, error } = await supabase
    .from("app_users")
    .select("id, full_name, email, role, title, phone, bio, avatar_url, practices!inner(slug)")
    .eq("practices.slug", slug);

  if (error) {
    throw new Error(error.message);
  }

  const profiles: AccountProfile[] =
    rows?.map((row) => ({
      id: row.id as string,
      practiceId: ((row.practices as { slug?: string } | null)?.slug as string) || practiceId,
      name: row.full_name as string,
      email: row.email as string,
      password: "",
      role: row.role as AccountProfile["role"],
      title: (row.title as string) || "Office team member",
      phone: (row.phone as string) || "",
      avatarColor: "#0f766e",
      bio: (row.bio as string) || "",
      avatarDataUrl: (row.avatar_url as string) || undefined
    })) || [];

  return {
    mode: "supabase" as const,
    profiles
  };
}

export async function createPatientShareLinkRecord(input: {
  patientEmail: string;
  practiceId: string;
  expiresAt: string;
}): Promise<SaveResult & { shareLink?: ShareLinkRecord }> {
  const supabase = createAdminSupabaseClient();
  const practice = practicesById[input.practiceId];
  const accessCode = `CP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  if (!practice) {
    throw new Error("Selected practice was not found.");
  }

  if (!supabase) {
    return {
      mode: "mock",
      shareLink: {
        id: randomUUID(),
        patientEmail: input.patientEmail,
        practiceId: input.practiceId,
        practiceName: practice.name,
        accessCode,
        status: "active",
        createdAt: new Date().toISOString(),
        expiresAt: input.expiresAt
      },
      message:
        "Share link created locally. Supabase credentials are still needed for server-backed delivery."
    };
  }

  const { data: identityRow, error: identityError } = await supabase
    .from("patient_identities")
    .select("id")
    .eq("email", input.patientEmail)
    .maybeSingle();

  if (identityError || !identityRow) {
    throw new Error(identityError?.message || "Patient identity was not found for this email.");
  }

  const slug = toSlug(practice.name);
  const { data: practiceRow, error: practiceError } = await supabase
    .from("practices")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (practiceError || !practiceRow) {
    throw new Error(practiceError?.message || "Practice record was not found.");
  }

  const { data: linkRow, error: linkError } = await supabase
    .from("patient_share_links")
    .insert({
      patient_identity_id: identityRow.id,
      practice_id: practiceRow.id,
      access_code: accessCode,
      expires_at: input.expiresAt,
      status: "active"
    })
    .select("id, access_code, expires_at, status, created_at")
    .single();

  if (linkError || !linkRow) {
    throw new Error(linkError?.message || "Unable to create the patient share link.");
  }

  return {
    mode: "supabase",
    shareLinkId: linkRow.id,
    shareLink: {
      id: linkRow.id as string,
      patientEmail: input.patientEmail,
      practiceId: input.practiceId,
      practiceName: practice.name,
      accessCode: linkRow.access_code as string,
      status: linkRow.status as ShareLinkRecord["status"],
      createdAt: linkRow.created_at as string,
      expiresAt: linkRow.expires_at as string
    },
    message: "Patient share link created in Supabase."
  };
}

export async function getPatientShareLinksRecord(input: {
  patientEmail?: string;
  practiceId?: string;
  accessCode?: string;
}) {
  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return {
      mode: "mock" as const,
      shareLinks: [] as ShareLinkRecord[]
    };
  }

  let patientIdentityId: string | null = null;
  if (input.patientEmail) {
    const { data: identityRow } = await supabase
      .from("patient_identities")
      .select("id")
      .eq("email", input.patientEmail)
      .maybeSingle();
    patientIdentityId = identityRow?.id ?? null;
  }

  let query = supabase
    .from("patient_share_links")
    .select("id, access_code, expires_at, status, created_at, patient_identities(email), practices(name, slug)");

  if (patientIdentityId) {
    query = query.eq("patient_identity_id", patientIdentityId);
  }

  if (input.practiceId) {
    const practice = practicesById[input.practiceId];
    if (practice) {
      const slug = toSlug(practice.name);
      const { data: practiceRow } = await supabase
        .from("practices")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (practiceRow?.id) {
        query = query.eq("practice_id", practiceRow.id);
      }
    }
  }

  if (input.accessCode) {
    query = query.eq("access_code", input.accessCode);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) {
    throw new Error(error.message);
  }

  const shareLinks: ShareLinkRecord[] =
    data?.map((row) => ({
      id: row.id as string,
      patientEmail: ((row.patient_identities as { email?: string } | null)?.email as string) || "",
      practiceId: ((row.practices as { slug?: string } | null)?.slug as string) || "",
      practiceName: ((row.practices as { name?: string } | null)?.name as string) || "Office",
      accessCode: row.access_code as string,
      status: row.status as ShareLinkRecord["status"],
      createdAt: row.created_at as string,
      expiresAt: row.expires_at as string
    })) || [];

  return {
    mode: "supabase" as const,
    shareLinks
  };
}

export async function createCaseFileSignedAccess(input: {
  fileId: string;
  actor: RequestActor;
  expiresIn?: number;
}) {
  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return {
      mode: "mock" as const,
      signedUrl: null
    };
  }

  const { data: fileRow, error: fileError } = await supabase
    .from("case_files")
    .select("id, case_id, storage_bucket, storage_path, original_name, cases!inner(practice_id, patient_id)")
    .eq("id", input.fileId)
    .maybeSingle();

  if (fileError) {
    throw new Error(fileError.message);
  }

  if (!fileRow) {
    throw new Error("Requested file was not found.");
  }

  const casePracticeId = (fileRow.cases as { practice_id?: string } | null)?.practice_id ?? null;
  if (!input.actor.practiceId || input.actor.practiceId !== casePracticeId) {
    throw new Error("You do not have access to this file.");
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from(fileRow.storage_bucket as string)
    .createSignedUrl(fileRow.storage_path as string, input.expiresIn ?? 120);

  if (signedError || !signed?.signedUrl) {
    throw new Error(signedError?.message || "Unable to generate a signed URL.");
  }

  await logAuditEvent({
    actor: input.actor,
    action: "case_file_accessed",
    resourceType: "case_file",
    resourceId: input.fileId,
    practiceId: casePracticeId,
    metadata: {
      caseId: fileRow.case_id,
      originalName: fileRow.original_name
    }
  });

  return {
    mode: "supabase" as const,
    signedUrl: signed.signedUrl,
    originalName: fileRow.original_name as string
  };
}

export async function logAuditEvent(input: {
  actor?: RequestActor | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  practiceId?: string | null;
  patientIdentityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return;
  }

  await supabase.from("audit_logs").insert({
    actor_auth_user_id: input.actor?.authUserId ?? null,
    actor_email: input.actor?.email ?? null,
    actor_role: input.actor?.role ?? null,
    actor_app_user_id: input.actor?.appUserId ?? null,
    practice_id: input.practiceId ?? input.actor?.practiceId ?? null,
    patient_identity_id: input.patientIdentityId ?? null,
    action: input.action,
    resource_type: input.resourceType,
    resource_id: input.resourceId ?? null,
    metadata: input.metadata ?? {}
  });
}

function toSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-");
}

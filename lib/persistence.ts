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
import { createMemberId, type CheckInRecord, type PatientVault, type ShareLinkRecord } from "@/lib/patient-vault";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { decryptJsonField, decryptTextField, encryptJsonField, encryptTextField } from "@/lib/field-encryption";

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
  contentId: string;
  contentType: "diagnosis" | "treatment";
  infoPageTitle: string;
  infoPageIntro: string;
  consentIntro: string;
  preferredMediaAssetIds: string[];
  generalAssetIds: string[];
  designConfig: Record<string, unknown>;
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
        diagnosis_id: `${input.contentType}:${input.contentId}`,
        info_page_title: input.infoPageTitle,
        info_page_intro: input.infoPageIntro,
        consent_intro: input.consentIntro,
        preferred_media_asset_ids: input.preferredMediaAssetIds,
        general_asset_ids: input.generalAssetIds,
        design_config: input.designConfig
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
    message: "A practice-specific copy of this patient page was saved and is now the default for this practice."
  };
}

export async function deletePracticeOverrideRecord(input: {
  practiceId: string;
  contentId: string;
  contentType: "diagnosis" | "treatment";
}): Promise<SaveResult> {
  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return {
      mode: "mock",
      message:
        "Supabase environment variables are not set yet. The page reset flow is ready, but it cannot remove practice copies until credentials are configured."
    };
  }

  const practice = practicesById[input.practiceId];
  if (!practice) {
    throw new Error("Selected practice profile was not found.");
  }

  const slug = toSlug(practice.name);
  const { data: practiceRow, error: practiceError } = await supabase
    .from("practices")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (practiceError) {
    throw new Error(practiceError.message);
  }

  if (!practiceRow) {
    return {
      mode: "supabase",
      message: "This page is already using the shared library default for this practice."
    };
  }

  const key = `${input.contentType}:${input.contentId}`;
  const { error } = await supabase
    .from("practice_overrides")
    .delete()
    .eq("practice_id", practiceRow.id)
    .eq("diagnosis_id", key);

  if (error) {
    throw new Error(error.message);
  }

  return {
    mode: "supabase",
    message: "The saved practice copy was removed. This office is now using the shared library default again."
  };
}

export async function savePatientVaultRecord(
  vault: PatientVault,
  actor?: RequestActor | null
): Promise<SaveResult> {
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
        insurance_snapshot: encryptJsonField(vault.insurance),
        conditions_snapshot: encryptJsonField(vault.medicalConditions),
        medications_snapshot: encryptJsonField(vault.medications),
        allergies_snapshot: encryptJsonField(vault.allergies),
        clearances_snapshot: encryptJsonField(vault.clearanceDocuments),
        emergency_contact_snapshot: encryptJsonField(vault.emergencyContact),
        emergency_disclosure_snapshot: encryptJsonField(vault.emergencyDisclosure),
        office_connections_snapshot: encryptJsonField(vault.officeConnections)
      },
      { onConflict: "patient_identity_id" }
    )
    .select("id")
    .single();

  if (vaultError || !vaultRow) {
    throw new Error(vaultError?.message || "Unable to save the patient vault.");
  }

  await logAuditEvent({
    actor,
    action: "patient_vault_updated",
    resourceType: "patient_vault",
    resourceId: vaultRow.id,
    patientIdentityId: identityRow.id,
    metadata: {
      hasInsurance: Boolean(vault.insurance.providerName || vault.insurance.memberId),
      conditionCount: vault.medicalConditions.length,
      medicationCount: vault.medications.length,
      allergyCount: vault.allergies.length,
      hasEmergencyContact: Boolean(vault.emergencyContact.name || vault.emergencyContact.phone)
    }
  });

  return {
    mode: "supabase",
    vaultId: vaultRow.id,
    message: "Patient vault saved to Supabase."
  };
}

export async function getPatientVaultRecord(email: string, actor?: RequestActor | null) {
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
    medicalConditions: decryptJsonField<PatientVault["medicalConditions"]>(vaultRow.conditions_snapshot, []),
    medications: decryptJsonField<PatientVault["medications"]>(vaultRow.medications_snapshot, []),
    allergies: decryptJsonField<PatientVault["allergies"]>(vaultRow.allergies_snapshot, []),
    clearanceDocuments:
      decryptJsonField<PatientVault["clearanceDocuments"]>(vaultRow.clearances_snapshot, []),
    insurance: decryptJsonField<PatientVault["insurance"]>(vaultRow.insurance_snapshot, {
      providerName: "",
      memberId: "",
      groupNumber: "",
      subscriberName: ""
    }),
    emergencyContact:
      decryptJsonField<PatientVault["emergencyContact"]>(vaultRow.emergency_contact_snapshot, {
        name: "",
        relationship: "",
        phone: ""
      }),
    emergencyDisclosure:
      decryptJsonField<PatientVault["emergencyDisclosure"]>(vaultRow.emergency_disclosure_snapshot, {
        enabled: true,
        showAllergies: true,
        showConditions: true,
        showMedications: true,
        showEmergencyContact: true,
        showBloodThinners: true,
        responderMessage: ""
      }),
    officeConnections: decryptJsonField<PatientVault["officeConnections"]>(vaultRow.office_connections_snapshot, [])
  };

  await logAuditEvent({
    actor,
    action: "patient_vault_read",
    resourceType: "patient_vault",
    resourceId: vaultRow.id,
    patientIdentityId: identityRow.id
  });

  return { mode: "supabase" as const, vault };
}

export async function getPracticePatientVaultRecords(practiceId: string, actor?: RequestActor | null) {
  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return {
      mode: "mock" as const,
      patients: [] as PatientVault[]
    };
  }

  const practice = practicesById[practiceId];
  if (!practice) {
    throw new Error("Selected practice was not found.");
  }

  const slug = toSlug(practice.name);
  const { data: practiceRow, error: practiceError } = await supabase
    .from("practices")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (practiceError) {
    throw new Error(practiceError.message);
  }

  if (!practiceRow?.id) {
    return {
      mode: "supabase" as const,
      patients: [] as PatientVault[]
    };
  }

  const { data: connections, error: connectionError } = await supabase
    .from("practice_patients")
    .select("patient_identity_id, local_chart_label, patient_identities(id, full_name, email, date_of_birth)")
    .eq("practice_id", practiceRow.id);

  if (connectionError) {
    throw new Error(connectionError.message);
  }

  const identities =
    connections
      ?.map((connection) => connection.patient_identities as {
        id?: string;
        full_name?: string;
        email?: string;
        date_of_birth?: string | null;
      } | null)
      .filter((identity): identity is {
        id: string;
        full_name?: string;
        email?: string;
        date_of_birth?: string | null;
      } => Boolean(identity?.id)) || [];

  if (identities.length === 0) {
    await logAuditEvent({
      actor,
      action: "practice_patient_list_read",
      resourceType: "practice_patient_list",
      resourceId: practiceRow.id,
      practiceId: practiceRow.id,
      metadata: {
        practiceSlug: practiceId,
        patientCount: 0
      }
    });

    return {
      mode: "supabase" as const,
      patients: [] as PatientVault[]
    };
  }

  const identityIds = identities.map((identity) => identity.id);
  const { data: vaultRows, error: vaultError } = await supabase
    .from("patient_vaults")
    .select("*")
    .in("patient_identity_id", identityIds);

  if (vaultError) {
    throw new Error(vaultError.message);
  }

  const vaultsByIdentityId = new Map(
    (vaultRows || []).map((vaultRow) => [vaultRow.patient_identity_id as string, vaultRow])
  );

  const patients: PatientVault[] = identities.map((identity) => {
    const vaultRow = vaultsByIdentityId.get(identity.id);

    return {
      profileId: identity.id,
      fullName: identity.full_name || "",
      email: identity.email || "",
      phone: (vaultRow?.phone as string) || "",
      dateOfBirth: identity.date_of_birth || "",
      memberId: (vaultRow?.member_id as string) || "",
      walletCode: (vaultRow?.wallet_code as string) || "",
      lastUpdatedAt: (vaultRow?.updated_at as string) || "",
      medicalConditions: decryptJsonField<PatientVault["medicalConditions"]>(vaultRow?.conditions_snapshot, []),
      medications: decryptJsonField<PatientVault["medications"]>(vaultRow?.medications_snapshot, []),
      allergies: decryptJsonField<PatientVault["allergies"]>(vaultRow?.allergies_snapshot, []),
      clearanceDocuments:
        decryptJsonField<PatientVault["clearanceDocuments"]>(vaultRow?.clearances_snapshot, []),
      insurance: decryptJsonField<PatientVault["insurance"]>(vaultRow?.insurance_snapshot, {
        providerName: "",
        memberId: "",
        groupNumber: "",
        subscriberName: ""
      }),
      emergencyContact:
        decryptJsonField<PatientVault["emergencyContact"]>(vaultRow?.emergency_contact_snapshot, {
          name: "",
          relationship: "",
          phone: ""
        }),
      emergencyDisclosure:
        decryptJsonField<PatientVault["emergencyDisclosure"]>(vaultRow?.emergency_disclosure_snapshot, {
          enabled: true,
          showAllergies: true,
          showConditions: true,
          showMedications: true,
          showEmergencyContact: true,
          showBloodThinners: true,
          responderMessage: ""
        }),
      officeConnections: decryptJsonField<PatientVault["officeConnections"]>(
        vaultRow?.office_connections_snapshot,
        []
      )
    };
  });

  await logAuditEvent({
    actor,
    action: "practice_patient_list_read",
    resourceType: "practice_patient_list",
    resourceId: practiceRow.id,
    practiceId: practiceRow.id,
    metadata: {
      practiceSlug: practiceId,
      patientCount: patients.length
    }
  });

  return {
    mode: "supabase" as const,
    patients: patients.sort((left, right) => left.fullName.localeCompare(right.fullName))
  };
}

export async function connectPracticePatientByCodeRecord(input: {
  practiceId: string;
  accessCode: string;
}, actor?: RequestActor | null): Promise<SaveResult & { patient?: PatientVault }> {
  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return {
      mode: "mock",
      message:
        "Supabase environment variables are not set yet. Patient database connections require server persistence."
    };
  }

  const practice = practicesById[input.practiceId];
  if (!practice) {
    throw new Error("Selected practice was not found.");
  }

  const normalizedCode = input.accessCode.trim().toUpperCase();
  if (!normalizedCode) {
    throw new Error("Patient access code is required.");
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
    throw new Error(practiceError?.message || "Unable to prepare the practice database.");
  }

  let patientIdentityId: string | null = null;

  const { data: vaultByCode, error: vaultLookupError } = await supabase
    .from("patient_vaults")
    .select("patient_identity_id")
    .or(`member_id.eq.${normalizedCode},wallet_code.eq.${normalizedCode}`)
    .maybeSingle();

  if (vaultLookupError) {
    throw new Error(vaultLookupError.message);
  }

  patientIdentityId = (vaultByCode?.patient_identity_id as string | undefined) ?? null;

  if (!patientIdentityId) {
    const { data: shareLinkRow, error: shareLinkError } = await supabase
      .from("patient_share_links")
      .select("patient_identity_id, status, expires_at")
      .eq("access_code", normalizedCode)
      .maybeSingle();

    if (shareLinkError) {
      throw new Error(shareLinkError.message);
    }

    if (shareLinkRow) {
      const status = shareLinkRow.status as ShareLinkRecord["status"];
      const expiresAt = new Date((shareLinkRow.expires_at as string) || "");
      if (status !== "active") {
        throw new Error("This patient access code is no longer active.");
      }
      if (!Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() < Date.now()) {
        throw new Error("This patient access code has expired.");
      }
      patientIdentityId = (shareLinkRow.patient_identity_id as string | undefined) ?? null;
    }
  }

  if (!patientIdentityId) {
    throw new Error("No patient was found for that ClearPath code.");
  }

  const { data: identityRow, error: identityError } = await supabase
    .from("patient_identities")
    .select("id, full_name, email, date_of_birth")
    .eq("id", patientIdentityId)
    .maybeSingle();

  if (identityError || !identityRow) {
    throw new Error(identityError?.message || "Unable to load the patient identity.");
  }

  const { error: practicePatientError } = await supabase.from("practice_patients").upsert(
    {
      practice_id: practiceRow.id,
      patient_identity_id: identityRow.id,
      local_chart_label: identityRow.full_name || identityRow.email
    },
    { onConflict: "practice_id,patient_identity_id" }
  );

  if (practicePatientError) {
    throw new Error(practicePatientError.message);
  }

  const { data: vaultRow, error: vaultError } = await supabase
    .from("patient_vaults")
    .select("*")
    .eq("patient_identity_id", identityRow.id)
    .maybeSingle();

  if (vaultError) {
    throw new Error(vaultError.message);
  }

  const patient = buildPatientVaultFromRows(identityRow, vaultRow);

  await logAuditEvent({
    actor,
    action: "practice_patient_connected",
    resourceType: "practice_patient",
    resourceId: practiceRow.id,
    practiceId: practiceRow.id,
    patientIdentityId: identityRow.id,
    metadata: {
      practiceSlug: input.practiceId,
      codeType: vaultByCode ? "patient-wallet-code" : "share-link-code"
    }
  });

  return {
    mode: "supabase",
    patient,
    message: `${patient.fullName || patient.email} was added to the practice patient database.`
  };
}

export async function saveOfficeCheckInRecord(
  input: CheckInRecord & { createdByUserId?: string | null },
  actor?: RequestActor | null
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
      notes: input.notes ? encryptTextField(input.notes) : null,
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

  await logAuditEvent({
    actor,
    action: "office_check_in_created",
    resourceType: "office_check_in",
    resourceId: checkInRow.id,
    practiceId: practiceRow.id,
      patientIdentityId: identityRow?.id ?? null,
      metadata: {
      status: input.status,
      insuranceConfirmed: input.insuranceConfirmed,
      historyConfirmed: input.historyConfirmed,
      medicationConfirmed: input.medicationConfirmed,
      hasNotes: Boolean(input.notes)
    }
  });

  return {
    mode: "supabase",
    checkInId: checkInRow.id,
    message: "Office check-in saved to Supabase."
  };
}

export async function getOfficeCheckInRecords(input: {
  patientEmail?: string;
  practiceId?: string;
}, actor?: RequestActor | null) {
  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return {
      mode: "mock" as const,
      records: [] as CheckInRecord[]
    };
  }

  let practiceUuid: string | null = null;
  let patientIdentityId: string | null = null;
  let query = supabase
    .from("office_check_ins")
    .select("id, patient_email, member_id, status, insurance_confirmed, history_confirmed, medication_confirmed, notes, created_at, practices(name, slug)");

  if (input.patientEmail) {
    query = query.eq("patient_email", input.patientEmail);
    const { data: identityRow } = await supabase
      .from("patient_identities")
      .select("id")
      .eq("email", input.patientEmail)
      .maybeSingle();
    patientIdentityId = identityRow?.id ?? null;
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
        practiceUuid = practiceRow.id;
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
      notes: decryptTextField(row.notes)
    })) || [];

  await logAuditEvent({
    actor,
    action: "office_check_in_history_read",
    resourceType: "office_check_in_collection",
    resourceId: practiceUuid ?? patientIdentityId,
    practiceId: practiceUuid,
    patientIdentityId,
    metadata: {
      practiceSlug: input.practiceId ?? null,
      recordCount: records.length
    }
  });

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
  patientName?: string;
  practiceId: string;
  expiresAt: string;
}, actor?: RequestActor | null): Promise<SaveResult & { shareLink?: ShareLinkRecord }> {
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

  const { data: existingIdentityRow, error: existingIdentityError } = await supabase
    .from("patient_identities")
    .select("id")
    .eq("email", input.patientEmail)
    .maybeSingle();

  if (existingIdentityError) {
    throw new Error(existingIdentityError.message);
  }

  let identityRow = existingIdentityRow;
  if (!identityRow) {
    const { data: newIdentityRow, error: newIdentityError } = await supabase
      .from("patient_identities")
      .insert({
        email: input.patientEmail,
        full_name: input.patientName?.trim() || input.patientEmail,
        date_of_birth: null
      })
      .select("id")
      .single();

    if (newIdentityError) {
      throw new Error(newIdentityError.message);
    }

    identityRow = newIdentityRow;
  }

  if (!identityRow) {
    throw new Error("Unable to prepare the patient invite.");
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

  const memberId = createMemberId("CP");
  const walletCode = createMemberId("WAL");
  const { error: vaultError } = await supabase.from("patient_vaults").upsert(
    {
      patient_identity_id: identityRow.id,
      member_id: memberId,
      wallet_code: walletCode
    },
    { onConflict: "patient_identity_id", ignoreDuplicates: true }
  );

  if (vaultError) {
    throw new Error(vaultError.message);
  }

  const { error: practicePatientError } = await supabase.from("practice_patients").upsert(
    {
      practice_id: practiceRow.id,
      patient_identity_id: identityRow.id,
      local_chart_label: input.patientName?.trim() || input.patientEmail
    },
    { onConflict: "practice_id,patient_identity_id" }
  );

  if (practicePatientError) {
    throw new Error(practicePatientError.message);
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

  await logAuditEvent({
    actor,
    action: "patient_invite_created",
    resourceType: "patient_share_link",
    resourceId: linkRow.id,
    practiceId: practiceRow.id,
    patientIdentityId: identityRow.id,
    metadata: {
      expiresAt: input.expiresAt
    }
  });

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

function buildPatientVaultFromRows(
  identityRow: {
    id: string;
    full_name?: string | null;
    email?: string | null;
    date_of_birth?: string | null;
  },
  vaultRow: Record<string, unknown> | null
): PatientVault {
  return {
    profileId: identityRow.id,
    fullName: identityRow.full_name || "",
    email: identityRow.email || "",
    phone: (vaultRow?.phone as string) || "",
    dateOfBirth: identityRow.date_of_birth || "",
    memberId: (vaultRow?.member_id as string) || "",
    walletCode: (vaultRow?.wallet_code as string) || "",
    lastUpdatedAt: (vaultRow?.updated_at as string) || "",
    medicalConditions: decryptJsonField<PatientVault["medicalConditions"]>(vaultRow?.conditions_snapshot, []),
    medications: decryptJsonField<PatientVault["medications"]>(vaultRow?.medications_snapshot, []),
    allergies: decryptJsonField<PatientVault["allergies"]>(vaultRow?.allergies_snapshot, []),
    clearanceDocuments:
      decryptJsonField<PatientVault["clearanceDocuments"]>(vaultRow?.clearances_snapshot, []),
    insurance: decryptJsonField<PatientVault["insurance"]>(vaultRow?.insurance_snapshot, {
      providerName: "",
      memberId: "",
      groupNumber: "",
      subscriberName: ""
    }),
    emergencyContact:
      decryptJsonField<PatientVault["emergencyContact"]>(vaultRow?.emergency_contact_snapshot, {
        name: "",
        relationship: "",
        phone: ""
      }),
    emergencyDisclosure:
      decryptJsonField<PatientVault["emergencyDisclosure"]>(vaultRow?.emergency_disclosure_snapshot, {
        enabled: true,
        showAllergies: true,
        showConditions: true,
        showMedications: true,
        showEmergencyContact: true,
        showBloodThinners: true,
        responderMessage: ""
      }),
    officeConnections: decryptJsonField<PatientVault["officeConnections"]>(
      vaultRow?.office_connections_snapshot,
      []
    )
  };
}

function toSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-");
}

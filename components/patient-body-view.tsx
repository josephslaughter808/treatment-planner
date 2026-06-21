"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  bodyRegionLabels,
  buildDiagnosticRecords,
  type BodyRegion,
  type DiagnosticRecord,
  type DiagnosticStatus
} from "@/lib/diagnostic-records";
import {
  patientTimelineUpdatedEvent,
  readTimelineFromStorage,
  readVaultFromStorage
} from "@/lib/patient-vault";

type DisplayMode = "body" | "list";
type BodySide = "front" | "back";

const statusLabels: Record<DiagnosticStatus, string> = {
  active: "Active",
  managed: "Managed",
  resolved: "Past or resolved"
};

export function PatientBodyView() {
  const { currentUser } = useAuth();
  const [records, setRecords] = useState<DiagnosticRecord[]>(() =>
    buildDiagnosticRecords(readVaultFromStorage(), readTimelineFromStorage())
  );
  const [displayMode, setDisplayMode] = useState<DisplayMode>("body");
  const [bodySide, setBodySide] = useState<BodySide>("front");
  const [selectedRegion, setSelectedRegion] = useState<BodyRegion>("chest");
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  useEffect(() => {
    function syncRecords() {
      const vault = readVaultFromStorage();
      const timeline = readTimelineFromStorage().filter((event) =>
        currentUser?.email
          ? event.patientEmail.toLowerCase() === currentUser.email.toLowerCase()
          : true
      );
      setRecords(buildDiagnosticRecords(vault, timeline));
    }

    syncRecords();
    window.addEventListener("storage", syncRecords);
    window.addEventListener(patientTimelineUpdatedEvent, syncRecords);
    return () => {
      window.removeEventListener("storage", syncRecords);
      window.removeEventListener(patientTimelineUpdatedEvent, syncRecords);
    };
  }, [currentUser?.email]);

  const isSampleMode = records.every((record) => record.isSample);
  const currentRecords = records.filter((record) => record.status !== "resolved");
  const resolvedRecords = records.filter((record) => record.status === "resolved");
  const activeTreatmentCount = records.flatMap((record) => record.treatments).filter(
    (treatment) => treatment.status === "active"
  ).length;
  const selectedRegionRecords = records.filter((record) => record.regions.includes(selectedRegion));
  const selectedCurrent = selectedRegionRecords.filter((record) => record.status !== "resolved");
  const selectedResolved = selectedRegionRecords.filter((record) => record.status === "resolved");
  const selectedRecord = records.find((record) => record.id === selectedRecordId) ?? null;
  const regionSummaries = useMemo(() => summarizeRecordsByRegion(records), [records]);

  function chooseRegion(region: BodyRegion) {
    setSelectedRegion(region);
    setSelectedRecordId(null);
  }

  return (
    <div className="health-map-page">
      {isSampleMode ? (
        <section className="health-map-sample-note" role="status">
          <div>
            <strong>Sample health map</strong>
            <p>These example conditions show how the feature works. They are not saved to your record.</p>
          </div>
          <Link className="secondary-button" href="/vault">
            Add my history
          </Link>
        </section>
      ) : null}

      <section className="health-snapshot-band" aria-label="Current health snapshot">
        <div className="health-snapshot-title">
          <p className="eyebrow">Current health snapshot</p>
          <h2>{currentRecords.length} conditions affecting care today</h2>
          <p>Past records stay available without crowding the current picture.</p>
        </div>
        <div className="health-snapshot-metrics">
          <div>
            <span>Current</span>
            <strong>{currentRecords.length}</strong>
          </div>
          <div>
            <span>Active treatments</span>
            <strong>{activeTreatmentCount}</strong>
          </div>
          <div>
            <span>Past or resolved</span>
            <strong>{resolvedRecords.length}</strong>
          </div>
        </div>
      </section>

      <div className="health-map-toolbar">
        <div className="segmented-control" aria-label="Health history view">
          <button
            aria-pressed={displayMode === "body"}
            className={displayMode === "body" ? "active" : ""}
            onClick={() => setDisplayMode("body")}
            type="button"
          >
            Body map
          </button>
          <button
            aria-pressed={displayMode === "list"}
            className={displayMode === "list" ? "active" : ""}
            onClick={() => setDisplayMode("list")}
            type="button"
          >
            All conditions
          </button>
        </div>
        <Link className="health-map-update-link" href="/vault">
          Update health profile
        </Link>
      </div>

      {displayMode === "body" ? (
        <section className="health-map-workspace">
          <div className="body-map-panel">
            <div className="body-map-panel-header">
              <div>
                <p className="eyebrow">Explore by location</p>
                <h2>Select a body region</h2>
              </div>
              <div className="segmented-control compact" aria-label="Body side">
                <button
                  aria-pressed={bodySide === "front"}
                  className={bodySide === "front" ? "active" : ""}
                  onClick={() => setBodySide("front")}
                  type="button"
                >
                  Front
                </button>
                <button
                  aria-pressed={bodySide === "back"}
                  className={bodySide === "back" ? "active" : ""}
                  onClick={() => setBodySide("back")}
                  type="button"
                >
                  Back
                </button>
              </div>
            </div>

            <div className="body-map-canvas">
              <BodyMapGraphic
                summaries={regionSummaries}
                onSelect={chooseRegion}
                selectedRegion={selectedRegion}
                side={bodySide}
              />
            </div>

            <button
              className={`systemic-region-button ${selectedRegion === "whole-body" ? "active" : ""}`}
              onClick={() => chooseRegion("whole-body")}
              type="button"
            >
              <span>Whole-body and systemic conditions</span>
              <strong>{regionSummaries["whole-body"]?.count ?? 0}</strong>
            </button>

            <div className="body-map-legend" aria-label="Body map legend">
              <span><i className="legend-current" /> Current condition</span>
              <span><i className="legend-past" /> Past record only</span>
              <span><i className="legend-empty" /> No condition mapped</span>
            </div>
          </div>

          <div className="region-records-panel">
            <div className="region-records-header">
              <div>
                <p className="eyebrow">Selected region</p>
                <h2>{bodyRegionLabels[selectedRegion]}</h2>
              </div>
              <span>{selectedRegionRecords.length} records</span>
            </div>

            {selectedRegionRecords.length > 0 ? (
              <>
                <ConditionSection
                  emptyText="No current conditions in this region."
                  onSelect={setSelectedRecordId}
                  records={selectedCurrent}
                  selectedRecordId={selectedRecordId}
                  title="Current"
                />
                {selectedResolved.length > 0 ? (
                  <details className="resolved-condition-group">
                    <summary>
                      <span>Past or resolved</span>
                      <strong>{selectedResolved.length}</strong>
                    </summary>
                    <ConditionCards
                      onSelect={setSelectedRecordId}
                      records={selectedResolved}
                      selectedRecordId={selectedRecordId}
                    />
                  </details>
                ) : null}
              </>
            ) : (
              <div className="health-map-empty-state">
                <strong>No conditions mapped here</strong>
                <p>Patient-reported and office-imported records associated with this region will appear here.</p>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="all-conditions-view">
          <ConditionSection
            emptyText="No current conditions saved."
            onSelect={setSelectedRecordId}
            records={currentRecords}
            selectedRecordId={selectedRecordId}
            title="Current and managed"
          />
          <details className="resolved-condition-group" open>
            <summary>
              <span>Past or resolved</span>
              <strong>{resolvedRecords.length}</strong>
            </summary>
            <ConditionCards
              onSelect={setSelectedRecordId}
              records={resolvedRecords}
              selectedRecordId={selectedRecordId}
            />
          </details>
        </section>
      )}

      {selectedRecord ? (
        <ConditionDetail record={selectedRecord} onClose={() => setSelectedRecordId(null)} />
      ) : null}
    </div>
  );
}

function ConditionSection({
  title,
  records,
  emptyText,
  selectedRecordId,
  onSelect
}: {
  title: string;
  records: DiagnosticRecord[];
  emptyText: string;
  selectedRecordId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="condition-section">
      <div className="condition-section-heading">
        <h3>{title}</h3>
        <span>{records.length}</span>
      </div>
      {records.length > 0 ? (
        <ConditionCards
          onSelect={onSelect}
          records={records}
          selectedRecordId={selectedRecordId}
        />
      ) : (
        <p className="condition-empty-copy">{emptyText}</p>
      )}
    </div>
  );
}

function ConditionCards({
  records,
  selectedRecordId,
  onSelect
}: {
  records: DiagnosticRecord[];
  selectedRecordId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="condition-card-list">
      {records.map((record) => (
        <button
          aria-pressed={selectedRecordId === record.id}
          className={`condition-summary-card ${selectedRecordId === record.id ? "selected" : ""}`}
          key={record.id}
          onClick={() => onSelect(record.id)}
          type="button"
        >
          <span className={`condition-status-dot ${record.status}`} />
          <span className="condition-summary-copy">
            <strong>{record.plainName}</strong>
            <small>{record.name !== record.plainName ? record.name : statusLabels[record.status]}</small>
            <span>{record.sourceOrganization}</span>
          </span>
          <span className="condition-card-arrow" aria-hidden="true">›</span>
        </button>
      ))}
    </div>
  );
}

function ConditionDetail({ record, onClose }: { record: DiagnosticRecord; onClose: () => void }) {
  return (
    <section className="condition-detail-panel" aria-label={`${record.plainName} details`}>
      <div className="condition-detail-header">
        <div>
          <div className="condition-detail-badges">
            <span className={`status-badge ${record.status}`}>{statusLabels[record.status]}</span>
            <span className="verification-badge">{formatVerification(record.verification)}</span>
          </div>
          <h2>{record.plainName}</h2>
          {record.name !== record.plainName ? <p className="clinical-name">Clinical name: {record.name}</p> : null}
        </div>
        <button aria-label="Close condition details" className="condition-detail-close" onClick={onClose} type="button">×</button>
      </div>

      <p className="condition-detail-summary">{record.summary}</p>

      <div className="condition-fact-grid">
        <div>
          <span>Diagnosed</span>
          <strong>{record.diagnosedAt ? formatDate(record.diagnosedAt) : "Date not recorded"}</strong>
        </div>
        <div>
          <span>Diagnosed by</span>
          <strong>{record.diagnosedBy}</strong>
        </div>
        <div>
          <span>Source</span>
          <strong>{record.sourceOrganization}</strong>
        </div>
        <div>
          <span>Last reviewed</span>
          <strong>{record.lastReviewedAt ? formatDate(record.lastReviewedAt) : "Not reviewed"}</strong>
        </div>
      </div>

      <div className="condition-treatment-section">
        <div className="condition-section-heading">
          <h3>Treatments and follow-up</h3>
          <span>{record.treatments.length}</span>
        </div>
        {record.treatments.length > 0 ? (
          <div className="treatment-history-list">
            {record.treatments.map((treatment) => (
              <article key={treatment.id}>
                <span className={`treatment-status ${treatment.status}`}>{treatment.status}</span>
                <div>
                  <strong>{treatment.name}</strong>
                  <p>{treatment.note || treatment.provider || "Treatment record on file."}</p>
                  {treatment.startedAt ? (
                    <small>
                      {formatDate(treatment.startedAt)}
                      {treatment.completedAt ? ` – ${formatDate(treatment.completedAt)}` : " – present"}
                    </small>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="condition-empty-copy">No treatment details are connected yet.</p>
        )}
      </div>

      <div className="condition-source-note">
        <strong>Record integrity</strong>
        <p>The source remains attached to this item. Patient corrections and later office updates are added as new attributed information rather than silently replacing it.</p>
      </div>
    </section>
  );
}

function BodyMapGraphic({
  side,
  selectedRegion,
  summaries,
  onSelect
}: {
  side: BodySide;
  selectedRegion: BodyRegion;
  summaries: Partial<Record<BodyRegion, RegionRecordSummary>>;
  onSelect: (region: BodyRegion) => void;
}) {
  const regions: Array<{
    id: BodyRegion;
    label: string;
    path: React.ReactNode;
  }> = side === "front" ? frontBodyRegions : backBodyRegions;

  return (
    <svg aria-label={`${side} interactive body map`} className="body-map-svg" role="img" viewBox="0 0 300 560">
      <defs>
        <filter id="body-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" floodColor="#0f172a" floodOpacity="0.08" stdDeviation="10" />
        </filter>
      </defs>
      <g className="body-map-silhouette" filter="url(#body-shadow)">
        <circle cx="150" cy="50" r="34" />
        <path d="M130 86h40l8 23 40 21 29 128-25 7-35-103-3 132-34 22-34-22-3-132-35 103-25-7 29-128 40-21 8-23Z" />
        <path d="M116 289 103 485l29 2 18-154 18 154 29-2-13-196-34 22-34-22Z" />
        <path d="m102 485-10 37 41 2-1-37-30-2Zm96 0 10 37-41 2 1-37 30-2Z" />
      </g>
      <text className="body-side-label" x="55" y="548">R</text>
      <text className="body-side-label" x="239" y="548">L</text>
      {regions.map((region) => {
        const summary = summaries[region.id];
        const count = summary?.count ?? 0;
        const status = summary?.currentCount ? "current-records" : count > 0 ? "past-records" : "empty";
        return (
          <g
            aria-label={`${region.label}, ${count} record${count === 1 ? "" : "s"}`}
            className={`body-region ${status} ${selectedRegion === region.id ? "selected" : ""}`}
            key={region.id}
            onClick={() => onSelect(region.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(region.id);
              }
            }}
            role="button"
            tabIndex={0}
          >
            {region.path}
            {count > 0 ? <RecordCountBadge count={count} region={region.id} /> : null}
          </g>
        );
      })}
    </svg>
  );
}

function RecordCountBadge({ count, region }: { count: number; region: BodyRegion }) {
  const [x, y] = regionBadgePositions[region];
  return (
    <g className="body-record-count" aria-hidden="true">
      <circle cx={x} cy={y} r="13" />
      <text x={x} y={y + 4}>{count}</text>
    </g>
  );
}

const frontBodyRegions: Array<{ id: BodyRegion; label: string; path: React.ReactNode }> = [
  { id: "head-neck", label: bodyRegionLabels["head-neck"], path: <><circle cx="150" cy="50" r="37" /><rect x="133" y="79" width="34" height="31" rx="12" /></> },
  { id: "chest", label: bodyRegionLabels.chest, path: <path d="M113 113Q150 94 187 113l13 76H100l13-76Z" /> },
  { id: "abdomen", label: bodyRegionLabels.abdomen, path: <path d="M100 190h100l-11 83-39 24-39-24-11-83Z" /> },
  { id: "pelvis", label: bodyRegionLabels.pelvis, path: <path d="m111 273 39 24 39-24-5 43-34 18-34-18-5-43Z" /> },
  { id: "right-arm", label: bodyRegionLabels["right-arm"], path: <path d="m112 119-31 16-31 124 30 8 39-111-7-37Z" /> },
  { id: "left-arm", label: bodyRegionLabels["left-arm"], path: <path d="m188 119 31 16 31 124-30 8-39-111 7-37Z" /> },
  { id: "right-leg", label: bodyRegionLabels["right-leg"], path: <path d="m116 309-13 177 30 3 17-156v-10l-34-14Z" /> },
  { id: "left-leg", label: bodyRegionLabels["left-leg"], path: <path d="m184 309 13 177-30 3-17-156v-10l34-14Z" /> },
  { id: "right-foot", label: bodyRegionLabels["right-foot"], path: <path d="m103 480-12 45 43 1-1-39-30-7Z" /> },
  { id: "left-foot", label: bodyRegionLabels["left-foot"], path: <path d="m197 480 12 45-43 1 1-39 30-7Z" /> }
];

const backBodyRegions: Array<{ id: BodyRegion; label: string; path: React.ReactNode }> = [
  { id: "head-neck", label: bodyRegionLabels["head-neck"], path: <><circle cx="150" cy="50" r="37" /><rect x="133" y="79" width="34" height="31" rx="12" /></> },
  { id: "back", label: bodyRegionLabels.back, path: <path d="M113 110Q150 96 187 110l14 136-51 51-51-51 14-136Z" /> },
  { id: "pelvis", label: bodyRegionLabels.pelvis, path: <path d="m104 246 46 51 46-51-12 70-34 18-34-18-12-70Z" /> },
  { id: "right-arm", label: bodyRegionLabels["right-arm"], path: <path d="m112 119-31 16-31 124 30 8 39-111-7-37Z" /> },
  { id: "left-arm", label: bodyRegionLabels["left-arm"], path: <path d="m188 119 31 16 31 124-30 8-39-111 7-37Z" /> },
  { id: "right-leg", label: bodyRegionLabels["right-leg"], path: <path d="m116 309-13 177 30 3 17-156v-10l-34-14Z" /> },
  { id: "left-leg", label: bodyRegionLabels["left-leg"], path: <path d="m184 309 13 177-30 3-17-156v-10l34-14Z" /> },
  { id: "right-foot", label: bodyRegionLabels["right-foot"], path: <path d="m103 480-12 45 43 1-1-39-30-7Z" /> },
  { id: "left-foot", label: bodyRegionLabels["left-foot"], path: <path d="m197 480 12 45-43 1 1-39 30-7Z" /> }
];

const regionBadgePositions: Record<BodyRegion, [number, number]> = {
  "whole-body": [150, 280],
  "head-neck": [184, 51],
  chest: [184, 145],
  abdomen: [183, 226],
  pelvis: [182, 294],
  back: [184, 190],
  "right-arm": [67, 208],
  "left-arm": [233, 208],
  "right-leg": [116, 408],
  "left-leg": [184, 408],
  "right-foot": [109, 509],
  "left-foot": [191, 509]
};

type RegionRecordSummary = {
  count: number;
  currentCount: number;
};

function summarizeRecordsByRegion(records: DiagnosticRecord[]) {
  const summaries: Partial<Record<BodyRegion, RegionRecordSummary>> = {};
  records.forEach((record) => {
    record.regions.forEach((region) => {
      const summary = summaries[region] ?? { count: 0, currentCount: 0 };
      summaries[region] = {
        count: summary.count + 1,
        currentCount: summary.currentCount + (record.status === "resolved" ? 0 : 1)
      };
    });
  });
  return summaries;
}

function formatVerification(value: DiagnosticRecord["verification"]) {
  if (value === "source-authenticated") return "Source authenticated";
  if (value === "clinician-confirmed") return "Clinician confirmed";
  if (value === "patient-reported") return "Patient reported";
  return "Disputed";
}

function formatDate(value: string) {
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = dateOnlyMatch
    ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
    : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
